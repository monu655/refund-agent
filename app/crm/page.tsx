"use client";

import { useState } from "react";
import { Search, User, Package, RefreshCw, ChevronRight, Shield } from "lucide-react";
import { customers } from "@/lib/data/customers";
import { Customer, CustomerTier } from "@/types";

const TIER_COLORS: Record<CustomerTier, { bg: string; text: string; border: string }> = {
  bronze: { bg: "rgba(180,100,40,0.12)", text: "#c87941", border: "rgba(180,100,40,0.3)" },
  silver: { bg: "rgba(160,160,175,0.12)", text: "#a0a0af", border: "rgba(160,160,175,0.3)" },
  gold: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  platinum: { bg: "rgba(99,102,241,0.12)", text: "#818cf8", border: "rgba(99,102,241,0.3)" },
};

function TierBadge({ tier }: { tier: CustomerTier }) {
  const c = TIER_COLORS[tier];
  return (
    <span
      style={{
        padding: "0.15rem 0.5rem", borderRadius: "4px",
        background: c.bg, color: c.text, border: `1px solid ${c.border}`,
        fontSize: "0.68rem", fontWeight: 700, textTransform: "capitalize",
        letterSpacing: "0.04em",
      }}
    >
      {tier}
    </span>
  );
}

function CustomerCard({ customer, onClick, selected }: { customer: Customer; onClick: () => void; selected: boolean }) {
  const daysSincePurchase = Math.floor(
    (new Date(customer.refundRequestedDate).getTime() - new Date(customer.purchaseDate).getTime()) / 86400000
  );

  return (
    <div
      onClick={onClick}
      style={{
        padding: "0.875rem 1rem",
        borderRadius: "10px",
        background: selected ? "rgba(99,102,241,0.08)" : "var(--glass)",
        border: `1px solid ${selected ? "rgba(99,102,241,0.3)" : "var(--border)"}`,
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: `linear-gradient(135deg, #6366f1, #a78bfa)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.9rem", fontWeight: 700, color: "white", flexShrink: 0,
            boxShadow: "0 2px 8px rgba(99,102,241,0.2)",
          }}
        >
          {customer.name.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "0.87rem", marginBottom: "0.15rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {customer.name}
            <TierBadge tier={customer.customerTier} />
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--foreground-muted)", display: "flex", gap: "0.5rem" }}>
            <span style={{ fontFamily: "var(--font-mono)" }}>{customer.orderId}</span>
            <span>·</span>
            <span>₹{customer.orderValue.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <ChevronRight size={14} color="var(--foreground-muted)" />
      </div>
    </div>
  );
}

function CustomerDetail({ customer }: { customer: Customer }) {
  const tier = TIER_COLORS[customer.customerTier];
  const daysSinceDelivery = customer.deliveryDate
    ? Math.floor((new Date(customer.refundRequestedDate).getTime() - new Date(customer.deliveryDate).getTime()) / 86400000)
    : null;
  const withinWindow = daysSinceDelivery !== null && daysSinceDelivery <= 30;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header */}
      <div
        className="glass"
        style={{ borderRadius: "12px", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}
      >
        <div
          style={{
            width: "52px", height: "52px", borderRadius: "14px",
            background: "linear-gradient(135deg, #6366f1, #a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.3rem", fontWeight: 700, color: "white",
            boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
          }}
        >
          {customer.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
            <span style={{ fontWeight: 700, fontSize: "1rem" }}>{customer.name}</span>
            <TierBadge tier={customer.customerTier} />
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--foreground-muted)" }}>{customer.email}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--foreground-muted)" }}>{customer.phone}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--foreground-muted)", marginBottom: "0.2rem" }}>Customer ID</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--foreground-secondary)" }}>{customer.customerId}</div>
        </div>
      </div>

      {/* Order details */}
      <div className="glass" style={{ borderRadius: "12px", padding: "1.25rem" }}>
        <div style={{ fontSize: "0.72rem", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Package size={11} />
          Order Details
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[
            ["Order ID", customer.orderId, true],
            ["Product", customer.productName, false],
            ["Category", customer.category, false],
            ["Order Value", `₹${customer.orderValue.toLocaleString("en-IN")}`, false],
            ["Purchase Date", customer.purchaseDate, false],
            ["Delivery Date", customer.deliveryDate ?? "Not delivered", false],
            ["Refund Requested", customer.refundRequestedDate, false],
            ["Days Since Delivery", daysSinceDelivery !== null ? `${daysSinceDelivery} days` : "N/A", false],
          ].map(([label, value, mono]) => (
            <div key={String(label)}>
              <div style={{ fontSize: "0.7rem", color: "var(--foreground-muted)", marginBottom: "0.1rem" }}>{label}</div>
              <div style={{ fontSize: "0.83rem", fontFamily: mono ? "var(--font-mono)" : "inherit", color: "var(--foreground)" }}>
                {String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refund analysis */}
      <div className="glass" style={{ borderRadius: "12px", padding: "1.25rem" }}>
        <div style={{ fontSize: "0.72rem", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Shield size={11} />
          Refund Eligibility Analysis
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            {
              rule: "30-Day Window",
              pass: withinWindow,
              detail: daysSinceDelivery !== null
                ? `${daysSinceDelivery} days since delivery (limit: 30)`
                : "Product not delivered",
            },
            {
              rule: "Refund History",
              pass: customer.previousRefundCount < 2,
              detail: `${customer.previousRefundCount} previous refund(s) (limit: 2)`,
            },
            {
              rule: "Product Category",
              pass: customer.category !== "digital" && customer.category !== "custom",
              detail: `Category: ${customer.category}`,
            },
            {
              rule: "Evidence Provided",
              pass: customer.evidenceProvided,
              detail: customer.evidenceProvided ? "Photos/video submitted" : "No evidence provided",
            },
          ].map((check) => (
            <div
              key={check.rule}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.5rem 0.75rem", borderRadius: "8px",
                background: check.pass ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                border: `1px solid ${check.pass ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
              }}
            >
              <span style={{ color: check.pass ? "#10b981" : "#ef4444", fontSize: "0.85rem" }}>
                {check.pass ? "✓" : "✗"}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 600 }}>{check.rule}</div>
                <div style={{ fontSize: "0.71rem", color: "var(--foreground-muted)" }}>{check.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refund reason */}
      <div className="glass" style={{ borderRadius: "12px", padding: "1.25rem" }}>
        <div style={{ fontSize: "0.72rem", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
          Refund Reason
        </div>
        <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "var(--foreground-secondary)", fontStyle: "italic" }}>
          &ldquo;{customer.refundReason}&rdquo;
        </p>
      </div>
    </div>
  );
}

