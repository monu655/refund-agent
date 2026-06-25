import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { TOOL_DEFINITIONS, executeTool } from "@/lib/agent/tools";
import { sessionStore } from "@/lib/store/sessions";
import { AgentSession, AgentStep, ToolCall } from "@/types";

const SYSTEM_PROMPT = `You are RefundAI, an expert AI Customer Support Agent for an e-commerce platform. Your role is to process refund requests by systematically validating them against company policy.

WORKFLOW (always follow this exact sequence):
1. Extract the order ID from the user message
2. Call getCustomerByOrderId to fetch customer details
3. Call getRefundPolicy to load the current policy
4. Call validateRefundWindow to check the 30-day rule
5. Call validateRefundHistory to check refund limits
6. Call validateProductEligibility to check product type rules
7. If all validations pass, call calculateRefundAmount
8. Finally call either approveRefund or rejectRefund with clear reasoning

RULES:
- Always be professional, empathetic, and clear
- Explain every decision with specific policy references
- If rejecting, tell the customer exactly which rule was violated
- Never approve refunds that violate policy
- Always complete the full workflow before giving final response

Respond in a friendly, professional tone.`;

export async function POST(req: NextRequest) {
  const { message, sessionId: existingSessionId } = await req.json();

  if (!message) {
    return new Response(JSON.stringify({ error: "Message required" }), { status: 400 });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return new Response(
      JSON.stringify({ error: "GROQ_API_KEY not found. Please set it in .env.local" }),
      { status: 500 }
    );
  }

  const groq = new Groq({ apiKey: groqKey });
  const sessionId = existingSessionId ?? `sess_${Date.now()}`;
  const startTime = new Date().toISOString();

  const session: AgentSession = {
    sessionId,
    orderId: "",
    steps: [],
    startTime,
    status: "running",
  };
  sessionStore.create(session);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const stepCounter = { n: 0 };
      const addStep = (
        type: AgentStep["type"],
        title: string,
        content: string,
        toolCall?: ToolCall
      ) => {
        stepCounter.n++;
        const step: AgentStep = {
          step: stepCounter.n,
          type,
          title,
          content,
          toolCall,
          timestamp: new Date().toISOString(),
        };
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
            max_tokens: 4096,
          });

          const choice = response.choices[0];
          const msg = choice.message;

          if (choice.finish_reason === "tool_calls" && msg.tool_calls && msg.tool_calls.length > 0) {
            // Add assistant message with tool calls
            messages.push({
              role: "assistant",
              content: msg.content || "",
              tool_calls: msg.tool_calls,
            });

            for (const tc of msg.tool_calls) {
              const toolName = tc.function.name;
              let toolArgs: Record<string, unknown> = {};

              try {
                toolArgs = JSON.parse(tc.function.arguments || "{}");
              } catch {
                toolArgs = {};
              }

              const toolCallObj: ToolCall = {
                id: tc.id,
                name: toolName as ToolCall["name"],
                arguments: toolArgs,
                status: "running",
                timestamp: new Date().toISOString(),
              };

              addStep(
                "tool_call",
                `Tool: ${toolName}`,
                `Calling ${toolName} with: ${JSON.stringify(toolArgs, null, 2)}`,
                toolCallObj
              );

              const startExec = Date.now();
              const result = executeTool(toolName, toolArgs);
              toolCallObj.duration = Date.now() - startExec;
              toolCallObj.status = result.success ? "success" : "error";
              toolCallObj.result = result.data;

              if (toolName === "getCustomerByOrderId" && result.success) {
                const customer = result.data as { orderId: string; name: string };
                session.orderId = customer.orderId || "";
                session.customer = result.data as AgentSession["customer"];
              }

              addStep(
                "tool_result",
                `Result: ${toolName}`,
                JSON.stringify(result.success ? result.data : { error: result.error }, null, 2),
                toolCallObj
              );

              // Add tool result to messages
              messages.push({
                role: "tool",
                tool_call_id: tc.id,
                content: JSON.stringify(result.success ? result.data : { error: result.error }),
              });
            }
          } else {
            // Final text response
            finalResponse = msg.content || "";
            continueLoop = false;
          }
        }

        // Determine decision
        const lc = finalResponse.toLowerCase();
        const isApproved =
          lc.includes("approved") ||
          lc.includes("refund has been approved") ||
          lc.includes("approve your refund");
        const isRejected =
          lc.includes("rejected") ||
          lc.includes("unable to process") ||
          lc.includes("not eligible") ||
          lc.includes("cannot approve") ||
          lc.includes("ineligible");

        session.decision = isApproved ? "approved" : isRejected ? "rejected" : "pending";

        addStep("decision", "Decision", session.decision);
        addStep("final_response", "Final Response", finalResponse);

        // Extract refund amount from approve tool call
        const approveStep = session.steps.find(
          (s) => s.toolCall?.name === "approveRefund" && s.toolCall.status === "success"
        );
        if (approveStep?.toolCall?.result) {
          const res = approveStep.toolCall.result as { refundAmount?: number };
          session.refundAmount = res.refundAmount;
        }

        session.status = "completed";
        session.endTime = new Date().toISOString();
        sessionStore.update(sessionId, session);

        sessionStore.addActivityLog({
          id: `log_${Date.now()}`,
          sessionId,
          orderId: session.orderId,
          customerName: session.customer?.name ?? "Unknown",
          decision: session.decision ?? "pending",
          amount: session.refundAmount,
          timestamp: startTime,
          duration: Date.now() - new Date(startTime).getTime(),
        });

        send("complete", {
          sessionId,
          decision: session.decision,
          refundAmount: session.refundAmount,
          response: finalResponse,
        });
      } catch (error) {
        const errMsg = (error as Error).message;
        session.status = "error";
        sessionStore.update(sessionId, session);
        send("error", { message: errMsg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function GET() {
  return Response.json({ sessions: sessionStore.getAll() });
}