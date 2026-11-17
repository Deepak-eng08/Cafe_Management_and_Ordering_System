import jwt from "jsonwebtoken";

// Server-side admin authentication.
// The frontend password check is NOT the security boundary — this middleware is.
// It verifies the JWT signed with JWT_SECRET on every admin API request.
export default function adminAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: missing token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized: invalid or expired token" });
  }
}
