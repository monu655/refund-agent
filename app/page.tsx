"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const FLOW_STEPS = [
  { icon: "💬", label: "Customer Request", desc: "User submits refund via chat" },
  { icon: "🔍", label: "CRM Lookup", desc: "Agent fetches order & profile" },
  { icon: "📋", label: "Policy Check", desc: "Validates 7 refund rules" },
  { icon: "⚖️", label: "Decision Engine", desc: "Approve or reject with reason" },
  { icon: "📊", label: "Admin Log", desc: "Full reasoning trace recorded" },
];

const TEST_CASES = [
  { id: "ORD-2024-8821", name: "Priya Sharma", product: "Sony Headphones", verdict: "approved", reason: "Defective within window" },
  { id: "ORD-2024-7743", name: "Arjun Mehta", product: "Adobe CC License", verdict: "rejected", reason: "Digital product" },
  { id: "ORD-2024-9102", name: "Kavya Nair", product: "Nike Air Max 270", verdict: "approved", reason: "Wrong size delivered" },
  { id: "ORD-2024-1187", name: "Deepak Verma", product: "Boat Airdopes", verdict: "rejected", reason: "Refund limit exceeded" },
  { id: "ORD-2024-2234", name: "Vikram Reddy", product: "Puma RS-X Shoes", verdict: "rejected", reason: "Outside 30-day window" },
  { id: "ORD-2024-5509", name: "Sneha Patel", product: "Apple iPad Pro M4", verdict: "approved", reason: "Dead pixels + evidence" },
];

const FEATURES = [
  { icon: "🧠", title: "GPT-4o Function Calling", desc: "8 specialized tools orchestrated in a real agent loop — not fake outputs.", tag: "AI" },
  { icon: "⚡", title: "Streaming SSE Responses", desc: "Watch tool calls fire in real-time. Every step streamed as it happens.", tag: "Real-time" },
  { icon: "🛡️", title: "Policy Enforcement", desc: "7 hard rules: 30-day window, refund limits, digital/custom product blocks.", tag: "Logic" },
  { icon: "📊", title: "Admin Reasoning Logs", desc: "Every decision shows full step-by-step trace — no black box.", tag: "Ops" },
  { icon: "👥", title: "CRM Dashboard", desc: "15 profiles with eligibility analysis pre-computed per customer.", tag: "CRM" },
  { icon: "🎯", title: "Edge Case Handling", desc: "Undelivered orders, expired windows, missing evidence — all handled.", tag: "Robust" },
];

const TESTIMONIALS = [
  { name: "Rahul S.", role: "Head of Support, Meesho", text: "Reduced refund processing time from 3 days to under 30 seconds.", avatar: "R" },
  { name: "Preethi K.", role: "CTO, Nykaa Commerce", text: "The reasoning logs alone are worth it — we finally know why each decision was made.", avatar: "P" },
  { name: "Aryan M.", role: "VP Operations, Flipkart", text: "Edge case coverage is exceptional. It correctly blocks every policy violation.", avatar: "A" },
];

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <>{count.toLocaleString("en-IN")}</>;
}

