import { useState, useEffect } from "react";
import { adminApi } from "../../adminApi";

function StatCard({ label, value, color = "amber" }) {
  const colors = {
    amber: "bg-gold/10 text-gold",
    green: "bg-emerald-500/10 text-emerald-400",
    blue: "bg-blue-500/10 text-blue-400",
    purple: "bg-purple-500/10 text-purple-400",
    red: "bg-red-500/10 text-red-400",
    cyan: "bg-cyan-500/10 text-cyan-400",
  };
  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${colors[color]?.split(" ")[1] || "text-gold"}`}>{value}</p>
    </div>
  );
}

export default function Dashboard({ onNotify }) {
  const [stats, setStats] = useState({ orders: 0, pending: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0 });
  const [kitchenStatus, setKitchenStatus] = useState("closed");
  const [menuCount, setMenuCount] = useState(0);
  const [activeOffers, setActiveOffers] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const [ordersData, kitchenData, menuData, offersData] = await Promise.all([
        adminApi.getAllOrders({ filter: "today", limit: 500 }),
        adminApi.getKitchenStatus(),
        adminApi.getMenu(),
        adminApi.getOffers({ active: "true" }),
      ]);

      const orders = ordersData.orders || [];
      setStats({
        orders: orders.length,
        pending: orders.filter((o) => o.status === "pending").length,
        preparing: orders.filter((o) => o.status === "preparing").length,
        ready: orders.filter((o) => o.status === "ready").length,
        completed: orders.filter((o) => o.status === "completed").length,
        cancelled: orders.filter((o) => o.status === "cancelled").length,
      });
      setKitchenStatus(kitchenData.status);
      setMenuCount(Array.isArray(menuData) ? menuData.length : 0);
      setActiveOffers(Array.isArray(offersData) ? offersData.length : 0);
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(loadDashboard, 10000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <p className="py-20 text-center text-gray-500">Loading dashboard...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Today's Orders" value={stats.orders} color="amber" />
        <StatCard label="Pending" value={stats.pending} color="blue" />
        <StatCard label="Preparing" value={stats.preparing} color="purple" />
        <StatCard label="Ready" value={stats.ready} color="green" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Completed" value={stats.completed} color="green" />
        <StatCard label="Cancelled" value={stats.cancelled} color="red" />
        <StatCard label="Active Menu Items" value={menuCount} color="cyan" />
        <StatCard label="Active Offers" value={activeOffers} color="amber" />
      </div>

      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Kitchen Status</h3>
        <div className={`flex items-center gap-3 rounded-xl px-5 py-4 text-sm font-semibold ${
          kitchenStatus === "open"
            ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
            : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
        }`}>
          <span className={`h-3 w-3 rounded-full ${kitchenStatus === "open" ? "bg-emerald-500" : "bg-red-500"}`} />
          {kitchenStatus === "open" ? "Kitchen is Open" : "Kitchen is Closed"}
        </div>
      </div>
    </div>
  );
}
