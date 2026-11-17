import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../adminApi";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function CustomerManagement({ onNotify }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      const data = await adminApi.getCustomers(params);
      setCustomers(data.members || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const pageIds = customers.map((c) => c._id);
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
      const res = await adminApi.deleteLoyaltyMembers(selectedIds);
      clearSelection();
      setConfirmAction(null);
      onNotify(res.message || `Deleted ${selectedIds.length} customer(s).`);
      loadCustomers();
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
      const res = await adminApi.deleteAllLoyaltyMembers();
      clearSelection();
      setConfirmAction(null);
      onNotify(res.message || "All customers deleted.");
      loadCustomers();
    } catch (err) {
      onNotify(err.message, "error");
      setConfirmAction(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or phone..."
          className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-gold"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setConfirmAction("deleteAll")}
            className="btn-3d-flat rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20"
          >
            🗑️ Delete All Customers
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
        {customers.length > 0 && (
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
        <p className="py-16 text-center text-gray-500">Loading customers...</p>
      ) : customers.length === 0 ? (
        <p className="py-16 text-center text-gray-500">No customers found.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 cursor-pointer rounded border-gray-600 bg-gray-800 accent-red-500"
                    aria-label="Select all customers on page"
                  />
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Orders</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Loyalty Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {customers.map((c) => (
                <tr key={c._id} className={`hover:bg-gray-900/50 ${selectedIds.includes(c._id) ? "bg-red-500/10" : ""}`}>
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(c._id)}
                      onChange={() => toggleSelect(c._id)}
                      className="h-4 w-4 cursor-pointer rounded border-gray-600 bg-gray-800 accent-red-500"
                      aria-label={`Select customer ${c.name}`}
                    />
                  </td>
                  <td className="px-5 py-3 text-white font-medium">{c.name}</td>
                  <td className="px-5 py-3 text-gray-400">{c.phone}</td>
                  <td className="px-5 py-3 text-gray-300">{c.totalOrders}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-lg bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">{c.loyaltyPoints}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-3d-flat rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-400 disabled:opacity-40">Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="btn-3d-flat rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-400 disabled:opacity-40">Next</button>
        </div>
      )}

      <ConfirmDialog
        open={confirmAction === "deleteSelected"}
        title="Delete selected customers?"
        description={`This will permanently delete ${selectedIds.length} selected customer(s) along with all their orders, loyalty points, and reward history. This action cannot be undone.`}
        icon="🗑️"
        confirmText="Delete Selected"
        loading={deleting}
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
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
