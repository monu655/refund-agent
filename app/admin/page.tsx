"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  TrendingUp, CheckCircle, XCircle, Clock, Activity,
  Bot, Zap, RefreshCw, DollarSign, ChevronDown, ChevronRight
} from "lucide-react";
import { AgentSession, AgentStep } from "@/types";

interface Stats {
  totalRequests: number; approvedRefunds: number; rejectedRefunds: number;
  pendingRefunds: number; approvalRate: number; avgResolutionTime: number;
  totalRefundAmount: number;
}
interface ActivityEntry {
  id: string; sessionId: string; orderId: string; customerName: string;
  decision: "approved" | "rejected" | "pending"; amount?: number;
  timestamp: string; duration: number;
}

// Mock trend data for charts
const TREND_DATA = [
  { date: "Dec 18", approved: 3, rejected: 2 },
  { date: "Dec 19", approved: 5, rejected: 3 },
  { date: "Dec 20", approved: 4, rejected: 4 },
  { date: "Dec 21", approved: 7, rejected: 2 },
  { date: "Dec 22", approved: 6, rejected: 3 },
  { date: "Dec 23", approved: 4, rejected: 5 },
  { date: "Today", approved: 0, rejected: 0 },
];

const RATE_DATA = [
  { date: "Dec 18", rate: 60 }, { date: "Dec 19", rate: 63 },
  { date: "Dec 20", rate: 50 }, { date: "Dec 21", rate: 78 },
  { date: "Dec 22", rate: 67 }, { date: "Dec 23", rate: 44 },
  { date: "Today", rate: 0 },
];

function StatCard({ label, value, sub, icon: Icon, color, prefix = "" }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; color: string; prefix?: string;
}) {
  return (
    <div className="glass" style={{ borderRadius: "12px", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--foreground-muted)", fontWeight: 500 }}>{label}</span>
        <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
          {prefix}{typeof value === "number" ? value.toLocaleString("en-IN") : value}
        </div>
        {sub && <div style={{ fontSize: "0.72rem", color: "var(--foreground-muted)", marginTop: "0.3rem" }}>{sub}</div>}
      </div>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: "approved" | "rejected" | "pending" }) {
  const config = {
    approved: { bg: "rgba(16,185,129,0.1)", color: "#10b981", border: "rgba(16,185,129,0.2)", label: "✓ Approved" },
    rejected: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.2)", label: "✗ Rejected" },
    pending: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "rgba(245,158,11,0.2)", label: "⏳ Pending" },
  }[decision];
  return (
    <span style={{ padding: "0.15rem 0.55rem", borderRadius: "5px", fontSize: "0.7rem", fontWeight: 700, background: config.bg, color: config.color, border: `1px solid ${config.border}` }}>
      {config.label}
    </span>
  );
}

