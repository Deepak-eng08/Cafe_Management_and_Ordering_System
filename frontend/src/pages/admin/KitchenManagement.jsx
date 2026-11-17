import { useState, useEffect } from "react";
import { adminApi } from "../../adminApi";

export default function KitchenManagement({ onNotify }) {
  const [status, setStatus] = useState("closed");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const data = await adminApi.getKitchenStatus();
        setStatus(data.status);
      } catch {
        setStatus("closed");
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  async function toggle(newStatus) {
    setToggling(true);
    try {
      const data = await adminApi.setKitchenStatus(newStatus);
      setStatus(data.status);
      localStorage.setItem("kitchenUpdated", Date.now());
      try { new BroadcastChannel("kitchen-updates").postMessage("refresh") } catch(e){}
      onNotify(
        newStatus === "open"
          ? "Kitchen is now Open! Customers can place orders."
          : "Kitchen is now Closed. Customers cannot place orders."
      );
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setToggling(false);
    }
  }

  if (loading) return <p className="py-16 text-center text-gray-500">Loading...</p>;

  return (
    <div className="max-w-lg space-y-6">
      <div className={`rounded-2xl border p-8 text-center ${
        status === "open"
          ? "bg-emerald-500/10 border-emerald-500/20"
          : "bg-red-500/10 border-red-500/20"
      }`}>
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
          {status === "open" ? (
            <span className="text-5xl">🟢</span>
          ) : (
            <span className="text-5xl">🔴</span>
          )}
        </div>
        <h3 className={`text-xl font-bold ${status === "open" ? "text-emerald-400" : "text-red-400"}`}>
          Kitchen is {status === "open" ? "Open" : "Closed"}
        </h3>
        <p className="mt-2 text-sm text-gray-400">
          {status === "open"
            ? "Customers can browse the menu and place orders."
            : "Customers can browse the menu but cannot place orders."}
        </p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => toggle("open")}
          disabled={toggling || status === "open"}
          className={`flex-1 rounded-xl py-3 text-sm font-semibold transition ${
            status === "open"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
          } disabled:opacity-50`}
        >
          🟢 Open Kitchen
        </button>
        <button
          onClick={() => toggle("closed")}
          disabled={toggling || status === "closed"}
          className={`flex-1 rounded-xl py-3 text-sm font-semibold transition ${
            status === "closed"
              ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
              : "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
          } disabled:opacity-50`}
        >
          🔴 Close Kitchen
        </button>
      </div>
    </div>
  );
}
