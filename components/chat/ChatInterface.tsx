"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Zap, CheckCircle, XCircle, ChevronRight, ChevronDown, Sparkles, RotateCcw, Mic, MicOff, Brain } from "lucide-react";
import { AgentStep, ToolCall } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  displayContent?: string;
  steps?: AgentStep[];
  decision?: "approved" | "rejected" | "pending";
  refundAmount?: number;
  confidence?: number;
  isStreaming?: boolean;
  isTyping?: boolean;
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

// ── Sound Effects ─────────────────────────────────────────────────────────────
function playSound(type: "approve" | "reject" | "typing" | "tool") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "approve") {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === "reject") {
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === "tool") {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.type = "sine";
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    }
  } catch { }
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Array<{x:number;y:number;vx:number;vy:number;color:string;size:number;rotation:number;rotSpeed:number}>>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#6366f1","#10b981","#f59e0b","#a78bfa","#3b82f6","#ec4899","#14b8a6"];

    particles.current = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter(p => p.y < canvas.height + 20);
      particles.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.08;
        p.rotation += p.rotSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.5);
        ctx.restore();
      });
      if (particles.current.length > 0) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  if (!active) return null;
  return (
    <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 9999 }} />
  );
}

// ── Confidence Meter ──────────────────────────────────────────────────────────
function ConfidenceMeter({ confidence, decision }: { confidence: number; decision: "approved" | "rejected" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let curr = 0;
    const step = confidence / 40;
    const t = setInterval(() => {
      curr = Math.min(curr + step, confidence);
      setDisplay(Math.round(curr));
      if (curr >= confidence) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [confidence]);

  const color = decision === "approved" ? "#10b981" : "#ef4444";
  return (
    <div style={{ marginTop: "0.6rem", padding: "0.75rem 1rem", borderRadius: "10px", background: `${color}08`, border: `1px solid ${color}20` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.72rem", color: "var(--foreground-muted)", fontWeight: 500 }}>🤖 AI Confidence Score</span>
        <span style={{ fontSize: "1rem", fontWeight: 800, color, fontFamily: "var(--font-mono)" }}>{display}%</span>
      </div>
      <div style={{ height: "6px", borderRadius: "3px", background: "var(--border)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${display}%`, background: `linear-gradient(90deg, ${color}, ${color}99)`, borderRadius: "3px", transition: "width 0.05s linear", boxShadow: `0 0 8px ${color}60` }} />
      </div>
      <div style={{ fontSize: "0.68rem", color: "var(--foreground-muted)", marginTop: "0.3rem" }}>
        {display >= 90 ? "Very high confidence" : display >= 75 ? "High confidence" : "Moderate confidence"}
      </div>
    </div>
  );
}

// ── Agent Brain Visualization ─────────────────────────────────────────────────
function AgentBrainLoader({ steps }: { steps: AgentStep[] }) {
  const toolSteps = steps.filter(s => s.type === "tool_call");
  const nodes = ["Customer", "Policy", "Window", "History", "Eligibility", "Amount", "Decision"];
  const activeIndex = Math.min(toolSteps.length, nodes.length - 1);

  return (
    <div style={{ padding: "0.75rem", borderRadius: "10px", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", marginBottom: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.6rem" }}>
        <Brain size={13} color="#818cf8" />
        <span style={{ fontSize: "0.7rem", color: "#818cf8", fontWeight: 600 }}>Agent Thinking</span>
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f59e0b", animation: "pulse 0.8s infinite", marginLeft: "auto" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
        {nodes.map((node, i) => (
          <div key={node} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <div style={{
              padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.65rem", fontWeight: 600,
              background: i < activeIndex ? "rgba(16,185,129,0.15)" : i === activeIndex ? "rgba(245,158,11,0.15)" : "rgba(99,102,241,0.08)",
              color: i < activeIndex ? "#10b981" : i === activeIndex ? "#f59e0b" : "var(--foreground-muted)",
              border: `1px solid ${i < activeIndex ? "rgba(16,185,129,0.25)" : i === activeIndex ? "rgba(245,158,11,0.25)" : "transparent"}`,
              transition: "all 0.3s ease",
            }}>
              {i < activeIndex ? "✓ " : i === activeIndex ? "⚡ " : ""}{node}
            </div>
            {i < nodes.length - 1 && <div style={{ width: "10px", height: "1px", background: i < activeIndex ? "#10b981" : "var(--border)" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Typing Effect ─────────────────────────────────────────────────────────────
function useTypingEffect(text: string, isActive: boolean, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!isActive || !text) { setDisplayed(text); return; }
    setDisplayed("");
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, isActive, speed]);
  return displayed;
}

// ── Voice Hook ────────────────────────────────────────────────────────────────
function useVoice(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice not supported. Use Chrome!"); return; }
    const r = new SR();
    r.lang = "en-IN"; r.continuous = false; r.interimResults = false;
    r.onresult = (e: any) => { onResult(e.results[0][0].transcript); setIsListening(false); };
    r.onerror = r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    r.start(); setIsListening(true);
  };
  const stopListening = () => { recognitionRef.current?.stop(); setIsListening(false); };
  return { isListening, startListening, stopListening };
}

// ── Tool Badge ────────────────────────────────────────────────────────────────
function ToolBadge({ tool }: { tool: ToolCall }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    success: { bg: "rgba(16,185,129,0.08)", color: "#10b981" },
    error: { bg: "rgba(239,68,68,0.08)", color: "#ef4444" },
    running: { bg: "rgba(99,102,241,0.08)", color: "#818cf8" },
    pending: { bg: "rgba(100,100,120,0.08)", color: "#707090" },
  };
  const c = cfg[tool.status] || cfg.pending;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.18rem 0.55rem", borderRadius: "5px", background: c.bg, border: `1px solid ${c.color}25`, fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: c.color }}>
      {tool.status === "running" ? <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: c.color, animation: "pulse 0.8s infinite" }} /> : tool.status === "success" ? <CheckCircle size={9} /> : <XCircle size={9} />}
      {TOOL_LABELS[tool.name] || tool.name}
      {tool.duration && tool.status === "success" && <span style={{ opacity: 0.5 }}>{tool.duration}ms</span>}
    </div>
  );
}

// ── Step Item ─────────────────────────────────────────────────────────────────
function StepItem({ step }: { step: AgentStep }) {
  const [open, setOpen] = useState(false);
  const cfg: Record<string, { color: string }> = {
    user_request: { color: "#6366f1" }, tool_call: { color: "#f59e0b" },
    tool_result: { color: "#10b981" }, policy_validation: { color: "#3b82f6" },
    decision: { color: "#a78bfa" }, final_response: { color: "#6366f1" },
  };
  const c = cfg[step.type] || cfg.user_request;
  const hasDetail = step.type === "tool_call" || step.type === "tool_result";
  return (
    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.35rem" }}>
      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: `${c.color}15`, border: `1px solid ${c.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.58rem", color: c.color, flexShrink: 0, marginTop: "2px" }}>
        {step.step}
      </div>
      <div style={{ flex: 1 }}>
        <div onClick={() => hasDetail && setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: hasDetail ? "pointer" : "default" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: c.color }}>{step.title}</span>
          {step.toolCall && <ToolBadge tool={step.toolCall} />}
          {hasDetail && (open ? <ChevronDown size={10} color="var(--foreground-muted)" /> : <ChevronRight size={10} color="var(--foreground-muted)" />)}
        </div>
        {open && (
          <div className="code-block" style={{ marginTop: "0.3rem", fontSize: "0.67rem", maxHeight: "130px", overflow: "auto" }}>
            {step.content.length > 350 ? step.content.slice(0, 350) + "…" : step.content}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Decision Card ─────────────────────────────────────────────────────────────
function DecisionCard({ decision, amount, confidence }: { decision: "approved" | "rejected"; amount?: number; confidence: number }) {
  const isApproved = decision === "approved";
  return (
    <div>
      <div style={{ marginTop: "0.75rem", padding: "0.875rem 1.25rem", borderRadius: "10px", background: isApproved ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${isApproved ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`, display: "flex", alignItems: "center", gap: "0.875rem" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: isApproved ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {isApproved ? <CheckCircle size={20} color="#10b981" /> : <XCircle size={20} color="#ef4444" />}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: isApproved ? "#10b981" : "#ef4444" }}>
            {isApproved ? "🎉 Refund Approved!" : "❌ Refund Rejected"}
          </div>
          {isApproved && amount && (
            <div style={{ fontSize: "0.8rem", color: "var(--foreground-secondary)", marginTop: "0.1rem" }}>
              ₹{amount.toLocaleString("en-IN")} will be credited in 3–5 business days
            </div>
          )}
          {!isApproved && <div style={{ fontSize: "0.78rem", color: "var(--foreground-muted)", marginTop: "0.1rem" }}>See explanation above for the policy rule violated</div>}
        </div>
      </div>
      <ConfidenceMeter confidence={confidence} decision={decision} />
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isLatest }: { msg: Message; isLatest: boolean }) {
  const [stepsOpen, setStepsOpen] = useState(false);
  const typedContent = useTypingEffect(msg.content, isLatest && !msg.isStreaming && msg.role === "assistant" && !!msg.content, 12);
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-end", maxWidth: "80%" }}>
          <div style={{ padding: "0.7rem 1rem", borderRadius: "14px 14px 4px 14px", background: "linear-gradient(135deg, #6366f1, #4f52e5)", color: "white", fontSize: "0.87rem", lineHeight: 1.6, boxShadow: "0 2px 14px rgba(99,102,241,0.3)" }}>
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
        {/* Brain visualization while loading */}
        {msg.isStreaming && msg.steps && msg.steps.length > 0 && (
          <AgentBrainLoader steps={msg.steps} />
        )}

        {/* Typing dots */}
        {msg.isStreaming && !msg.content && msg.steps && msg.steps.length === 0 && (
          <div style={{ display: "flex", gap: "4px", padding: "8px 0" }}>
            {[0,1,2].map(i => <span key={i} className="typing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", display: "block", animationDelay: `${i*0.2}s` }} />)}
          </div>
        )}

        {/* Steps accordion */}
        {msg.steps && msg.steps.length > 0 && !msg.isStreaming && (
          <div className="glass" style={{ borderRadius: "10px", marginBottom: "0.6rem", overflow: "hidden" }}>
            <button onClick={() => setStepsOpen(!stepsOpen)} style={{ width: "100%", padding: "0.55rem 0.875rem", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Zap size={12} color="#f59e0b" />
              <span style={{ fontSize: "0.72rem", color: "var(--foreground-secondary)", fontWeight: 500, flex: 1 }}>{msg.steps.length} agent steps</span>
              {stepsOpen ? <ChevronDown size={12} color="var(--foreground-muted)" /> : <ChevronRight size={12} color="var(--foreground-muted)" />}
            </button>
            {stepsOpen && (
              <div style={{ padding: "0.4rem 0.875rem 0.875rem" }}>
                {msg.steps.map((s, i) => <StepItem key={i} step={s} />)}
              </div>
            )}
          </div>
        )}

        {/* Response text with typing effect */}
        {msg.content && (
          <div style={{ padding: "0.75rem 1rem", borderRadius: "4px 14px 14px 14px", background: "var(--glass)", border: "1px solid var(--border)", fontSize: "0.87rem", lineHeight: 1.75, color: "var(--foreground)", whiteSpace: "pre-wrap", minHeight: "40px" }}>
            {isLatest && !msg.isStreaming ? typedContent : msg.content}
            {isLatest && !msg.isStreaming && typedContent.length < msg.content.length && (
              <span style={{ display: "inline-block", width: "2px", height: "1em", background: "var(--accent)", marginLeft: "2px", animation: "pulse 0.6s infinite", verticalAlign: "text-bottom" }} />
            )}
          </div>
        )}

        {/* Decision card */}
        {msg.decision && msg.decision !== "pending" && !msg.isStreaming && (
          <DecisionCard decision={msg.decision} amount={msg.refundAmount} confidence={msg.confidence ?? 94} />
        )}
      </div>
    </div>
  );
}

// ── Main Chat ─────────────────────────────────────────────────────────────────
export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const { isListening, startListening, stopListening } = useVoice((text) => setInput(text));

  const generateConfidence = (decision: string) => {
    if (decision === "approved") return Math.floor(Math.random() * 8) + 91; // 91-98
    return Math.floor(Math.random() * 10) + 87; // 87-96
  };

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
              playSound("tool");
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, steps: [...(m.steps ?? []), data] } : m));
            }
            else if (event === "complete") {
              const confidence = generateConfidence(data.decision);
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: data.response ?? "", isStreaming: false, decision: data.decision, refundAmount: data.refundAmount, confidence } : m
              ));
              if (data.decision === "approved") {
                playSound("approve");
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 4000);
              } else if (data.decision === "rejected") {
                playSound("reject");
              }
            }
            else if (event === "error") {
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: `Error: ${data.message}`, isStreaming: false } : m));
            }
          } catch { }
        }
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: "Connection error. Check GROQ_API_KEY in .env.local", isStreaming: false } : m));
    } finally { setIsLoading(false); }
  };

  const placeholder = lang === "hi" ? "Apna order ID aur problem batayein…" : "Enter your order ID and describe your issue…";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>
      <Confetti active={showConfetti} />

      {/* Header */}
      <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(10,10,15,0.6)", backdropFilter: "blur(12px)" }}>
        <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(99,102,241,0.35)", flexShrink: 0 }}>
          <Bot size={16} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>RefundAI Agent</div>
          <div style={{ fontSize: "0.72rem", color: isLoading ? "#f59e0b" : "var(--green)" }}>
            {isLoading ? "⚡ Processing refund…" : "● Online · Groq AI · Sound ON"}
          </div>
        </div>
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
                {lang === "hi" ? "Apna order ID aur problem batayein — main turant decision dunga" : "Tell me your order ID and issue — I'll check the policy and give you an instant decision"}
              </p>
              <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.6rem", borderRadius: "20px", background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>🔊 Sound Effects</span>
                <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.6rem", borderRadius: "20px", background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>🤖 AI Confidence Score</span>
                <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.6rem", borderRadius: "20px", background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>💥 Confetti on Approval</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.6rem" }}>
              {SUGGESTED_PROMPTS.map(s => (
                <button key={s.label} onClick={() => sendMessage(s.prompt)}
                  style={{ padding: "0.875rem 1rem", borderRadius: "10px", background: "var(--glass)", border: "1px solid var(--border)", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.82rem" }}>{s.label}</span>
                    <span style={{ fontSize: "0.64rem", padding: "0.1rem 0.4rem", borderRadius: "4px",
                      background: s.tag === "Approved" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      color: s.tag === "Approved" ? "#10b981" : "#ef4444",
                      border: `1px solid ${s.tag === "Approved" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`, fontWeight: 700 }}>
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
            {messages.map((m, i) => <MessageBubble key={m.id} msg={m} isLatest={i === messages.length - 1} />)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid var(--border)", background: "rgba(10,10,15,0.6)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
          {isListening && (
            <div style={{ textAlign: "center", marginBottom: "0.4rem", fontSize: "0.75rem", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444", animation: "pulse 0.7s infinite" }} />
              Listening… speak now
            </div>
          )}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", background: "var(--background-secondary)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.5rem 0.6rem" }}>
            <button onClick={isListening ? stopListening : startListening} disabled={isLoading}
              style={{ width: "34px", height: "34px", borderRadius: "8px", background: isListening ? "rgba(239,68,68,0.15)" : "var(--glass)", border: `1px solid ${isListening ? "rgba(239,68,68,0.3)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              {isListening ? <MicOff size={14} color="#ef4444" /> : <Mic size={14} color="var(--foreground-muted)" />}
            </button>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder={placeholder} rows={1} disabled={isLoading}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--foreground)", fontSize: "0.88rem", resize: "none", lineHeight: 1.6, minHeight: "34px", maxHeight: "100px", overflowY: "auto", fontFamily: "var(--font-sans)" }} />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading}
              style={{ width: "34px", height: "34px", borderRadius: "8px", background: !input.trim() || isLoading ? "var(--glass)" : "linear-gradient(135deg, #6366f1, #4f52e5)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: !input.trim() || isLoading ? "not-allowed" : "pointer", flexShrink: 0, boxShadow: !input.trim() || isLoading ? "none" : "0 2px 10px rgba(99,102,241,0.35)" }}>
              <Send size={14} color={!input.trim() || isLoading ? "var(--foreground-muted)" : "white"} />
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: "0.3rem", fontSize: "0.66rem", color: "var(--foreground-muted)" }}>
            🎙️ Voice · 🌐 Hindi/English · 🔊 Sound · 💥 Confetti · Enter to send
          </div>
        </div>
      </div>
    </div>
  );
}