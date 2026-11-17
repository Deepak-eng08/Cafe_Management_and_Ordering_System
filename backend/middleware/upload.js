import multer from "multer";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.test(file.originalname)) {
      return cb(null, true);
    }
    const error = new Error("Only JPG, JPEG, PNG, or WEBP images are allowed");
    error.code = "INVALID_FILE_TYPE";
    cb(error);
  },
});

export default upload;
