"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Zap, CheckCircle, XCircle, ChevronRight, ChevronDown, Sparkles, RotateCcw, Mic, MicOff } from "lucide-react";
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
  { label: "✅ Valid refund", prompt: "I'd like a refund for order ORD-2024-8821. My Sony headphones stopped working after 2 weeks.", tag: "Approved" },
  { label: "🚫 Digital product", prompt: "Please process a refund for order ORD-2024-7743 — I purchased the Adobe license by mistake.", tag: "Rejected" },
  { label: "🚫 Custom item", prompt: "I want a refund for ORD-2024-3301, the shelf colour doesn't match my room.", tag: "Rejected" },
  { label: "🚫 Limit exceeded", prompt: "Can I get a refund for order ORD-2024-1187? One earbud stopped working.", tag: "Rejected" },
  { label: "🚫 Expired window", prompt: "I need a refund for order ORD-2024-2234 — the shoes don't fit well anymore.", tag: "Rejected" },
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
        <span key={i} className="typing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", display: "block", animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
}

function ToolBadge({ tool }: { tool: ToolCall }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    success: { bg: "rgba(16,185,129,0.08)", color: "#10b981" },
    error: { bg: "rgba(239,68,68,0.08)", color: "#ef4444" },
    running: { bg: "rgba(99,102,241,0.08)", color: "#818cf8" },
    pending: { bg: "rgba(100,100,120,0.08)", color: "#707090" },
  };
  const c = cfg[tool.status] || cfg.pending;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.2rem 0.65rem 0.2rem 0.5rem", borderRadius: "6px", background: c.bg, border: `1px solid ${c.color}25`, fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: c.color }}>
      {tool.status === "running"
        ? <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.color, animation: "pulse 1s infinite" }} />
        : tool.status === "success" ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {TOOL_LABELS[tool.name] || tool.name}
      {tool.duration && tool.status === "success" && <span style={{ opacity: 0.55 }}>{tool.duration}ms</span>}
    </div>
  );
}

function StepItem({ step, index }: { step: AgentStep; index: number }) {
  const [open, setOpen] = useState(false);
  const cfg: Record<string, { color: string }> = {
    user_request: { color: "#6366f1" }, tool_call: { color: "#f59e0b" },
    tool_result: { color: "#10b981" }, policy_validation: { color: "#3b82f6" },
    decision: { color: "#a78bfa" }, final_response: { color: "#6366f1" },
  };
  const c = cfg[step.type] || cfg.user_request;
  const hasDetail = step.type === "tool_call" || step.type === "tool_result";

  return (
    <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.4rem" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: `${c.color}15`, border: `1px solid ${c.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", color: c.color, flexShrink: 0 }}>
          {step.step}
        </div>
        <div style={{ width: "1px", flex: 1, background: `${c.color}20`, minHeight: "8px", marginTop: "2px" }} />
      </div>
      <div style={{ flex: 1, paddingBottom: "0.3rem" }}>
        <div onClick={() => hasDetail && setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: hasDetail ? "pointer" : "default" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: c.color }}>{step.title}</span>
          {step.toolCall && <ToolBadge tool={step.toolCall} />}
          {hasDetail && (open ? <ChevronDown size={11} color="var(--foreground-muted)" /> : <ChevronRight size={11} color="var(--foreground-muted)" />)}
        </div>
        {open && (
          <div className="code-block" style={{ marginTop: "0.4rem", fontSize: "0.7rem", maxHeight: "150px", overflow: "auto" }}>
            {step.content.length > 400 ? step.content.slice(0, 400) + "…" : step.content}
          </div>
        )}
      </div>
    </div>
  );
}