function SessionRow({ session }: { session: AgentSession }) {
  const [expanded, setExpanded] = useState(false);
  const duration = session.endTime
    ? ((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000).toFixed(1)
    : "…";

  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 1fr 0.8fr 32px", padding: "0.875rem 1.25rem", alignItems: "center", cursor: "pointer", fontSize: "0.83rem", gap: "0.5rem" }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#818cf8" }}>
          {session.orderId || session.sessionId.slice(-8)}
        </span>
        <span style={{ color: "var(--foreground)" }}>{session.customer?.name ?? "—"}</span>
        {session.decision ? <DecisionBadge decision={session.decision} /> : <span style={{ color: "var(--foreground-muted)", fontSize: "0.75rem" }}>processing…</span>}
        <span style={{ color: "var(--foreground-secondary)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
          {session.refundAmount ? `₹${session.refundAmount.toLocaleString("en-IN")}` : "—"}
        </span>
        <span style={{ color: "var(--foreground-muted)", fontSize: "0.75rem" }}>{duration}s</span>
        {expanded ? <ChevronDown size={13} color="var(--foreground-muted)" /> : <ChevronRight size={13} color="var(--foreground-muted)" />}
      </div>

      {expanded && session.steps.length > 0 && (
        <div style={{ padding: "0 1.25rem 1rem", background: "rgba(0,0,0,0.2)" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem", paddingTop: "0.75rem" }}>
            Agent Reasoning Trace · {session.steps.length} steps
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {session.steps.map((step, i) => (
              <StepRow key={i} step={step} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StepRow({ step }: { step: AgentStep }) {
  const [open, setOpen] = useState(false);
  const typeColors: Record<string, { color: string; bg: string }> = {
    user_request: { color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
    tool_call: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    tool_result: { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    policy_validation: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
    decision: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
    final_response: { color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
  };
  const c = typeColors[step.type] || typeColors.user_request;
  const isExpandable = step.type === "tool_call" || step.type === "tool_result";

  return (
    <div
      onClick={() => isExpandable && setOpen(!open)}
      style={{ borderRadius: "8px", background: c.bg, border: `1px solid ${c.color}20`, overflow: "hidden", cursor: isExpandable ? "pointer" : "default" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.45rem 0.75rem" }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: c.color, minWidth: "14px" }}>{step.step}</span>
        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: c.color, flex: 1 }}>{step.title}</span>
        <span style={{ fontSize: "0.68rem", color: "var(--foreground-muted)" }}>
          {new Date(step.timestamp).toLocaleTimeString()}
        </span>
        {isExpandable && (open ? <ChevronDown size={11} color={c.color} /> : <ChevronRight size={11} color={c.color} />)}
      </div>
      {open && (
        <div style={{ padding: "0 0.75rem 0.75rem" }}>
          <pre style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--foreground-secondary)", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0, lineHeight: 1.5 }}>
            {step.content.length > 500 ? step.content.slice(0, 500) + "…" : step.content}
          </pre>
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--background-secondary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.6rem 0.875rem", fontSize: "0.78rem" }}>
      <div style={{ color: "var(--foreground-muted)", marginBottom: "0.3rem" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({ totalRequests: 0, approvedRefunds: 0, rejectedRefunds: 0, pendingRefunds: 0, approvalRate: 0, avgResolutionTime: 0, totalRefundAmount: 0 });
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        fetch("/api/stats"), fetch("/api/sessions")
      ]);
      const statsData = await statsRes.json();
      const sessionsData = await sessionsRes.json();
      if (statsData.success) setStats(statsData.data.stats);
      if (sessionsData.success) setSessions(sessionsData.data);
      setLastRefresh(new Date());
    } catch (e) { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 5000); return () => clearInterval(t); }, [fetchData]);

  const pieData = stats.totalRequests > 0 ? [
    { name: "Approved", value: stats.approvedRefunds, color: "#10b981" },
    { name: "Rejected", value: stats.rejectedRefunds, color: "#ef4444" },
    { name: "Pending", value: stats.pendingRefunds, color: "#f59e0b" },
  ].filter(d => d.value > 0) : [{ name: "No data", value: 1, color: "var(--border)" }];

  return (
    <div style={{ paddingTop: "56px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "0.2rem" }}>Admin Dashboard</h1>
            <p style={{ color: "var(--foreground-muted)", fontSize: "0.82rem" }}>Live agent activity · auto-refreshes every 5s</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--foreground-muted)" }}>
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={fetchData}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.875rem", borderRadius: "8px", background: "var(--glass)", border: "1px solid var(--border)", color: "var(--foreground-secondary)", fontSize: "0.78rem", cursor: "pointer" }}
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <StatCard label="Total Requests" value={stats.totalRequests} icon={Activity} color="#6366f1" sub="All time sessions" />
          <StatCard label="Approved" value={stats.approvedRefunds} icon={CheckCircle} color="#10b981" sub="Refunds processed" />
          <StatCard label="Rejected" value={stats.rejectedRefunds} icon={XCircle} color="#ef4444" sub="Policy violations" />
          <StatCard label="Approval Rate" value={`${stats.approvalRate}%`} icon={TrendingUp} color="#3b82f6" sub="Of completed requests" />
          <StatCard label="Avg Resolution" value={`${stats.avgResolutionTime}s`} icon={Clock} color="#f59e0b" sub="End-to-end time" />
          <StatCard label="Total Refunded" value={stats.totalRefundAmount} icon={DollarSign} color="#a78bfa" prefix="₹" sub="Approved amount" />
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: "1rem", marginBottom: "2rem" }}>
          {/* Trend bar chart */}
          <div className="glass" style={{ borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--foreground)" }}>
              Refund Trends (7 days)
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={TREND_DATA} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="approved" fill="#10b981" radius={[3, 3, 0, 0]} name="Approved" />
                <Bar dataKey="rejected" fill="#ef4444" radius={[3, 3, 0, 0]} name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Approval rate line chart */}
          <div className="glass" style={{ borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--foreground)" }}>
              Approval Rate (7 days)
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={RATE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 3 }} name="Rate %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="glass" style={{ borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: "1rem", color: "var(--foreground)" }}>
              Decision Distribution
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.72rem" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                  <span style={{ color: "var(--foreground-secondary)", flex: 1 }}>{d.name}</span>
                  <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Session log */}
        <div className="glass" style={{ borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Bot size={15} color="var(--accent)" />
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Agent Sessions</span>
              <span style={{ fontSize: "0.72rem", color: "var(--foreground-muted)", padding: "0.1rem 0.5rem", background: "var(--glass)", borderRadius: "4px", border: "1px solid var(--border)" }}>
                {sessions.length} total
              </span>
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--foreground-muted)" }}>Click any row to expand reasoning trace</span>
          </div>

          {sessions.length === 0 ? (
            <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--foreground-muted)" }}>
              <Bot size={36} style={{ opacity: 0.2, margin: "0 auto 1rem", display: "block" }} />
              <div style={{ fontWeight: 600, marginBottom: "0.3rem" }}>No sessions yet</div>
              <div style={{ fontSize: "0.83rem" }}>Go to the Agent page and submit a refund request to see live logs here.</div>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 1fr 0.8fr 32px", padding: "0.6rem 1.25rem", borderBottom: "1px solid var(--border)", fontSize: "0.68rem", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.07em", gap: "0.5rem" }}>
                <span>Order ID</span><span>Customer</span><span>Decision</span><span>Refund Amt</span><span>Duration</span><span />
              </div>
              {sessions.map(s => <SessionRow key={s.sessionId} session={s} />)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
