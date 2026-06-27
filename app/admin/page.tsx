"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, CheckCircle, XCircle, Clock, Activity, Bot, RefreshCw, DollarSign, ChevronDown, ChevronRight } from "lucide-react";
import { AgentSession, AgentStep, ToolCall } from "@/types";

interface Stats {
  totalRequests: number; approvedRefunds: number; rejectedRefunds: number;
  pendingRefunds: number; approvalRate: number; avgResolutionTime: number; totalRefundAmount: number;
}

const TREND_DATA = [
  { date: "D18", approved: 3, rejected: 2 },
  { date: "D19", approved: 5, rejected: 3 },
  { date: "D20", approved: 4, rejected: 4 },
  { date: "D21", approved: 7, rejected: 2 },
  { date: "D22", approved: 6, rejected: 3 },
  { date: "D23", approved: 4, rejected: 5 },
  { date: "Today", approved: 0, rejected: 0 },
];

const RATE_DATA = [
  { date: "D18", rate: 60 }, { date: "D19", rate: 63 },
  { date: "D20", rate: 50 }, { date: "D21", rate: 78 },
  { date: "D22", rate: 67 }, { date: "D23", rate: 44 },
  { date: "Today", rate: 0 },
];

function StatCard({ label, value, icon: Icon, color, prefix = "" }: {
  label: string; value: number | string; icon: React.ElementType; color: string; prefix?: string;
}) {
  return (
    <div className="glass" style={{ borderRadius: "12px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.72rem", color: "var(--foreground-muted)", fontWeight: 500 }}>{label}</span>
        <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={13} color={color} />
        </div>
      </div>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
        {prefix}{typeof value === "number" ? value.toLocaleString("en-IN") : value}
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
    <span style={{ padding: "0.15rem 0.5rem", borderRadius: "5px", fontSize: "0.68rem", fontWeight: 700, background: config.bg, color: config.color, border: `1px solid ${config.border}`, whiteSpace: "nowrap" }}>
      {config.label}
    </span>
  );
}

function StepRow({ step }: { step: AgentStep }) {
  const [open, setOpen] = useState(false);
  const typeColors: Record<string, { color: string }> = {
    user_request: { color: "#6366f1" },
    tool_call: { color: "#f59e0b" },
    tool_result: { color: "#10b981" },
    policy_validation: { color: "#3b82f6" },
    decision: { color: "#a78bfa" },
    final_response: { color: "#6366f1" },
  };
  const c = typeColors[step.type] || typeColors.user_request;
  const isExpandable = step.type === "tool_call" || step.type === "tool_result";

  return (
    <div onClick={() => isExpandable && setOpen(!open)}
      style={{ borderRadius: "6px", background: `${c.color}10`, border: `1px solid ${c.color}20`, overflow: "hidden", cursor: isExpandable ? "pointer" : "default", marginBottom: "0.3rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.6rem" }}>
        <span style={{ fontSize: "0.62rem", fontWeight: 700, color: c.color, minWidth: "14px" }}>{step.step}</span>
        <span style={{ fontSize: "0.7rem", fontWeight: 600, color: c.color, flex: 1 }}>{step.title}</span>
        {isExpandable && (open ? <ChevronDown size={10} color={c.color} /> : <ChevronRight size={10} color={c.color} />)}
      </div>
      {open && (
        <div style={{ padding: "0 0.6rem 0.6rem" }}>
          <pre style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--foreground-secondary)", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>
            {step.content.length > 300 ? step.content.slice(0, 300) + "…" : step.content}
          </pre>
        </div>
      )}
    </div>
  );
}

