import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../adminApi";
import { isAdminUnlocked, unlockAdmin, lockAdmin } from "../../adminAuth";
import Dashboard from "./Dashboard";
import OrderManagement from "./OrderManagement";
import MenuManagement from "./MenuManagement";
import CategoryManagement from "./CategoryManagement";
import OffersManagement from "./OffersManagement";
import LoyaltyRewards from "./LoyaltyRewards";
import KitchenManagement from "./KitchenManagement";
import CustomerManagement from "./CustomerManagement";
import WebsiteContentSection from "./WebsiteContent";
import NotificationsSection from "./Notifications";

const SECTIONS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "orders", label: "Orders" },
  { id: "menu", label: "Menu" },
  { id: "categories", label: "Categories" },
  { id: "offers", label: "Offers" },
  { id: "loyalty", label: "Loyalty" },
  { id: "kitchen", label: "Kitchen" },
  { id: "customers", label: "Customers" },
  { id: "website", label: "Website" },
  { id: "notifications", label: "Notifications" },
];

const SECTION_ICONS = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  ),
  orders: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>
  ),
  menu: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
  ),
  categories: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
  ),
  offers: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
  ),
  loyalty: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  ),
  kitchen: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h5"/><path d="M2 18h5"/><path d="M2 6h5"/><path d="M17 12h5"/><path d="M17 18h5"/><path d="M17 6h5"/><path d="M12 2v20"/></svg>
  ),
  customers: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  website: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  ),
  notifications: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
  ),
};

function LoginGate({ onUnlock }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoggingIn(true);
    setError("");
    try {
      const data = await adminApi.login(username, password);
      unlockAdmin(data.token);
      onUnlock();
    } catch (err) {
      setError(err.message || "Invalid username or password");
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <form onSubmit={handleLogin} className="w-full max-w-sm rounded-2xl bg-gray-900 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C69214" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
          </div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="mt-1 text-sm text-gray-400">Cafe Management System</p>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm text-gray-400">Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            autoComplete="username"
            className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white outline-none focus:border-gold"
            placeholder="Enter admin username"
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm text-gray-400">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white outline-none focus:border-gold"
            placeholder="Enter admin password"
          />
        </label>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loggingIn} className="mt-5 w-full rounded-xl bg-gold py-3 text-sm font-semibold text-gray-950 transition hover:bg-gold-hover">{loggingIn ? "Signing in…" : "Unlock Admin"}</button>
      </form>
    </div>
  );
}

export default function AdminPanel() {
  const [unlocked, setUnlocked] = useState(() => isAdminUnlocked());
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const data = await adminApi.getUnreadCount();
      setUnreadCount(data.count);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    fetchUnread();
    const timer = setInterval(fetchUnread, 30000);
    return () => clearInterval(timer);
  }, [unlocked, fetchUnread]);

  if (!unlocked) {
    return <LoginGate onUnlock={() => setUnlocked(true)} />;
  }

  function handleLogout() {
    lockAdmin();
    setUnlocked(false);
  }

  const sectionProps = { onNotify: (msg, type) => {
    const event = new CustomEvent("admin-toast", { detail: { message: msg, type } });
    window.dispatchEvent(event);
  }};

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-200">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gray-900 border-r border-gray-800 transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 border-b border-gray-800 px-5 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden ring-2 ring-gold/40 bg-white">
            <img src="/logo.png" alt="Cinephile's Café Logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Admin Panel</p>
            <p className="text-xs text-gray-500">Cafe Management</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => { setActiveSection(section.id); setSidebarOpen(false); }}
              className={`btn-3d-flat flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                activeSection === section.id
                  ? "bg-gold/10 text-gold"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {SECTION_ICONS[section.id]}
              {section.label}
              {section.id === "notifications" && unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-800 p-3">
          <button onClick={handleLogout} className="btn-3d-flat flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Lock Panel
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-gray-800 bg-gray-950/80 px-5 py-4 backdrop-blur-sm">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg border border-gray-700 p-2 text-gray-400 hover:text-white lg:hidden">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <h2 className="text-lg font-semibold text-white capitalize">{activeSection === "website" ? "Website Content" : activeSection}</h2>
        </header>

        <div className="p-5">
          {activeSection === "dashboard" && <Dashboard {...sectionProps} />}
          {activeSection === "orders" && <OrderManagement {...sectionProps} />}
          {activeSection === "menu" && <MenuManagement {...sectionProps} />}
          {activeSection === "categories" && <CategoryManagement {...sectionProps} />}
          {activeSection === "offers" && <OffersManagement {...sectionProps} />}
          {activeSection === "loyalty" && <LoyaltyRewards {...sectionProps} />}
          {activeSection === "kitchen" && <KitchenManagement {...sectionProps} />}
          {activeSection === "customers" && <CustomerManagement {...sectionProps} />}
          {activeSection === "website" && <WebsiteContentSection {...sectionProps} />}
          {activeSection === "notifications" && <NotificationsSection {...sectionProps} onRefreshCount={fetchUnread} />}
        </div>
      </main>
    </div>
  );
}
