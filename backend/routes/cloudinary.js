import express from "express";
import cloudinary, { isConfigured } from "../config/cloudinary.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// Cloudinary image management is admin-only — every endpoint requires a valid JWT.
router.use(adminAuth);

router.get("/status", (req, res) => {
  res.json({ configured: isConfigured, cloudName: process.env.CLOUDINARY_CLOUD_NAME || "" });
});

router.get("/images", async (req, res) => {
  try {
    const { search, folder, tag, maxResults, nextCursor } = req.query;
    if (!isConfigured) {
      return res.status(503).json({ message: "Cloudinary is not configured on the server" });
    }
    if (search) {
      const result = await cloudinary.search
        .expression(`resource_type:image AND (${search})`)
        .with_field("tags")
        .max_results(parseInt(maxResults, 10) || 50)
        .next_cursor(nextCursor)
        .execute();
      return res.json(result);
    }
    const options = {
      resource_type: "image",
      max_results: parseInt(maxResults, 10) || 50,
    };
    if (folder) options.prefix = folder;
    if (tag) options.type = "tag";
    if (nextCursor) options.next_cursor = nextCursor;
    const result = await cloudinary.api.resources(options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/images/:publicId", async (req, res) => {
  try {
    if (!isConfigured) {
      return res.status(503).json({ message: "Cloudinary is not configured on the server" });
    }
    const result = await cloudinary.api.resource(req.params.publicId, { resource_type: "image" });
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

router.post("/upload", async (req, res) => {
  try {
    const { file, url, folder, publicId } = req.body;
    if (!file && !url) {
      return res.status(400).json({ message: "Provide a base64 'file' (data URI) or a remote image 'url'" });
    }
    const options = {
      folder: folder || "",
      resource_type: "image",
    };
    if (publicId) options.public_id = publicId;
    const result = await cloudinary.uploader.upload(file || url, options);
    res.status(201).json({
      public_id: result.public_id,
      url: result.url,
      secure_url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/images/:publicId", async (req, res) => {
  try {
    if (!isConfigured) {
      return res.status(503).json({ message: "Cloudinary is not configured on the server" });
    }
    const result = await cloudinary.uploader.destroy(req.params.publicId, { resource_type: "image" });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
