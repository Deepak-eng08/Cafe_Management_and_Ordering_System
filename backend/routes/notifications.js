import express from "express";
import Notification from "../models/Notification.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// Notifications are admin-only — every endpoint requires a valid JWT.
router.use(adminAuth);

router.get("/", async (req, res) => {
  try {
    const { unread } = req.query;
    const query = {};
    if (unread === "true") query.read = false;
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/unread-count", async (req, res) => {
  try {
    const count = await Notification.countDocuments({ read: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// /read-all MUST come before /:id/read, otherwise Express captures
// "read-all" as the :id param and returns 404 instead of bulk-updating.
router.put("/read-all", async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/", async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ message: "All notifications deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export async function createNotification(type, title, message, data = null) {
  try {
    await Notification.create({ type, title, message, data });
  } catch (err) {
    console.error("Notification creation error:", err.message);
  }
}

export default router;
