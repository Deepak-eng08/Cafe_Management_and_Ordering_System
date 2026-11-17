import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { existsSync } from "fs";
import path from "path";
import http from "http";
import mongoose from "mongoose";
import { initSocketServer } from "./socketServer.js";
import adminRoutes from "./routes/admin.js";
import orderRoutes from "./routes/orders.js";
import customerRoutes from "./routes/customers.js";
import kitchenRoutes from "./routes/kitchen.js";
import menuRoutes from "./routes/menu.js";
import categoryRoutes from "./routes/categories.js";
import offerRoutes from "./routes/offers.js";
import websiteContentRoutes from "./routes/websiteContent.js";
import notificationRoutes from "./routes/notifications.js";
import loyaltyRoutes from "./routes/loyalty.js";
import cloudinaryRoutes from "./routes/cloudinary.js";

const app = express();
const PORT = process.env.PORT || 5000;
// MONGO_URI is required. No local fallback: without it we refuse to start so a
// misconfigured production deployment never silently connects to a local DB.
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error(
    "MONGO_URI is not set. Set it to your MongoDB Atlas connection string (see backend/.env.example) before starting the server."
  );
  process.exit(1);
}
const FRONTEND_DIST = path.join(import.meta.dirname, "..", "frontend", "dist");
const HAS_FRONTEND = existsSync(path.join(FRONTEND_DIST, "index.html"));

// Trust proxy only when deployed behind a reverse proxy (Nginx, Render, Railway, etc.).
// We trust exactly ONE hop (the platform's load balancer), never all headers blindly,
// so clients cannot spoof X-Forwarded-For to bypass the rate limiter.
// Set TRUST_PROXY=true on Render.
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);

// Security headers. CSP is tuned for the Vite build + Cloudinary images.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
        // ws: and wss: are NOT valid CSP source values — remove them.
        // Same-origin WebSocket connections are permitted by browsers without them.
        "connect-src": ["'self'", "https://res.cloudinary.com"],
        "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
        "object-src": ["'none'"],
        "frame-ancestors": ["'self'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
      },
    },
  })
);

// CORS: allow listed origins (set ALLOWED_ORIGINS, comma-separated).
// Same-origin and header-less requests (curl, same-host frontend) are always allowed.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function checkOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.length === 0) return true;
  return allowedOrigins.includes(origin);
}

function isAllowedOrigin(origin, callback) {
  if (checkOrigin(origin)) {
    return callback(null, true);
  }
  return callback(new Error("Not allowed by CORS"), false);
}

app.use(
  cors({
    origin: isAllowedOrigin,
    credentials: true,
  })
);
app.use(express.json());

// ── Rate limiting (per IP) ──────────────────────────────────────────────
// Separate limits per API type so the app's own polling never trips a 429:
//   • Admin login      → 10 req / 15 min  (brute-force protection)
//   • Create order     → 30 req / 15 min  (legit customers have plenty of room)
//   • Other writes     → 200 req / 15 min (admin mutations, claims)
//   • Reads (GET…)     → 1500 req / 15 min (menu browsing, status polling)
// The customer site polls kitchen status every 3s (~20 req/min) and the admin
// panel refreshes counts periodically, so the read cap is deliberately generous
// while still stopping runaway/automated traffic.
const WINDOW_MS = 15 * 60 * 1000;

// Strict — prevents brute-force attempts on the admin login.
const loginLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 10,
  skip: (req) => req.method !== "POST",
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});

// Reasonable — enough for multiple customers per IP, blocks order spam.
const orderCreateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 30,
  skip: (req) => req.method !== "POST",
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many orders placed. Please try again later." },
});

// Reads — menu browsing, kitchen-status polling, order lookups. High cap so
// several customers behind one public IP are never blocked.
const apiReadLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 1500,
  skip: (req) => !["GET", "HEAD", "OPTIONS"].includes(req.method),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Writes — admin mutations, status changes, claims. Protects the API without
// accidentally blocking normal admin usage.
const apiWriteLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 200,
  skip: (req) => ["GET", "HEAD", "OPTIONS"].includes(req.method),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Order matters: the strict/login and order limiters run before the general ones,
// so a POST that exceeds them returns 429 immediately instead of only counting
// toward the broader write cap.
app.use("/api/admin/login", loginLimiter);
app.use("/api/orders", orderCreateLimiter);
app.use("/api", apiReadLimiter);
app.use("/api", apiWriteLimiter);

const server = http.createServer(app);
initSocketServer(server, isAllowedOrigin);

app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/kitchen-status", kitchenRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/website-content", websiteContentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/cloudinary", cloudinaryRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

if (HAS_FRONTEND) {
  // Production: serve the built frontend from the same server (no CORS/mixed-content issues).
  app.use(express.static(FRONTEND_DIST));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) {
      return next();
    }
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ message: "Cafe API is running" });
  });
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });
