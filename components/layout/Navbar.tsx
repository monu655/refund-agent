"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, LayoutDashboard, Users, FileText, Zap } from "lucide-react";

const NAV_ITEMS = [
  { href: "/agent", label: "Agent", icon: Bot },
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm", label: "CRM", icon: Users },
  { href: "/policy", label: "Policy", icon: FileText },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: "56px",
        background: "rgba(10,10,15,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 1.5rem",
        gap: "0.5rem",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          textDecoration: "none",
          marginRight: "2rem",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #6366f1, #a78bfa)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Zap size={14} color="white" fill="white" />
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: "0.95rem",
            letterSpacing: "-0.02em",
            color: "var(--foreground)",
          }}
        >
          Refund<span className="gradient-text">AI</span>
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flex: 1 }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "0.83rem",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--foreground)" : "var(--foreground-secondary)",
                background: active ? "var(--glass-hover)" : "transparent",
                border: active ? "1px solid var(--border)" : "1px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Status pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.3rem 0.75rem",
          borderRadius: "999px",
          background: "rgba(16,185,129,0.1)",
          border: "1px solid rgba(16,185,129,0.2)",
          fontSize: "0.75rem",
          color: "var(--green)",
          fontWeight: 500,
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "var(--green)",
            boxShadow: "0 0 6px var(--green)",
          }}
        />
        Agent Online
      </div>
    </nav>
  );
}
