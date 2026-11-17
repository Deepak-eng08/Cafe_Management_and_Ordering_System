import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../adminApi";
import ConfirmDialog from "../../components/ConfirmDialog";

const NOTIFICATION_ICONS = {
  new_order: "🛒",
  loyalty_redeemed: "⭐",
  kitchen_closed: "🔴",
  offer_expired: "⏰",
};

export default function NotificationsSection({ onNotify, onRefreshCount }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showClearAll, setShowClearAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const params = filter === "unread" ? { unread: "true" } : {};
      const data = await adminApi.getNotifications(params);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  async function markRead(id) {
    try {
      await adminApi.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      onRefreshCount();
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  async function markAllRead() {
    try {
      await adminApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      onRefreshCount();
      onNotify("All notifications marked as read");
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  async function confirmDeleteSingle() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteNotification(deleteTarget._id);
      setNotifications((prev) => prev.filter((n) => n._id !== deleteTarget._id));
      onRefreshCount();
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  async function confirmClearAll() {
    setClearingAll(true);
    try {
      await adminApi.clearAllNotifications();
      setNotifications([]);
      onRefreshCount();
      onNotify("All notifications cleared");
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setClearingAll(false);
      setShowClearAll(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {["all", "unread"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn-3d-flat rounded-lg px-3 py-2 text-xs font-medium capitalize ${
                filter === f ? "bg-gold text-gray-950" : "bg-gray-800 text-gray-400"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={markAllRead} className="btn-3d-flat rounded-lg bg-gray-800 px-3 py-2 text-xs text-gray-400">Mark all read</button>
        <button onClick={() => setShowClearAll(true)} className="btn-3d-flat rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">Clear all</button>
      </div>

      {loading ? (
        <p className="py-16 text-center text-gray-500">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="py-16 text-center text-gray-500">No notifications.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                n.read
                  ? "bg-gray-900 border-gray-800"
                  : "bg-gray-900/80 border-gold/20"
              }`}
            >
              <span className="text-xl">{NOTIFICATION_ICONS[n.type] || "📌"}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${n.read ? "text-gray-400" : "text-white"}`}>{n.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{n.message}</p>
                <p className="mt-1 text-xs text-gray-600">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-1.5">
                {!n.read && (
                  <button onClick={() => markRead(n._id)} className="btn-3d-flat rounded-lg bg-gray-800 px-2 py-1 text-xs text-gray-400">Read</button>
                )}
                <button onClick={() => setDeleteTarget(n)} className="btn-3d-flat rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-400">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Notification"
        description="Are you sure you want to delete this notification? This action cannot be undone."
        icon="🗑️"
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
        loading={deleting}
        onConfirm={confirmDeleteSingle}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={showClearAll}
        title="Clear All Notifications"
        description="Are you sure you want to clear all notifications? This action cannot be undone."
        icon="🧹"
        confirmText="Clear All"
        cancelText="Cancel"
        confirmColor="red"
        loading={clearingAll}
        onConfirm={confirmClearAll}
        onCancel={() => setShowClearAll(false)}
      />
    </div>
  );
}
