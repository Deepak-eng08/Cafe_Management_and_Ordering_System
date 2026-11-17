import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// POST /api/admin/login
// Body: { username, password }
// Compares against ADMIN_USERNAME / ADMIN_PASSWORD env vars. On success it
// returns a JWT signed with JWT_SECRET (8h expiry). Credentials are never
// exposed to the frontend.
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (
    username &&
    password &&
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    try {
      const token = jwt.sign({ role: "admin", username }, process.env.JWT_SECRET, {
        expiresIn: "8h",
      });
      return res.json({ success: true, token });
    } catch (error) {
      return res.status(500).json({ message: "Login failed: JWT_SECRET is not configured" });
    }
  }

  return res.status(401).json({ message: "Invalid username or password" });
});

export default router;