function SessionRow({ session }: { session: AgentSession }) {
  const [expanded, setExpanded] = useState(false);
  const duration = session.endTime
    ? ((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000).toFixed(1)
    : "…";

  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <div onClick={() => setExpanded(!expanded)}
        style={{ padding: "0.75rem 1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "#818cf8", flex: "1 1 120px" }}>
          {session.orderId || session.sessionId.slice(-8)}
        </span>
        <span style={{ fontSize: "0.8rem", flex: "1 1 100px" }}>{session.customer?.name ?? "—"}</span>
        {session.decision ? <DecisionBadge decision={session.decision} /> : <span style={{ fontSize: "0.72rem", color: "var(--foreground-muted)" }}>processing…</span>}
        <span style={{ fontSize: "0.72rem", color: "var(--foreground-muted)", marginLeft: "auto" }}>{duration}s</span>
        {expanded ? <ChevronDown size={13} color="var(--foreground-muted)" /> : <ChevronRight size={13} color="var(--foreground-muted)" />}
      </div>
      {expanded && session.steps.length > 0 && (
        <div style={{ padding: "0 1rem 1rem", background: "rgba(0,0,0,0.2)" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--foreground-muted)", marginBottom: "0.5rem", paddingTop: "0.5rem" }}>
            {session.steps.length} reasoning steps
          </div>
          {session.steps.map((s, i) => <StepRow key={i} step={s} />)}
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--background-secondary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.75rem" }}>
      <div style={{ color: "var(--foreground-muted)", marginBottom: "0.2rem" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>
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
      const [s1, s2] = await Promise.all([fetch("/api/stats"), fetch("/api/sessions")]);
      const d1 = await s1.json(); const d2 = await s2.json();
      if (d1.success) setStats(d1.data.stats);
      if (d2.success) setSessions(d2.data);
      setLastRefresh(new Date());
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 5000); return () => clearInterval(t); }, [fetchData]);

  const pieData = stats.totalRequests > 0 ? [
    { name: "Approved", value: stats.approvedRefunds, color: "#10b981" },
    { name: "Rejected", value: stats.rejectedRefunds, color: "#ef4444" },
  ].filter(d => d.value > 0) : [{ name: "No data", value: 1, color: "#333" }];

  return (
    <div style={{ paddingTop: "56px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.25rem 1rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.03em" }}>Admin Dashboard</h1>
            <p style={{ color: "var(--foreground-muted)", fontSize: "0.75rem" }}>Auto-refreshes every 5s · {lastRefresh.toLocaleTimeString()}</p>
          </div>
          <button onClick={fetchData} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", borderRadius: "8px", background: "var(--glass)", border: "1px solid var(--border)", color: "var(--foreground-secondary)", fontSize: "0.75rem", cursor: "pointer" }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* Stats grid - responsive */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <StatCard label="Total Requests" value={stats.totalRequests} icon={Activity} color="#6366f1" />
          <StatCard label="Approved" value={stats.approvedRefunds} icon={CheckCircle} color="#10b981" />
          <StatCard label="Rejected" value={stats.rejectedRefunds} icon={XCircle} color="#ef4444" />
          <StatCard label="Approval Rate" value={`${stats.approvalRate}%`} icon={TrendingUp} color="#3b82f6" />
          <StatCard label="Avg Time" value={`${stats.avgResolutionTime}s`} icon={Clock} color="#f59e0b" />
          <StatCard label="Refunded" value={stats.totalRefundAmount} icon={DollarSign} color="#a78bfa" prefix="₹" />
        </div>

        {/* Charts - stack on mobile */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div className="glass" style={{ borderRadius: "12px", padding: "1rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.75rem" }}>Refund Trends</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={TREND_DATA} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="approved" fill="#10b981" radius={[3, 3, 0, 0]} name="Approved" />
                <Bar dataKey="rejected" fill="#ef4444" radius={[3, 3, 0, 0]} name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass" style={{ borderRadius: "12px", padding: "1rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.75rem" }}>Approval Rate</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={RATE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 3 }} name="Rate %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass" style={{ borderRadius: "12px", padding: "1rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.75rem" }}>Distribution</div>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={52} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: d.color }} />
                  <span style={{ color: "var(--foreground-secondary)" }}>{d.name}: <strong>{d.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="glass" style={{ borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bot size={14} color="var(--accent)" />
            <span style={{ fontWeight: 600, fontSize: "0.87rem" }}>Agent Sessions</span>
            <span style={{ fontSize: "0.7rem", color: "var(--foreground-muted)", padding: "0.1rem 0.4rem", background: "var(--glass)", borderRadius: "4px", border: "1px solid var(--border)" }}>
              {sessions.length}
            </span>
          </div>
          {sessions.length === 0 ? (
            <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--foreground-muted)" }}>
              <Bot size={32} style={{ opacity: 0.2, display: "block", margin: "0 auto 0.75rem" }} />
              <div style={{ fontWeight: 600, marginBottom: "0.25rem", fontSize: "0.87rem" }}>No sessions yet</div>
              <div style={{ fontSize: "0.78rem" }}>Go to Agent and submit a refund request</div>
            </div>
          ) : (
            sessions.map(s => <SessionRow key={s.sessionId} session={s} />)
          )}
        </div>
      </div>
    </div>
  );
}