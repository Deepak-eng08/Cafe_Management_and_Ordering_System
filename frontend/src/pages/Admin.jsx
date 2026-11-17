import { useEffect, useState, useCallback, useRef } from "react"
import { getOrders, updateOrderStatus, getKitchenStatus, setKitchenStatus, deleteOrders, deleteAllOrders } from "../api"
import { adminApi } from "../adminApi"
import {
  isAdminUnlocked,
  unlockAdmin,
  lockAdmin,
} from "../adminAuth"
import ConfirmDialog from "../components/ConfirmDialog"
import AdminToastStack from "../components/notifications/AdminToastStack"
import AdminNotificationBell from "../components/notifications/AdminNotificationBell"
import { registerAdminSocket } from "../services/socketClient"
import { useNotifications } from "../context/NotificationContext"
import { formatPrice } from "../price"

const STATUSES = ["pending", "preparing", "ready", "completed", "cancelled"]
const FILTER_OPTIONS = ["all", "pending", "preparing", "ready", "completed", "cancelled"]
const STATUS_COLORS = {
  pending: "bg-gold/10 text-gold ring-gold/20",
  preparing: "bg-blue-100 text-blue-800 ring-blue-200",
  ready: "bg-green-100 text-green-800 ring-green-200",
  completed: "bg-gray-100 text-gray-600 ring-gray-200",
  cancelled: "bg-red-100 text-red-800 ring-red-200",
}

const SECTIONS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "orders", label: "Orders" },
  { id: "menu", label: "Menu" },
  { id: "categories", label: "Categories" },
  { id: "offers", label: "Offers" },
  { id: "loyalty", label: "Loyalty" },
  { id: "kitchen", label: "Kitchen" },
  { id: "customers", label: "Customers" },
  { id: "notifications", label: "Notifications" },
]

