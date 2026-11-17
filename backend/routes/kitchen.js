// Kitchen Status routes — simple Open / Closed toggle
// Status is persisted in MongoDB so it survives server restarts
// (an in-memory variable would reset to "closed" every restart).

import express from "express";
import WebsiteContent from "../models/WebsiteContent.js";
import Notification from "../models/Notification.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

const KITCHEN_STATUS_KEY = "kitchenStatus";
const KITCHEN_UPDATED_KEY = "kitchenLastUpdated";

async function getStoredStatus() {
  const doc = await WebsiteContent.findOne({ key: KITCHEN_STATUS_KEY });
  return doc && doc.value ? doc.value : "closed";
}

async function getStoredLastUpdated() {
  const doc = await WebsiteContent.findOne({ key: KITCHEN_UPDATED_KEY });
  return doc && typeof doc.value === "number" ? doc.value : Date.now();
}

// GET /api/kitchen-status
// Returns the current kitchen status ("open" or "closed") and timestamp
router.get("/", async (req, res) => {
  try {
    const [status, lastUpdated] = await Promise.all([
      getStoredStatus(),
      getStoredLastUpdated(),
    ]);
    res.json({ status, lastUpdated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/kitchen-status
// Body: { status: "open" } or { status: "closed" }
// Updates the kitchen status and returns the new value. Admin-only.
router.put("/", adminAuth, async (req, res) => {
  const { status } = req.body;

  // Only allow "open" or "closed"
  if (status !== "open" && status !== "closed") {
    return res.status(400).json({
      message: 'status must be either "open" or "closed"',
    });
  }

  const lastUpdated = Date.now();

  try {
    await Promise.all([
      WebsiteContent.findOneAndUpdate(
        { key: KITCHEN_STATUS_KEY },
        { key: KITCHEN_STATUS_KEY, value: status },
        { upsert: true, new: true, runValidators: true }
      ),
      WebsiteContent.findOneAndUpdate(
        { key: KITCHEN_UPDATED_KEY },
        { key: KITCHEN_UPDATED_KEY, value: lastUpdated },
        { upsert: true, new: true, runValidators: true }
      ),
    ]);

    if (status === "closed") {
      try {
        await Notification.create({
          type: "kitchen_closed",
          title: "Kitchen Closed",
          message: "Kitchen has been closed. Customers cannot place orders.",
        });
      } catch { /* non-critical */ }
    }

    res.json({ status, lastUpdated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
