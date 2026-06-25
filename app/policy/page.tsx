"use client";

import { useState } from "react";
import { refundPolicy } from "@/lib/data/policy";
import { Search, Shield, CheckCircle, XCircle, ChevronDown, ChevronRight, FileText, AlertTriangle } from "lucide-react";

export default function PolicyPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>("RULE-001");

  const filtered = refundPolicy.rules.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ paddingTop: "56px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
            <Shield size={18} color="var(--accent)" />
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.03em" }}>Policy Center</h1>
            <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "4px", background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
              v{refundPolicy.version}
            </span>
          </div>
          <p style={{ color: "var(--foreground-muted)", fontSize: "0.83rem" }}>
            Last updated: {refundPolicy.lastUpdated} · {refundPolicy.rules.length} active rules · Applied to every refund request
          </p>
        </div>

        {/* Alert banner */}
        <div style={{ display: "flex", gap: "0.75rem", padding: "0.875rem 1rem", borderRadius: "10px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", marginBottom: "1.5rem", alignItems: "flex-start" }}>
          <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: "1px" }} />
          <div style={{ fontSize: "0.82rem", color: "var(--foreground-secondary)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--foreground)" }}>Policy strictly enforced.</strong> The AI agent checks all rules in sequence before making any refund decision. All rules are ANDed — a single violation results in rejection.
          </div>
        </div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--background-secondary)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.5rem 1rem", marginBottom: "1.25rem" }}>
          <Search size={14} color="var(--foreground-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search rules…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--foreground)", fontSize: "0.87rem", fontFamily: "var(--font-sans)" }}
          />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--foreground-muted)", fontSize: "1.1rem" }}>×</button>}
        </div>

        {/* Rules */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {filtered.map((rule, idx) => {
            const isOpen = expandedId === rule.id;
            return (
              <div key={rule.id} className="glass" style={{ borderRadius: "12px", overflow: "hidden", border: `1px solid ${isOpen ? "rgba(99,102,241,0.25)" : "var(--border)"}`, transition: "border-color 0.2s ease" }}>
                <button
                  onClick={() => setExpandedId(isOpen ? null : rule.id)}
                  style={{ width: "100%", padding: "1rem 1.25rem", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.875rem", textAlign: "left" }}
                >
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.7rem", fontWeight: 800, color: "#818cf8", fontFamily: "var(--font-mono)" }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--foreground)", marginBottom: "0.15rem" }}>{rule.title}</div>
                    <div style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--foreground-muted)", background: "rgba(0,0,0,0.2)", display: "inline-block", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                      {rule.condition}
                    </div>
                  </div>
                  {isOpen ? <ChevronDown size={15} color="var(--foreground-muted)" /> : <ChevronRight size={15} color="var(--foreground-muted)" />}
                </button>

                {isOpen && (
                  <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--foreground-secondary)", margin: "1rem 0 1.25rem" }}>
                      {rule.description}
                    </p>
                    <div style={{ fontSize: "0.72rem", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <FileText size={11} /> Validation Examples
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {rule.examples.map((ex, i) => (
                        <div key={i} style={{ display: "flex", gap: "0.75rem", padding: "0.75rem", borderRadius: "8px", background: ex.verdict === "pass" ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)", border: `1px solid ${ex.verdict === "pass" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}` }}>
                          <div style={{ flexShrink: 0, marginTop: "1px" }}>
                            {ex.verdict === "pass"
                              ? <CheckCircle size={14} color="#10b981" />
                              : <XCircle size={14} color="#ef4444" />}
                          </div>
                          <div>
                            <div style={{ fontSize: "0.82rem", color: "var(--foreground)", marginBottom: "0.2rem" }}>{ex.scenario}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--foreground-muted)" }}>{ex.reason}</div>
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
            <Search size={32} style={{ opacity: 0.2, display: "block", margin: "0 auto 1rem" }} />
            No rules match "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
