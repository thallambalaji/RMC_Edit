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
  Bus,
  Users2,
  FileBarChart,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customer-po", label: "Customer & PO", icon: Users },
  { href: "/sales", label: "Sales", icon: BarChart3 },
  { href: "/dc", label: "DC", icon: Truck },
  { href: "/billing", label: "Billing", icon: FileText },
  { href: "/qc", label: "QC", icon: CheckSquare },
  { href: "/transport", label: "Transport", icon: Bus },
  { href: "/store", label: "Store", icon: Package },
  { href: "/accounts", label: "Accounts", icon: BookOpen, comingSoon: true },
  { href: "/hrm", label: "HRM", icon: Users2, comingSoon: true },
  { href: "/reports", label: "Reports", icon: FileBarChart, comingSoon: true },
];

const LogoIcon = () => (
  <div className="grid grid-cols-2 gap-0.5 w-6 h-6 shrink-0">
    <div className="w-2.5 h-2.5 bg-[#ea580c] rounded-[3px]"></div>
    <div className="w-2.5 h-2.5 bg-[#ea580c]/60 rounded-[3px]"></div>
    <div className="w-2.5 h-2.5 bg-[#ea580c]/80 rounded-[3px]"></div>
    <div className="w-2.5 h-2.5 bg-[#ea580c]/30 rounded-[3px]"></div>
  </div>
);

