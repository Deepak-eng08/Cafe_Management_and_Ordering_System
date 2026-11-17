import express from "express";
import multer from "multer";
import MenuItem from "../models/MenuItem.js";
import cloudinary from "../config/cloudinary.js";
import upload, { MAX_FILE_SIZE } from "../middleware/upload.js";
import { uploadImageToCloudinary, extractCloudinaryPublicId } from "../utils/cloudinaryUpload.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

const BOOLEAN_FIELDS = [
  "available",
  "bestseller",
  "recommended",
  "newArrival",
  "chefsSpecial",
  "cinephilesPick",
  "customersFavourite",
];

function parseBool(value, fallback) {
  if (value === undefined || value === "") return fallback;
  return value === true || value === "true" || value === "on" || value === "1";
}

router.get("/", async (req, res) => {
  try {
    const { category, available, search } = req.query;
    const query = {};
    if (category && category !== "All") query.category = category;
    if (available !== undefined) query.available = available === "true";
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    const items = await MenuItem.find(query).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", adminAuth, upload.single("image"), async (req, res) => {
  let newPublicId = null;
  try {
    const { name, price, category, description, image } = req.body;
    if (!name || price === undefined || price === "" || !category) {
      return res.status(400).json({ message: "name, price, and category are required" });
    }

    let imageUrl = "";
    if (req.file) {
      const uploaded = await uploadImageToCloudinary(req.file.buffer, "cafe/menu");
      newPublicId = uploaded.public_id;
      imageUrl = uploaded.secure_url || uploaded.url;
    } else if (typeof image === "string" && image.trim()) {
      imageUrl = image.trim();
    } else {
      return res.status(400).json({ message: "An image is required. Select a JPG, PNG, or WEBP image." });
    }

    const item = await MenuItem.create({
      name: String(name),
      price: Number(price),
      category: String(category),
      description: description || "",
      image: imageUrl,
      available: parseBool(req.body.available, true),
      bestseller: parseBool(req.body.bestseller, false),
      recommended: parseBool(req.body.recommended, false),
      newArrival: parseBool(req.body.newArrival, false),
      chefsSpecial: parseBool(req.body.chefsSpecial, false),
      cinephilesPick: parseBool(req.body.cinephilesPick, false),
      customersFavourite: parseBool(req.body.customersFavourite, false),
    });

    res.status(201).json(item);
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
    for (const key of BOOLEAN_FIELDS) {
      if (req.body[key] !== undefined && req.body[key] !== "") updates[key] = parseBool(req.body[key], undefined);
    }
    if (req.body.name !== undefined && req.body.name !== "") updates.name = String(req.body.name);
    if (req.body.price !== undefined && req.body.price !== "") updates.price = Number(req.body.price);
    if (req.body.category !== undefined && req.body.category !== "") updates.category = String(req.body.category);
    if (req.body.description !== undefined) updates.description = req.body.description || "";

    const existing = await MenuItem.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Menu item not found" });

    if (req.file) {
      const uploaded = await uploadImageToCloudinary(req.file.buffer, "cafe/menu");
      newPublicId = uploaded.public_id;
      updates.image = uploaded.secure_url || uploaded.url;
      if (existing.image) oldPublicId = extractCloudinaryPublicId(existing.image);
    } else if (typeof req.body.image === "string" && req.body.image.trim()) {
      updates.image = req.body.image.trim();
    }

    const item = await MenuItem.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ message: "Menu item not found" });

    if (newPublicId && oldPublicId && oldPublicId !== newPublicId) {
      cloudinary.uploader.destroy(oldPublicId, { resource_type: "image" }).catch(() => {});
    }

    res.json(item);
  } catch (error) {
    if (newPublicId) {
      cloudinary.uploader.destroy(newPublicId, { resource_type: "image" }).catch(() => {});
    }
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu item not found" });
    const publicId = extractCloudinaryPublicId(item.image);
    if (publicId) {
      cloudinary.uploader.destroy(publicId, { resource_type: "image" }).catch(() => {});
    }
    res.json({ message: "Menu item deleted" });
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
