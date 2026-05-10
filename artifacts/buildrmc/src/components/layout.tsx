import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Truck,
  BarChart3,
  CheckSquare,
  BookOpen,
  Package,
  LogOut,
  ChevronDown,
  Bell,
  User,
  Shield,
  KeyRound,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",   label: "Dashboard",    icon: LayoutDashboard },
  { href: "/customer-po", label: "Customer & PO", icon: Users },
  { href: "/billing",     label: "Billing",       icon: FileText },
  { href: "/dc",          label: "DC",            icon: Truck },
  { href: "/sales",       label: "Sales",         icon: BarChart3 },
  { href: "/qc",          label: "QC",            icon: CheckSquare },
  { href: "/accounts",    label: "Accounts",      icon: BookOpen },
  { href: "/store",       label: "Store",         icon: Package },
];

// Mock notifications
const notifications = [
  { id: 1, title: "New Invoice Created", desc: "Invoice #INV-2026-0042 was created", time: "2 min ago", read: false, href: "/billing" },
  { id: 2, title: "DC Pending Approval", desc: "DC #DC-0088 is awaiting approval", time: "15 min ago", read: false, href: "/dc" },
  { id: 3, title: "Payment Follow-up Due", desc: "Kumar Builders payment due today", time: "1 hr ago", read: true, href: "/sales/payment-follow-up/list" },
  { id: 4, title: "Sales Enquiry Received", desc: "New enquiry from Ramesh Constructions", time: "3 hrs ago", read: true, href: "/sales/enquiry/list" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();

  const [notifOpen, setNotifOpen]   = useState(false);
  const [userOpen,  setUserOpen]    = useState(false);
  const [notifList, setNotifList]   = useState(notifications);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target  as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => (window.location.href = "/") });
  };

  const unread = notifList.filter((n) => !n.read).length;

  const markRead = (id: number, href: string) => {
    setNotifList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setNotifOpen(false);
    navigate(href);
  };

  const initials = (user?.fullName || user?.username || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  /* ─────────────── styles ─────────────── */
  const s = {
    header: {
      background: "linear-gradient(135deg, #0d1f2d 0%, #162635 60%, #0f2233 100%)",
      boxShadow: "0 2px 24px rgba(0,0,0,0.35)",
      position: "sticky" as const,
      top: 0,
      zIndex: 100,
    },
    brandBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      height: "54px",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
    },
    logoBox: {
      width: "34px", height: "34px", borderRadius: "9px",
      background: "linear-gradient(135deg,#3DB9C1 0%,#1a9ca6 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "15px", fontWeight: 900, color: "#fff",
      boxShadow: "0 4px 12px rgba(61,185,193,0.4)",
    },
    iconBtn: {
      width: "34px", height: "34px", borderRadius: "9px",
      background: "rgba(255,255,255,0.07)",
      border: "1px solid rgba(255,255,255,0.10)",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", color: "rgba(255,255,255,0.65)",
      transition: "all 0.2s",
      position: "relative" as const,
    },
    badge: {
      position: "absolute" as const, top: "5px", right: "5px",
      width: "7px", height: "7px", borderRadius: "50%",
      background: "#f43f5e", border: "1.5px solid #0d1f2d",
    },
    dropdown: {
      position: "absolute" as const, top: "calc(100% + 10px)", right: 0,
      minWidth: "280px",
      background: "#fff",
      borderRadius: "12px",
      boxShadow: "0 16px 48px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)",
      border: "1px solid #e8eef5",
      overflow: "hidden",
      zIndex: 200,
    },
    navTab: (active: boolean): React.CSSProperties => ({
      display: "flex", alignItems: "center", gap: "6px",
      padding: "9px 14px",
      fontSize: "11px",
      fontWeight: active ? 700 : 500,
      color: active ? "#3DB9C1" : "rgba(255,255,255,0.55)",
      borderBottom: active ? "2px solid #3DB9C1" : "2px solid transparent",
      marginBottom: "-2px",
      cursor: "pointer",
      transition: "all 0.2s",
      whiteSpace: "nowrap" as const,
      letterSpacing: "0.04em",
      textTransform: "uppercase" as const,
      background: active ? "rgba(61,185,193,0.08)" : "transparent",
      textDecoration: "none",
    }),
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f4f7fb" }}>
      {/* ═══ HEADER ═══════════════════════════════ */}
      <header style={s.header}>

        {/* Brand strip */}
        <div style={s.brandBar}>
          {/* Logo */}
          <Link href="/dashboard">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", textDecoration: "none" }}>
              <div style={s.logoBox}>B</div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  BUILD<span style={{ color: "#3DB9C1" }}>RMC</span>
                </div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Satisfaction Matters
                </div>
              </div>
            </div>
          </Link>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

            {/* ── Bell / Notifications ── */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button
                onClick={() => { setNotifOpen((o) => !o); setUserOpen(false); }}
                style={s.iconBtn}
                title="Notifications"
              >
                <Bell size={15} />
                {unread > 0 && <span style={s.badge} />}
              </button>

              {notifOpen && (
                <div style={{ ...s.dropdown, minWidth: "320px" }}>
                  {/* Header */}
                  <div style={{ padding: "12px 16px", background: "linear-gradient(135deg,#0d1f2d,#162635)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#fff" }}>Notifications</span>
                    <span style={{ fontSize: "10px", background: "#3DB9C1", color: "#fff", borderRadius: "10px", padding: "2px 8px", fontWeight: 700 }}>{unread} new</span>
                  </div>
                  {/* Items */}
                  <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                    {notifList.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id, n.href)}
                        style={{
                          display: "flex", gap: "10px", padding: "10px 16px",
                          borderBottom: "1px solid #f1f5f9",
                          background: n.read ? "#fff" : "#f0fdfa",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                      >
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", marginTop: "5px", flexShrink: 0, background: n.read ? "#cbd5e1" : "#3DB9C1" }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>{n.title}</div>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>{n.desc}</div>
                          <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px" }}>{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Footer */}
                  <div style={{ padding: "10px 16px", textAlign: "center", borderTop: "1px solid #f1f5f9" }}>
                    <button onClick={() => { setNotifOpen(false); navigate("/billing"); }} style={{ fontSize: "11px", fontWeight: 700, color: "#3DB9C1", background: "none", border: "none", cursor: "pointer" }}>
                      View all notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ width: "1px", height: "26px", background: "rgba(255,255,255,0.10)" }} />

            {/* ── User dropdown ── */}
            <div ref={userRef} style={{ position: "relative" }}>
              <button
                onClick={() => { setUserOpen((o) => !o); setNotifOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "4px 10px 4px 5px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg,#3DB9C1,#1a9ca6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 900, color: "#fff", letterSpacing: "0.04em" }}>
                  {initials}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", lineHeight: 1, maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user?.fullName || user?.username || "Admin"}
                  </div>
                  <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.40)", fontWeight: 600, letterSpacing: "0.06em", marginTop: "2px" }}>SUPER ADMIN</div>
                </div>
                <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.40)", transition: "transform 0.2s", transform: userOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>

              {userOpen && (
                <div style={s.dropdown}>
                  {/* Profile banner */}
                  <div style={{ padding: "16px", background: "linear-gradient(135deg,#0d1f2d,#162635)", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg,#3DB9C1,#1a9ca6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 900, color: "#fff" }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff" }}>{user?.fullName || user?.username}</div>
                      <div style={{ fontSize: "10px", color: "#3DB9C1", fontWeight: 600, letterSpacing: "0.06em", marginTop: "2px" }}>● SUPER ADMIN</div>
                    </div>
                  </div>

                  {/* Menu items */}
                  {[
                    { icon: User,     label: "My Profile",       href: "/dashboard" },
                    { icon: Shield,   label: "Permissions",      href: "/dashboard" },
                    { icon: KeyRound, label: "Change Password",  href: "/dashboard" },
                  ].map((item) => (
                    <Link key={item.label} href={item.href}>
                      <div
                        onClick={() => setUserOpen(false)}
                        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", fontSize: "12px", fontWeight: 600, color: "#374151", cursor: "pointer", borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f0fdfa")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <item.icon size={13} style={{ color: "#3DB9C1" }} />
                        {item.label}
                      </div>
                    </Link>
                  ))}

                  {/* Logout */}
                  <div
                    onClick={handleLogout}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", fontSize: "12px", fontWeight: 700, color: "#ef4444", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fff5f5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <LogOut size={13} />
                    Sign Out
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Nav tabs ── */}
        <div style={{ overflowX: "auto", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <nav style={{ display: "flex", padding: "0 28px", gap: "2px" }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <div style={s.navTab(isActive)}>
                    <Icon size={12} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ══════════════════════════════ */}
      <main style={{ flex: 1, padding: "16px 28px 28px", maxWidth: "1680px", width: "100%", margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}