const CraneIllustration = () => (
  <svg viewBox="0 0 100 80" className="w-full h-16 text-[#ea580c]/70 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="10" y1="75" x2="90" y2="75" />
    <line x1="30" y1="75" x2="30" y2="20" />
    <line x1="33" y1="75" x2="33" y2="20" />
    <line x1="30" y1="70" x2="33" y2="65" />
    <line x1="33" y1="60" x2="30" y2="55" />
    <line x1="30" y1="50" x2="33" y2="45" />
    <line x1="33" y1="40" x2="30" y2="35" />
    <line x1="30" y1="30" x2="33" y2="25" />
    <line x1="10" y1="20" x2="85" y2="20" />
    <line x1="30" y1="15" x2="85" y2="20" />
    <line x1="10" y1="20" x2="30" y2="10" />
    <line x1="30" y1="10" x2="30" y2="20" />
    <polygon points="27,15 36,15 33,10 30,10" fill="#ffedd5" />
    <rect x="60" y="20" width="4" height="3" fill="currentColor" />
    <line x1="62" y1="23" x2="62" y2="35" />
    <circle cx="62" cy="37" r="1.5" />
    <rect x="65" y="45" width="20" height="30" fill="none" stroke="#94a3b8" strokeDasharray="2,2" />
    <line x1="65" y1="55" x2="85" y2="55" stroke="#94a3b8" />
    <line x1="65" y1="65" x2="85" y2="65" stroke="#94a3b8" />
  </svg>
);

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();
  const { toast } = useToast();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifList, setNotifList] = useState<any[]>(() => {
    const saved = localStorage.getItem("rmc_notifications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      { id: 1, title: "New Quotation", desc: "Quotation #Q-2026-004 pending review", time: "10m ago", read: false, href: "/customer-po" },
      { id: 2, title: "Cube Test Due", desc: "Grade M30 7-day testing is due today", time: "1h ago", read: false, href: "/qc" }
    ];
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    localStorage.setItem("rmc_notifications", JSON.stringify(notifList));
  }, [notifList]);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
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

  const dismissAll = () => {
    setNotifList((prev) => prev.map((n) => ({ ...n, read: true })));
    setNotifOpen(false);
  };

  const initials = (user?.fullName || user?.username || "A")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const showSidebar = location === "/dashboard";

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-800 font-sans print:bg-white">
      {/* ═══ SIDEBAR PANEL ══════════════════════════════ */}
      {showSidebar && (
        <aside 
          className={`bg-white border-r border-slate-100 flex flex-col shrink-0 transition-all duration-300 ${
            isCollapsed ? "w-20" : "w-64"
          } print:hidden`}
        >
          {/* Brand Header */}
          <div className="flex items-center gap-3 p-5 border-b border-slate-100 h-16 overflow-hidden">
            <LogoIcon />
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-xs text-slate-800 tracking-tight leading-none uppercase">
                  FORTUNE<span className="text-[#ea580c]">MIX</span>
                </span>
                <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider mt-1 whitespace-nowrap">
                  Enterprise Platform
                </span>
              </div>
            )}
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || location.startsWith(item.href + "/");
              const content = (
                <div
                  onClick={() => {
                    if (item.comingSoon) {
                      toast({ title: "Coming Soon", description: `${item.label} module is under development.` });
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer font-bold relative group ${
                    isActive
                      ? "bg-[#fff7ed] text-[#ea580c]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#ea580c] rounded-r-md" />
                  )}
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-[#ea580c]" : "text-slate-400 group-hover:text-slate-600"}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  {item.comingSoon && !isCollapsed && (
                    <span className="ml-auto text-[8px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-black tracking-wide uppercase">
                      Soon
                    </span>
                  )}
                </div>
              );

              if (item.comingSoon) {
                return <div key={item.href}>{content}</div>;
              }

              return (
                <Link key={item.href} href={item.href} className="block no-underline">
                  {content}
                </Link>
              );
            })}
          </nav>

          {/* Promo card */}
          {!isCollapsed && (
            <div className="mx-4 my-2 p-4 bg-orange-50/40 rounded-2xl border border-orange-100/50 flex flex-col items-center text-center">
              <CraneIllustration />
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                Building tomorrow,
              </p>
              <p className="text-xs font-extrabold text-[#ea580c] leading-tight mb-3">
                together.
              </p>
              <button className="flex items-center gap-1 bg-white hover:bg-orange-50 border border-orange-100 text-[#ea580c] font-extrabold text-[10px] uppercase tracking-wider px-4 py-1.5 rounded-xl shadow-sm transition-all duration-200 cursor-pointer">
                Learn More <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-100 flex flex-col gap-2 shrink-0">
            {!isCollapsed && (
              <div className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-[0.1em]">
                <div>© 2026 aeccentric. All rights reserved.</div>
                <div className="text-[8px] opacity-75 mt-0.5">Designed and developed by aeccentric solutions</div>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 self-start cursor-pointer transition-all duration-200"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
            </button>
          </div>
        </aside>
      )}

      {/* ═══ RIGHT PANEL ════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header Topnav */}
        <header className="sticky top-0 bg-white border-b border-slate-100 h-16 flex items-center justify-between px-6 z-40 print:hidden">
          {/* Horizontal Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto select-none py-2 max-w-4xl no-scrollbar" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {navItems.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              const content = (
                <span
                  onClick={() => {
                    if (item.comingSoon) {
                      toast({ title: "Coming Soon", description: `${item.label} module is under development.` });
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10.5px] uppercase tracking-wider font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[#fff7ed] text-[#ea580c]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {item.label}
                </span>
              );

              if (item.comingSoon) return <div key={item.href} className="flex">{content}</div>;

              return (
                <Link key={item.href} href={item.href} className="flex no-underline">
                  {content}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            {/* Bell Notifications */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setNotifOpen((o) => !o); setUserOpen(false); }}
                className="w-9 h-9 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-600 relative cursor-pointer"
                title="Notifications"
              >
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#ea580c] text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white">
                    {unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute top-full right-0 mt-2 min-w-[320px] bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden z-50 anim-fade-up">
                  {/* Header */}
                  <div className="padding-[12px 16px] bg-gradient-to-r from-slate-900 to-slate-800 p-4 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white">Notifications</span>
                    <span className="text-[9px] bg-[#ea580c] text-white rounded-full px-2.5 py-0.5 font-black uppercase tracking-wider">{unread} new</span>
                  </div>
                  {/* Items */}
                  <div className="max-h-[280px] overflow-y-auto">
                    {notifList.length > 0 ? (
                      notifList.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id, n.href)}
                          className={`flex gap-3 p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-all ${
                            n.read ? "bg-white" : "bg-orange-50/20"
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? "bg-slate-300" : "bg-[#ea580c]"}`} />
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-800">{n.title}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{n.desc}</div>
                            <div className="text-[9px] text-slate-400 font-semibold mt-1">{n.time}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        No notifications
                      </div>
                    )}
                  </div>
                  {/* Footer */}
                  <div className="p-3 text-center border-t border-slate-50 bg-slate-50/30">
                    <button 
                      onClick={dismissAll} 
                      className="text-[11px] font-extrabold text-[#ea580c] hover:underline bg-transparent border-0 cursor-pointer"
                    >
                      Dismiss all alerts
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Vertical Divider */}
            <div className="w-px h-6 bg-slate-100" />

            {/* Profile Dropdown */}
            <div ref={userRef} className="relative">
              <button
                onClick={() => { setUserOpen((o) => !o); setNotifOpen(false); }}
                className="flex items-center gap-2.5 hover:bg-slate-50 p-1.5 pr-3 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-100"
              >
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-black">
                  A
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-black text-slate-800 leading-tight">Admin</div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide leading-none mt-0.5">Super Admin</div>
                </div>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${userOpen ? "rotate-180" : ""}`} />
              </button>

              {userOpen && (
                <div className="absolute top-full right-0 mt-2 min-w-[240px] bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden z-50 anim-fade-up">
                  {/* User info banner */}
                  <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-black border border-white/10">
                      {initials}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">{user?.fullName || user?.username || "Admin"}</div>
                      <div className="text-[9px] text-[#ea580c] font-black uppercase tracking-wider mt-0.5">● Super Admin</div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="py-1">
                    {[
                      { icon: User, label: "My Profile", href: "/profile" },
                      { icon: Shield, label: "Permissions", href: "/permissions" },
                      { icon: KeyRound, label: "Change Password", href: "/change-password" },
                    ].map((item) => (
                      <Link key={item.label} href={item.href}>
                        <div
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer font-semibold transition-colors"
                        >
                          <item.icon size={14} className="text-slate-400" />
                          {item.label}
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-slate-100 py-1">
                    <div
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs text-rose-500 hover:bg-rose-50 cursor-pointer font-bold transition-colors"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Children Container */}
        <main className="flex-1 overflow-y-auto p-2 md:p-4 print:p-0 min-h-0 bg-[#f8fafc] flex flex-col justify-between">
          <div className="flex-1">
            {children}
          </div>
          <footer className="text-center py-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] print:hidden shrink-0 mt-8 border-t border-slate-100/60 leading-relaxed">
            <div>© 2026 aeccentric. All rights reserved.</div>
            <div className="text-[8px] opacity-75 mt-0.5">Designed and developed by aeccentric solutions</div>
          </footer>
        </main>
      </div>
    </div>
  );
}
