"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Zap, CheckCircle, XCircle, ChevronRight, ChevronDown, Sparkles, RotateCcw, Mic, MicOff, Brain, Share2, Upload, Timer, Shield } from "lucide-react";
import { AgentStep, ToolCall } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: AgentStep[];
  decision?: "approved" | "rejected" | "pending";
  refundAmount?: number;
  confidence?: number;
  isStreaming?: boolean;
  customerTier?: string;
  processingTime?: number;
}

const SUGGESTED_PROMPTS = [
  { label: "✅ Valid refund", prompt: "I'd like a refund for order ORD-2024-8821. My Sony headphones stopped working after 2 weeks.", tag: "Approved" },
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

// Order predictor data
const ORDER_PREDICTIONS: Record<string, { verdict: "approved" | "rejected"; reason: string; confidence: number; tier?: string }> = {
  "ORD-2024-8821": { verdict: "approved", reason: "Defective electronics within window", confidence: 96, tier: "gold" },
  "ORD-2024-7743": { verdict: "rejected", reason: "Digital product — non-refundable", confidence: 99, tier: "silver" },
  "ORD-2024-9102": { verdict: "approved", reason: "Wrong item delivered", confidence: 94, tier: "bronze" },
  "ORD-2024-1187": { verdict: "rejected", reason: "Refund limit exceeded (2/2)", confidence: 98, tier: "bronze" },
  "ORD-2024-2234": { verdict: "rejected", reason: "Outside 30-day window", confidence: 99, tier: "bronze" },
  "ORD-2024-5509": { verdict: "approved", reason: "Defective screen + evidence", confidence: 97, tier: "platinum" },
  "ORD-2024-3301": { verdict: "rejected", reason: "Custom product — non-refundable", confidence: 98, tier: "bronze" },
  "ORD-2024-4455": { verdict: "rejected", reason: "Product not yet delivered", confidence: 95, tier: "gold" },
  "ORD-2024-6620": { verdict: "approved", reason: "Damaged book with evidence", confidence: 92, tier: "silver" },
  "ORD-2024-9933": { verdict: "approved", reason: "Defective appliance + evidence", confidence: 95, tier: "platinum" },
};

// ── Sound Effects ─────────────────────────────────────────────────────────────
function playSound(type: "approve" | "reject" | "tool") {
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
      osc.start(); osc.stop(ctx.currentTime + 0.5);
    } else if (type === "reject") {
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(); osc.stop(ctx.currentTime + 0.08);
    }
  } catch { }
}

// ── Matrix Rain ───────────────────────────────────────────────────────────────
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.floor(canvas.width / 20);
    const drops = Array(cols).fill(1);
    const chars = "アイウエオカキクケコ0123456789REFUNDAI₹✓✗⚡".split("");
    const interval = setInterval(() => {
      ctx.fillStyle = "rgba(10,10,15,0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(99,102,241,0.15)";
      ctx.font = "14px monospace";
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * 20, y * 20);
        if (y * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    }, 80);
    return () => clearInterval(interval);
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.4 }} />;
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<any[]>([]);
  const animRef = useRef<number>(0);
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#6366f1","#10b981","#f59e0b","#a78bfa","#3b82f6","#ec4899"];
    particles.current = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width, y: -20,
      vx: (Math.random() - 0.5) * 6, vy: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4, rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
    }));
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter(p => p.y < canvas.height + 20);
      particles.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.rotation += p.rotSpeed;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
        ctx.fillStyle = p.color; ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.5);
        ctx.restore();
      });
      if (particles.current.length > 0) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 9999 }} />;
}

// ── AI Mood Indicator ─────────────────────────────────────────────────────────
function AIMoodIndicator({ steps, decision, isStreaming }: { steps: AgentStep[]; decision?: string; isStreaming?: boolean }) {
  const toolCount = steps.filter(s => s.type === "tool_call").length;
  let mood = { emoji: "😴", label: "Idle", color: "#6b7280" };
  if (!isStreaming && decision === "approved") mood = { emoji: "😊", label: "Happy", color: "#10b981" };
  else if (!isStreaming && decision === "rejected") mood = { emoji: "😤", label: "Strict", color: "#ef4444" };
  else if (isStreaming && toolCount >= 5) mood = { emoji: "⚖️", label: "Deciding", color: "#a78bfa" };
  else if (isStreaming && toolCount >= 3) mood = { emoji: "🔍", label: "Checking", color: "#3b82f6" };
  else if (isStreaming && toolCount >= 1) mood = { emoji: "🤔", label: "Analyzing", color: "#f59e0b" };
  else if (isStreaming) mood = { emoji: "💭", label: "Thinking", color: "#6366f1" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.7rem", borderRadius: "20px", background: `${mood.color}15`, border: `1px solid ${mood.color}30`, fontSize: "0.72rem", color: mood.color, fontWeight: 600 }}>
      <span style={{ fontSize: "1rem" }}>{mood.emoji}</span>
      AI Mood: {mood.label}
    </div>
  );
}

