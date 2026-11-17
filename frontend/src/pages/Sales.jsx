import { useEffect, useState, useCallback } from "react"
import { getOrders, getSalesStats, deleteOrders, deleteAllOrders, exportSalesToExcel } from "../api"
import { formatPrice } from "../price"
import ConfirmDialog from "../components/ConfirmDialog"
import { adminApi } from "../adminApi"
import {
  isAdminUnlocked,
  unlockAdmin,
  lockAdmin,
} from "../adminAuth"

const FILTERS = [
  { key: "today", label: "Today" },
  { key: "thisWeek", label: "This Week" },
  { key: "thisMonth", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "thisYear", label: "This Year" },
  { key: "custom", label: "Custom" },
]

function Sales() {
  const [unlocked, setUnlocked] = useState(() => isAdminUnlocked())
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loggingIn, setLoggingIn] = useState(false)

  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [activeFilter, setActiveFilter] = useState("thisMonth")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState("")
  const [exportSuccess, setExportSuccess] = useState("")

  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })

  const [selectedIds, setSelectedIds] = useState([])
  const [confirmAction, setConfirmAction] = useState(null)
  const [deleting, setDeleting] = useState(false)

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
  }

  const loadData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true)
    try {
      const params = { page, limit: 50 }
      if (activeFilter !== "custom" && activeFilter !== "all") {
        params.filter = activeFilter
      }
      if (activeFilter === "custom") {
        if (customFrom) params.from = customFrom
        if (customTo) params.to = customTo
      }
      if (search.trim()) params.search = search.trim()

      const [ordersRes, statsRes] = await Promise.all([
        getOrders(params),
        getSalesStats(params),
      ])

      setOrders(ordersRes.orders || [])
      setPagination(ordersRes.pagination || { page: 1, pages: 1, total: 0 })
      setStats(statsRes)
      setError("")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, activeFilter, customFrom, customTo, search])

  useEffect(() => {
    if (!unlocked) return
    loadData(true)
  }, [unlocked, loadData])

  useEffect(() => {
    if (!unlocked) return
    const timer = setInterval(() => loadData(false), 10000)
    return () => clearInterval(timer)
  }, [unlocked, loadData])

  function handleFilterChange(key) {
    setActiveFilter(key)
    setPage(1)
    setSearch("")
    setSearchInput("")
  }

  function handleSearch(e) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  function handleCustomDateLoad() {
    setPage(1)
    loadData(true)
  }

  async function handleExport() {
    setExportError("")
    setExportSuccess("")
    if (activeFilter === "custom" && (!customFrom || !customTo || customFrom > customTo)) {
      setExportError("Please select a valid date range.")
      return
    }
    setExporting(true)
    try {
      await exportSalesToExcel({
        filter: activeFilter !== "custom" ? activeFilter : undefined,
        from: activeFilter === "custom" ? customFrom : undefined,
        to: activeFilter === "custom" ? customTo : undefined,
      })
      setExportSuccess("Sales report downloaded.")
    } catch (err) {
      setExportError(err.message || "Unable to generate sales report. Please try again.")
    } finally {
      setExporting(false)
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

  function clearSelection() {
    setSelectedIds([])
  }

  async function handleDeleteSelected() {
    setDeleting(true)
    try {
      await deleteOrders(selectedIds)
      clearSelection()
      setConfirmAction(null)
      loadData(true)
    } catch (err) {
      setError(err.message)
      setConfirmAction(null)
    } finally {
      setDeleting(false)
    }
  }

  async function handleDeleteAll() {
    setDeleting(true)
    try {
      await deleteAllOrders()
      clearSelection()
      setConfirmAction(null)
      loadData(true)
    } catch (err) {
      setError(err.message)
      setConfirmAction(null)
    } finally {
      setDeleting(false)
    }
  }

  if (!unlocked) {
    return (
      <main className="flex flex-1 flex-col bg-cream">
        <section className="relative overflow-hidden bg-espresso-deep pt-16 pb-14 sm:pt-20">
          <div className="absolute inset-0 bg-gradient-to-r from-espresso-deep via-espresso-deep/90 to-mocha/40" />
          <div className="relative z-10 mx-auto max-w-7xl px-5 text-center sm:px-6">
            <h1 className="font-display text-3xl font-semibold text-white sm:text-5xl">
              Cafe <span className="italic text-gold">Sales</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/75 sm:text-base">
              Enter your credentials to view sales dashboard.
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
              className="btn-3d-gold-sm w-full rounded-full py-3 text-sm sm:text-base"
            >
              {loggingIn ? "Signing in…" : "Unlock Sales"}
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main>
      <section className="relative overflow-hidden bg-espresso-deep pt-14 pb-10 sm:pt-20 sm:pb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-espresso-deep via-espresso-deep/90 to-mocha/40" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-semibold text-white sm:text-5xl">
            Sales <span className="italic text-gold">Dashboard</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/75 sm:text-base">
            Revenue, orders, and top-selling items.
          </p>
        </div>
      </section>

      <section className="bg-cream px-5 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">

          <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-steam sm:text-sm">
              All orders are permanently stored.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction("deleteAll")}
                className="btn-3d-outline rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-50 sm:text-sm"
              >
                🗑️ Delete All
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction("deleteSelected")}
                disabled={selectedIds.length === 0}
                className="btn-3d-outline rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              >
                🗑️ Delete Selected ({selectedIds.length})
              </button>
              <button
                type="button"
                onClick={() => loadData(true)}
                className="btn-3d-outline rounded-full border border-latte bg-white px-4 py-2 text-xs font-medium text-espresso sm:text-sm"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-3d-outline rounded-full border border-latte bg-white px-4 py-2 text-xs font-medium text-steam sm:text-sm"
              >
                Lock
              </button>
            </div>
          </div>

          {/* Filter buttons */}
          <div className="mb-5 flex flex-wrap gap-2 sm:mb-6">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => handleFilterChange(f.key)}
                className={`btn-pill-admin px-4 py-2 text-xs sm:text-sm ${
                  activeFilter === f.key ? "active" : ""
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Export — works with the active filter (today / this week / this
              month / last month) or the custom From/To range. */}
          <div className="mb-5 sm:mb-6">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="btn-3d-gold-sm rounded-full px-5 py-2.5 text-xs font-semibold sm:text-sm"
            >
              {exporting ? "Generating Report..." : "📊 Export Sales to Excel"}
            </button>
          </div>

          {exportError && (
            <p className="mb-5 text-sm text-red-700">{exportError}</p>
          )}
          {exportSuccess && (
            <p className="mb-5 text-sm text-green-700">{exportSuccess}</p>
          )}

          {/* Custom date range */}
          {activeFilter === "custom" && (
            <div className="mb-5 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:mb-6 sm:flex-row sm:items-end sm:rounded-3xl sm:p-5">
              <label className="flex-1">
                <span className="mb-1 block text-xs text-mocha sm:text-sm">From</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full rounded-xl border border-latte bg-cream px-3 py-2.5 text-sm outline-none focus:border-gold sm:text-base"
                />
              </label>
              <label className="flex-1">
                <span className="mb-1 block text-xs text-mocha sm:text-sm">To</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full rounded-xl border border-latte bg-cream px-3 py-2.5 text-sm outline-none focus:border-gold sm:text-base"
                />
              </label>
              <button
                type="button"
                onClick={handleCustomDateLoad}
                disabled={!customFrom && !customTo}
                className="btn-pill-admin active px-5 py-2.5 text-xs font-semibold sm:text-sm"
              >
                Apply
              </button>
            </div>
          )}

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mb-5 sm:mb-6">
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by Order ID, Name, or Phone..."
                className="min-w-0 flex-1 rounded-xl border border-latte bg-white px-4 py-2.5 text-sm outline-none focus:border-gold sm:text-base"
              />
              <button
                type="submit"
                className="btn-3d-outline shrink-0 rounded-full border border-latte bg-white px-4 py-2.5 text-xs font-medium text-espresso sm:text-sm"
              >
                Search
              </button>
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setSearchInput(""); setPage(1) }}
                  className="btn-3d-outline shrink-0 rounded-full border border-latte bg-white px-4 py-2.5 text-xs font-medium text-steam sm:text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {/* Summary cards */}
          {!loading && !error && stats && (
            <div className="mb-6 grid grid-cols-2 gap-2 sm:mb-8 sm:grid-cols-4 sm:gap-3">
              <div className="rounded-xl bg-white px-3 py-3 shadow-sm sm:rounded-2xl sm:px-5 sm:py-4">
                <p className="text-[10px] uppercase tracking-wide text-steam sm:text-xs">
                  Revenue
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-espresso sm:text-2xl">
                  ₹{formatPrice(stats.totalRevenue)}
                </p>
              </div>
              <div className="rounded-xl bg-white px-3 py-3 shadow-sm sm:rounded-2xl sm:px-5 sm:py-4">
                <p className="text-[10px] uppercase tracking-wide text-steam sm:text-xs">
                  Completed
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-espresso sm:text-2xl">
                  {stats.totalOrders}
                </p>
              </div>
              <div className="rounded-xl bg-white px-3 py-3 shadow-sm sm:rounded-2xl sm:px-5 sm:py-4">
                <p className="text-[10px] uppercase tracking-wide text-steam sm:text-xs">
                  Cancelled
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-espresso sm:text-2xl">
                  {stats.cancelledOrders}
                </p>
              </div>
              <div className="rounded-xl bg-white px-3 py-3 shadow-sm sm:rounded-2xl sm:px-5 sm:py-4">
                <p className="text-[10px] uppercase tracking-wide text-steam sm:text-xs">
                  Total Orders
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-espresso sm:text-2xl">
                  {pagination.total}
                </p>
              </div>
            </div>
          )}

          {/* Top selling items */}
          {!loading && !error && stats && stats.topSellingItems && stats.topSellingItems.length > 0 && (
            <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm sm:mb-8 sm:rounded-3xl sm:p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-steam sm:text-sm">
                Top Selling Items
              </h3>
              <div className="space-y-2">
                {stats.topSellingItems.map((item, i) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-xl bg-cream px-3 py-2.5 text-xs sm:px-4 sm:py-3 sm:text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-espresso">
                        {i + 1}
                      </span>
                      <span className="font-medium text-espresso">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-espresso">{item.quantity} sold</span>
                      <span className="ml-2 text-steam">₹{formatPrice(item.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Peak hours & best day analytics */}
          {!loading && !error && stats && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 sm:gap-5">
              <PeakHoursCard peakHours={stats.peakHours || []} />
              <BestDayCard
                bestDay={stats.bestDay || null}
                dayBreakdown={stats.dayBreakdown || []}
              />
            </div>
          )}

          {loading && (
            <p className="py-16 text-center text-sm text-steam">Loading sales...</p>
          )}

          {!loading && error && (
            <p className="py-16 text-center text-sm text-red-700">
              {error}. Is the backend running on port 5000?
            </p>
          )}

          {!loading && !error && orders.length === 0 && (
            <p className="py-16 text-center text-base text-steam sm:text-lg">
              No orders found for this filter.
            </p>
          )}

          {!loading && !error && orders.length > 0 && (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                <p className="text-xs text-steam sm:text-sm">
                  Showing {orders.length} of {pagination.total} orders
                </p>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="btn-3d-outline rounded-full border border-latte bg-white px-4 py-2 text-xs font-medium text-espresso sm:text-sm"
                >
                  {allPageSelected ? "Clear Selection" : "Select All on Page"}
                </button>
              </div>

              <ul className="space-y-4 sm:space-y-5">
                {orders.map((order) => {
                  const isSelected = selectedIds.includes(order._id)
                  return (
                    <li
                      key={order._id}
                      className={`rounded-2xl bg-white px-4 py-4 shadow-sm transition sm:rounded-3xl sm:px-6 sm:py-5 ${
                        isSelected ? "ring-2 ring-red-400" : ""
                      }`}
                    >
                      <div className="mb-3 flex items-center gap-3 border-b border-latte pb-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(order._id)}
                          className="h-4 w-4 cursor-pointer rounded border-latte accent-red-600"
                          aria-label={`Select order ${order.orderId}`}
                        />
                        <span className="text-xs font-medium text-mocha sm:text-sm">
                          {isSelected ? "Selected" : "Select this order"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                      <div>
                        <p className="font-display text-lg font-semibold text-espresso sm:text-xl">
                          {order.customerName}
                        </p>
                        {order.phoneNumber && (
                          <p className="mt-0.5 text-xs font-medium text-mocha sm:text-sm">
                            📞 {order.phoneNumber}
                          </p>
                        )}
                        {order.tableNumber && (
                          <p className="mt-0.5 inline-flex rounded-md border border-gold/40 bg-gold/10 px-2 py-0.5 text-xs font-bold text-gold sm:text-sm">
                            🪑 Table {order.tableNumber}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-steam sm:text-xs">
                          {order.orderId} &middot; {new Date(order.createdAt).toLocaleString()}
                        </p>
                        <p
                          className={`mt-1 text-[10px] capitalize sm:text-xs ${
                            order.status === "completed"
                              ? "text-green-700"
                              : order.status === "cancelled"
                                ? "text-red-700"
                                : "text-mocha"
                          }`}
                        >
                          {order.status}
                        </p>
                      </div>
                      <p className="text-base font-bold text-espresso sm:text-lg">
                        ₹{formatPrice(order.total)}
                      </p>
                    </div>

                    <ul className="mt-3 space-y-1 border-t border-latte pt-3 text-xs text-mocha sm:mt-4 sm:text-sm">
                      {order.items.map((item, index) => (
                        <li key={`${order._id}-${index}`}>
                          {item.quantity}× {item.name} — ₹
                          {formatPrice(item.price * item.quantity)}
                        </li>
                      ))}
                    </ul>
                  </li>
                  )
                })}
              </ul>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2 sm:mt-8">
                  <button
                    type="button"
                    onClick={() => { setPage((p) => Math.max(1, p - 1)); setLoading(true) }}
                    disabled={page <= 1}
                    className="btn-3d-outline rounded-full border border-latte bg-white px-4 py-2 text-xs font-medium text-espresso sm:text-sm"
                  >
                    Previous
                  </button>
                  <span className="px-3 text-xs text-steam sm:text-sm">
                    Page {page} of {pagination.pages}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setPage((p) => Math.min(pagination.pages, p + 1)); setLoading(true) }}
                    disabled={page >= pagination.pages}
                    className="btn-3d-outline rounded-full border border-latte bg-white px-4 py-2 text-xs font-medium text-espresso sm:text-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

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
        description="This will permanently delete every order in the database. This action cannot be undone."
        icon="⚠️"
        confirmText="Delete All"
        loading={deleting}
        theme="light"
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmAction(null)}
      />
    </main>
  )
}

function PeakHoursCard({ peakHours }) {
  const top = peakHours.slice(0, 6)
  const max = top.length ? top[0].orders : 0
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-steam sm:text-sm">
        Peak Hours
      </h3>
      {peakHours.length === 0 ? (
        <p className="py-8 text-center text-sm text-steam">No completed orders yet</p>
      ) : (
        <>
          <div className="space-y-3">
            {top.map((row, i) => {
              const isTop = i === 0
              const pct = max > 0 ? Math.max(8, Math.round((row.orders / max) * 100)) : 0
              return (
                <div key={row.hour}>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className={isTop ? "font-bold text-gold" : "font-medium text-mocha"}>
                      {isTop && "🔥 "}
                      {row.hour}
                    </span>
                    <span className={isTop ? "font-bold text-espresso" : "text-steam"}>
                      {row.orders} {row.orders === 1 ? "order" : "orders"}
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-cream">
                    <div
                      className={`h-full rounded-full ${isTop ? "bg-gold" : "bg-gold/40"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 rounded-xl bg-gold/10 px-4 py-3 ring-1 ring-gold/30">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">
              🔥 Peak Hour
            </p>
            <p className="mt-0.5 font-display text-lg font-semibold text-espresso">
              {peakHours[0].hour}
            </p>
            <p className="text-xs text-mocha">
              {peakHours[0].orders} completed{" "}
              {peakHours[0].orders === 1 ? "order" : "orders"}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function BestDayCard({ bestDay, dayBreakdown }) {
  const maxSales = dayBreakdown.length
    ? Math.max(...dayBreakdown.map((d) => d.sales))
    : 0
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-steam sm:text-sm">
        Best Day
      </h3>
      {!bestDay || bestDay.sales === 0 ? (
        <p className="py-8 text-center text-sm text-steam">No sales data available</p>
      ) : (
        <>
          <div className="rounded-xl bg-gold/10 px-4 py-3 ring-1 ring-gold/30">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">
              🏆 Best Day
            </p>
            <p className="mt-0.5 font-display text-xl font-bold text-espresso">
              {bestDay.day}
            </p>
            <p className="text-xs text-mocha">
              ₹{formatPrice(bestDay.sales)} sales · {bestDay.orders}{" "}
              {bestDay.orders === 1 ? "order" : "orders"}
            </p>
          </div>

          {dayBreakdown.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {dayBreakdown.map((d) => {
                const pct = maxSales > 0 ? Math.max(6, Math.round((d.sales / maxSales) * 100)) : 0
                const isBest = d.day === bestDay.day
                return (
                  <div key={d.day} className="flex items-center gap-2 text-xs sm:text-sm">
                    <span
                      className={`w-12 shrink-0 text-right ${
                        isBest ? "font-bold text-gold" : "text-steam"
                      }`}
                    >
                      {d.day.slice(0, 3)}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream">
                      <div
                        className={`h-full rounded-full ${isBest ? "bg-gold" : "bg-gold/40"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span
                      className={`w-14 shrink-0 text-right ${
                        isBest ? "font-semibold text-espresso" : "text-steam"
                      }`}
                    >
                      ₹{formatPrice(d.sales)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Sales