function Admin({ onNotify }) {
  const [unlocked, setUnlocked] = useState(() => isAdminUnlocked())
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loggingIn, setLoggingIn] = useState(false)
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0)
  const [activeOrdersCount, setActiveOrdersCount] = useState(0)
  const { setAdminMode } = useNotifications()

  // Register this admin panel for real-time new-order notifications.
  useEffect(() => {
    if (unlocked) {
      registerAdminSocket()
      setAdminMode(true)
      return () => setAdminMode(false)
    }
    setAdminMode(false)
  }, [unlocked, setAdminMode])

  async function handleLogin(e) {
    e.preventDefault()
    setLoggingIn(true)
    setLoginError("")
    try {
      const data = await adminApi.login(username, password)
      unlockAdmin(data.token)
      setUnlocked(true)
      setUsername("")
      setPassword("")
    } catch (err) {
      setLoginError(err.message || "Invalid username or password. Try again.")
    } finally {
      setLoggingIn(false)
    }
  }

  function handleLogout() {
    lockAdmin()
    setUnlocked(false)
    setActiveSection("dashboard")
  }

  const fetchUnread = useCallback(async () => {
    try {
      const data = await adminApi.getUnreadCount()
      setUnreadCount(data.count)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!unlocked) return
    fetchUnread()
    const timer = setInterval(fetchUnread, 30000)
    return () => clearInterval(timer)
  }, [unlocked, fetchUnread])

  const fetchPendingClaims = useCallback(async () => {
    try {
      const data = await adminApi.getPendingClaimsCount()
      setPendingClaimsCount(data.count)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!unlocked) return
    fetchPendingClaims()
    const timer = setInterval(fetchPendingClaims, 15000)
    return () => clearInterval(timer)
  }, [unlocked, fetchPendingClaims])

  const fetchActiveOrders = useCallback(async () => {
    try {
      const data = await adminApi.getActiveOrdersCount()
      setActiveOrdersCount(data.count)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!unlocked) return
    fetchActiveOrders()
    const timer = setInterval(fetchActiveOrders, 8000)
    return () => clearInterval(timer)
  }, [unlocked, fetchActiveOrders])

  const refreshCounts = useCallback(() => {
    fetchUnread()
    fetchActiveOrders()
  }, [fetchUnread, fetchActiveOrders])

  if (!unlocked) {
    return (
      <main className="flex flex-1 flex-col bg-cream">
        <section className="relative overflow-hidden bg-espresso-deep pt-16 pb-14 sm:pt-20">
          <div className="absolute inset-0 bg-gradient-to-r from-espresso-deep via-espresso-deep/90 to-mocha/40" />
          <div className="relative z-10 mx-auto max-w-7xl px-5 text-center sm:px-6">
            <h1 className="font-display text-3xl font-semibold text-white sm:text-5xl">
              Cafe <span className="italic text-gold">Admin</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/75 sm:text-base">
              Enter your credentials to access the admin panel.
            </p>
          </div>
        </section>

        <section className="flex flex-1 items-start justify-center px-5 py-10 sm:px-6 sm:py-12">
          <form
            onSubmit={handleLogin}
            className="w-full max-w-sm rounded-3xl bg-white px-5 py-7 shadow-sm sm:px-6 sm:py-8"
          >
            <label className="block">
              <span className="mb-1.5 block text-sm text-mocha">Username</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                className="w-full rounded-xl border border-latte bg-cream px-3 py-2.5 text-sm outline-none focus:border-gold sm:text-base"
                placeholder="Admin username"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm text-mocha">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-latte bg-cream px-3 py-2.5 text-sm outline-none focus:border-gold sm:text-base"
                placeholder="Owner password"
              />
            </label>
            {loginError && (
              <p className="mt-3 text-sm text-red-700">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loggingIn}
              className="btn-3d-gold-sm mt-5 w-full rounded-full py-3 text-sm sm:text-base"
            >
              {loggingIn ? "Signing in…" : "Unlock Admin"}
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminToastStack onViewOrder={() => setActiveSection("orders")} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-espresso-deep transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden ring-2 ring-gold/40 bg-white">
            <img src="/logo.png" alt="Cinephile's Café Logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-white">Cinephile&apos;s</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-gold">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => { setActiveSection(section.id); setSidebarOpen(false); }}
              className={`btn-3d-flat flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                activeSection === section.id
                  ? "bg-gold/15 text-gold"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {section.label}
              {section.id === "orders" && activeOrdersCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-white">
                  {activeOrdersCount > 99 ? "99+" : activeOrdersCount}
                </span>
              )}
              {section.id === "loyalty" && pendingClaimsCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-white">
                  {pendingClaimsCount > 99 ? "99+" : pendingClaimsCount}
                </span>
              )}
              {section.id === "notifications" && unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            className="btn-3d-flat flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60"
          >
            Lock Panel
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-latte bg-cream/80 px-5 py-4 backdrop-blur-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-3d-outline rounded-xl border border-latte bg-white px-3 py-2 text-xs font-medium text-espresso"
          >
            Menu
          </button>
          <h2 className="font-display text-lg font-semibold text-espresso capitalize">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </h2>
          <div className="ml-auto">
            <AdminNotificationBell onNavigateOrders={() => setActiveSection("orders")} />
          </div>
        </header>

        <section className="px-5 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 hidden items-center justify-between gap-4 lg:flex">
              <h2 className="font-display text-2xl font-semibold text-espresso sm:text-3xl">
                {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
              </h2>
              <AdminNotificationBell onNavigateOrders={() => setActiveSection("orders")} />
            </div>

            {activeSection === "dashboard" && <DashboardSection onNotify={onNotify} />}
            {activeSection === "orders" && <OrdersSection onNotify={onNotify} onRefreshCount={refreshCounts} />}
            {activeSection === "menu" && <MenuSection onNotify={onNotify} />}
            {activeSection === "categories" && <CategoriesSection onNotify={onNotify} />}
            {activeSection === "offers" && <OffersSection onNotify={onNotify} />}
            {activeSection === "loyalty" && <LoyaltySection onNotify={onNotify} />}
            {activeSection === "kitchen" && <KitchenSection onNotify={onNotify} />}
            {activeSection === "customers" && <CustomersSection onNotify={onNotify} />}
            {activeSection === "notifications" && <NotificationsSection onNotify={onNotify} onRefreshCount={fetchUnread} />}
          </div>
        </section>
      </main>
    </div>
  )
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function DashboardSection({ onNotify }) {
  const [stats, setStats] = useState({ orders: 0, pending: 0, preparing: 0, ready: 0, completed: 0 })
  const [kitchenStatus, setKitchenStatusState] = useState("closed")
  const [menuCount, setMenuCount] = useState(0)
  const [activeOffers, setActiveOffers] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [ordersData, kitchenData, menuData, offersData] = await Promise.all([
        adminApi.getAllOrders({ filter: "today", limit: 500 }),
        adminApi.getKitchenStatus(),
        adminApi.getMenu(),
        adminApi.getOffers(),
      ])
      const orders = ordersData.orders || []
      setStats({
        orders: orders.length,
        pending: orders.filter((o) => o.status === "pending").length,
        preparing: orders.filter((o) => o.status === "preparing").length,
        ready: orders.filter((o) => o.status === "ready").length,
        completed: orders.filter((o) => o.status === "completed").length,
      })
      setKitchenStatusState(kitchenData.status)
      setMenuCount(Array.isArray(menuData) ? menuData.length : 0)
      setActiveOffers(Array.isArray(offersData) ? offersData.filter((o) => (o.status || "active") === "active").length : 0)
    } catch (err) {
      onNotify(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [])

  if (loading) return <p className="py-16 text-center text-sm text-steam">Loading dashboard...</p>

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <DashCard label="Today's Orders" value={stats.orders} />
        <DashCard label="Pending" value={stats.pending} />
        <DashCard label="Preparing" value={stats.preparing} />
        <DashCard label="Ready" value={stats.ready} />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <DashCard label="Completed" value={stats.completed} />
        <DashCard label="Active Menu Items" value={menuCount} />
        <DashCard label="Active Offers" value={activeOffers} />
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-latte">
          <p className="text-sm text-steam">Kitchen Status</p>
          <div className={`mt-2 flex items-center gap-2 text-sm font-semibold ${kitchenStatus === "open" ? "text-green-700" : "text-red-700"}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${kitchenStatus === "open" ? "bg-green-600" : "bg-red-600"}`} />
            {kitchenStatus === "open" ? "Open" : "Closed"}
          </div>
        </div>
      </div>
    </div>
  )
}

function DashCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-latte">
      <p className="text-sm text-steam">{label}</p>
      <p className="mt-2 text-3xl font-bold text-espresso">{value}</p>
    </div>
  )
}

/* ============================================================
   ORDERS
   ============================================================ */
const ORDER_KEEP_MS = 24 * 60 * 60 * 1000

function isWithin24h(order) {
  try {
    const t = new Date(order.createdAt).getTime()
    if (Number.isNaN(t)) return false
    return Date.now() - t < ORDER_KEEP_MS
  } catch { return false }
}

function OrdersSection({ onNotify, onRefreshCount }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })
  const [selectedIds, setSelectedIds] = useState([])
  const [confirmAction, setConfirmAction] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadOrders = useCallback(async () => {
    try {
      const params = { page, limit: 50 }
      if (search.trim()) params.search = search.trim()
      const data = await adminApi.getAllOrders(params)
      let list = (data.orders || []).filter(isWithin24h)
      if (filter !== "all") list = list.filter((o) => o.status === filter)
      setOrders(list)
      setPagination(data.pagination || { total: 0, pages: 1 })
    } catch (err) {
      onNotify(err.message, "error")
    } finally {
      setLoading(false)
    }
  }, [page, search, filter])

  useEffect(() => { loadOrders() }, [loadOrders])

  useEffect(() => {
    const t = setInterval(loadOrders, 8000)
    return () => clearInterval(t)
  }, [loadOrders])

  async function handleStatusChange(orderId, status) {
    try {
      await adminApi.updateOrderStatus(orderId, status)
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)))
      onNotify(`Order updated to "${status}".`, "success")
      if (onRefreshCount) {
        onRefreshCount()
      }
    } catch (err) {
      onNotify(err.message, "error")
    }
  }

  const pageIds = orders.map((o) => o._id)
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id))

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (allPageSelected) return prev.filter((id) => !pageIds.includes(id))
      return [...new Set([...prev, ...pageIds])]
    })
  }

  async function handleDeleteSelected() {
    setDeleting(true)
    try {
      const res = await deleteOrders(selectedIds)
      const count = selectedIds.length
      setSelectedIds([])
      setConfirmAction(null)
      onNotify(res.message || `Deleted ${count} order(s).`, "success")
      loadOrders()
      if (onRefreshCount) onRefreshCount()
    } catch (err) {
      onNotify(err.message, "error")
      setConfirmAction(null)
    } finally {
      setDeleting(false)
    }
  }

  async function handleDeleteAll() {
    setDeleting(true)
    try {
      const res = await deleteAllOrders()
      setSelectedIds([])
      setConfirmAction(null)
      onNotify(res.message || "All orders deleted.", "success")
      loadOrders()
      if (onRefreshCount) onRefreshCount()
    } catch (err) {
      onNotify(err.message, "error")
      setConfirmAction(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by Order ID, name, or phone..."
          className="flex-1 rounded-xl border border-latte bg-white px-4 py-2.5 text-sm text-espresso outline-none focus:border-gold"
        />
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`btn-pill-admin px-3 py-1.5 text-xs font-medium capitalize ${
                filter === f ? "active" : ""
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setConfirmAction("deleteAll")}
            className="rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            🗑️ Delete All Orders
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction("deleteSelected")}
            disabled={selectedIds.length === 0}
            className="rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            🗑️ Delete Selected ({selectedIds.length})
          </button>
        </div>
        {orders.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectAll}
            className="btn-3d-outline rounded-full border border-latte bg-white px-4 py-2 text-xs font-medium text-espresso"
          >
            {allPageSelected ? "Clear Selection" : "Select All on Page"}
          </button>
        )}
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-steam">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="py-16 text-center text-base text-steam">No orders found.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isActive = order.status === "pending" || order.status === "preparing" || order.status === "ready"
            const orderCardStyle = isActive
              ? order.status === "pending"
                ? "bg-gradient-to-br from-gold/5 via-gold/10 to-gold/5 border-2 border-gold/30 shadow-md"
                : order.status === "preparing"
                ? "bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 border-2 border-blue-300 shadow-md"
                : "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-300 shadow-md"
              : order.status === "cancelled"
              ? "bg-red-50/50 border border-red-200 opacity-70"
              : "bg-white border border-latte"
            const titleStyle = isActive ? "text-espresso" : order.status === "cancelled" ? "text-red-800" : "text-mocha"
            const amountStyle = isActive ? "text-espresso" : "text-mocha"
            const itemsStyle = isActive ? "text-mocha font-medium" : "text-steam"
            const borderStyle = isActive ? order.status === "pending" ? "border-gold/20" : order.status === "preparing" ? "border-blue-200" : "border-emerald-200" : "border-latte"

            return (
              <div key={order._id} className={`rounded-2xl px-5 py-5 transition-all ${orderCardStyle}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(order._id)}
                        onChange={() => toggleSelect(order._id)}
                        className="h-4 w-4 cursor-pointer rounded border-latte accent-red-600"
                        aria-label={`Select order ${order.orderId}`}
                      />
                      <p className={`font-display text-lg font-semibold ${titleStyle}`}>{order.customerName}</p>
                      {order.tableNumber && (
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${isActive ? "border-gold/40 bg-gold/10 text-gold" : "border-latte bg-cream text-mocha"}`}>
                          🪑 Table {order.tableNumber}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isActive ? "text-mocha" : "text-steam"}`}>{order.phoneNumber}</p>
                    <p className={`mt-1 text-[11px] ${isActive ? "text-steam" : "text-latte"}`}>{order.orderId} &middot; {new Date(order.createdAt).toLocaleString()}</p>
                    <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 capitalize ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className={`text-lg font-bold ${amountStyle}`}>₹{formatPrice(order.total)}</p>
                </div>

                <ul className={`mt-3 space-y-1 border-t pt-3 text-xs ${borderStyle} ${itemsStyle}`}>
                  {order.items.map((item, i) => (
                    <li key={i}>{item.quantity}× {item.name} — ₹{formatPrice(item.price * item.quantity)}</li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(order._id, s)}
                    disabled={order.status === s || order.status === "completed" || order.status === "cancelled"}
                    className={`btn-pill-admin px-3 py-1.5 text-xs font-medium capitalize ${
                      order.status === s ? "active" : ""
                    } disabled:opacity-50`}
                  >
                    {s}
                  </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-full border border-latte bg-white px-4 py-2 text-xs font-medium text-mocha hover:border-gold disabled:opacity-40">Previous</button>
          <span className="text-sm text-steam">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="rounded-full border border-latte bg-white px-4 py-2 text-xs font-medium text-mocha hover:border-gold disabled:opacity-40">Next</button>
        </div>
      )}

      <ConfirmDialog
        open={confirmAction === "deleteSelected"}
        title="Delete selected orders?"
        description={`This will permanently delete ${selectedIds.length} selected order(s). This action cannot be undone.`}
        icon="🗑️"
        confirmText="Delete Selected"
        loading={deleting}
        theme="light"
        onConfirm={handleDeleteSelected}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction === "deleteAll"}
        title="Delete ALL orders?"
        description="This will permanently delete every order in the last 24 hours shown here. This action cannot be undone."
        icon="⚠️"
        confirmText="Delete All"
        loading={deleting}
        theme="light"
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}

/* ============================================================
   MENU
   ============================================================ */
const EMPTY_ITEM = { name: "", price: "", category: "", description: "", image: "", available: true, bestseller: false, recommended: false, newArrival: false, chefsSpecial: false, cinephilesPick: false, customersFavourite: false }

function MenuSection({ onNotify }) {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState("All")
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_ITEM })
  const [selectedFile, setSelectedFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef(null)

  const MAX_IMAGE_BYTES = 5 * 1024 * 1024
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

  async function loadData() {
    try {
      const [menuData, catData] = await Promise.all([adminApi.getMenu(), adminApi.getCategories()])
      setItems(Array.isArray(menuData) ? menuData : [])
      setCategories(Array.isArray(catData) ? catData : [])
    } catch (err) { onNotify(err.message, "error") }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  function openAdd() { setEditItem(null); setSelectedFile(null); setForm({ ...EMPTY_ITEM, category: categories[0]?.name || "" }); setShowForm(true) }
  function openEdit(item) {
    setEditItem(item)
    setSelectedFile(null)
    setForm({ name: item.name, price: item.price, category: item.category, description: item.description || "", image: item.image || "", available: item.available, bestseller: item.bestseller || false, recommended: item.recommended || false, newArrival: item.newArrival || false, chefsSpecial: item.chefsSpecial || false, cinephilesPick: item.cinephilesPick || false, customersFavourite: item.customersFavourite || false })
    setShowForm(true)
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      onNotify("Only JPG, JPEG, PNG, or WEBP images are allowed", "error")
      e.target.value = ""
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onNotify("Image is too large. Maximum size is 5 MB", "error")
      e.target.value = ""
      return
    }
    setSelectedFile(file)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (saving) return
    if (!editItem && !selectedFile && !form.image) {
      onNotify("Please select an image for the menu item", "error")
      return
    }
    setSaving(true)
    try {
      const data = { ...form, price: Number(form.price) }
      if (editItem) { await adminApi.updateMenuItem(editItem._id, data, selectedFile); onNotify("Menu item updated") }
      else { await adminApi.createMenuItem(data, selectedFile); onNotify("Menu item added") }
      setShowForm(false); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; loadData(); localStorage.setItem("menuUpdated", Date.now()); try { new BroadcastChannel("menu-updates").postMessage("refresh") } catch(e){}
    } catch (err) { onNotify(err.message, "error") }
    finally { setSaving(false) }
  }

  async function confirmDeleteMenuItem() {
    if (!deleteTarget) return
    setDeleting(true)
    try { await adminApi.deleteMenuItem(deleteTarget._id); setItems((prev) => prev.filter((i) => i._id !== deleteTarget._id)); onNotify("Menu item deleted successfully."); localStorage.setItem("menuUpdated", Date.now()); try { new BroadcastChannel("menu-updates").postMessage("refresh") } catch(e){} }
    catch (err) { onNotify(err.message, "error") }
    finally { setDeleting(false); setDeleteTarget(null) }
  }

  async function toggleField(id, field, value) {
    try { await adminApi.updateMenuItem(id, { [field]: value }); setItems((prev) => prev.map((i) => (i._id === id ? { ...i, [field]: value } : i))); localStorage.setItem("menuUpdated", Date.now()); try { new BroadcastChannel("menu-updates").postMessage("refresh") } catch(e){} }
    catch (err) { onNotify(err.message, "error") }
  }

  const filtered = items.filter((item) => {
    if (filterCat !== "All" && item.category !== filterCat) return false
    if (search.trim()) { const t = search.toLowerCase(); return item.name.toLowerCase().includes(t) || (item.description || "").toLowerCase().includes(t) }
    return true
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu items..." className="flex-1 rounded-xl border border-latte bg-white px-4 py-2.5 text-sm text-espresso outline-none focus:border-gold" />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-xl border border-latte bg-white px-4 py-2.5 text-sm text-espresso outline-none focus:border-gold">
          <option value="All">All Categories</option>
          {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
        </select>
        <button onClick={openAdd} className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-espresso transition hover:bg-gold-hover">+ Add Item</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleSave} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-lg font-semibold text-espresso">{editItem ? "Edit Menu Item" : "Add Menu Item"}</h3>
            <label className="block"><span className="mb-1 block text-sm text-mocha">Name *</span><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-latte bg-cream px-4 py-2.5 text-sm text-espresso outline-none focus:border-gold" /></label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block"><span className="mb-1 block text-sm text-mocha">Price (₹) *</span><input type="number" required min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-xl border border-latte bg-cream px-4 py-2.5 text-sm text-espresso outline-none focus:border-gold" /></label>
              <label className="block"><span className="mb-1 block text-sm text-mocha">Category *</span><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-latte bg-cream px-4 py-2.5 text-sm text-espresso outline-none focus:border-gold">{categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}</select></label>
            </div>
            <label className="block"><span className="mb-1 block text-sm text-mocha">Description</span><textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-latte bg-cream px-4 py-2.5 text-sm text-espresso outline-none focus:border-gold" /></label>
            <label className="block">
              <span className="mb-1 block text-sm text-mocha">Image {!editItem && <span className="text-red-500">*</span>}</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full border border-latte bg-cream px-4 py-2.5 text-sm font-semibold text-espresso transition hover:border-gold hover:text-gold">Choose Image</button>
                {selectedFile && <span className="text-xs text-mocha">{selectedFile.name}</span>}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} className="hidden" />
              </div>
              {(selectedFile || form.image) && (
                <img src={selectedFile ? URL.createObjectURL(selectedFile) : form.image} alt="Preview" className="mt-2 h-32 w-full rounded-xl border border-latte object-cover" />
              )}
              <p className="mt-1 text-xs text-steam">JPG, PNG, or WEBP — max 5 MB{editItem ? ". Leave empty to keep the current image." : ""}</p>
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-mocha"><input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="accent-gold" />Available</label>
              <label className="flex items-center gap-2 text-sm text-mocha"><input type="checkbox" checked={form.bestseller} onChange={(e) => setForm({ ...form, bestseller: e.target.checked })} className="accent-gold" />Bestseller</label>
              <label className="flex items-center gap-2 text-sm text-mocha"><input type="checkbox" checked={form.recommended} onChange={(e) => setForm({ ...form, recommended: e.target.checked })} className="accent-gold" />Recommended</label>
              <label className="flex items-center gap-2 text-sm text-mocha"><input type="checkbox" checked={form.newArrival} onChange={(e) => setForm({ ...form, newArrival: e.target.checked })} className="accent-gold" />New Arrival</label>
              <label className="flex items-center gap-2 text-sm text-mocha"><input type="checkbox" checked={form.chefsSpecial} onChange={(e) => setForm({ ...form, chefsSpecial: e.target.checked })} className="accent-gold" />Chef's Special</label>
              <label className="flex items-center gap-2 text-sm text-mocha"><input type="checkbox" checked={form.cinephilesPick} onChange={(e) => setForm({ ...form, cinephilesPick: e.target.checked })} className="accent-gold" />Cinephile's Pick</label>
              <label className="flex items-center gap-2 text-sm text-mocha"><input type="checkbox" checked={form.customersFavourite} onChange={(e) => setForm({ ...form, customersFavourite: e.target.checked })} className="accent-gold" />Customer's Favourite</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 rounded-full bg-gold py-2.5 text-sm font-semibold text-espresso hover:bg-gold-hover disabled:opacity-50">{saving ? (editItem ? "Saving..." : "Uploading image...") : editItem ? "Update" : "Add Item"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-latte bg-white px-5 py-2.5 text-sm text-mocha hover:text-espresso">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="py-16 text-center text-sm text-steam">Loading menu...</p>
        : filtered.length === 0 ? <p className="py-16 text-center text-base text-steam">No menu items found.</p>
        : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <div key={item._id} className="rounded-2xl bg-white shadow-sm ring-1 ring-latte overflow-hidden">
                {item.image && <img src={item.image} alt={item.name} className="h-40 w-full object-cover" />}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-semibold text-espresso">{item.name}</p>
                      <p className="text-xs text-steam">{item.category}</p>
                    </div>
                    <p className="text-lg font-bold text-gold">₹{formatPrice(item.price)}</p>
                  </div>
                  {item.description && <p className="text-xs text-mocha line-clamp-2">{item.description}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${item.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{item.available ? "Available" : "Unavailable"}</span>
                    {item.bestseller && <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">Bestseller</span>}
                    {item.recommended && <span className="rounded-full bg-burgundy/10 px-2 py-0.5 text-[10px] font-medium text-burgundy">Recommended</span>}
                    {item.newArrival && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">New Arrival</span>}
                    {item.chefsSpecial && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">Chef's Special</span>}
                    {item.cinephilesPick && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">Cinephile's Pick</span>}
                    {item.customersFavourite && <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-medium text-pink-700">Customer's Favourite</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button onClick={() => openEdit(item)} className="rounded-full border border-latte bg-white px-3 py-1 text-[11px] font-medium text-mocha hover:border-gold">Edit</button>
                    <button onClick={() => toggleField(item._id, "available", !item.available)} className={`rounded-full px-3 py-1 text-[11px] font-medium ${item.available ? "border border-gold/30 bg-gold/5 text-gold/80" : "border border-green-300 bg-green-50 text-green-700"}`}>{item.available ? "Unavailable" : "Available"}</button>
                    <button onClick={() => toggleField(item._id, "bestseller", !item.bestseller)} className={`rounded-full px-3 py-1 text-[11px] font-medium ${item.bestseller ? "border border-gold bg-gold/10 text-gold" : "border border-latte bg-white text-mocha"}`}>{item.bestseller ? "Unbestseller" : "Bestseller"}</button>
                    <button onClick={() => toggleField(item._id, "recommended", !item.recommended)} className={`rounded-full px-3 py-1 text-[11px] font-medium ${item.recommended ? "border border-burgundy bg-burgundy/10 text-burgundy" : "border border-latte bg-white text-mocha"}`}>{item.recommended ? "Unrecommend" : "Recommended"}</button>
                    <button onClick={() => toggleField(item._id, "newArrival", !item.newArrival)} className={`rounded-full px-3 py-1 text-[11px] font-medium ${item.newArrival ? "border border-blue-300 bg-blue-50 text-blue-700" : "border border-latte bg-white text-mocha"}`}>{item.newArrival ? "Remove New Arrival" : "New Arrival"}</button>
                    <button onClick={() => toggleField(item._id, "chefsSpecial", !item.chefsSpecial)} className={`rounded-full px-3 py-1 text-[11px] font-medium ${item.chefsSpecial ? "border border-orange-300 bg-orange-50 text-orange-700" : "border border-latte bg-white text-mocha"}`}>{item.chefsSpecial ? "Remove Chef's Special" : "Chef's Special"}</button>
                    <button onClick={() => toggleField(item._id, "cinephilesPick", !item.cinephilesPick)} className={`rounded-full px-3 py-1 text-[11px] font-medium ${item.cinephilesPick ? "border border-purple-300 bg-purple-50 text-purple-700" : "border border-latte bg-white text-mocha"}`}>{item.cinephilesPick ? "Remove Cinephile's Pick" : "Cinephile's Pick"}</button>
                    <button onClick={() => toggleField(item._id, "customersFavourite", !item.customersFavourite)} className={`rounded-full px-3 py-1 text-[11px] font-medium ${item.customersFavourite ? "border border-pink-300 bg-pink-50 text-pink-700" : "border border-latte bg-white text-mocha"}`}>{item.customersFavourite ? "Remove Customer's Favourite" : "Customer's Favourite"}</button>
                    <button onClick={() => setDeleteTarget(item)} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-medium text-red-700">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Menu Item"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        icon="🗑️"
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
        loading={deleting}
        theme="light"
        onConfirm={confirmDeleteMenuItem}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

/* ============================================================
   CATEGORIES
   ============================================================ */
function CategoriesSection({ onNotify }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState("")
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    try { const d = await adminApi.getCategories(); setCategories(Array.isArray(d) ? d : []) }
    catch (err) { onNotify(err.message, "error") }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault(); if (!newName.trim()) return
    try { await adminApi.createCategory({ name: newName.trim() }); setNewName(""); onNotify("Category added"); load(); localStorage.setItem("menuUpdated", Date.now()); try { new BroadcastChannel("menu-updates").postMessage("refresh") } catch(e){} }
    catch (err) { onNotify(err.message, "error") }
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return
    try { await adminApi.updateCategory(id, { name: editName.trim() }); setEditId(null); setEditName(""); onNotify("Category updated"); load(); localStorage.setItem("menuUpdated", Date.now()); try { new BroadcastChannel("menu-updates").postMessage("refresh") } catch(e){} }
    catch (err) { onNotify(err.message, "error") }
  }

  async function confirmDeleteCategory() {
    if (!deleteTarget) return
    setDeleting(true)
    try { await adminApi.deleteCategory(deleteTarget._id); setCategories((prev) => prev.filter((c) => c._id !== deleteTarget._id)); onNotify("Category deleted successfully."); localStorage.setItem("menuUpdated", Date.now()); try { new BroadcastChannel("menu-updates").postMessage("refresh") } catch(e){} }
    catch (err) { onNotify(err.message, "error") }
    finally { setDeleting(false); setDeleteTarget(null) }
  }

  async function move(index, dir) {
    const updated = [...categories]
    const target = index + dir
    if (target < 0 || target >= updated.length) return
    ;[updated[index], updated[target]] = [updated[target], updated[index]]
    setCategories(updated)
    try { await adminApi.reorderCategories(updated.map((c, i) => ({ id: c._id, order: i }))) }
    catch (err) { onNotify(err.message, "error"); load() }
  }

  if (loading) return <p className="py-16 text-center text-sm text-steam">Loading categories...</p>

  return (
    <div className="space-y-5 max-w-xl">
      <form onSubmit={handleAdd} className="flex gap-3">
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category name..." className="flex-1 rounded-xl border border-latte bg-white px-4 py-2.5 text-sm text-espresso outline-none focus:border-gold" />
        <button type="submit" disabled={!newName.trim()} className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-espresso hover:bg-gold-hover disabled:opacity-50">+ Add</button>
      </form>
      {categories.length === 0 ? <p className="py-16 text-center text-base text-steam">No categories yet.</p> : (
        <div className="space-y-2">
          {categories.map((cat, i) => (
            <div key={cat._id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-latte">
              <span className="w-6 text-center text-xs text-steam">{i + 1}</span>
              {editId === cat._id ? (
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleUpdate(cat._id)} autoFocus className="flex-1 rounded-lg border border-gold bg-cream px-3 py-1.5 text-sm text-espresso outline-none" />
              ) : (
                <span className="flex-1 text-sm font-medium text-espresso">{cat.name}</span>
              )}
              <div className="flex gap-1.5">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg bg-cream border border-latte px-2 py-1 text-xs text-mocha hover:border-gold disabled:opacity-30">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === categories.length - 1} className="rounded-lg bg-cream border border-latte px-2 py-1 text-xs text-mocha hover:border-gold disabled:opacity-30">↓</button>
                {editId === cat._id ? (
                  <>
                    <button onClick={() => handleUpdate(cat._id)} className="rounded-lg bg-gold/15 px-2 py-1 text-xs font-medium text-gold">Save</button>
                    <button onClick={() => { setEditId(null); setEditName("") }} className="rounded-lg bg-cream border border-latte px-2 py-1 text-xs text-mocha">Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditId(cat._id); setEditName(cat.name) }} className="rounded-lg bg-cream border border-latte px-2 py-1 text-xs text-mocha hover:border-gold">Edit</button>
                    <button onClick={() => setDeleteTarget(cat)} className="rounded-lg bg-red-50 border border-red-200 px-2 py-1 text-xs text-red-700">Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        icon="🗑️"
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
        loading={deleting}
        theme="light"
        onConfirm={confirmDeleteCategory}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

/* ============================================================
   OFFERS
   ============================================================ */
const OFFER_DURATION_OPTIONS = [
  { value: "custom", label: "Custom Date Range" },
  { value: "today", label: "Today Only" },
  { value: "tomorrow", label: "Until Tomorrow" },
  { value: "7days", label: "7 Days" },
  { value: "30days", label: "30 Days" },
  { value: "year", label: "Whole Year" },
]

function offerToInputDate(dateStr) {
  if (!dateStr) return ""
  return new Date(dateStr).toISOString().split("T")[0]
}

function offerComputePreviewDates(duration, startDate) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (duration) {
    case "today":
      return { start: offerToInputDate(today), end: offerToInputDate(today) }
    case "tomorrow": {
      const t = new Date(today); t.setDate(t.getDate() + 1)
      return { start: offerToInputDate(today), end: offerToInputDate(t) }
    }
    case "7days": {
      const e = new Date(today); e.setDate(e.getDate() + 7)
      return { start: offerToInputDate(today), end: offerToInputDate(e) }
    }
    case "30days": {
      const e = new Date(today); e.setDate(e.getDate() + 30)
      return { start: offerToInputDate(today), end: offerToInputDate(e) }
    }
    case "year": {
      const s = startDate ? new Date(startDate) : today
      const endYear = s.getFullYear()
      return { start: offerToInputDate(s), end: `${endYear}-12-31` }
    }
    case "custom":
    default:
      return { start: startDate || "", end: "" }
  }
}

const EMPTY_OFFER_ADMIN = { title: "", description: "", image: "", duration: "custom", startDate: "", endDate: "" }

function OffersSection({ onNotify }) {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editOffer, setEditOffer] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_OFFER_ADMIN })
  const [selectedFile, setSelectedFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef(null)

  const MAX_IMAGE_BYTES = 5 * 1024 * 1024
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

  async function loadOffers() {
    try { const d = await adminApi.getOffers(); setOffers(Array.isArray(d) ? d : []) }
    catch (err) { onNotify(err.message, "error") }
    finally { setLoading(false) }
  }
  useEffect(() => { loadOffers() }, [])

  function openAdd() {
    setEditOffer(null)
    setSelectedFile(null)
    const preview = offerComputePreviewDates("custom", "")
    setForm({ ...EMPTY_OFFER_ADMIN, ...preview })
    setShowForm(true)
  }

  function openEdit(o) {
    setEditOffer(o)
    setSelectedFile(null)
    const dur = o.duration || "custom"
    const preview = offerComputePreviewDates(dur, offerToInputDate(o.startDate))
    setForm({ title: o.title, description: o.description || "", image: o.image || "", duration: dur, startDate: preview.start, endDate: preview.end })
    setShowForm(true)
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      onNotify("Only JPG, JPEG, PNG, or WEBP images are allowed", "error")
      e.target.value = ""
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onNotify("Image is too large. Maximum size is 5 MB", "error")
      e.target.value = ""
      return
    }
    setSelectedFile(file)
  }

  function handleDurationChange(dur) {
    const preview = offerComputePreviewDates(dur, form.startDate)
    setForm({ ...form, duration: dur, startDate: preview.start, endDate: preview.end })
  }

  async function handleSave(e) {
    e.preventDefault(); if (saving) return
    setSaving(true)
    try {
      if (!editOffer && !selectedFile && !form.image) {
        onNotify("Please select an image for the offer", "error")
        return
      }
      if (editOffer) { await adminApi.updateOffer(editOffer._id, form, selectedFile); onNotify("Offer updated") }
      else { await adminApi.createOffer(form, selectedFile); onNotify("Offer created") }
      setShowForm(false); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; loadOffers()
      localStorage.setItem("offerUpdated", Date.now()); try { new BroadcastChannel("offer-updates").postMessage("refresh") } catch(e){}
    } catch (err) { onNotify(err.message, "error") }
    finally { setSaving(false) }
  }

  async function confirmDeleteOffer() {
    if (!deleteTarget) return
    setDeleting(true)
    try { await adminApi.deleteOffer(deleteTarget._id); setOffers((prev) => prev.filter((o) => o._id !== deleteTarget._id)); onNotify("Offer deleted successfully.")
    localStorage.setItem("offerUpdated", Date.now()); try { new BroadcastChannel("offer-updates").postMessage("refresh") } catch(e){} }
    catch (err) { onNotify(err.message, "error") }
    finally { setDeleting(false); setDeleteTarget(null) }
  }

  const isCustom = form.duration === "custom"
  const isYear = form.duration === "year"
  const hideDates = !isCustom && !isYear

  const adminStatusBadge = (status) => {
    switch (status) {
      case "active": return <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">Active</span>
      case "upcoming": return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">Upcoming</span>
      case "expired": return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">Expired</span>
      default: return null
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={openAdd} className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-espresso hover:bg-gold-hover">+ Add Offer</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleSave} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-lg font-semibold text-espresso">{editOffer ? "Edit Offer" : "Add Offer"}</h3>
            <label className="block"><span className="mb-1 block text-sm text-mocha">Offer Title *</span><input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-latte bg-cream px-4 py-2.5 text-sm text-espresso outline-none focus:border-gold" /></label>
            <label className="block"><span className="mb-1 block text-sm text-mocha">Description</span><textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-latte bg-cream px-4 py-2.5 text-sm text-espresso outline-none focus:border-gold" /></label>
            <label className="block">
              <span className="mb-1 block text-sm text-mocha">Offer Image {!editOffer && <span className="text-red-500">*</span>}</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full border border-latte bg-cream px-4 py-2.5 text-sm font-semibold text-espresso transition hover:border-gold hover:text-gold">Choose Image</button>
                {selectedFile && <span className="text-xs text-mocha">{selectedFile.name}</span>}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} className="hidden" />
              </div>
              {(selectedFile || form.image) && (
                <img src={selectedFile ? URL.createObjectURL(selectedFile) : form.image} alt="Preview" className="mt-2 h-32 w-full rounded-xl border border-latte object-cover" />
              )}
              <p className="mt-1 text-xs text-steam">JPG, PNG, or WEBP — max 5 MB. Uploads automatically to Cloudinary.{editOffer ? " Leave empty to keep the current image." : ""}</p>
            </label>

            <div>
              <span className="mb-2 block text-sm text-mocha">Offer Duration *</span>
              <div className="grid grid-cols-2 gap-2">
                {OFFER_DURATION_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => handleDurationChange(opt.value)} className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition ${form.duration === opt.value ? "bg-gold/15 text-gold ring-1 ring-gold/50" : "bg-cream text-steam hover:text-espresso"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {!hideDates && (
              <div className="grid grid-cols-2 gap-4">
                {(isCustom || isYear) && (
                  <label className="block"><span className="mb-1 block text-sm text-mocha">Start Date *</span><input type="date" required value={form.startDate} onChange={(e) => { if (isYear) { const p = offerComputePreviewDates("year", e.target.value); setForm({ ...form, startDate: p.start, endDate: p.end }) } else { setForm({ ...form, startDate: e.target.value }) } }} className="w-full rounded-xl border border-latte bg-cream px-4 py-2.5 text-sm text-espresso outline-none focus:border-gold" /></label>
                )}
                {isCustom && (
                  <label className="block"><span className="mb-1 block text-sm text-mocha">End Date *</span><input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full rounded-xl border border-latte bg-cream px-4 py-2.5 text-sm text-espresso outline-none focus:border-gold" /></label>
                )}
              </div>
            )}

            {hideDates && (
              <p className="text-xs text-steam">Dates are set automatically. Starts today and expires based on the selected duration.</p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 rounded-full bg-gold py-2.5 text-sm font-semibold text-espresso hover:bg-gold-hover disabled:opacity-50">{saving ? (editOffer ? "Saving..." : "Uploading image...") : editOffer ? "Update" : "Create"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-latte bg-white px-5 py-2.5 text-sm text-mocha hover:text-espresso">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="py-16 text-center text-sm text-steam">Loading offers...</p>
        : offers.length === 0 ? <p className="py-16 text-center text-base text-steam">No offers yet.</p>
        : (
          <div className="space-y-3">
            {offers.map((offer) => {
              const start = new Date(offer.startDate); const end = new Date(offer.endDate)
              const status = offer.status || "active"
              const durLabel = OFFER_DURATION_OPTIONS.find((d) => d.value === offer.duration)?.label || "Custom"
              return (
                <div key={offer._id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-latte">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-espresso">{offer.title}</p>
                      {offer.description && <p className="mt-1 text-sm text-mocha">{offer.description}</p>}
                      <p className="mt-2 text-xs text-steam">{start.toLocaleDateString()} — {end.toLocaleDateString()}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {adminStatusBadge(status)}
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-mocha">{durLabel}</span>
                      </div>
                    </div>
                    {offer.image && <img src={offer.image} alt={offer.title} className="h-16 w-24 rounded-xl object-cover" />}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => openEdit(offer)} className="rounded-full border border-latte bg-white px-3 py-1.5 text-xs font-medium text-mocha hover:border-gold">Edit</button>
                    <button onClick={() => setDeleteTarget(offer)} className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Offer"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        icon="🗑️"
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
        loading={deleting}
        theme="light"
        onConfirm={confirmDeleteOffer}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

/* ============================================================
   LOYALTY
   ============================================================ */
function LoyaltySection({ onNotify }) {
  const [loyaltyTab, setLoyaltyTab] = useState("customers")
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0)

  const fetchPendingClaims = useCallback(async () => {
    try {
      const data = await adminApi.getPendingClaimsCount()
      setPendingClaimsCount(data.count)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchPendingClaims() }, [fetchPendingClaims])

  return (
    <div className="space-y-5">
      <div className="flex gap-1.5 border-b border-latte pb-3">
        <button onClick={() => setLoyaltyTab("customers")} className={`btn-pill-admin px-4 py-2 text-xs font-semibold ${loyaltyTab === "customers" ? "active" : ""}`}>Customers</button>
        <button onClick={() => setLoyaltyTab("claims")} className={`btn-pill-admin px-4 py-2 text-xs font-semibold ${loyaltyTab === "claims" ? "active" : ""}`}>
          Reward Claims {pendingClaimsCount > 0 && <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] text-white ${loyaltyTab === "claims" ? "bg-gold" : "bg-gold"}`}>{pendingClaimsCount}</span>}
        </button>
        <button onClick={() => setLoyaltyTab("history")} className={`btn-pill-admin px-4 py-2 text-xs font-semibold ${loyaltyTab === "history" ? "active" : ""}`}>History</button>
      </div>

      {loyaltyTab === "customers" && <LoyaltyCustomersTab onNotify={onNotify} />}
      {loyaltyTab === "claims" && <LoyaltyClaimsTab onNotify={onNotify} onRefreshCount={fetchPendingClaims} />}
      {loyaltyTab === "history" && <LoyaltyHistoryTab />}
    </div>
  )
}

