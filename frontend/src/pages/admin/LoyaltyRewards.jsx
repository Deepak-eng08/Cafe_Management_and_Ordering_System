import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../adminApi";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function LoyaltyRewards({ onNotify }) {
  const [loyaltyTab, setLoyaltyTab] = useState("customers");
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0);

  const fetchPendingClaims = useCallback(async () => {
    try {
      const data = await adminApi.getPendingClaimsCount();
      setPendingClaimsCount(data.count);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchPendingClaims(); }, [fetchPendingClaims]);

  return (
    <div className="space-y-5">
      <div className="flex gap-1.5 border-b border-gray-800 pb-3">
        <button onClick={() => setLoyaltyTab("customers")} className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${loyaltyTab === "customers" ? "bg-gold text-gray-950" : "bg-gray-800 text-gray-400 hover:text-white"}`}>Customers</button>
        <button onClick={() => setLoyaltyTab("claims")} className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${loyaltyTab === "claims" ? "bg-gold text-gray-950" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
          Reward Claims {pendingClaimsCount > 0 && <span className="ml-1 rounded-full bg-gold px-1.5 py-0.5 text-[10px] text-white">{pendingClaimsCount}</span>}
        </button>
        <button onClick={() => setLoyaltyTab("history")} className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${loyaltyTab === "history" ? "bg-gold text-gray-950" : "bg-gray-800 text-gray-400 hover:text-white"}`}>History</button>
      </div>

      {loyaltyTab === "customers" && <ModularCustomersTab onNotify={onNotify} />}
      {loyaltyTab === "claims" && <ModularClaimsTab onNotify={onNotify} onRefreshCount={fetchPendingClaims} />}
      {loyaltyTab === "history" && <ModularHistoryTab />}
    </div>
  );
}

function ModularCustomersTab({ onNotify }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      const data = await adminApi.getLoyaltyMembers(params);
      setMembers(data.members || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const rewardStatusBadge = (status) => {
    switch (status) {
      case "locked": return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">Locked</span>;
      case "ready_to_claim": return <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Ready to Claim</span>;
      case "pending_approval": return <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">Pending Approval</span>;
      case "redeemed": return <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400">Redeemed</span>;
      default: return null;
    }
  };

  const pageIds = members.map((m) => m._id);
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
      loadMembers();
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
      loadMembers();
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
        {members.length > 0 && (
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
        <p className="py-16 text-center text-gray-500">Loading members...</p>
      ) : members.length === 0 ? (
        <p className="py-16 text-center text-gray-500">No loyalty members found.</p>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const isSelected = selectedIds.includes(member._id);
            return (
              <div key={member._id} className={`rounded-2xl bg-gray-900 border p-5 transition ${isSelected ? "border-red-500/60" : "border-gray-800"}`}>
                <div className="mb-3 flex items-center gap-3 border-b border-gray-800 pb-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(member._id)}
                    className="h-4 w-4 cursor-pointer rounded border-gray-600 bg-gray-800 accent-red-500"
                    aria-label={`Select customer ${member.name}`}
                  />
                  <span className="text-xs font-medium text-gray-400">
                    {isSelected ? "Selected" : "Select this customer"}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-white">{member.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{member.phone}</p>
                  <p className="text-xs text-gray-500 mt-1">Orders: {member.totalOrders} &middot; Points: {member.loyaltyPoints}</p>
                  {member.rewardStatus && member.rewardStatus !== "none" && (
                    <p className="mt-1 text-xs text-gold">Reward: {member.rewardStatus}</p>
                  )}
                  {member.currentRewardStatus && member.currentRewardStatus !== "locked" && (
                    <div className="mt-1">{rewardStatusBadge(member.currentRewardStatus)}</div>
                  )}
                </div>
              </div>
            );
          })}
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

function ModularClaimsTab({ onNotify, onRefreshCount }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const loadClaims = useCallback(async () => {
    try {
      const d = await adminApi.getAllClaims({ page, limit: 20 });
      setClaims(d.claims || []);
      setPagination(d.pagination || { total: 0, pages: 1 });
    } catch (err) { onNotify(err.message, "error"); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { loadClaims(); }, [loadClaims]);

  useEffect(() => {
    const t = setInterval(() => { loadClaims(); onRefreshCount(); }, 10000);
    return () => clearInterval(t);
  }, [loadClaims, onRefreshCount]);

  async function handleApprove(id) {
    try {
      await adminApi.approveClaim(id);
      loadClaims();
      onRefreshCount();
      onNotify("Reward approved and points deducted successfully");
    } catch (err) { onNotify(err.message, "error"); }
  }

  async function handleReject(id) {
    try {
      await adminApi.rejectClaim(id);
      loadClaims();
      onRefreshCount();
      onNotify("Claim rejected. Customer keeps all their points.");
    } catch (err) { onNotify(err.message, "error"); }
  }

  if (loading) return <p className="py-16 text-center text-gray-500">Loading claims...</p>;
  if (claims.length === 0) return <p className="py-16 text-center text-gray-500">No reward claims yet.</p>;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Customer Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Reward</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Required Points</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Current Points</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Request Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-900">
            {claims.map((claim) => (
              <tr key={claim._id} className="hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium text-white">{claim.customerName}</td>
                <td className="px-4 py-3 text-gray-400">{claim.phone}</td>
                <td className="px-4 py-3 text-gray-400">{claim.rewardName}</td>
                <td className="px-4 py-3 text-gray-400">{claim.pointsRequired}</td>
                <td className="px-4 py-3 text-gray-400">{claim.currentLoyaltyPoints}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(claim.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  {claim.status === "pending" && <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">Pending</span>}
                  {claim.status === "approved" && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Approved</span>}
                  {claim.status === "rejected" && <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">Rejected</span>}
                </td>
                <td className="px-4 py-3">
                  {claim.status === "pending" ? (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleApprove(claim._id)} className="rounded-lg bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/20">Approve</button>
                      <button onClick={() => handleReject(claim._id)} className="rounded-lg bg-red-500/10 px-3 py-1 text-[11px] font-medium text-red-400 hover:bg-red-500/20">Reject</button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-500">{claim.approvedBy || "—"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-3d-flat rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-400 disabled:opacity-40">Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="btn-3d-flat rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-400 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}

function ModularHistoryTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    async function load() {
      try {
        const d = await adminApi.getRewardHistory({ page, limit: 20 });
        setHistory(d.history || []);
        setPagination(d.pagination || { total: 0, pages: 1 });
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, [page]);

  if (loading) return <p className="py-16 text-center text-gray-500">Loading reward history...</p>;
  if (history.length === 0) return <p className="py-16 text-center text-gray-500">No reward history yet.</p>;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Customer Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Reward Redeemed</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Redemption Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Approved By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-900">
            {history.map((h) => (
              <tr key={h._id} className="hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium text-white">{h.customerName}</td>
                <td className="px-4 py-3 text-gray-400">{h.phone}</td>
                <td className="px-4 py-3 text-gray-400">{h.rewardName}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(h.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-400">{h.approvedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-3d-flat rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-400 disabled:opacity-40">Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="btn-3d-flat rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-400 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