// ── Policy Rule Tracker ───────────────────────────────────────────────────────
function PolicyRuleTracker({ steps }: { steps: AgentStep[] }) {
  const rules = [
    { key: "validateRefundWindow", label: "30-Day Window" },
    { key: "validateRefundHistory", label: "Refund Limit" },
    { key: "validateProductEligibility", label: "Product Type" },
    { key: "calculateRefundAmount", label: "Amount Check" },
  ];
  const getStatus = (key: string) => {
    const step = steps.find(s => s.toolCall?.name === key);
    if (!step) return "pending";
    if (step.toolCall?.status === "running") return "running";
    const result = step.toolCall?.result as any;
    if (result?.valid === false) return "fail";
    if (result?.valid === true) return "pass";
    return "pass";
  };
  const hasAny = steps.some(s => rules.some(r => s.toolCall?.name === r.key));
  if (!hasAny) return null;
  return (
    <div style={{ padding: "0.75rem", borderRadius: "10px", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", marginBottom: "0.5rem" }}>
      <div style={{ fontSize: "0.68rem", color: "var(--foreground-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <Shield size={11} color="#818cf8" /> Policy Rule Tracker
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
        {rules.map(r => {
          const status = getStatus(r.key);
          const cfg = {
            pending: { color: "var(--foreground-muted)", bg: "transparent", icon: "○" },
            running: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: "⟳" },
            pass: { color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: "✓" },
            fail: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: "✗" },
          }[status];
          return (
            <div key={r.key} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.5rem", borderRadius: "6px", background: cfg.bg, transition: "all 0.3s ease" }}>
              <span style={{ fontSize: "0.75rem", color: cfg.color, fontWeight: 700, animation: status === "running" ? "pulse 0.8s infinite" : "none" }}>{cfg.icon}</span>
              <span style={{ fontSize: "0.68rem", color: cfg.color }}>{r.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Live Timer ────────────────────────────────────────────────────────────────
function LiveTimer({ startTime, endTime }: { startTime: number; endTime?: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (endTime) { setElapsed(endTime - startTime); return; }
    const t = setInterval(() => setElapsed(Date.now() - startTime), 100);
    return () => clearInterval(t);
  }, [startTime, endTime]);
  const secs = (elapsed / 1000).toFixed(1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.72rem", color: "var(--foreground-muted)", fontFamily: "var(--font-mono)" }}>
      <Timer size={11} />
      {secs}s
    </div>
  );
}

// ── Customer Loyalty Badge ────────────────────────────────────────────────────
function TierBadge({ tier }: { tier: string }) {
  const cfg: Record<string, { color: string; bg: string; label: string; icon: string }> = {
    platinum: { color: "#e5e4e2", bg: "rgba(229,228,226,0.1)", label: "Platinum", icon: "💎" },
    gold: { color: "#ffd700", bg: "rgba(255,215,0,0.1)", label: "Gold", icon: "🥇" },
    silver: { color: "#c0c0c0", bg: "rgba(192,192,192,0.1)", label: "Silver", icon: "🥈" },
    bronze: { color: "#cd7f32", bg: "rgba(205,127,50,0.1)", label: "Bronze", icon: "🥉" },
  };
  const c = cfg[tier] || cfg.bronze;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.65rem", borderRadius: "20px", background: c.bg, border: `1px solid ${c.color}30`, fontSize: "0.7rem", color: c.color, fontWeight: 700 }}>
      {c.icon} {c.label} Member
      {(tier === "gold" || tier === "platinum") && (
        <span style={{ fontSize: "0.62rem", background: c.color, color: "#000", padding: "0.05rem 0.3rem", borderRadius: "3px", fontWeight: 800 }}>PRIORITY</span>
      )}
    </div>
  );
}

// ── Evidence Upload ───────────────────────────────────────────────────────────
function EvidenceUpload({ onUpload }: { onUpload: (name: string) => void }) {
  const [uploaded, setUploaded] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setUploaded(file.name); onUpload(file.name); }
  };
  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*,video/*" onChange={handleFile} style={{ display: "none" }} />
      {!uploaded ? (
        <button onClick={() => inputRef.current?.click()}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", borderRadius: "8px", background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.3)", color: "#818cf8", fontSize: "0.75rem", cursor: "pointer", width: "100%", justifyContent: "center" }}>
          <Upload size={13} /> Upload Evidence (Photo/Video)
        </button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", borderRadius: "8px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981", fontSize: "0.75rem" }}>
          <CheckCircle size={13} /> Evidence received: {uploaded} ✓
        </div>
      )}
    </div>
  );
}

// ── Refund Predictor ──────────────────────────────────────────────────────────
function RefundPredictor({ input }: { input: string }) {
  const orderMatch = input.match(/ORD-\d{4}-\d{4}/i);
  const orderId = orderMatch?.[0]?.toUpperCase();
  const prediction = orderId ? ORDER_PREDICTIONS[orderId] : null;
  if (!prediction) return null;
  return (
    <div className="fade-in" style={{
      padding: "0.6rem 0.875rem", borderRadius: "8px", marginBottom: "0.4rem",
      background: prediction.verdict === "approved" ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
      border: `1px solid ${prediction.verdict === "approved" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
      display: "flex", alignItems: "center", gap: "0.6rem",
    }}>
      <span style={{ fontSize: "0.85rem" }}>{prediction.verdict === "approved" ? "🔮✅" : "🔮❌"}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: prediction.verdict === "approved" ? "#10b981" : "#ef4444" }}>
          AI Predicts: {prediction.verdict === "approved" ? "APPROVE" : "REJECT"} ({prediction.confidence}% confident)
        </div>
        <div style={{ fontSize: "0.67rem", color: "var(--foreground-muted)" }}>{prediction.reason}</div>
      </div>
      {prediction.tier && <TierBadge tier={prediction.tier} />}
    </div>
  );
}

// ── WhatsApp Share ────────────────────────────────────────────────────────────
function WhatsAppShare({ decision, amount, orderId }: { decision: string; amount?: number; orderId?: string }) {
  const text = decision === "approved"
    ? `✅ My refund for order ${orderId} has been APPROVED! ₹${amount?.toLocaleString("en-IN")} will be credited in 3-5 days. Processed by RefundAI 🤖`
    : `❌ Refund for order ${orderId} was not approved due to policy violation. Checked by RefundAI 🤖`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.875rem", borderRadius: "8px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.25)", color: "#25d366", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none", marginTop: "0.5rem" }}>
      <Share2 size={13} /> Share on WhatsApp
    </a>
  );
}

// ── Confidence Meter ──────────────────────────────────────────────────────────
function ConfidenceMeter({ confidence, decision }: { confidence: number; decision: "approved" | "rejected" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let curr = 0; const step = confidence / 40;
    const t = setInterval(() => {
      curr = Math.min(curr + step, confidence);
      setDisplay(Math.round(curr));
      if (curr >= confidence) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [confidence]);
  const color = decision === "approved" ? "#10b981" : "#ef4444";
  return (
    <div style={{ marginTop: "0.5rem", padding: "0.6rem 0.875rem", borderRadius: "8px", background: `${color}08`, border: `1px solid ${color}15` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
        <span style={{ fontSize: "0.7rem", color: "var(--foreground-muted)" }}>🤖 AI Confidence</span>
        <span style={{ fontSize: "0.9rem", fontWeight: 800, color, fontFamily: "var(--font-mono)" }}>{display}%</span>
      </div>
      <div style={{ height: "5px", borderRadius: "3px", background: "var(--border)" }}>
        <div style={{ height: "100%", width: `${display}%`, background: color, borderRadius: "3px", boxShadow: `0 0 8px ${color}60`, transition: "width 0.05s" }} />
      </div>
    </div>
  );
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
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.15rem 0.5rem", borderRadius: "5px", background: c.bg, border: `1px solid ${c.color}25`, fontSize: "0.67rem", fontFamily: "var(--font-mono)", color: c.color }}>
      {tool.status === "running" ? <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: c.color, animation: "pulse 0.8s infinite" }} /> : tool.status === "success" ? <CheckCircle size={9} /> : <XCircle size={9} />}
      {TOOL_LABELS[tool.name] || tool.name}
    </div>
  );
}

// ── Step Item ─────────────────────────────────────────────────────────────────
function StepItem({ step }: { step: AgentStep }) {
  const [open, setOpen] = useState(false);
  const cfg: Record<string, { color: string }> = {
    user_request: { color: "#6366f1" }, tool_call: { color: "#f59e0b" },
    tool_result: { color: "#10b981" }, decision: { color: "#a78bfa" }, final_response: { color: "#6366f1" },
  };
  const c = cfg[step.type] || cfg.user_request;
  const hasDetail = step.type === "tool_call" || step.type === "tool_result";
  return (
    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.3rem" }}>
      <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: `${c.color}15`, border: `1px solid ${c.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", color: c.color, flexShrink: 0, marginTop: "2px" }}>{step.step}</div>
      <div style={{ flex: 1 }}>
        <div onClick={() => hasDetail && setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: "0.3rem", cursor: hasDetail ? "pointer" : "default" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: c.color }}>{step.title}</span>
          {step.toolCall && <ToolBadge tool={step.toolCall} />}
          {hasDetail && (open ? <ChevronDown size={10} color="var(--foreground-muted)" /> : <ChevronRight size={10} color="var(--foreground-muted)" />)}
        </div>
        {open && <div className="code-block" style={{ marginTop: "0.25rem", fontSize: "0.65rem", maxHeight: "120px", overflow: "auto" }}>{step.content.slice(0, 300)}</div>}
      </div>
    </div>
  );
}

// ── Voice Hook ────────────────────────────────────────────────────────────────
function useVoice(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const ref = useRef<any>(null);
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Use Chrome for voice!"); return; }
    const r = new SR(); r.lang = "en-IN"; r.continuous = false; r.interimResults = false;
    r.onresult = (e: any) => { onResult(e.results[0][0].transcript); setIsListening(false); };
    r.onerror = r.onend = () => setIsListening(false);
    ref.current = r; r.start(); setIsListening(true);
  };
  const stopListening = () => { ref.current?.stop(); setIsListening(false); };
  return { isListening, startListening, stopListening };
}

// ── Main Chat ─────────────────────────────────────────────────────────────────
export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showMatrix, setShowMatrix] = useState(true);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [evidenceFile, setEvidenceFile] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [allSteps, setAllSteps] = useState<AgentStep[]>([]);
  const [currentDecision, setCurrentDecision] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const { isListening, startListening, stopListening } = useVoice(text => setInput(text));

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const finalText = evidenceFile ? `${text} [Evidence attached: ${evidenceFile}]` : text;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: finalText };
    setMessages(prev => [...prev, userMsg]);
    setInput(""); setEvidenceFile(null);
    setIsLoading(true);
    setAllSteps([]);
    setCurrentDecision(undefined);
    const now = Date.now();
    setStartTime(now);
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", isStreaming: true, steps: [] }]);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: finalText, sessionId }),
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
              setAllSteps(prev => [...prev, data]);
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, steps: [...(m.steps ?? []), data] } : m));
            }
            else if (event === "complete") {
              const confidence = data.decision === "approved" ? Math.floor(Math.random() * 7) + 92 : Math.floor(Math.random() * 9) + 88;
              const procTime = Date.now() - now;
              setCurrentDecision(data.decision);
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: data.response ?? "", isStreaming: false, decision: data.decision, refundAmount: data.refundAmount, confidence, processingTime: procTime } : m
              ));
              if (data.decision === "approved") { playSound("approve"); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4500); }
              else if (data.decision === "rejected") playSound("reject");
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

  const lastMsg = messages[messages.length - 1];
  const isLastStreaming = lastMsg?.isStreaming;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", position: "relative" }}>
      {showMatrix && <MatrixRain />}
      <Confetti active={showConfetti} />

      {/* Header */}
      <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.6rem", background: "rgba(10,10,15,0.85)", backdropFilter: "blur(16px)", zIndex: 10, flexWrap: "wrap" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(99,102,241,0.4)", flexShrink: 0 }}>
          <Bot size={15} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>RefundAI Agent</div>
          <div style={{ fontSize: "0.68rem", color: isLoading ? "#f59e0b" : "var(--green)" }}>
            {isLoading ? "⚡ Processing…" : "● Online · Groq Llama 3.3"}
          </div>
        </div>

        {/* Mood Indicator */}
        <AIMoodIndicator steps={allSteps} decision={currentDecision} isStreaming={isLoading} />

        {/* Live Timer when processing */}
        {isLoading && startTime > 0 && <LiveTimer startTime={startTime} />}

        <button onClick={() => setShowMatrix(!showMatrix)} style={{ padding: "0.25rem 0.5rem", borderRadius: "6px", background: "var(--glass)", border: "1px solid var(--border)", color: showMatrix ? "#6366f1" : "var(--foreground-muted)", fontSize: "0.68rem", cursor: "pointer", flexShrink: 0 }}>
          {showMatrix ? "🌙 Matrix ON" : "🌙 Matrix OFF"}
        </button>
        <button onClick={() => setLang(l => l === "en" ? "hi" : "en")} style={{ padding: "0.25rem 0.5rem", borderRadius: "6px", background: "var(--glass)", border: "1px solid var(--border)", color: "var(--foreground-secondary)", fontSize: "0.68rem", cursor: "pointer", flexShrink: 0 }}>
          {lang === "en" ? "🇮🇳" : "🇬🇧"}
        </button>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); setSessionId(null); setAllSteps([]); setCurrentDecision(undefined); }}
            style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.6rem", borderRadius: "6px", background: "var(--glass)", border: "1px solid var(--border)", color: "var(--foreground-muted)", fontSize: "0.72rem", cursor: "pointer", flexShrink: 0 }}>
            <RotateCcw size={11} /> New
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", position: "relative", zIndex: 1 }}>
        {messages.length === 0 ? (
          <div style={{ maxWidth: "700px", margin: "0 auto", paddingTop: "1rem" }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg, #6366f1, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem", boxShadow: "0 4px 24px rgba(99,102,241,0.3)" }}>
                <Sparkles size={22} color="white" />
              </div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                {lang === "hi" ? "Namaste! Kaise madad karoon?" : "How can I help you today?"}
              </h2>
              <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.75rem" }}>
                {["💥 Confetti", "🔊 Sound", "🤖 Confidence", "🧠 Brain", "⏱️ Timer", "🔮 Predictor", "🎭 Mood", "🌙 Matrix"].map(f => (
                  <span key={f} style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: "20px", background: "rgba(99,102,241,0.08)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.15)" }}>{f}</span>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.5rem" }}>
              {SUGGESTED_PROMPTS.map(s => (
                <button key={s.label} onClick={() => sendMessage(s.prompt)}
                  style={{ padding: "0.75rem", borderRadius: "10px", background: "rgba(10,10,15,0.7)", border: "1px solid var(--border)", cursor: "pointer", textAlign: "left", backdropFilter: "blur(8px)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>{s.label}</span>
                    <span style={{ fontSize: "0.62rem", padding: "0.08rem 0.35rem", borderRadius: "4px",
                      background: s.tag === "Approved" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      color: s.tag === "Approved" ? "#10b981" : "#ef4444", fontWeight: 700 }}>{s.tag}</span>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--foreground-muted)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: "780px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const isLast = idx === messages.length - 1;
              if (isUser) return (
                <div key={msg.id} style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", maxWidth: "80%" }}>
                    <div style={{ padding: "0.65rem 0.9rem", borderRadius: "14px 14px 4px 14px", background: "linear-gradient(135deg, #6366f1, #4f52e5)", color: "white", fontSize: "0.85rem", lineHeight: 1.6, boxShadow: "0 2px 14px rgba(99,102,241,0.3)" }}>{msg.content}</div>
                    <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={12} color="#818cf8" /></div>
                  </div>
                </div>
              );
              return (
                <div key={msg.id} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", maxWidth: "95%" }}>
                  <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}><Bot size={12} color="#818cf8" /></div>
                  <div style={{ flex: 1 }}>
                    {/* Policy tracker while streaming */}
                    {msg.isStreaming && msg.steps && <PolicyRuleTracker steps={msg.steps} />}

                    {/* Typing dots */}
                    {msg.isStreaming && !msg.content && (!msg.steps || msg.steps.length === 0) && (
                      <div style={{ display: "flex", gap: "4px", padding: "6px 0" }}>
                        {[0,1,2].map(i => <span key={i} className="typing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", display: "block", animationDelay: `${i*0.2}s` }} />)}
                      </div>
                    )}

                    {/* Steps accordion */}
                    {msg.steps && msg.steps.length > 0 && !msg.isStreaming && (
                      <StepsAccordion steps={msg.steps} />
                    )}

                    {/* Response */}
                    {msg.content && (
                      <div style={{ padding: "0.7rem 0.9rem", borderRadius: "4px 14px 14px 14px", background: "rgba(10,10,15,0.75)", border: "1px solid var(--border)", fontSize: "0.85rem", lineHeight: 1.75, backdropFilter: "blur(8px)", whiteSpace: "pre-wrap" }}>
                        {msg.content}
                      </div>
                    )}

                    {/* Decision card */}
                    {msg.decision && msg.decision !== "pending" && !msg.isStreaming && (
                      <div>
                        <div style={{ marginTop: "0.6rem", padding: "0.8rem 1rem", borderRadius: "10px", background: msg.decision === "approved" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${msg.decision === "approved" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`, display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: msg.decision === "approved" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {msg.decision === "approved" ? <CheckCircle size={18} color="#10b981" /> : <XCircle size={18} color="#ef4444" />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: "0.87rem", color: msg.decision === "approved" ? "#10b981" : "#ef4444" }}>
                              {msg.decision === "approved" ? "🎉 Refund Approved!" : "❌ Refund Rejected"}
                            </div>
                            {msg.decision === "approved" && msg.refundAmount && (
                              <div style={{ fontSize: "0.76rem", color: "var(--foreground-secondary)" }}>₹{msg.refundAmount.toLocaleString("en-IN")} in 3–5 business days</div>
                            )}
                          </div>
                          {msg.processingTime && (
                            <div style={{ fontSize: "0.68rem", color: "var(--foreground-muted)", fontFamily: "var(--font-mono)", textAlign: "right" }}>
                              <div>⏱️ {(msg.processingTime/1000).toFixed(1)}s</div>
                            </div>
                          )}
                        </div>
                        {msg.confidence && <ConfidenceMeter confidence={msg.confidence} decision={msg.decision as any} />}
                        <WhatsAppShare decision={msg.decision} amount={msg.refundAmount} orderId={messages.find(m => m.role === "user")?.content.match(/ORD-\d{4}-\d{4}/i)?.[0]} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border)", background: "rgba(10,10,15,0.85)", backdropFilter: "blur(16px)", zIndex: 10 }}>
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
          {/* Predictor */}
          {input.length > 5 && <RefundPredictor input={input} />}

          {/* Evidence upload */}
          <EvidenceUpload onUpload={setEvidenceFile} />

          {isListening && (
            <div style={{ textAlign: "center", margin: "0.3rem 0", fontSize: "0.73rem", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444", animation: "pulse 0.7s infinite" }} /> Listening…
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", background: "var(--background-secondary)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.45rem 0.55rem", marginTop: "0.4rem" }}>
            <button onClick={isListening ? stopListening : startListening} disabled={isLoading}
              style={{ width: "32px", height: "32px", borderRadius: "7px", background: isListening ? "rgba(239,68,68,0.15)" : "var(--glass)", border: `1px solid ${isListening ? "rgba(239,68,68,0.3)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              {isListening ? <MicOff size={13} color="#ef4444" /> : <Mic size={13} color="var(--foreground-muted)" />}
            </button>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder={lang === "hi" ? "Order ID aur problem batayein…" : "Enter order ID and describe your issue…"}
              rows={1} disabled={isLoading}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--foreground)", fontSize: "0.86rem", resize: "none", lineHeight: 1.6, minHeight: "32px", maxHeight: "90px", overflowY: "auto", fontFamily: "var(--font-sans)" }} />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading}
              style={{ width: "32px", height: "32px", borderRadius: "7px", background: !input.trim() || isLoading ? "var(--glass)" : "linear-gradient(135deg, #6366f1, #4f52e5)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: !input.trim() || isLoading ? "not-allowed" : "pointer", flexShrink: 0 }}>
              <Send size={13} color={!input.trim() || isLoading ? "var(--foreground-muted)" : "white"} />
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: "0.25rem", fontSize: "0.62rem", color: "var(--foreground-muted)" }}>
            🎙️ Voice · 🌙 Matrix · 🔮 Predictor · 📸 Evidence · 📱 WhatsApp · 💥 Confetti · 🔊 Sound
          </div>
        </div>
      </div>
    </div>
  );
}

function StepsAccordion({ steps }: { steps: AgentStep[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass" style={{ borderRadius: "10px", marginBottom: "0.5rem", overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", padding: "0.5rem 0.8rem", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <Zap size={11} color="#f59e0b" />
        <span style={{ fontSize: "0.7rem", color: "var(--foreground-secondary)", fontWeight: 500, flex: 1 }}>{steps.length} agent steps</span>
        {open ? <ChevronDown size={11} color="var(--foreground-muted)" /> : <ChevronRight size={11} color="var(--foreground-muted)" />}
      </button>
      {open && <div style={{ padding: "0.4rem 0.8rem 0.8rem" }}>{steps.map((s, i) => <StepItem key={i} step={s} />)}</div>}
    </div>
  );
}