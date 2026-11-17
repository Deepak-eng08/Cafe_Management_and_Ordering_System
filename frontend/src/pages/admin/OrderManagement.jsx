import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../adminApi";
import { deleteOrders, deleteAllOrders } from "../../api";
import { formatPrice } from "../../price";
import ConfirmDialog from "../../components/ConfirmDialog";

const STATUS_COLORS = {
  pending: "bg-gold/10 text-gold ring-gold/20",
  preparing: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  ready: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  completed: "bg-gray-500/10 text-gray-400 ring-gray-500/20",
  cancelled: "bg-red-500/10 text-red-400 ring-red-500/20",
};

const STATUS_OPTIONS = ["pending", "preparing", "ready", "completed", "cancelled"];
const FILTER_OPTIONS = ["all", "pending", "preparing", "ready", "completed", "cancelled"];

export default function OrderManagement({ onNotify }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      const data = await adminApi.getAllOrders(params);
      let list = data.orders || [];
      if (filter !== "all") {
        list = list.filter((o) => o.status === filter);
      }
      setOrders(list);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    const timer = setInterval(loadOrders, 8000);
    return () => clearInterval(timer);
  }, [loadOrders]);

  async function handleStatusChange(orderId, status) {
    try {
      await adminApi.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
      onNotify(`Order updated to "${status}"`);
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  const pageIds = orders.map((o) => o._id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (allPageSelected) return prev.filter((id) => !pageIds.includes(id));
      return [...new Set([...prev, ...pageIds])];
    });
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function handleDeleteSelected() {
    setDeleting(true);
    try {
      await deleteOrders(selectedIds);
      clearSelection();
      setConfirmAction(null);
      onNotify(`Deleted ${selectedIds.length} order(s).`);
      loadOrders();
    } catch (err) {
      onNotify(err.message, "error");
      setConfirmAction(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteAll() {
    setDeleting(true);
    try {
      await deleteAllOrders();
      clearSelection();
      setConfirmAction(null);
      onNotify("All orders deleted.");
      loadOrders();
    } catch (err) {
      onNotify(err.message, "error");
      setConfirmAction(null);
    } finally {
      setDeleting(false);
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
          className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-gold"
        />
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition ${
                filter === f ? "bg-gold text-gray-950" : "bg-gray-800 text-gray-400 hover:text-white"
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
            className="btn-3d-flat rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20"
          >
            🗑️ Delete All Orders
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction("deleteSelected")}
            disabled={selectedIds.length === 0}
            className="btn-3d-flat rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            🗑️ Delete Selected ({selectedIds.length})
          </button>
        </div>
        {orders.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectAll}
            className="btn-3d-flat rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-xs font-medium text-gray-300 hover:text-white"
          >
            {allPageSelected ? "Clear Selection" : "Select All on Page"}
          </button>
        )}
      </div>

      {loading ? (
        <p className="py-16 text-center text-gray-500">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="py-16 text-center text-gray-500">No orders found.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isSelected = selectedIds.includes(order._id);
            return (
            <div key={order._id} className={`rounded-2xl bg-gray-900 border p-5 transition ${isSelected ? "border-red-500/60" : "border-gray-800"}`}>
              <div className="mb-3 flex items-center gap-3 border-b border-gray-800 pb-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(order._id)}
                  className="h-4 w-4 cursor-pointer rounded border-gray-600 bg-gray-800 accent-red-500"
                  aria-label={`Select order ${order.orderId}`}
                />
                <span className="text-xs font-medium text-gray-400">
                  {isSelected ? "Selected" : "Select this order"}
                </span>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{order.customerName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{order.phoneNumber}</p>
                  <p className="text-xs text-gray-500 mt-1">{order.orderId} &middot; {new Date(order.createdAt).toLocaleString()}</p>
                  <span className={`mt-2 inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 capitalize ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-lg font-bold text-white">₹{formatPrice(order.total)}</p>
              </div>

              <div className="mt-3 border-t border-gray-800 pt-3">
                <ul className="space-y-1 text-sm text-gray-400">
                  {order.items.map((item, i) => (
                    <li key={i}>{item.quantity}x {item.name} — ₹{formatPrice(item.price * item.quantity)}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(order._id, s)}
                    disabled={order.status === s || order.status === "completed" || order.status === "cancelled"}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                      order.status === s
                        ? "bg-gold text-gray-950"
                        : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                    } disabled:opacity-50`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-3d-flat rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-400"
          >Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {pagination.pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page >= pagination.pages}
            className="btn-3d-flat rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-400"
          >Next</button>
        </div>
      )}

      <ConfirmDialog
        open={confirmAction === "deleteSelected"}
        title="Delete selected orders?"
        description={`This will permanently delete ${selectedIds.length} selected order(s). This action cannot be undone.`}
        icon="🗑️"
        confirmText="Delete Selected"
        loading={deleting}
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
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
