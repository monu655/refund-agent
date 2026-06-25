"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Zap, CheckCircle, XCircle, ChevronRight, ChevronDown, Sparkles, RotateCcw } from "lucide-react";
import { AgentStep, ToolCall } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: AgentStep[];
  decision?: "approved" | "rejected" | "pending";
  refundAmount?: number;
  isStreaming?: boolean;
}

const SUGGESTED_PROMPTS = [
  { label: "✅ Valid refund", prompt: "I'd like to request a refund for order ORD-2024-8821. My Sony headphones stopped working after 2 weeks.", tag: "Approved" },
  { label: "🚫 Digital product", prompt: "Please process a refund for order ORD-2024-7743 — I purchased the Adobe license by mistake.", tag: "Rejected" },
  { label: "🚫 Custom item", prompt: "I want a refund for ORD-2024-3301, the shelf colour doesn't match my room.", tag: "Rejected" },
  { label: "🚫 Limit exceeded", prompt: "Can I get a refund for order ORD-2024-1187? One earbud stopped working.", tag: "Rejected" },
  { label: "🚫 Expired window", prompt: "I need a refund for ORD-2024-2234 — the shoes don't fit well anymore.", tag: "Rejected" },
  { label: "✅ Defective + proof", prompt: "My iPad screen has dead pixels, order ORD-2024-5509. I have photos ready.", tag: "Approved" },
];

const TOOL_LABELS: Record<string, string> = {
  getCustomerByOrderId: "Fetch Customer",
  getRefundPolicy: "Load Policy",
  validateRefundWindow: "Check 30-Day Window",
  validateRefundHistory: "Check Refund History",
  validateProductEligibility: "Check Product Type",
  calculateRefundAmount: "Calculate Amount",
  approveRefund: "Approve Refund",
  rejectRefund: "Reject Refund",
};

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 0" }}>
      {[0, 1, 2].map(i => (
        <span key={i} className="typing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", display: "block" }} />
      ))}
    </div>
  );
}

function ToolBadge({ tool }: { tool: ToolCall }) {
  const cfg: Record<string, { bg: string; color: string; dot?: boolean }> = {
    success: { bg: "rgba(16,185,129,0.08)", color: "#10b981" },
    error: { bg: "rgba(239,68,68,0.08)", color: "#ef4444" },
    running: { bg: "rgba(99,102,241,0.08)", color: "#818cf8", dot: true },
    pending: { bg: "rgba(100,100,120,0.08)", color: "#707090" },
  };
  const c = cfg[tool.status] || cfg.pending;
  const label = TOOL_LABELS[tool.name] || tool.name;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.2rem 0.65rem 0.2rem 0.5rem", borderRadius: "6px", background: c.bg, border: `1px solid ${c.color}25`, fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: c.color }}>
      {c.dot
        ? <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.color, animation: "pulse 1s infinite", flexShrink: 0 }} />
        : tool.status === "success"
        ? <CheckCircle size={10} />
        : <XCircle size={10} />}
      {label}
      {tool.duration && tool.status === "success" && <span style={{ opacity: 0.55 }}>{tool.duration}ms</span>}
    </div>
  );
}

