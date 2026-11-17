import cloudinary from "../config/cloudinary.js";

// Uploads an image buffer to Cloudinary into the given folder.
// Used by both the menu and offers image uploads.
export function uploadImageToCloudinary(buffer, folder = "cafe") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// Extracts the Cloudinary public id from a res.cloudinary.com image URL
// so the asset can be cleaned up when it is replaced. Returns null if the
// URL is not a Cloudinary image.
export function extractCloudinaryPublicId(url) {
  const match = String(url || "").match(
    /res\.cloudinary\.com\/[^/]+\/image\/upload\/v\d+\/(.+?)\.(?:jpg|jpeg|png|webp)$/
  );
  return match ? match[1] : null;
}
