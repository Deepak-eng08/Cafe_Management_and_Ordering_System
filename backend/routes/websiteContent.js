import express from "express";
import WebsiteContent from "../models/WebsiteContent.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

const DEFAULT_CONTENT = {
  cafeName: "Cinephile's Cafe",
  heroTitle: "Good Food. Great Movies.",
  heroSubtitle: "Where cinematic vibes meet café culture",
  heroDescription: "A cozy haven for movie lovers and food enthusiasts.",
  heroImage: "",
  aboutUs: "Welcome to Cinephile's Cafe — a cozy haven for movie lovers and food enthusiasts.",
  openingHours: "10:00 AM - 10:00 PM",
  contactNumber: "",
  address: "",
};

router.get("/", async (req, res) => {
  try {
    const entries = await WebsiteContent.find();
    const content = {};
    for (const entry of entries) {
      content[entry.key] = entry.value;
    }
    const result = { ...DEFAULT_CONTENT, ...content };
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/", adminAuth, async (req, res) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== "object") {
      return res.status(400).json({ message: "Request body must be an object" });
    }
    const ops = Object.entries(updates).map(([key, value]) =>
      WebsiteContent.findOneAndUpdate(
        { key },
        { key, value },
        { upsert: true, new: true, runValidators: true }
      )
    );
    await Promise.all(ops);
    const entries = await WebsiteContent.find();
    const content = {};
    for (const entry of entries) {
      content[entry.key] = entry.value;
    }
    const result = { ...DEFAULT_CONTENT, ...content };
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