function LoyaltyCustomersTab({ onNotify }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })
  const [selected, setSelected] = useState(null)
  const [editPoints, setEditPoints] = useState("")
  const [redeemForm, setRedeemForm] = useState({ reward: "", pointsCost: "" })
  const [selectedIds, setSelectedIds] = useState([])
  const [confirmAction, setConfirmAction] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadMembers = useCallback(async () => {
    try {
      const params = { page, limit: 20 }; if (search.trim()) params.search = search.trim()
      const d = await adminApi.getLoyaltyMembers(params); setMembers(d.members || []); setPagination(d.pagination || { total: 0, pages: 1 })
    } catch (err) { onNotify(err.message, "error") }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { loadMembers() }, [loadMembers])

  const pageIds = members.map((m) => m._id)
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id))

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (allPageSelected) return prev.filter((id) => !pageIds.includes(id))
      return [...new Set([...prev, ...pageIds])]
    })
  }

  function clearSelection() {
    setSelectedIds([])
  }

  async function handleDeleteSelected() {
    setDeleting(true)
    try {
      const res = await adminApi.deleteLoyaltyMembers(selectedIds)
      clearSelection()
      setConfirmAction(null)
      onNotify(res.message || `Deleted ${selectedIds.length} customer(s).`)
      loadMembers()
    } catch (err) { onNotify(err.message, "error"); setConfirmAction(null) }
    finally { setDeleting(false) }
  }

  async function handleDeleteAll() {
    setDeleting(true)
    try {
      const res = await adminApi.deleteAllLoyaltyMembers()
      clearSelection()
      setConfirmAction(null)
      onNotify(res.message || "All customers deleted.")
      loadMembers()
    } catch (err) { onNotify(err.message, "error"); setConfirmAction(null) }
    finally { setDeleting(false) }
  }

  async function handleUpdatePoints(phone) {
    const pts = Number(editPoints); if (isNaN(pts) || pts < 0) { onNotify("Invalid points", "error"); return }
    try {
      await adminApi.updateLoyaltyPoints(phone, pts)
      setMembers((prev) => prev.map((m) => (m.phone === phone ? { ...m, loyaltyPoints: pts } : m)))
      if (selected?.phone === phone) setSelected((prev) => ({ ...prev, loyaltyPoints: pts }))
      setEditPoints(""); onNotify("Points updated")
    } catch (err) { onNotify(err.message, "error") }
  }

  async function handleRedeem(phone) {
    if (!redeemForm.reward.trim()) { onNotify("Enter a reward name", "error"); return }
    try {
      const cost = Number(redeemForm.pointsCost) || 0
      await adminApi.redeemReward(phone, redeemForm.reward, cost)
      setMembers((prev) => prev.map((m) => (m.phone === phone ? { ...m, loyaltyPoints: Math.max(0, m.loyaltyPoints - cost), rewardStatus: redeemForm.reward } : m)))
      setRedeemForm({ reward: "", pointsCost: "" }); onNotify("Reward redeemed")
    } catch (err) { onNotify(err.message, "error") }
  }

  const rewardStatusBadge = (status) => {
    switch (status) {
      case "locked": return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">Locked</span>
      case "ready_to_claim": return <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">Ready to Claim</span>
      case "pending_approval": return <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold/80">Pending Approval</span>
      case "redeemed": return <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">Redeemed</span>
      default: return null
    }
  }

  return (
    <div className="space-y-5">
      <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search by name or phone..." className="w-full rounded-xl border border-latte bg-white px-4 py-2.5 text-sm text-espresso outline-none focus:border-gold" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setConfirmAction("deleteAll")}
            className="rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            🗑️ Delete All Customers
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction("deleteSelected")}
            disabled={selectedIds.length === 0}
            className="rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            🗑️ Delete Selected ({selectedIds.length})
          </button>
        </div>
        {members.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectAll}
            className="btn-3d-outline rounded-full border border-latte bg-white px-4 py-2 text-xs font-medium text-espresso"
          >
            {allPageSelected ? "Clear Selection" : "Select All on Page"}
          </button>
        )}
      </div>

      {loading ? <p className="py-16 text-center text-sm text-steam">Loading members...</p>
        : members.length === 0 ? <p className="py-16 text-center text-base text-steam">No loyalty members found.</p>
        : (
          <div className="space-y-3">
            {members.map((m) => {
              const isSelected = selectedIds.includes(m._id)
              return (
              <div key={m._id} className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${isSelected ? "ring-red-400" : "ring-latte"}`}>
                <div className="mb-3 flex items-center gap-3 border-b border-latte pb-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(m._id)}
                    className="h-4 w-4 cursor-pointer rounded border-latte accent-red-600"
                    aria-label={`Select customer ${m.name}`}
                  />
                  <span className="text-xs font-medium text-mocha">
                    {isSelected ? "Selected" : "Select this customer"}
                  </span>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-semibold text-espresso">{m.name}</p>
                    <p className="text-xs text-mocha">{m.phone}</p>
                    <p className="text-xs text-steam mt-1">Orders: {m.totalOrders} &middot; Points: {m.loyaltyPoints}</p>
                    {m.rewardStatus && m.rewardStatus !== "none" && <p className="mt-1 text-xs text-gold">Reward: {m.rewardStatus}</p>}
                    {m.currentRewardStatus && m.currentRewardStatus !== "locked" && (
                      <div className="mt-1">{rewardStatusBadge(m.currentRewardStatus)}</div>
                    )}
                  </div>
                </div>

                {selected?.phone === m.phone ? (
                  <div className="mt-4 space-y-3 border-t border-latte pt-4">
                    <div className="flex gap-2">
                      <input type="number" value={editPoints} onChange={(e) => setEditPoints(e.target.value)} placeholder="New points" min="0" className="flex-1 rounded-xl border border-latte bg-cream px-3 py-2 text-sm text-espresso outline-none focus:border-gold" />
                      <button onClick={() => handleUpdatePoints(m.phone)} className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-espresso hover:bg-gold-hover">Set Points</button>
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={redeemForm.reward} onChange={(e) => setRedeemForm({ ...redeemForm, reward: e.target.value })} placeholder="Reward name" className="flex-1 rounded-xl border border-latte bg-cream px-3 py-2 text-sm text-espresso outline-none focus:border-gold" />
                      <input type="number" value={redeemForm.pointsCost} onChange={(e) => setRedeemForm({ ...redeemForm, pointsCost: e.target.value })} placeholder="Points" min="0" className="w-24 rounded-xl border border-latte bg-cream px-3 py-2 text-sm text-espresso outline-none focus:border-gold" />
                      <button onClick={() => handleRedeem(m.phone)} className="rounded-full bg-burgundy/10 px-4 py-2 text-xs font-semibold text-burgundy hover:bg-burgundy/20">Redeem</button>
                    </div>
                    <button onClick={() => setSelected(null)} className="text-xs text-steam hover:text-espresso">Close</button>
                  </div>
                ) : (
                  <button onClick={() => { setSelected(m); setEditPoints(String(m.loyaltyPoints)); setRedeemForm({ reward: "", pointsCost: "" }) }} className="mt-3 rounded-full border border-latte bg-white px-3 py-1.5 text-xs font-medium text-mocha hover:border-gold">Manage</button>
                )}
              </div>
              )
            })}
          </div>
        )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-3d-outline rounded-full border border-latte bg-white px-4 py-2 text-xs font-medium text-mocha disabled:opacity-40">Previous</button>
          <span className="text-sm text-steam">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="btn-3d-outline rounded-full border border-latte bg-white px-4 py-2 text-xs font-medium text-mocha disabled:opacity-40">Next</button>
        </div>
      )}

      <ConfirmDialog
        open={confirmAction === "deleteSelected"}
        title="Delete selected customers?"
        description={`This will permanently delete ${selectedIds.length} selected customer(s) along with all their orders, loyalty points, and reward history. This action cannot be undone.`}
        icon="🗑️"
        confirmText="Delete Selected"
        loading={deleting}
        theme="light"
        onConfirm={handleDeleteSelected}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction === "deleteAll"}
        title="Delete ALL customers?"
        description="This will permanently delete every customer along with all their orders, loyalty points, and reward history. This action cannot be undone."
        icon="⚠️"
        confirmText="Delete All"
        loading={deleting}
        theme="light"
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}

function LoyaltyClaimsTab({ onNotify, onRefreshCount }) {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)

  const loadClaims = useCallback(async () => {
    try {
      const d = await adminApi.getPendingClaims()
      setClaims(Array.isArray(d) ? d : [])
    } catch (err) { onNotify(err.message, "error") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadClaims() }, [loadClaims])

  useEffect(() => {
    const t = setInterval(() => { loadClaims(); onRefreshCount() }, 10000)
    return () => clearInterval(t)
  }, [loadClaims, onRefreshCount])

  async function handleApprove(id) {
    try {
      await adminApi.approveClaim(id)
      setClaims((prev) => prev.filter((c) => c._id !== id))
      onRefreshCount()
      onNotify("Reward Redeemed Successfully", "success")
    } catch (err) { onNotify(err.message, "error") }
  }

  async function handleReject(id) {
    try {
      await adminApi.rejectClaim(id)
      setClaims((prev) => prev.filter((c) => c._id !== id))
      onRefreshCount()
      onNotify("Claim rejected. Customer can claim again.", "success")
    } catch (err) { onNotify(err.message, "error") }
  }

  if (loading) return <p className="py-16 text-center text-sm text-steam">Loading pending claims...</p>

  if (claims.length === 0) return <p className="py-16 text-center text-base text-steam">No pending reward claims.</p>

  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-latte">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-latte bg-white">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steam">Customer Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steam">Phone</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steam">Reward</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steam">Orders</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steam">Date & Time</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steam">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steam">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-latte bg-white">
          {claims.map((claim) => (
            <tr key={claim._id} className="hover:bg-cream/50">
              <td className="px-4 py-3 font-medium text-espresso">{claim.customerName}</td>
              <td className="px-4 py-3 text-mocha">{claim.phone}</td>
              <td className="px-4 py-3 text-mocha">{claim.rewardName}</td>
              <td className="px-4 py-3 text-mocha">{claim.eligibleOrders}</td>
              <td className="px-4 py-3 text-xs text-steam">{new Date(claim.createdAt).toLocaleString()}</td>
              <td className="px-4 py-3"><span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold/80">Pending</span></td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  <button onClick={() => handleApprove(claim._id)} className="rounded-full bg-green-50 border border-green-200 px-3 py-1 text-[11px] font-medium text-green-700 hover:bg-green-100">Approve</button>
                  <button onClick={() => handleReject(claim._id)} className="rounded-full bg-red-50 border border-red-200 px-3 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100">Reject</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LoyaltyHistoryTab() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })

  useEffect(() => {
    async function load() {
      try {
        const d = await adminApi.getRewardHistory({ page, limit: 20 })
        setHistory(d.history || [])
        setPagination(d.pagination || { total: 0, pages: 1 })
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [page])

  if (loading) return <p className="py-16 text-center text-sm text-steam">Loading reward history...</p>

  if (history.length === 0) return <p className="py-16 text-center text-base text-steam">No reward history yet.</p>

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl ring-1 ring-latte">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-latte bg-white">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steam">Customer Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steam">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steam">Reward Redeemed</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steam">Redemption Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steam">Approved By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-latte bg-white">
            {history.map((h) => (
              <tr key={h._id} className="hover:bg-cream/50">
                <td className="px-4 py-3 font-medium text-espresso">{h.customerName}</td>
                <td className="px-4 py-3 text-mocha">{h.phone}</td>
                <td className="px-4 py-3 text-mocha">{h.rewardName}</td>
                <td className="px-4 py-3 text-xs text-steam">{new Date(h.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-mocha">{h.approvedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-3d-outline rounded-full border border-latte bg-white px-4 py-2 text-xs font-medium text-mocha disabled:opacity-40">Previous</button>
          <span className="text-sm text-steam">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="btn-3d-outline rounded-full border border-latte bg-white px-4 py-2 text-xs font-medium text-mocha disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   KITCHEN
   ============================================================ */
function KitchenSection({ onNotify }) {
  const [status, setStatus] = useState("closed")
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    getKitchenStatus().then((d) => setStatus(d.status)).catch(() => setStatus("closed")).finally(() => setLoading(false))
  }, [])

  async function toggle(newStatus) {
    setToggling(true)
    try {
      const d = await setKitchenStatus(newStatus)
      setStatus(d.status)
      localStorage.setItem("kitchenUpdated", Date.now())
      try { new BroadcastChannel("kitchen-updates").postMessage("refresh") } catch(e){}
      onNotify(newStatus === "open" ? "Kitchen is now Open!" : "Kitchen is now Closed.", "success")
    } catch (err) { onNotify(err.message, "error") }
    finally { setToggling(false) }
  }

  if (loading) return <p className="py-16 text-center text-sm text-steam">Loading...</p>

  return (
    <div className="max-w-lg space-y-6">
      <div className={`rounded-3xl p-8 text-center ring-1 ${status === "open" ? "bg-green-50 ring-green-200" : "bg-red-50 ring-red-200"}`}>
        <div className="mx-auto mb-4 text-5xl">{status === "open" ? "🟢" : "🔴"}</div>
        <h3 className={`font-display text-xl font-bold ${status === "open" ? "text-green-800" : "text-red-800"}`}>
          Kitchen is {status === "open" ? "Open" : "Closed"}
        </h3>
        <p className="mt-2 text-sm text-mocha">
          {status === "open" ? "Customers can browse and place orders." : "Customers can browse but cannot place orders."}
        </p>
      </div>
      <div className="flex gap-4">
        <button onClick={() => toggle("open")} disabled={toggling || status === "open"} className={`btn-3d-flat flex-1 rounded-full py-3 text-sm font-semibold ${status === "open" ? "bg-green-600 text-white shadow-md shadow-green-200" : "border border-green-300 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white"} disabled:opacity-50`}>🟢 Open Kitchen</button>
        <button onClick={() => toggle("closed")} disabled={toggling || status === "closed"} className={`btn-3d-flat flex-1 rounded-full py-3 text-sm font-semibold ${status === "closed" ? "bg-red-600 text-white shadow-md shadow-red-200" : "border border-red-300 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white"} disabled:opacity-50`}>🔴 Close Kitchen</button>
      </div>
    </div>
  )
}

/* ============================================================
   CUSTOMERS
   ============================================================ */
function CustomersSection({ onNotify }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })
  const [selectedIds, setSelectedIds] = useState([])
  const [confirmAction, setConfirmAction] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      const params = { page, limit: 20 }; if (search.trim()) params.search = search.trim()
      const d = await adminApi.getCustomers(params); setCustomers(d.members || []); setPagination(d.pagination || { total: 0, pages: 1 })
    } catch (err) { onNotify(err.message, "error") }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const pageIds = customers.map((c) => c._id)
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id))

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (allPageSelected) return prev.filter((id) => !pageIds.includes(id))
      return [...new Set([...prev, ...pageIds])]
    })
  }

  function clearSelection() {
    setSelectedIds([])
  }

  async function handleDeleteSelected() {
    setDeleting(true)
    try {
      const res = await adminApi.deleteLoyaltyMembers(selectedIds)
      clearSelection()
      setConfirmAction(null)
      onNotify(res.message || `Deleted ${selectedIds.length} customer(s).`)
      load()
    } catch (err) { onNotify(err.message, "error"); setConfirmAction(null) }
    finally { setDeleting(false) }
  }

  async function handleDeleteAll() {
    setDeleting(true)
    try {
      const res = await adminApi.deleteAllLoyaltyMembers()
      clearSelection()
      setConfirmAction(null)
      onNotify(res.message || "All customers deleted.")
      load()
    } catch (err) { onNotify(err.message, "error"); setConfirmAction(null) }
    finally { setDeleting(false) }
  }

  return (
    <div className="space-y-5">
      <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search by name or phone..." className="w-full rounded-xl border border-latte bg-white px-4 py-2.5 text-sm text-espresso outline-none focus:border-gold" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setConfirmAction("deleteAll")}
            className="rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            🗑️ Delete All Customers
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction("deleteSelected")}
            disabled={selectedIds.length === 0}
            className="rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            🗑️ Delete Selected ({selectedIds.length})
          </button>
        </div>
        {customers.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectAll}
            className="btn-3d-outline rounded-full border border-latte bg-white px-4 py-2 text-xs font-medium text-espresso"
          >
            {allPageSelected ? "Clear Selection" : "Select All on Page"}
          </button>
        )}
      </div>

      {loading ? <p className="py-16 text-center text-sm text-steam">Loading customers...</p>
        : customers.length === 0 ? <p className="py-16 text-center text-base text-steam">No customers found.</p>
        : (
          <div className="overflow-x-auto rounded-2xl ring-1 ring-latte">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-latte bg-white">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-steam">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 cursor-pointer rounded border-latte accent-red-600"
                    aria-label="Select all customers on page"
                  />
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-steam">Name</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-steam">Phone</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-steam">Total Orders</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-steam">Loyalty Points</th>
              </tr></thead>
              <tbody className="divide-y divide-latte bg-white">
                {customers.map((c) => (
                  <tr key={c._id} className={`hover:bg-cream/50 ${selectedIds.includes(c._id) ? "bg-red-50" : ""}`}>
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c._id)}
                        onChange={() => toggleSelect(c._id)}
                        className="h-4 w-4 cursor-pointer rounded border-latte accent-red-600"
                        aria-label={`Select customer ${c.name}`}
                      />
                    </td>
                    <td className="px-5 py-3 font-medium text-espresso">{c.name}</td>
                    <td className="px-5 py-3 text-mocha">{c.phone}</td>
                    <td className="px-5 py-3 text-mocha">{c.totalOrders}</td>
                    <td className="px-5 py-3"><span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-semibold text-gold">{c.loyaltyPoints}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-3d-outline rounded-full border border-latte bg-white px-4 py-2 text-xs font-medium text-mocha disabled:opacity-40">Previous</button>
          <span className="text-sm text-steam">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="btn-3d-outline rounded-full border border-latte bg-white px-4 py-2 text-xs font-medium text-mocha disabled:opacity-40">Next</button>
        </div>
      )}

      <ConfirmDialog
        open={confirmAction === "deleteSelected"}
        title="Delete selected customers?"
        description={`This will permanently delete ${selectedIds.length} selected customer(s) along with all their orders, loyalty points, and reward history. This action cannot be undone.`}
        icon="🗑️"
        confirmText="Delete Selected"
        loading={deleting}
        theme="light"
        onConfirm={handleDeleteSelected}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction === "deleteAll"}
        title="Delete ALL customers?"
        description="This will permanently delete every customer along with all their orders, loyalty points, and reward history. This action cannot be undone."
        icon="⚠️"
        confirmText="Delete All"
        loading={deleting}
        theme="light"
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}

/* ============================================================
   LOYALTY
   ============================================================ */
const NOTIF_ICON = {
  new_order: "🛒",
  loyalty_redeemed: "⭐",
  kitchen_closed: "🔴",
  offer_expired: "⏰",
  reward_claim: "🎁",
}

function parseNotifMessage(message) {
  const parts = []
  const regex = /([A-Z][a-z]+(?: [A-Z][a-z]+)*)|(ORD-\S+)|(₹\d+)|(".*?")/g
  let last = 0
  let match
  while ((match = regex.exec(message)) !== null) {
    if (match.index > last) parts.push({ text: message.slice(last, match.index), type: "normal" })
    if (match[1]) parts.push({ text: match[1], type: "name" })
    else if (match[2]) parts.push({ text: match[2], type: "id" })
    else if (match[3]) parts.push({ text: match[3], type: "amount" })
    else if (match[4]) parts.push({ text: match[4], type: "status" })
    else parts.push({ text: match[0], type: "normal" })
    last = match.index + match[0].length
  }
  if (last < message.length) parts.push({ text: message.slice(last), type: "normal" })
  return parts
}

function renderMessage(message) {
  const parts = parseNotifMessage(message)
  return parts.map((p, i) => {
    if (p.type === "name") return <span key={i} className="font-bold text-burgundy">{p.text}</span>
    if (p.type === "id") return <span key={i} className="font-mono font-semibold text-gold">{p.text}</span>
    if (p.type === "amount") return <span key={i} className="font-bold text-green-700">{p.text}</span>
    if (p.type === "status") return <span key={i} className="font-semibold text-blue-700">{p.text}</span>
    return <span key={i}>{p.text}</span>
  })
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function NotificationsSection({ onNotify, onRefreshCount }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [showClearAll, setShowClearAll] = useState(false)
  const [clearingAll, setClearingAll] = useState(false)

  const load = useCallback(async () => {
    try {
      const params = filter === "unread" ? { unread: "true" } : {}
      const d = await adminApi.getNotifications(params); setNotifications(Array.isArray(d) ? d : [])
    } catch (err) { onNotify(err.message, "error") }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function markRead(id) {
    try { await adminApi.markNotificationRead(id); setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n))); onRefreshCount() }
    catch (err) { onNotify(err.message, "error") }
  }

  async function markAllRead() {
    try { await adminApi.markAllRead(); setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))); onRefreshCount(); onNotify("All marked as read") }
    catch (err) { onNotify(err.message, "error") }
  }

  async function confirmClearAll() {
    setClearingAll(true)
    try { await adminApi.clearAllNotifications(); setNotifications([]); onRefreshCount(); onNotify("All notifications cleared") }
    catch (err) { onNotify(err.message, "error") }
    finally { setClearingAll(false); setShowClearAll(false) }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {["all", "unread"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${filter === f ? "bg-gold text-espresso" : "bg-white border border-latte text-mocha hover:border-gold"}`}>{f}{f === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}</button>
          ))}
        </div>
        <div className="flex-1" />
        {unreadCount > 0 && <button onClick={markAllRead} className="rounded-full border border-latte bg-white px-3 py-1.5 text-xs font-medium text-mocha hover:border-gold">Mark all read</button>}
        <button onClick={() => setShowClearAll(true)} className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">Clear all</button>
      </div>

      {loading ? <p className="py-16 text-center text-sm text-steam">Loading notifications...</p>
        : notifications.length === 0 ? <p className="py-16 text-center text-base text-steam">No notifications yet.</p>
        : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const dt = new Date(n.createdAt)
              return (
                <button
                  key={n._id}
                  onClick={() => { if (!n.read) markRead(n._id) }}
                  className={`w-full text-left flex items-start gap-3 rounded-2xl p-4 transition-all duration-200 cursor-pointer ${
                    n.read
                      ? "bg-white border border-latte/60 hover:border-latte"
                      : "bg-gradient-to-br from-gold/5 via-gold/10 to-gold/5 border-2 border-gold/30 hover:border-gold shadow-md"
                  }`}
                >
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${
                    n.read ? "bg-cream" : "bg-gold/10 ring-2 ring-gold/30"
                  }`}>
                    {NOTIF_ICON[n.type] || "📌"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${n.read ? "font-medium text-espresso" : "font-bold text-espresso"}`}>{n.title}</p>
                      {!n.read && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-gold animate-pulse" />}
                    </div>
                    <p className={`mt-1 text-[13px] leading-relaxed ${n.read ? "text-mocha font-medium" : "text-mocha font-semibold"}`}>
                      {renderMessage(n.message)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`text-[11px] font-medium ${n.read ? "text-steam" : "text-gold/80"}`}>{timeAgo(n.createdAt)}</span>
                      <span className="text-[10px] text-steam">&middot;</span>
                      <span className={`text-[11px] font-medium ${n.read ? "text-steam" : "text-mocha"}`}>{dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at {dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

      <ConfirmDialog
        open={showClearAll}
        title="Clear All Notifications"
        description="Are you sure you want to clear all notifications? This action cannot be undone."
        icon="🧹"
        confirmText="Clear All"
        cancelText="Cancel"
        confirmColor="red"
        loading={clearingAll}
        theme="light"
        onConfirm={confirmClearAll}
        onCancel={() => setShowClearAll(false)}
      />
    </div>
  )
}

export default Admin
