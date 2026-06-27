"use client";

import { useState } from "react";
import { customers } from "@/lib/data/customers";
import { Customer } from "@/types";
import { Search, Users, Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const TIER_CONFIG = {
  bronze: { color: "#cd7f32", bg: "rgba(205,127,50,0.1)", border: "rgba(205,127,50,0.2)" },
  silver: { color: "#c0c0c0", bg: "rgba(192,192,192,0.1)", border: "rgba(192,192,192,0.2)" },
  gold: { color: "#ffd700", bg: "rgba(255,215,0,0.1)", border: "rgba(255,215,0,0.2)" },
  platinum: { color: "#e5e4e2", bg: "rgba(229,228,226,0.1)", border: "rgba(229,228,226,0.2)" },
};

function EligibilityCheck({ customer }: { customer: Customer }) {
  const checks = [
    {
      label: "30-Day Window",
      pass: customer.deliveryDate
        ? Math.floor((new Date(customer.refundRequestedDate).getTime() - new Date(customer.deliveryDate).getTime()) / 86400000) <= 30
        : false,
    },
    { label: "Refund Limit", pass: customer.previousRefundCount < 2 },
    { label: "Product Type", pass: customer.category !== "digital" && customer.category !== "custom" },
    { label: "Evidence", pass: customer.evidenceProvided || (!customer.refundReason.toLowerCase().includes("broken") && !customer.refundReason.toLowerCase().includes("damage")) },
  ];

  const allPass = checks.every(c => c.pass);

  return (
    <div style={{ marginTop: "0.75rem", padding: "0.75rem", borderRadius: "8px", background: allPass ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)", border: `1px solid ${allPass ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}` }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: allPass ? "#10b981" : "#ef4444", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
        <Shield size={11} /> Eligibility: {allPass ? "ELIGIBLE" : "NOT ELIGIBLE"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3rem" }}>
        {checks.map(c => (
          <div key={c.label} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", color: "var(--foreground-secondary)" }}>
            {c.pass ? <CheckCircle size={10} color="#10b981" /> : <XCircle size={10} color="#ef4444" />}
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerCard({ customer }: { customer: Customer }) {
  const [expanded, setExpanded] = useState(false);
  const tier = TIER_CONFIG[customer.customerTier];

  return (
    <div className="glass" style={{ borderRadius: "12px", overflow: "hidden" }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: "1rem", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", color: "white", flexShrink: 0 }}>
              {customer.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.87rem" }}>{customer.name}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--foreground-muted)" }}>{customer.email}</div>
            </div>
          </div>
          <span style={{ padding: "0.15rem 0.5rem", borderRadius: "5px", fontSize: "0.65rem", fontWeight: 700, background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`, textTransform: "uppercase", flexShrink: 0 }}>
            {customer.customerTier}
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#818cf8", background: "rgba(99,102,241,0.1)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
            {customer.orderId}
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--foreground-secondary)", background: "var(--glass)", padding: "0.1rem 0.4rem", borderRadius: "4px", border: "1px solid var(--border)" }}>
            {customer.category}
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--foreground-secondary)" }}>
            ₹{customer.orderValue.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 1rem 1rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div style={{ fontSize: "0.78rem" }}>
              <span style={{ color: "var(--foreground-muted)" }}>Product: </span>
              <span>{customer.productName}</span>
            </div>
            <div style={{ fontSize: "0.78rem" }}>
              <span style={{ color: "var(--foreground-muted)" }}>Reason: </span>
              <span style={{ color: "var(--foreground-secondary)" }}>{customer.refundReason}</span>
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ fontSize: "0.72rem" }}>
                <span style={{ color: "var(--foreground-muted)" }}>Purchased: </span>
                {customer.purchaseDate}
              </div>
              <div style={{ fontSize: "0.72rem" }}>
                <span style={{ color: "var(--foreground-muted)" }}>Delivered: </span>
                {customer.deliveryDate ?? "Not yet"}
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ fontSize: "0.72rem" }}>
                <span style={{ color: "var(--foreground-muted)" }}>Past refunds: </span>
                {customer.previousRefundCount}
              </div>
              <div style={{ fontSize: "0.72rem" }}>
                <span style={{ color: "var(--foreground-muted)" }}>Evidence: </span>
                {customer.evidenceProvided ? "✅ Yes" : "❌ No"}
              </div>
            </div>
          </div>
          <EligibilityCheck customer={customer} />
        </div>
      )}
    </div>
  );
}

export default function CRMPage() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");

  const filtered = customers.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.orderId.toLowerCase().includes(search.toLowerCase()) ||
      c.productName.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === "all" || c.customerTier === tierFilter;
    return matchSearch && matchTier;
  });

  return (
    <div style={{ paddingTop: "56px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "1.25rem 1rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Users size={16} color="var(--accent)" />
            <h1 style={{ fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.03em" }}>CRM</h1>
            <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: "4px", background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
              {customers.length} customers
            </span>
          </div>
          <p style={{ color: "var(--foreground-muted)", fontSize: "0.78rem" }}>Click any card to see full details</p>
        </div>

        {/* Search + Filter */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--background-secondary)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.5rem 0.875rem", flex: 1, minWidth: "200px" }}>
            <Search size={13} color="var(--foreground-muted)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, order, product…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--foreground)", fontSize: "0.85rem", fontFamily: "var(--font-sans)" }} />
          </div>
          <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
            style={{ padding: "0.5rem 0.75rem", borderRadius: "10px", background: "var(--background-secondary)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "0.82rem", cursor: "pointer" }}>
            <option value="all">All Tiers</option>
            <option value="platinum">Platinum</option>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="bronze">Bronze</option>
          </select>
        </div>

        {/* Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "0.75rem" }}>
          {filtered.map(c => <CustomerCard key={c.customerId} customer={c} />)}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--foreground-muted)" }}>
            <Users size={32} style={{ opacity: 0.2, display: "block", margin: "0 auto 0.75rem" }} />
            No customers found
          </div>
        )}
      </div>
    </div>
  );
}