function DecisionCard({ decision, amount }: { decision: "approved" | "rejected"; amount?: number }) {
  const isApproved = decision === "approved";
  return (
    <div style={{ marginTop: "0.75rem", padding: "0.875rem 1.25rem", borderRadius: "10px", background: isApproved ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${isApproved ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`, display: "flex", alignItems: "center", gap: "0.875rem" }}>
      <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: isApproved ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
            See explanation above for the policy rule violated
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
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-end", maxWidth: "80%" }}>
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
    <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", maxWidth: "92%" }}>
      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
        <Bot size={13} color="#818cf8" />
      </div>
      <div style={{ flex: 1 }}>
        {msg.isStreaming && !msg.content && <TypingDots />}
        {msg.steps && msg.steps.length > 0 && (
          <div className="glass" style={{ borderRadius: "10px", marginBottom: "0.6rem", overflow: "hidden" }}>
            <button onClick={() => setStepsOpen(!stepsOpen)} style={{ width: "100%", padding: "0.6rem 0.875rem", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Zap size={12} color="#f59e0b" />
              <span style={{ fontSize: "0.72rem", color: "var(--foreground-secondary)", fontWeight: 500, flex: 1 }}>{msg.steps.length} agent steps</span>
              {stepsOpen ? <ChevronDown size={12} color="var(--foreground-muted)" /> : <ChevronRight size={12} color="var(--foreground-muted)" />}
            </button>
            {stepsOpen && (
              <div style={{ padding: "0.5rem 0.875rem 0.875rem" }}>
                {msg.steps.map((s, i) => <StepItem key={i} step={s} index={i} />)}
              </div>
            )}
          </div>
        )}
        {msg.content && (
          <div style={{ padding: "0.75rem 1rem", borderRadius: "4px 14px 14px 14px", background: "var(--glass)", border: "1px solid var(--border)", fontSize: "0.87rem", lineHeight: 1.75, color: "var(--foreground)", whiteSpace: "pre-wrap" }}>
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

// ── Voice Hook ────────────────────────────────────────────────────────────────
function useVoice(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Voice not supported in this browser. Use Chrome!"); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      onResult(text);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return { isListening, startListening, stopListening };
}

// ── Main Chat ─────────────────────────────────────────────────────────────────
export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const { isListening, startListening, stopListening } = useVoice((text) => {
    setInput(text);
  });

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", isStreaming: true, steps: [] }]);

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

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line.startsWith("data:")) continue;
          const eventLine = lines[i - 1] ?? "";
          const event = eventLine.startsWith("event:") ? eventLine.slice(6).trim() : "message";
          try {
            const data = JSON.parse(line.slice(5).trim());
            if (event === "session") setSessionId(data.sessionId);
            else if (event === "step") {
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, steps: [...(m.steps ?? []), data] } : m));
            }
            else if (event === "complete") {
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: data.response ?? "", isStreaming: false, decision: data.decision, refundAmount: data.refundAmount } : m));
            }
            else if (event === "error") {
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: `Error: ${data.message}`, isStreaming: false } : m));
            }
          } catch { }
        }
      }
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: "Connection error. Check GROQ_API_KEY in .env.local", isStreaming: false } : m));
    } finally { setIsLoading(false); }
  };

  const placeholder = lang === "hi"
    ? "Apna order ID aur problem batayein… (e.g. ORD-2024-8821)"
    : "Enter your order ID and describe your issue…";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>
      {/* Header */}
      <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(10,10,15,0.6)", backdropFilter: "blur(12px)" }}>
        <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(99,102,241,0.3)", flexShrink: 0 }}>
          <Bot size={16} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>RefundAI Agent</div>
          <div style={{ fontSize: "0.72rem", color: isLoading ? "#f59e0b" : "var(--green)" }}>
            {isLoading ? "⚡ Processing…" : "● Online · Groq AI"}
          </div>
        </div>

        {/* Language Toggle */}
        <button onClick={() => setLang(l => l === "en" ? "hi" : "en")}
          style={{ padding: "0.3rem 0.6rem", borderRadius: "6px", background: "var(--glass)", border: "1px solid var(--border)", color: "var(--foreground-secondary)", fontSize: "0.72rem", cursor: "pointer", flexShrink: 0 }}>
          {lang === "en" ? "🇮🇳 Hindi" : "🇬🇧 English"}
        </button>

        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); setSessionId(null); }}
            style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.35rem 0.65rem", borderRadius: "7px", background: "var(--glass)", border: "1px solid var(--border)", color: "var(--foreground-muted)", fontSize: "0.75rem", cursor: "pointer", flexShrink: 0 }}>
            <RotateCcw size={12} /> New
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1rem" }}>
        {messages.length === 0 ? (
          <div style={{ maxWidth: "700px", margin: "0 auto", paddingTop: "1.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg, #6366f1, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.875rem", boxShadow: "0 4px 24px rgba(99,102,241,0.3)" }}>
                <Sparkles size={22} color="white" />
              </div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "0.4rem" }}>
                {lang === "hi" ? "Namaste! Kaise madad kar sakta hoon?" : "How can I help you today?"}
              </h2>
              <p style={{ color: "var(--foreground-secondary)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                {lang === "hi"
                  ? "Apna order ID aur problem batayein — main turant decision dunga"
                  : "Tell me your order ID and issue — I'll check the policy and give you an instant decision"}
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.6rem" }}>
              {SUGGESTED_PROMPTS.map(s => (
                <button key={s.label} onClick={() => sendMessage(s.prompt)}
                  style={{ padding: "0.875rem 1rem", borderRadius: "10px", background: "var(--glass)", border: "1px solid var(--border)", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.82rem" }}>{s.label}</span>
                    <span style={{ fontSize: "0.64rem", padding: "0.1rem 0.4rem", borderRadius: "4px", background: s.tag === "Approved" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: s.tag === "Approved" ? "#10b981" : "#ef4444", border: `1px solid ${s.tag === "Approved" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`, fontWeight: 700 }}>
                      {s.tag}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.73rem", color: "var(--foreground-muted)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.prompt}</span>
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
      <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid var(--border)", background: "rgba(10,10,15,0.6)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>

          {/* Voice listening indicator */}
          {isListening && (
            <div style={{ textAlign: "center", marginBottom: "0.5rem", fontSize: "0.78rem", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", animation: "pulse 0.8s infinite" }} />
              Listening… speak now
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", background: "var(--background-secondary)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.5rem 0.6rem" }}>
            {/* Voice button */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              style={{ width: "34px", height: "34px", borderRadius: "8px", background: isListening ? "rgba(239,68,68,0.15)" : "var(--glass)", border: `1px solid ${isListening ? "rgba(239,68,68,0.3)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              {isListening ? <MicOff size={14} color="#ef4444" /> : <Mic size={14} color="var(--foreground-muted)" />}
            </button>

            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder={placeholder}
              rows={1}
              disabled={isLoading}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--foreground)", fontSize: "0.88rem", resize: "none", lineHeight: 1.6, minHeight: "34px", maxHeight: "100px", overflowY: "auto", fontFamily: "var(--font-sans)" }}
            />

            <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading}
              style={{ width: "34px", height: "34px", borderRadius: "8px", background: !input.trim() || isLoading ? "var(--glass)" : "linear-gradient(135deg, #6366f1, #4f52e5)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: !input.trim() || isLoading ? "not-allowed" : "pointer", flexShrink: 0, boxShadow: !input.trim() || isLoading ? "none" : "0 2px 10px rgba(99,102,241,0.35)" }}>
              <Send size={14} color={!input.trim() || isLoading ? "var(--foreground-muted)" : "white"} />
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: "0.3rem", fontSize: "0.66rem", color: "var(--foreground-muted)" }}>
            🎙️ Voice · 🌐 Hindi/English · Enter to send · Powered by Groq AI
          </div>
        </div>
      </div>
    </div>
  );
}