export default function CRMPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.orderId.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.productName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ paddingTop: "56px", minHeight: "100vh" }}>
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", height: "calc(100vh - 56px)" }}>
        {/* Left: Customer list */}
        <div
          style={{
            borderRight: "1px solid var(--border)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}
        >
          <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
              <User size={15} color="var(--accent)" />
              <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>CRM</span>
              <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--foreground-muted)" }}>
                {filtered.length} customers
              </span>
            </div>
            <div
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                background: "var(--background-secondary)",
                border: "1px solid var(--border)", borderRadius: "8px",
                padding: "0.4rem 0.75rem",
              }}
            >
              <Search size={13} color="var(--foreground-muted)" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, order ID, email…"
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "var(--foreground)", fontSize: "0.83rem",
                  fontFamily: "var(--font-sans)",
                }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--foreground-muted)", fontSize: "1rem", lineHeight: 1 }}>×</button>
              )}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {filtered.map((c) => (
                <CustomerCard
                  key={c.customerId}
                  customer={c}
                  selected={selected?.customerId === c.customerId}
                  onClick={() => setSelected(selected?.customerId === c.customerId ? null : c)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Detail */}
        <div style={{ overflowY: "auto", padding: "1.5rem" }}>
          {selected ? (
            <CustomerDetail customer={selected} />
          ) : (
            <div
              style={{
                height: "100%", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: "1rem", textAlign: "center",
              }}
            >
              <User size={40} style={{ opacity: 0.2 }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: "0.3rem" }}>Select a customer</div>
                <div style={{ color: "var(--foreground-muted)", fontSize: "0.83rem" }}>
                  Click any customer to view their profile, order history, and eligibility analysis.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
