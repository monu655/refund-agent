"use client";

import { useState } from "react";
import { refundPolicy } from "@/lib/data/policy";
import { Search, Shield, CheckCircle, XCircle, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";

const RULE_SUMMARIES: Record<string, string> = {
  "RULE-001": "Request must be made within 30 days of delivery",
  "RULE-002": "Product must be delivered before refund can be processed",
  "RULE-003": "Customer cannot have more than 2 refunds in 12 months",
  "RULE-004": "Digital products like software and subscriptions are non-refundable",
  "RULE-005": "Custom or personalized products are non-refundable",
  "RULE-006": "Damaged products need photo or video evidence",
  "RULE-007": "Refund amount cannot be more than the original order value",
};

export default function PolicyPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>("RULE-001");

  const filtered = refundPolicy.rules.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ paddingTop: "56px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1.25rem 1rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Shield size={16} color="var(--accent)" />
            <h1 style={{ fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.03em" }}>Refund Policy</h1>
            <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: "4px", background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)", fontWeight: 600 }}>
              v{refundPolicy.version}
            </span>
          </div>
          <p style={{ color: "var(--foreground-muted)", fontSize: "0.78rem" }}>
            {refundPolicy.rules.length} rules · All rules are checked before every refund decision
          </p>
        </div>

        {/* Warning */}
        <div style={{ display: "flex", gap: "0.6rem", padding: "0.75rem 1rem", borderRadius: "10px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", marginBottom: "1.25rem", alignItems: "flex-start" }}>
          <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div style={{ fontSize: "0.8rem", color: "var(--foreground-secondary)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--foreground)" }}>All rules are strictly enforced.</strong> Even one violation will result in rejection.
          </div>
        </div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--background-secondary)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.5rem 0.875rem", marginBottom: "1rem" }}>
          <Search size={13} color="var(--foreground-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rules…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--foreground)", fontSize: "0.85rem", fontFamily: "var(--font-sans)" }} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--foreground-muted)", fontSize: "1.1rem" }}>×</button>}
        </div>

        {/* Rules */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {filtered.map((rule, idx) => {
            const isOpen = expandedId === rule.id;
            return (
              <div key={rule.id} className="glass" style={{ borderRadius: "12px", overflow: "hidden", border: `1px solid ${isOpen ? "rgba(99,102,241,0.3)" : "var(--border)"}`, transition: "border-color 0.2s" }}>
                <button onClick={() => setExpandedId(isOpen ? null : rule.id)}
                  style={{ width: "100%", padding: "1rem", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem", textAlign: "left" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.72rem", fontWeight: 800, color: "#818cf8" }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--foreground)", marginBottom: "0.15rem" }}>{rule.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--foreground-muted)" }}>{RULE_SUMMARIES[rule.id]}</div>
                  </div>
                  {isOpen ? <ChevronDown size={14} color="var(--foreground-muted)" /> : <ChevronRight size={14} color="var(--foreground-muted)" />}
                </button>

                {isOpen && (
                  <div style={{ padding: "0 1rem 1rem", borderTop: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "0.83rem", lineHeight: 1.7, color: "var(--foreground-secondary)", margin: "0.875rem 0 1rem" }}>
                      {rule.description}
                    </p>

                    <div style={{ fontSize: "0.7rem", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.6rem", fontWeight: 600 }}>
                      Examples
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {rule.examples.map((ex, i) => (
                        <div key={i} style={{ display: "flex", gap: "0.6rem", padding: "0.7rem 0.875rem", borderRadius: "8px", background: ex.verdict === "pass" ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)", border: `1px solid ${ex.verdict === "pass" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}` }}>
                          <div style={{ flexShrink: 0, marginTop: "2px" }}>
                            {ex.verdict === "pass" ? <CheckCircle size={13} color="#10b981" /> : <XCircle size={13} color="#ef4444" />}
                          </div>
                          <div>
                            <div style={{ fontSize: "0.8rem", color: "var(--foreground)", marginBottom: "0.15rem", fontWeight: 500 }}>{ex.scenario}</div>
                            <div style={{ fontSize: "0.73rem", color: "var(--foreground-muted)" }}>{ex.reason}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--foreground-muted)" }}>
            <Search size={28} style={{ opacity: 0.2, display: "block", margin: "0 auto 0.75rem" }} />
            No rules match "{search}"
          </div>
        )}
      </div>
    </div>
  );
}