function StepItem({ step, index }: { step: AgentStep; index: number }) {
  const [open, setOpen] = useState(false);
  const cfg: Record<string, { color: string; icon: string }> = {
    user_request: { color: "#6366f1", icon: "①" },
    tool_call: { color: "#f59e0b", icon: "⚡" },
    tool_result: { color: "#10b981", icon: "✓" },
    policy_validation: { color: "#3b82f6", icon: "🛡" },
    decision: { color: "#a78bfa", icon: "⚖" },
    final_response: { color: "#6366f1", icon: "✦" },
  };
  const c = cfg[step.type] || cfg.user_request;
  const hasDetail = step.type === "tool_call" || step.type === "tool_result";

  return (
    <div className="fade-in" style={{ display: "flex", gap: "0.6rem" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: `${c.color}15`, border: `1px solid ${c.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", color: c.color, flexShrink: 0 }}>
          {step.step}
        </div>
        {index < 100 && <div style={{ width: "1px", flex: 1, background: `${c.color}20`, minHeight: "12px", marginTop: "2px" }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: "0.5rem" }}>
        <div
          onClick={() => hasDetail && setOpen(!open)}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: hasDetail ? "pointer" : "default", userSelect: "none" }}
        >
          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: c.color }}>{step.title}</span>
          {step.toolCall && <ToolBadge tool={step.toolCall} />}
          {hasDetail && (open ? <ChevronDown size={11} color="var(--foreground-muted)" /> : <ChevronRight size={11} color="var(--foreground-muted)" />)}
        </div>
        {open && (
          <div className="code-block fade-in" style={{ marginTop: "0.4rem", fontSize: "0.7rem", maxHeight: "180px", overflow: "auto" }}>
            {step.content.length > 600 ? step.content.slice(0, 600) + "…" : step.content}
          </div>
        )}
      </div>
    </div>
  );
}

function DecisionCard({ decision, amount }: { decision: "approved" | "rejected"; amount?: number }) {
  const isApproved = decision === "approved";
  return (
    <div style={{
      marginTop: "0.75rem", padding: "0.875rem 1.25rem", borderRadius: "10px",
      background: isApproved ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
      border: `1px solid ${isApproved ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
      display: "flex", alignItems: "center", gap: "0.875rem",
    }}>
      <div style={{
        width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
        background: isApproved ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isApproved ? <CheckCircle size={18} color="#10b981" /> : <XCircle size={18} color="#ef4444" />}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: "0.87rem", color: isApproved ? "#10b981" : "#ef4444" }}>
          {isApproved ? "Refund Approved" : "Refund Rejected"}
        </div>
        {isApproved && amount && (
          <div style={{ fontSize: "0.78rem", color: "var(--foreground-secondary)", marginTop: "0.1rem" }}>
            ₹{amount.toLocaleString("en-IN")} will be credited in 3–5 business days
          </div>
        )}
        {!isApproved && (
          <div style={{ fontSize: "0.78rem", color: "var(--foreground-muted)", marginTop: "0.1rem" }}>
            See explanation above for the specific policy rule violated
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const [stepsOpen, setStepsOpen] = useState(false);
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-end", maxWidth: "75%" }}>
          <div style={{ padding: "0.7rem 1rem", borderRadius: "14px 14px 4px 14px", background: "linear-gradient(135deg, #6366f1, #4f52e5)", color: "white", fontSize: "0.87rem", lineHeight: 1.6, boxShadow: "0 2px 12px rgba(99,102,241,0.25)" }}>
            {msg.content}
          </div>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <User size={13} color="#818cf8" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", maxWidth: "90%" }}>
      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px", boxShadow: "0 0 12px rgba(99,102,241,0.15)" }}>
        <Bot size={13} color="#818cf8" />
      </div>
      <div style={{ flex: 1 }}>
        {msg.isStreaming && !msg.content && <TypingDots />}

        {/* Tool steps toggle */}
        {msg.steps && msg.steps.length > 0 && (
          <div className="glass" style={{ borderRadius: "10px", marginBottom: "0.6rem", overflow: "hidden" }}>
            <button
              onClick={() => setStepsOpen(!stepsOpen)}
              style={{ width: "100%", padding: "0.6rem 0.875rem", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", textAlign: "left" }}
            >
              <Zap size={12} color="#f59e0b" />
              <span style={{ fontSize: "0.72rem", color: "var(--foreground-secondary)", fontWeight: 500, flex: 1 }}>
                {msg.steps.length} agent steps
              </span>
              {stepsOpen ? <ChevronDown size={12} color="var(--foreground-muted)" /> : <ChevronRight size={12} color="var(--foreground-muted)" />}
            </button>
            {stepsOpen && (
              <div style={{ padding: "0.5rem 0.875rem 0.875rem" }}>
                {msg.steps.map((s, i) => <StepItem key={i} step={s} index={i} />)}
              </div>
            )}
          </div>
        )}

        {/* Response text */}
        {msg.content && (
          <div style={{ padding: "0.75rem 1rem", borderRadius: "4px 14px 14px 14px", background: "var(--glass)", border: "1px solid var(--border)", fontSize: "0.87rem", lineHeight: 1.75, color: "var(--foreground)", whiteSpace: "pre-wrap" }}
            className={msg.isStreaming ? "stream-cursor" : ""}
          >
            {msg.content}
          </div>
        )}

        {msg.decision && msg.decision !== "pending" && !msg.isStreaming && (
          <DecisionCard decision={msg.decision} amount={msg.refundAmount} />
        )}
      </div>
    </div>
  );
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", isStreaming: true, steps: [] };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const data = JSON.parse(line.slice(5).trim());
            const eventLine = lines[lines.indexOf(line) - 1] ?? "";
            const event = eventLine.startsWith("event:") ? eventLine.slice(6).trim() : "message";

            if (event === "session") setSessionId(data.sessionId);
            else if (event === "step") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, steps: [...(m.steps ?? []), data] } : m
              ));
            }
            else if (event === "complete") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: data.response ?? "", isStreaming: false, decision: data.decision, refundAmount: data.refundAmount } : m
              ));
            }
            else if (event === "error") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: `Error: ${data.message}`, isStreaming: false } : m
              ));
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (e) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: "Connection error. Make sure OPENAI_API_KEY is set in .env.local", isStreaming: false } : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleReset = () => { setMessages([]); setSessionId(null); };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>
      {/* Header */}
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(10,10,15,0.6)", backdropFilter: "blur(12px)" }}>
        <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(99,102,241,0.3)" }}>
          <Bot size={16} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>RefundAI Agent</div>
          <div style={{ fontSize: "0.72rem", color: "var(--foreground-muted)" }}>
            {isLoading ? (
              <span style={{ color: "#f59e0b" }}>⚡ Processing refund request…</span>
            ) : (
              <span style={{ color: "var(--green)" }}>● Online · GPT-4o with function calling</span>
            )}
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={handleReset} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.35rem 0.75rem", borderRadius: "7px", background: "var(--glass)", border: "1px solid var(--border)", color: "var(--foreground-muted)", fontSize: "0.75rem", cursor: "pointer" }}>
            <RotateCcw size={12} /> New chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
        {messages.length === 0 ? (
          <div style={{ maxWidth: "700px", margin: "0 auto", paddingTop: "2rem" }}>
            {/* Welcome */}
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, #6366f1, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", boxShadow: "0 4px 24px rgba(99,102,241,0.3)" }}>
                <Sparkles size={24} color="white" />
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
                How can I help you today?
              </h2>
              <p style={{ color: "var(--foreground-secondary)", fontSize: "0.87rem", lineHeight: 1.6 }}>
                I'm your AI refund agent. Tell me your order ID and issue —<br />I'll check the policy and give you an instant decision.
              </p>
            </div>
            {/* Suggested prompts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              {SUGGESTED_PROMPTS.map(s => (
                <button key={s.label} onClick={() => sendMessage(s.prompt)}
                  style={{ padding: "0.875rem 1rem", borderRadius: "10px", background: "var(--glass)", border: "1px solid var(--border)", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--foreground)" }}>{s.label}</span>
                    <span style={{ fontSize: "0.64rem", padding: "0.1rem 0.4rem", borderRadius: "4px",
                      background: s.tag === "Approved" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      color: s.tag === "Approved" ? "#10b981" : "#ef4444",
                      border: `1px solid ${s.tag === "Approved" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                      fontWeight: 700 }}>
                      {s.tag}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--foreground-muted)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: "780px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {messages.map(m => <MessageBubble key={m.id} msg={m} />)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", background: "rgba(10,10,15,0.6)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-end", background: "var(--background-secondary)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.6rem 0.75rem", transition: "border-color 0.15s ease" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your order ID and describe your issue…"
              rows={1}
              disabled={isLoading}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--foreground)", fontSize: "0.9rem", resize: "none", lineHeight: 1.6, minHeight: "36px", maxHeight: "120px", overflowY: "auto", fontFamily: "var(--font-sans)" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              style={{ width: "36px", height: "36px", borderRadius: "8px", background: !input.trim() || isLoading ? "var(--glass)" : "linear-gradient(135deg, #6366f1, #4f52e5)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: !input.trim() || isLoading ? "not-allowed" : "pointer", transition: "all 0.15s ease", flexShrink: 0, boxShadow: !input.trim() || isLoading ? "none" : "0 2px 10px rgba(99,102,241,0.35)" }}
            >
              <Send size={14} color={!input.trim() || isLoading ? "var(--foreground-muted)" : "white"} />
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: "0.4rem", fontSize: "0.68rem", color: "var(--foreground-muted)" }}>
            Enter to send · Shift+Enter for new line · Powered by GPT-4o
          </div>
        </div>
      </div>
    </div>
  );
}
