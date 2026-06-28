"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, AlertCircle, Users, DollarSign, Clock } from "lucide-react";
import { customers } from "@/lib/data/customers";

const REJECTION_REASONS = [
  { reason: "Digital Product", count: 3, color: "#ef4444" },
  { reason: "Custom Product", count: 2, color: "#f97316" },
  { reason: "Outside 30 Days", count: 2, color: "#f59e0b" },
  { reason: "Refund Limit", count: 2, color: "#a78bfa" },
  { reason: "No Evidence", count: 1, color: "#6366f1" },
];

const TIER_DATA = [
  { tier: "Platinum", count: customers.filter(c => c.customerTier === "platinum").length, color: "#e5e4e2" },
  { tier: "Gold", count: customers.filter(c => c.customerTier === "gold").length, color: "#ffd700" },
  { tier: "Silver", count: customers.filter(c => c.customerTier === "silver").length, color: "#c0c0c0" },
  { tier: "Bronze", count: customers.filter(c => c.customerTier === "bronze").length, color: "#cd7f32" },
];

const WEEKLY_DATA = [
  { day: "Mon", requests: 4, approved: 3, rejected: 1, amount: 45000 },
  { day: "Tue", requests: 7, approved: 4, rejected: 3, amount: 82000 },
  { day: "Wed", requests: 5, approved: 3, rejected: 2, amount: 61000 },
  { day: "Thu", requests: 9, approved: 6, rejected: 3, amount: 120000 },
  { day: "Fri", requests: 6, approved: 4, rejected: 2, amount: 75000 },
  { day: "Sat", requests: 3, approved: 2, rejected: 1, amount: 30000 },
  { day: "Sun", requests: 2, approved: 1, rejected: 1, amount: 15000 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--background-secondary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.6rem 0.875rem", fontSize: "0.78rem" }}>
      <div style={{ color: "var(--foreground-muted)", marginBottom: "0.25rem" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.name === "amount" ? `₹${p.value.toLocaleString("en-IN")}` : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

function MetricCard({ label, value, change, icon: Icon, color, prefix = "" }: {
  label: string; value: string | number; change?: string; positive?: boolean;
  icon: React.ElementType; color: string; prefix?: string;
}) {
  return (
    <div className="glass" style={{ borderRadius: "12px", padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--foreground-muted)", fontWeight: 500 }}>{label}</span>
        <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <div style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
        {prefix}{typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </div>
      {change && (
        <div style={{ fontSize: "0.72rem", color: "var(--foreground-muted)", marginTop: "0.3rem" }}>
          {change}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const totalAmount = WEEKLY_DATA.reduce((s, d) => s + d.amount, 0);
  const totalRequests = WEEKLY_DATA.reduce((s, d) => s + d.requests, 0);
  const totalApproved = WEEKLY_DATA.reduce((s, d) => s + d.approved, 0);
  const approvalRate = Math.round((totalApproved / totalRequests) * 100);

  return (
    <div style={{ paddingTop: "56px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem 1rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <TrendingUp size={16} color="var(--accent)" />
            <h1 style={{ fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.03em" }}>Analytics</h1>
          </div>
          <p style={{ color: "var(--foreground-muted)", fontSize: "0.78rem" }}>Weekly performance overview</p>
        </div>

        {/* Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <MetricCard label="Total Requests" value={totalRequests} icon={AlertCircle} color="#6366f1" change="This week" />
          <MetricCard label="Approved" value={totalApproved} icon={TrendingUp} color="#10b981" change={`${approvalRate}% rate`} />
          <MetricCard label="Rejected" value={totalRequests - totalApproved} icon={TrendingDown} color="#ef4444" change="Policy violations" />
          <MetricCard label="Total Refunded" value={totalAmount} icon={DollarSign} color="#a78bfa" prefix="₹" change="Approved amount" />
          <MetricCard label="Customers" value={customers.length} icon={Users} color="#3b82f6" change="In CRM" />
          <MetricCard label="Avg Resolution" value="18s" icon={Clock} color="#f59e0b" change="Per request" />
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>

          {/* Weekly Requests */}
          <div className="glass" style={{ borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, marginBottom: "1rem" }}>Weekly Requests</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={WEEKLY_DATA} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="approved" fill="#10b981" radius={[3, 3, 0, 0]} name="Approved" />
                <Bar dataKey="rejected" fill="#ef4444" radius={[3, 3, 0, 0]} name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Refund Amount Trend */}
          <div className="glass" style={{ borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, marginBottom: "1rem" }}>Refund Amount (₹)</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={WEEKLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 3 }} name="amount" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Rejection Reasons */}
          <div className="glass" style={{ borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, marginBottom: "1rem" }}>Top Rejection Reasons</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {REJECTION_REASONS.map(r => (
                <div key={r.reason}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.25rem" }}>
                    <span style={{ color: "var(--foreground-secondary)" }}>{r.reason}</span>
                    <span style={{ color: r.color, fontWeight: 600 }}>{r.count}</span>
                  </div>
                  <div style={{ height: "6px", borderRadius: "3px", background: "var(--border)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(r.count / 5) * 100}%`, background: r.color, borderRadius: "3px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Tiers */}
          <div className="glass" style={{ borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, marginBottom: "1rem" }}>Customer Tiers</div>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={TIER_DATA} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="count">
                  {TIER_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3rem", marginTop: "0.5rem" }}>
              {TIER_DATA.map(t => (
                <div key={t.tier} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                  <span style={{ color: "var(--foreground-secondary)" }}>{t.tier}: <strong style={{ color: "var(--foreground)" }}>{t.count}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass" style={{ borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 600, marginBottom: "1rem" }}>Product Category Breakdown</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem" }}>
            {["electronics", "clothing", "digital", "custom", "books", "toys"].map(cat => {
              const count = customers.filter(c => c.category === cat).length;
              const eligible = customers.filter(c => c.category === cat && cat !== "digital" && cat !== "custom").length;
              return (
                <div key={cat} style={{ padding: "0.875rem", borderRadius: "10px", background: "var(--glass)", border: "1px solid var(--border)", textAlign: "center" }}>
                  <div style={{ fontSize: "1.4rem", marginBottom: "0.3rem" }}>
                    {cat === "electronics" ? "📱" : cat === "clothing" ? "👕" : cat === "digital" ? "💻" : cat === "custom" ? "🎨" : cat === "books" ? "📚" : "🧸"}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.8rem", textTransform: "capitalize", marginBottom: "0.15rem" }}>{cat}</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{count}</div>
                  <div style={{ fontSize: "0.65rem", color: cat === "digital" || cat === "custom" ? "#ef4444" : "#10b981" }}>
                    {cat === "digital" || cat === "custom" ? "Non-refundable" : "Eligible"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}