import express from "express";
import XLSX from "xlsx";
import Order from "../models/Order.js";
import Loyalty from "../models/Loyalty.js";
import Notification from "../models/Notification.js";
import { getSocketIO } from "../socketServer.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

function buildDateFilter(query) {
  const { filter, from, to } = query;
  const now = new Date();
  let dateFilter = {};

  if (filter === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    dateFilter = { createdAt: { $gte: start } };
  } else if (filter === "thisWeek") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    dateFilter = { createdAt: { $gte: start } };
  } else if (filter === "thisMonth") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    dateFilter = { createdAt: { $gte: start } };
  } else if (filter === "lastMonth") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    end.setHours(23, 59, 59, 999);
    dateFilter = { createdAt: { $gte: start, $lte: end } };
  } else if (filter === "thisYear") {
    const start = new Date(now.getFullYear(), 0, 1);
    dateFilter = { createdAt: { $gte: start } };
  } else if (from || to) {
    const range = {};
    if (from) range.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      range.$lte = toDate;
    }
    dateFilter = { createdAt: range };
  }

  return dateFilter;
}

function buildSearchFilter(search) {
  if (!search || !search.trim()) return {};
  const term = search.trim();
  return {
    $or: [
      { orderId: { $regex: term, $options: "i" } },
      { customerName: { $regex: term, $options: "i" } },
      { phoneNumber: { $regex: term, $options: "i" } },
    ],
  };
}

// ── Excel export helpers ─────────────────────────────────────────────────────
const EXPORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseISODate(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || ""));
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) };
}

// The café operates in India, so the export range is built in IST (UTC+5:30).
// MongoDB timestamps are stored in UTC, so the IST boundaries are converted back
// to UTC for the query. This keeps an order placed near IST midnight on the
// correct calendar day.
function buildISTRange(from, to) {
  const start = parseISODate(from);
  const end = parseISODate(to);
  if (!start || !end) return null;
  const startUTC = Date.UTC(start.year, start.month, start.day) - IST_OFFSET_MS;
  const endUTC = Date.UTC(end.year, end.month, end.day + 1) - IST_OFFSET_MS - 1;
  return { createdAt: { $gte: new Date(startUTC), $lte: new Date(endUTC) } };
}

function exportDateLabel(str) {
  const d = parseISODate(str);
  if (!d) return String(str);
  return `${String(d.day).padStart(2, "0")} ${EXPORT_MONTHS[d.month]} ${d.year}`;
}

function formatISTDateTime(date) {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return ist.toISOString().replace("T", " ").slice(0, 19);
}

function formatINR(n, minDecimals = 0) {
  return (
    "₹" +
    n.toLocaleString("en-IN", {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: minDecimals,
    })
  );
}

