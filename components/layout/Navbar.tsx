"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, LayoutDashboard, Users, FileText, Zap, Menu, X, TrendingUp } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/agent", label: "Agent", icon: Bot },
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/crm", label: "CRM", icon: Users },
  { href: "/policy", label: "Policy", icon: FileText },
];

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        height: "56px", background: "rgba(10,10,15,0.95)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 1rem", gap: "0.5rem",
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", flex: 1 }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #6366f1, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Zap size={14} color="white" fill="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "-0.02em", color: "var(--foreground)" }}>
            Refund<span className="gradient-text">AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.35rem 0.75rem", borderRadius: "8px", textDecoration: "none",
                fontSize: "0.83rem", fontWeight: active ? 600 : 400,
                color: active ? "var(--foreground)" : "var(--foreground-secondary)",
                background: active ? "var(--glass-hover)" : "transparent",
                border: active ? "1px solid var(--border)" : "1px solid transparent",
              }}>
                <Icon size={14} />{label}
              </Link>
            );
          })}
        </div>

        {/* Online status */}
        <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.75rem", borderRadius: "999px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", fontSize: "0.75rem", color: "var(--green)", fontWeight: 500, flexShrink: 0 }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px var(--green)" }} />
          Online
        </div>

        {/* Hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn" style={{ background: "none", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.4rem", cursor: "pointer", color: "var(--foreground)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          position: "fixed", top: "56px", left: 0, right: 0, zIndex: 49,
          background: "rgba(10,10,15,0.98)", backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)", padding: "0.75rem 1rem",
          display: "flex", flexDirection: "column", gap: "0.4rem",
        }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.75rem 1rem", borderRadius: "10px", textDecoration: "none",
                fontSize: "0.92rem", fontWeight: active ? 600 : 400,
                color: active ? "white" : "var(--foreground-secondary)",
                background: active ? "linear-gradient(135deg,#6366f1,#4f52e5)" : "var(--glass)",
                border: "1px solid var(--border)",
              }}>
                <Icon size={16} />{label}
              </Link>
            );
          })}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", fontSize: "0.78rem", color: "var(--green)" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)" }} />
            Agent Online
          </div>
        </div>
      )}

      <style>{`
        .desktop-nav { display: flex !important; }
        .mobile-menu-btn { display: none !important; }
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}