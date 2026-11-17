import express from "express";
import Loyalty from "../models/Loyalty.js";
import Order from "../models/Order.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone must be exactly 10 digits." });
    }
    const loyalty = await Loyalty.findOne({ phone });
    if (!loyalty) return res.status(404).json({ message: "No reward history found." });
    res.json(loyalty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/backfill", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find({
      status: "completed",
      phoneNumber: { $exists: true, $ne: "" },
    });

    const phoneMap = {};
    for (const order of orders) {
      const phone = (order.phoneNumber || "").trim();
      if (!/^\d{10}$/.test(phone)) continue;
      if (!phoneMap[phone]) {
        phoneMap[phone] = { name: order.customerName, totalOrders: 0, totalAmountSpent: 0, lastOrderDate: null };
      }
      phoneMap[phone].totalOrders += 1;
      phoneMap[phone].totalAmountSpent += order.total;
      const orderDate = new Date(order.createdAt);
      if (!phoneMap[phone].lastOrderDate || orderDate > phoneMap[phone].lastOrderDate) {
        phoneMap[phone].lastOrderDate = orderDate;
      }
    }

    let created = 0;
    let updated = 0;

    for (const [phone, data] of Object.entries(phoneMap)) {
      const existing = await Loyalty.findOne({ phone });
      if (existing) {
        existing.name = data.name;
        existing.totalOrders = data.totalOrders;
        existing.totalAmountSpent = data.totalAmountSpent;
        existing.loyaltyPoints = data.totalOrders;
        existing.lastOrderDate = data.lastOrderDate;
        await existing.save();
        updated++;
      } else {
        await Loyalty.create({
          name: data.name,
          phone,
          totalOrders: data.totalOrders,
          totalAmountSpent: data.totalAmountSpent,
          loyaltyPoints: data.totalOrders,
          rewardStatus: "none",
          lastOrderDate: data.lastOrderDate,
        });
        created++;
      }
    }

    res.json({ message: `Backfill complete. Created: ${created}, Updated: ${updated}`, phones: Object.keys(phoneMap) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