function formatItems(items) {
  return items.map((item) => `${item.name} x${item.quantity}`).join(", ");
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function isoDateString(d) {
  return `${d.year}-${pad2(d.month + 1)}-${pad2(d.day)}`;
}

// Returns a UTC Date for the given IST wall-clock time.
function istDate(year, month, day, hour = 0, minute = 0, second = 0, ms = 0) {
  return new Date(Date.UTC(year, month, day, hour, minute, second, ms) - IST_OFFSET_MS);
}

const EXPORT_PRESETS = ["today", "thisWeek", "thisMonth", "lastMonth", "thisYear"];

// Resolves the export date range from either a preset filter (today / thisWeek /
// thisMonth / lastMonth) or a custom from/to pair. All boundaries are IST
// (UTC+5:30) because the café operates in India. Returns { range, fromLabel,
// toLabel } where range is the MongoDB query and the labels are YYYY-MM-DD
// strings used for the filename and sheet header. Returns null when no valid
// range can be derived.
function resolveExportRange(filter, from, to) {
  if (filter && EXPORT_PRESETS.includes(filter)) {
    const now = new Date();
    const istNow = new Date(now.getTime() + IST_OFFSET_MS);
    const y = istNow.getUTCFullYear();
    const m = istNow.getUTCMonth();
    const d = istNow.getUTCDate();
    const wd = istNow.getUTCDay();

    let start = { year: y, month: m, day: d };
    let end = { year: y, month: m, day: d };

    if (filter === "thisWeek") {
      const diff = wd === 0 ? 6 : wd - 1; // week starts on Monday
      const monday = new Date(istNow.getTime() - diff * 24 * 60 * 60 * 1000);
      start = {
        year: monday.getUTCFullYear(),
        month: monday.getUTCMonth(),
        day: monday.getUTCDate(),
      };
    } else if (filter === "thisMonth") {
      start = { year: y, month: m, day: 1 };
    } else if (filter === "lastMonth") {
      const first = new Date(Date.UTC(y, m - 1, 1));
      const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
      start = { year: first.getUTCFullYear(), month: first.getUTCMonth(), day: 1 };
      end = { year: first.getUTCFullYear(), month: first.getUTCMonth(), day: lastDay };
    } else if (filter === "thisYear") {
      start = { year: y, month: 0, day: 1 };
    }

    return {
      range: {
        createdAt: {
          $gte: istDate(start.year, start.month, start.day),
          $lte: istDate(end.year, end.month, end.day, 23, 59, 59, 999),
        },
      },
      fromLabel: isoDateString(start),
      toLabel: isoDateString(end),
    };
  }

  const start = parseISODate(from);
  const end = parseISODate(to);
  if (
    !start ||
    !end ||
    start.year > end.year ||
    (start.year === end.year &&
      (start.month > end.month ||
        (start.month === end.month && start.day > end.day)))
  ) {
    return null;
  }
  return { range: buildISTRange(from, to), fromLabel: from, toLabel: to };
}

// The café operates in India (IST, UTC+5:30). MongoDB timestamps are stored in
// UTC, so we shift each order's timestamp into IST before reading the hour/day.
// This keeps "Peak Hours" and "Best Day" aligned with the clock the staff sees.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function istParts(date) {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return { hour: ist.getUTCHours(), day: ist.getUTCDay() };
}

