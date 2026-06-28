import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { TOOL_DEFINITIONS, executeTool } from "@/lib/agent/tools";
import { sessionStore } from "@/lib/store/sessions";
import { AgentSession, AgentStep, ToolCall } from "@/types";
import { sendRefundEmail } from "@/lib/email";

const SYSTEM_PROMPT = `You are RefundAI, an AI refund agent. Process refund requests by calling tools in this exact order:
1. getCustomerByOrderId - fetch customer
2. getRefundPolicy - load policy  
3. validateRefundWindow - check 30 days
4. validateRefundHistory - check refund limit
5. validateProductEligibility - check product type
6. If all pass: calculateRefundAmount, then approveRefund
7. If any fail: rejectRefund with exact rule violated

Be professional and concise. Always complete all steps before responding.`;

export async function POST(req: NextRequest) {
  const { message, sessionId: existingSessionId } = await req.json();
  if (!message) return new Response(JSON.stringify({ error: "Message required" }), { status: 400 });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return new Response(JSON.stringify({ error: "GROQ_API_KEY not set" }), { status: 500 });

  const groq = new Groq({ apiKey: groqKey });
  const sessionId = existingSessionId ?? `sess_${Date.now()}`;
  const startTime = new Date().toISOString();

  const session: AgentSession = { sessionId, orderId: "", steps: [], startTime, status: "running" };
  sessionStore.create(session);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const stepCounter = { n: 0 };
      const addStep = (type: AgentStep["type"], title: string, content: string, toolCall?: ToolCall) => {
        stepCounter.n++;
        const step: AgentStep = { step: stepCounter.n, type, title, content, toolCall, timestamp: new Date().toISOString() };
        session.steps.push(step);
        send("step", step);
        return step;
      };

      try {
        send("session", { sessionId });
        addStep("user_request", "User Request", message);

        const messages: Groq.Chat.ChatCompletionMessageParam[] = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ];

        let continueLoop = true;
        let finalResponse = "";

        while (continueLoop) {
          const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages,
            tools: TOOL_DEFINITIONS as any,
            tool_choice: "auto",
            temperature: 0.1,
            max_tokens: 800,
          });

          const choice = response.choices[0];
          const msg = choice.message;

          if (choice.finish_reason === "tool_calls" && msg.tool_calls?.length) {
            messages.push({ role: "assistant", content: msg.content || "", tool_calls: msg.tool_calls });

            for (const tc of msg.tool_calls) {
              const toolName = tc.function.name;
              let toolArgs: Record<string, unknown> = {};
              try { toolArgs = JSON.parse(tc.function.arguments || "{}"); } catch { toolArgs = {}; }

              const toolCallObj: ToolCall = {
                id: tc.id, name: toolName as ToolCall["name"],
                arguments: toolArgs, status: "running", timestamp: new Date().toISOString(),
              };

              addStep("tool_call", `Tool: ${toolName}`, `Calling ${toolName}`, toolCallObj);

              const startExec = Date.now();
              const result = executeTool(toolName, toolArgs);
              toolCallObj.duration = Date.now() - startExec;
              toolCallObj.status = result.success ? "success" : "error";
              toolCallObj.result = result.data;

              if (toolName === "getCustomerByOrderId" && result.success) {
                session.orderId = (result.data as any).orderId || "";
                session.customer = result.data as AgentSession["customer"];
              }

              addStep("tool_result", `Result: ${toolName}`,
                JSON.stringify(result.success ? result.data : { error: result.error }, null, 2), toolCallObj);

              messages.push({
                role: "tool", tool_call_id: tc.id,
                content: JSON.stringify(result.success ? result.data : { error: result.error }),
              });
            }
          } else {
            finalResponse = msg.content || "";
            continueLoop = false;
          }
        }

        // Determine decision
        const lc = finalResponse.toLowerCase();
        const isApproved = lc.includes("approved") || lc.includes("approve");
        const isRejected = lc.includes("rejected") || lc.includes("unable") || lc.includes("not eligible") || lc.includes("cannot") || lc.includes("ineligible");
        session.decision = isApproved ? "approved" : isRejected ? "rejected" : "pending";

        addStep("decision", "Decision", session.decision);
        addStep("final_response", "Final Response", finalResponse);

        // Get refund amount
        const approveStep = session.steps.find(s => s.toolCall?.name === "approveRefund" && s.toolCall.status === "success");
        if (approveStep?.toolCall?.result) session.refundAmount = (approveStep.toolCall.result as any).refundAmount;

        session.status = "completed";
        session.endTime = new Date().toISOString();
        sessionStore.update(sessionId, session);

        // Send email notification
        if (session.customer?.email && session.decision !== "pending") {
          await sendRefundEmail({
            to: session.customer.email,
            name: session.customer.name,
            orderId: session.orderId,
            decision: session.decision as "approved" | "rejected",
            amount: session.refundAmount,
            reason: session.decision === "rejected" ? finalResponse.slice(0, 200) : undefined,
          });
          addStep("final_response", "📧 Email Sent", `Notification sent to ${session.customer.email}`);
        }

        sessionStore.addActivityLog({
          id: `log_${Date.now()}`, sessionId, orderId: session.orderId,
          customerName: session.customer?.name ?? "Unknown",
          decision: session.decision ?? "pending", amount: session.refundAmount,
          timestamp: startTime, duration: Date.now() - new Date(startTime).getTime(),
        });

        send("complete", {
          sessionId, decision: session.decision,
          refundAmount: session.refundAmount, response: finalResponse,
        });

      } catch (error) {
        session.status = "error";
        sessionStore.update(sessionId, session);
        send("error", { message: (error as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}

export async function GET() {
  return Response.json({ sessions: sessionStore.getAll() });
}