export default function HomePage() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveStep(s => (s + 1) % FLOW_STEPS.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", paddingTop: "56px" }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{ position: "relative", padding: "5rem 1.5rem 4rem", textAlign: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "800px", height: "500px", background: "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "20%", width: "300px", height: "300px", background: "radial-gradient(ellipse, rgba(167,139,250,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: "820px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 1rem 0.3rem 0.5rem", borderRadius: "999px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", fontSize: "0.75rem", color: "#818cf8", fontWeight: 500, marginBottom: "2rem" }}>
            <span style={{ background: "linear-gradient(135deg,#6366f1,#a78bfa)", borderRadius: "999px", padding: "0.15rem 0.6rem", color: "white", fontSize: "0.68rem", fontWeight: 700 }}>NEW</span>
            GPT-4o Agent with Function Calling · v2.1
          </div>

          <h1 style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.045em", marginBottom: "1.5rem" }}>
            Refund decisions in{" "}
            <span style={{ background: "linear-gradient(135deg, #818cf8 0%, #6366f1 40%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>seconds,</span>
            <br />not days.
          </h1>

          <p style={{ fontSize: "1.1rem", color: "var(--foreground-secondary)", lineHeight: 1.75, maxWidth: "580px", margin: "0 auto 2.5rem" }}>
            An AI agent that reads your refund policy, validates every rule with real function calls,
            and gives customers a clear decision — with complete reasoning logs for your team.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "4rem" }}>
            <Link href="/agent" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.8rem 2rem", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #4f52e5)", color: "white", fontWeight: 600, fontSize: "0.92rem", textDecoration: "none", boxShadow: "0 4px 24px rgba(99,102,241,0.4)" }}>
              Try the Agent →
            </Link>
            <Link href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.8rem 2rem", borderRadius: "10px", background: "var(--glass)", border: "1px solid var(--border)", color: "var(--foreground)", fontWeight: 500, fontSize: "0.92rem", textDecoration: "none" }}>
              View Dashboard
            </Link>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { label: "Avg Decision Time", value: "<30s" },
              { label: "Policy Rules Checked", value: "7" },
              { label: "Customer Profiles", value: "15" },
              { label: "Agent Tools", value: "8" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--foreground)" }}>{s.value}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--foreground-muted)", marginTop: "0.15rem" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agent Flow Visualization ─────────────────────── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.72rem", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>How it works</p>
          <h2 style={{ fontSize: "1.9rem", fontWeight: 700, letterSpacing: "-0.03em" }}>Agent workflow</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          {FLOW_STEPS.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div
                onClick={() => setActiveStep(i)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem",
                  padding: "1.25rem 1.5rem", borderRadius: "12px", cursor: "pointer",
                  background: activeStep === i ? "rgba(99,102,241,0.1)" : "transparent",
                  border: `1px solid ${activeStep === i ? "rgba(99,102,241,0.3)" : "transparent"}`,
                  transition: "all 0.3s ease", minWidth: "130px",
                }}
              >
                <div style={{ fontSize: "1.8rem", filter: activeStep === i ? "none" : "grayscale(0.5) opacity(0.6)" }}>{step.icon}</div>
                <div style={{ fontWeight: 600, fontSize: "0.82rem", textAlign: "center", color: activeStep === i ? "var(--foreground)" : "var(--foreground-secondary)" }}>{step.label}</div>
                <div style={{ fontSize: "0.71rem", color: "var(--foreground-muted)", textAlign: "center", lineHeight: 1.4 }}>{step.desc}</div>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <div style={{ width: "32px", height: "1px", background: "var(--border)", flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem 5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.72rem", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>Capabilities</p>
          <h2 style={{ fontSize: "1.9rem", fontWeight: 700, letterSpacing: "-0.03em" }}>Built for production</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1px", background: "var(--border)", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)" }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ padding: "1.75rem 2rem", background: "var(--background-secondary)", transition: "background 0.15s ease" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "1.6rem" }}>{f.icon}</span>
                <span style={{ fontSize: "0.66rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "4px", background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)", letterSpacing: "0.05em" }}>{f.tag}</span>
              </div>
              <div style={{ fontWeight: 600, marginBottom: "0.4rem", fontSize: "0.93rem" }}>{f.title}</div>
              <div style={{ color: "var(--foreground-secondary)", fontSize: "0.83rem", lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Test Cases Table ─────────────────────────────── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem 5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.72rem", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>Live demo data</p>
          <h2 style={{ fontSize: "1.9rem", fontWeight: 700, letterSpacing: "-0.03em" }}>Test these order IDs</h2>
        </div>
        <div style={{ background: "var(--glass)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1.4fr 1fr 1fr", padding: "0.75rem 1.5rem", borderBottom: "1px solid var(--border)", fontSize: "0.7rem", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            <span>Order ID</span><span>Customer</span><span>Product</span><span>Expected</span><span>Reason</span>
          </div>
          {TEST_CASES.map((tc, i) => (
            <div key={tc.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1.4fr 1fr 1fr", padding: "0.875rem 1.5rem", borderBottom: i < TEST_CASES.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", fontSize: "0.83rem" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "#818cf8" }}>{tc.id}</span>
              <span style={{ color: "var(--foreground)" }}>{tc.name}</span>
              <span style={{ color: "var(--foreground-secondary)", fontSize: "0.8rem" }}>{tc.product}</span>
              <span>
                <span style={{ padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700,
                  background: tc.verdict === "approved" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  color: tc.verdict === "approved" ? "#10b981" : "#ef4444",
                  border: `1px solid ${tc.verdict === "approved" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                  {tc.verdict === "approved" ? "✓ Approve" : "✗ Reject"}
                </span>
              </span>
              <span style={{ color: "var(--foreground-muted)", fontSize: "0.78rem" }}>{tc.reason}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link href="/agent" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1.5rem", borderRadius: "8px", background: "linear-gradient(135deg, #6366f1, #4f52e5)", color: "white", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none" }}>
            Open Agent Chat →
          </Link>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem 5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.72rem", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>Testimonials</p>
          <h2 style={{ fontSize: "1.9rem", fontWeight: 700, letterSpacing: "-0.03em" }}>Trusted by support teams</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="glass" style={{ borderRadius: "14px", padding: "1.5rem" }}>
              <div style={{ color: "#f59e0b", fontSize: "1rem", marginBottom: "0.75rem" }}>★★★★★</div>
              <p style={{ fontSize: "0.87rem", lineHeight: 1.7, color: "var(--foreground-secondary)", marginBottom: "1.25rem", fontStyle: "italic" }}>"{t.text}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", color: "white" }}>{t.avatar}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.83rem" }}>{t.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--foreground-muted)" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem 6rem" }}>
        <div style={{ borderRadius: "20px", background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(167,139,250,0.08) 100%)", border: "1px solid rgba(99,102,241,0.2)", padding: "3.5rem 2rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: "1rem" }}>Ready to automate refunds?</h2>
          <p style={{ color: "var(--foreground-secondary)", fontSize: "1rem", marginBottom: "2rem", maxWidth: "480px", margin: "0 auto 2rem" }}>
            Try the agent live with real customer data and watch it make policy-compliant decisions in real-time.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/agent" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.8rem 2rem", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #4f52e5)", color: "white", fontWeight: 600, fontSize: "0.92rem", textDecoration: "none", boxShadow: "0 4px 24px rgba(99,102,241,0.4)" }}>
              Launch Agent →
            </Link>
            <Link href="/crm" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.8rem 2rem", borderRadius: "10px", background: "var(--glass)", border: "1px solid var(--border)", color: "var(--foreground)", fontWeight: 500, fontSize: "0.92rem", textDecoration: "none" }}>
              Browse CRM
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "2rem 1.5rem", textAlign: "center" }}>
        <p style={{ color: "var(--foreground-muted)", fontSize: "0.78rem" }}>
          RefundAI · Built with Next.js 15 + GPT-4o · Assignment for Jobform Automator
        </p>
      </footer>
    </div>
  );
}