function formatHourLabel(hour) {
  const start = hour % 12 === 0 ? 12 : hour % 12;
  const startAmpm = hour < 12 ? "AM" : "PM";
  const endHour = (hour + 1) % 24;
  const end = endHour % 12 === 0 ? 12 : endHour % 12;
  const endAmpm = endHour < 12 ? "AM" : "PM";
  return `${start} ${startAmpm} - ${end} ${endAmpm}`;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Aggregate completed orders into per-hour counts (IST) and per-day sales (IST).
// Reuses the same in-memory order list already fetched for the other stats, so
// no additional database queries are needed.
function computeTimeAnalytics(completedOrders) {
  const hourCounts = {};
  const daySales = {};
  const dayOrders = {};

  for (const order of completedOrders) {
    const { hour, day } = istParts(order.createdAt);
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    daySales[day] = (daySales[day] || 0) + order.total;
    dayOrders[day] = (dayOrders[day] || 0) + 1;
  }

  const peakHours = Object.entries(hourCounts)
    .map(([hour, orders]) => ({
      hour: formatHourLabel(Number(hour)),
      orders,
    }))
    .sort((a, b) => b.orders - a.orders);

  const dayBreakdown = DAY_NAMES.map((name, index) => ({
    day: name,
    sales: Math.round(daySales[index] || 0),
    orders: dayOrders[index] || 0,
  }));

  let bestDay = null;
  for (const entry of dayBreakdown) {
    if (entry.sales > 0 && (!bestDay || entry.sales > bestDay.sales)) bestDay = entry;
  }

  return { peakHours, dayBreakdown, bestDay };
}

const POINT_TIERS = [
  { min: 200, points: 1 },
  { min: 350, points: 2 },
  { min: 500, points: 3 },
  { min: 700, points: 4 },
  { min: 850, points: 5 },
  { min: 1000, points: 6 },
];
const POINT_TIER_DELTAS = [150, 150, 200];

function pointsForAmount(amount) {
  if (amount < POINT_TIERS[0].min) return 0;

  let thresholds = POINT_TIERS.map((t) => t.min);
  let next = thresholds[thresholds.length - 1];
  let idx = thresholds.length - 1;
  while (next < amount) {
    next += POINT_TIER_DELTAS[idx % POINT_TIER_DELTAS.length];
    idx += 1;
    thresholds.push(next);
  }

  let points = 0;
  thresholds.forEach((t, i) => {
    if (amount >= t) points = i + 1;
  });
  return points;
}

async function updateLoyalty(order) {
  try {
    const earned = pointsForAmount(order.total);
    const existing = await Loyalty.findOne({ phone: order.phoneNumber });

    if (existing) {
      existing.totalOrders += 1;
      existing.totalAmountSpent += order.total;
      existing.loyaltyPoints += earned;
      existing.lastOrderDate = order.createdAt || new Date();
      if (order.customerName) existing.name = order.customerName;
      await existing.save();
    } else {
      await Loyalty.create({
        name: order.customerName,
        phone: order.phoneNumber,
        totalOrders: 1,
        totalAmountSpent: order.total,
        loyaltyPoints: earned,
        rewardStatus: "none",
        currentRewardStatus: "locked",
        lastOrderDate: order.createdAt || new Date(),
      });
    }
  } catch (err) {
    console.error("Loyalty update error:", err.message);
  }
}

router.post("/", async (req, res) => {
  try {
    const { customerName, phoneNumber, tableNumber, items } = req.body;

    if (!customerName || !phoneNumber || !items || items.length === 0) {
      return res.status(400).json({
        message: "customerName, phoneNumber, and at least one item are required",
      });
    }

    if (!tableNumber || !/^\d+$/.test(String(tableNumber))) {
      return res.status(400).json({
        message: "Table number is required and must be a number",
      });
    }

    const total = Math.round(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    );

    const order = await Order.create({ customerName, phoneNumber, tableNumber, items, total });

    try {
      await Notification.create({
        type: "new_order",
        title: "New Order Received",
        message: `${customerName} placed order ${order.orderId} for ₹${total}`,
        data: { orderId: order.orderId },
      });
    } catch { /* notification creation is non-critical */ }

    // Real-time: alert every connected admin panel instantly.
    const io = getSocketIO();
    if (io) {
      io.to("admins").emit("newOrder", {
        orderId: order.orderId,
        tableNumber: order.tableNumber,
        customerName: order.customerName,
        phoneNumber: order.phoneNumber,
        items: order.items,
        total: order.total,
        createdAt: order.createdAt,
      });
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/active-count", adminAuth, async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await Order.countDocuments({
      status: "pending",
      createdAt: { $gte: since },
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/stats", adminAuth, async (req, res) => {
  try {
    const dateFilter = buildDateFilter(req.query);
    const searchFilter = buildSearchFilter(req.query.search);
    const query = { ...dateFilter, ...searchFilter };

    const orders = await Order.find(query);

    const completedOrders = orders.filter((o) => o.status === "completed");
    const cancelledOrders = orders.filter((o) => o.status === "cancelled");
    const totalRevenue = Math.round(completedOrders.reduce((sum, o) => sum + o.total, 0));

    const itemCounts = {};
    for (const order of completedOrders) {
      for (const item of order.items) {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemCounts[item.name].quantity += item.quantity;
        itemCounts[item.name].revenue += item.price * item.quantity;
      }
    }
    const topSellingItems = Object.values(itemCounts)
      .map((entry) => ({ ...entry, revenue: Math.round(entry.revenue) }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const { peakHours, dayBreakdown, bestDay } = computeTimeAnalytics(completedOrders);

    res.json({
      totalRevenue,
      totalOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      topSellingItems,
      peakHours,
      dayBreakdown,
      bestDay,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/export
// Admin-only. Downloads a real .xlsx sales report for the active date range —
// either a preset filter (today / thisWeek / thisMonth / lastMonth) or a custom
// From/To pair. Read-only: it only fetches orders and builds the workbook — it
// never deletes, updates, or creates any records.
router.get("/export", adminAuth, async (req, res) => {
  try {
    const { filter, from, to } = req.query;

    const resolved = resolveExportRange(filter, from, to);
    if (!resolved) {
      return res.status(400).json({ message: "Please select a valid date range." });
    }

    const orders = await Order.find(resolved.range).sort({ createdAt: 1 });

    if (orders.length === 0) {
      return res.status(404).json({ message: "No orders found for the selected date range." });
    }

    const completedOrders = orders.filter((o) => o.status === "completed");
    const cancelledOrders = orders.filter((o) => o.status === "cancelled");
    const totalOrders = orders.length;
    const completedCount = completedOrders.length;
    const cancelledCount = cancelledOrders.length;
    const totalSales = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = completedCount > 0 ? totalSales / completedCount : 0;

    const wb = XLSX.utils.book_new();

    // Sheet 1: Sales Summary
    const summaryRows = [
      ["Sales Report"],
      [],
      ["Date Range", `${exportDateLabel(resolved.fromLabel)} - ${exportDateLabel(resolved.toLabel)}`],
      ["Total Orders", totalOrders],
      ["Completed Orders", completedCount],
      ["Cancelled Orders", cancelledCount],
      ["Total Sales", formatINR(totalSales)],
      ["Average Order Value", formatINR(avgOrderValue, 2)],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), "Sales Summary");

    // Sheet 2: Orders — one row per order using the fields on the Order model.
    const orderRows = [
      ["Order ID", "Date Time (IST)", "Customer Name", "Customer Phone", "Items", "Total", "Status"],
      ...orders.map((o) => [
        o.orderId,
        formatISTDateTime(o.createdAt),
        o.customerName,
        o.phoneNumber,
        formatItems(o.items),
        o.total,
        o.status,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(orderRows), "Orders");

    // Optional analytics sheets: reuse the exact same calculations the Sales
    // Panel already performs (top selling items + time analytics). No new
    // analytics are introduced for the export.
    const itemCounts = {};
    for (const order of completedOrders) {
      for (const item of order.items) {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemCounts[item.name].quantity += item.quantity;
        itemCounts[item.name].revenue += item.price * item.quantity;
      }
    }
    const topItems = Object.values(itemCounts)
      .map((entry) => ({ ...entry, revenue: Math.round(entry.revenue) }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["Item", "Quantity Sold", "Revenue"],
        ...topItems.map((i) => [i.name, i.quantity, i.revenue]),
      ]),
      "Top Items"
    );

    const { peakHours, dayBreakdown, bestDay } = computeTimeAnalytics(completedOrders);

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["Day", "Sales", "Orders"],
        ...dayBreakdown.map((d) => [d.day, d.sales, d.orders]),
      ]),
      "Daily Sales"
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["Hour", "Orders"],
        ...peakHours.map((p) => [p.hour, p.orders]),
      ]),
      "Peak Hours"
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["Day", "Sales", "Orders"],
        ...(bestDay ? [[bestDay.day, bestDay.sales, bestDay.orders]] : []),
      ]),
      "Best Day"
    );

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const filename = `Sales_Report_${resolved.fromLabel}_to_${resolved.toLabel}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", adminAuth, async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const dateFilter = buildDateFilter(req.query);
    const searchFilter = buildSearchFilter(search);
    const query = { ...dateFilter, ...searchFilter };

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({ orders, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/orders/all
// Permanently deletes every order in the database.
router.delete("/all", adminAuth, async (req, res) => {
  try {
    const result = await Order.deleteMany({});
    try {
      await Notification.deleteMany({ type: "new_order" });
    } catch { /* non-critical */ }
    res.json({
      message: `Deleted ${result.deletedCount} orders.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/orders
// Body: { ids: ["...", "..."] } — permanently deletes the selected orders.
router.delete("/", adminAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids must be a non-empty array" });
    }

    const orders = await Order.find({ _id: { $in: ids } });
    const result = await Order.deleteMany({ _id: { $in: ids } });

    const orderIds = orders.map((o) => o.orderId).filter(Boolean);
    if (orderIds.length > 0) {
      try {
        await Notification.deleteMany({ "data.orderId": { $in: orderIds } });
      } catch { /* non-critical */ }
    }

    res.json({
      message: `Deleted ${result.deletedCount} orders.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "preparing", "ready", "completed", "cancelled"];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(", ")}` });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (status === "completed") {
      await updateLoyalty(order);
    }

    if (status === "completed" || status === "cancelled") {
      try {
        await Notification.updateMany(
          { "data.orderId": order.orderId, read: false },
          { read: true }
        );
      } catch { /* non-critical */ }
    }

    // Real-time: as soon as an order becomes ready, notify ONLY that
    // customer's private order room.
    if (status === "ready") {
      const io = getSocketIO();
      if (io) {
        io.to(`order-${order.orderId}`).emit("orderReady", {
          orderId: order.orderId,
          tableNumber: order.tableNumber,
        });
      }
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
