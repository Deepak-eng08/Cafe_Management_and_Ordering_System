import express from "express";
import multer from "multer";
import Offer from "../models/Offer.js";
import cloudinary from "../config/cloudinary.js";
import upload, { MAX_FILE_SIZE } from "../middleware/upload.js";
import { uploadImageToCloudinary, extractCloudinaryPublicId } from "../utils/cloudinaryUpload.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function computeDates(duration, customStart, customEnd) {
  const now = new Date();
  const today = startOfDay(now);

  switch (duration) {
    case "today":
      return { startDate: today, endDate: endOfDay(today) };

    case "tomorrow": {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { startDate: today, endDate: endOfDay(tomorrow) };
    }

    case "7days": {
      const end = new Date(today);
      end.setDate(end.getDate() + 7);
      return { startDate: today, endDate: endOfDay(end) };
    }

    case "30days": {
      const end = new Date(today);
      end.setDate(end.getDate() + 30);
      return { startDate: today, endDate: endOfDay(end) };
    }

    case "year": {
      const start = customStart ? startOfDay(new Date(customStart)) : today;
      const endYear = start.getFullYear();
      const end = new Date(endYear, 11, 31, 23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }

    case "custom":
    default: {
      const start = customStart ? startOfDay(new Date(customStart)) : today;
      const end = customEnd ? endOfDay(new Date(customEnd)) : endOfDay(today);
      return { startDate: start, endDate: end };
    }
  }
}

function getStatus(startDate, endDate) {
  const now = new Date();
  if (startDate > now) return "upcoming";
  if (endDate < now) return "expired";
  return "active";
}

router.get("/", async (req, res) => {
  try {
    const offers = await Offer.find({}).sort({ createdAt: -1 });

    const result = offers.map((o) => {
      const obj = o.toObject();
      obj.status = getStatus(o.startDate, o.endDate);
      return obj;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/active", async (req, res) => {
  try {
    const now = new Date();
    const offers = await Offer.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ createdAt: -1 });

    const result = offers.map((o) => {
      const obj = o.toObject();
      obj.status = "active";
      return obj;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/customer", async (req, res) => {
  try {
    const now = new Date();
    const offers = await Offer.find({
      endDate: { $gte: now },
    }).sort({ createdAt: -1 });

    const result = offers.map((o) => {
      const obj = o.toObject();
      obj.status = getStatus(o.startDate, o.endDate);
      return obj;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    const obj = offer.toObject();
    obj.status = getStatus(offer.startDate, offer.endDate);
    res.json(obj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", adminAuth, upload.single("image"), async (req, res) => {
  let newPublicId = null;
  try {
    const { title, description, image, duration, startDate: customStart, endDate: customEnd } = req.body;
    if (!title) {
      return res.status(400).json({ message: "title is required" });
    }

    const dur = duration || "custom";
    const dates = computeDates(dur, customStart, customEnd);

    let imageUrl = "";
    if (req.file) {
      const uploaded = await uploadImageToCloudinary(req.file.buffer, "cafe/offers");
      newPublicId = uploaded.public_id;
      imageUrl = uploaded.secure_url || uploaded.url;
    } else if (typeof image === "string" && image.trim()) {
      imageUrl = image.trim();
    }

    const offer = await Offer.create({
      title,
      description: description || "",
      image: imageUrl,
      duration: dur,
      startDate: dates.startDate,
      endDate: dates.endDate,
    });

    const obj = offer.toObject();
    obj.status = getStatus(offer.startDate, offer.endDate);
    res.status(201).json(obj);
  } catch (error) {
    if (newPublicId) {
      cloudinary.uploader.destroy(newPublicId, { resource_type: "image" }).catch(() => {});
    }
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", adminAuth, upload.single("image"), async (req, res) => {
  let newPublicId = null;
  let oldPublicId = null;
  try {
    const updates = {};
    const allowed = ["title", "description", "duration"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (req.file) {
      const uploaded = await uploadImageToCloudinary(req.file.buffer, "cafe/offers");
      newPublicId = uploaded.public_id;
      updates.image = uploaded.secure_url || uploaded.url;
      const existing = await Offer.findById(req.params.id);
      if (existing && existing.image) oldPublicId = extractCloudinaryPublicId(existing.image);
    } else if (typeof req.body.image === "string" && req.body.image.trim()) {
      updates.image = req.body.image.trim();
    }

    if (updates.duration) {
      const dates = computeDates(
        updates.duration,
        req.body.startDate,
        req.body.endDate
      );
      updates.startDate = dates.startDate;
      updates.endDate = dates.endDate;
    } else if (req.body.startDate || req.body.endDate) {
      if (req.body.startDate) updates.startDate = startOfDay(new Date(req.body.startDate));
      if (req.body.endDate) updates.endDate = endOfDay(new Date(req.body.endDate));
    }

    const offer = await Offer.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!offer) return res.status(404).json({ message: "Offer not found" });

    if (newPublicId && oldPublicId && oldPublicId !== newPublicId) {
      cloudinary.uploader.destroy(oldPublicId, { resource_type: "image" }).catch(() => {});
    }

    const obj = offer.toObject();
    obj.status = getStatus(offer.startDate, offer.endDate);
    res.json(obj);
  } catch (error) {
    if (newPublicId) {
      cloudinary.uploader.destroy(newPublicId, { resource_type: "image" }).catch(() => {});
    }
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    const publicId = extractCloudinaryPublicId(offer.image);
    if (publicId) {
      cloudinary.uploader.destroy(publicId, { resource_type: "image" }).catch(() => {});
    }
    res.json({ message: "Offer deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: `Image is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.` });
    }
    return res.status(400).json({ message: error.message });
  }
  if (error && error.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({ message: error.message });
  }
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  next();
});

export default router;
