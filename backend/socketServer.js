import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Order from "./models/Order.js";

let io = null;

// Returns true only for a valid admin JWT (same secret + role as the REST admin auth).
function isAdminToken(token) {
  if (!token || !process.env.JWT_SECRET) return false;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload && payload.role === "admin";
  } catch {
    return false;
  }
}

export function initSocketServer(server, isAllowedOrigin) {
  if (io) return io;

  const origin =
    typeof isAllowedOrigin === "function"
      ? (origin, callback) => {
          if (isAllowedOrigin.length >= 2) {
            isAllowedOrigin(origin, callback);
          } else {
            callback(null, isAllowedOrigin(origin));
          }
        }
      : true;

  io = new Server(server, {
    cors: {
      origin,
      credentials: true,
    },
  });

  // Verify an admin JWT sent in the handshake `auth` (defense in depth).
  // Customers connect without a token and stay unauthenticated.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (isAdminToken(token)) {
      socket.data.isAdmin = true;
    }
    next();
  });

  io.on("connection", (socket) => {
    // Admin clients join the shared "admins" room so new orders
    // are broadcast to every connected admin panel instantly.
    // Only authenticated admins may join: the JWT is verified here even if the
    // socket connected before login (token comes from the event payload).
    socket.on("registerAdmin", ({ token } = {}) => {
      if (socket.data.isAdmin || isAdminToken(token)) {
        socket.data.isAdmin = true;
        socket.join("admins");
      }
    });

    // Customer clients join a private room for their order so they
    // only receive readiness updates for their own order.
    socket.on("joinOrderRoom", async (orderId) => {
      if (!orderId || typeof orderId !== "string") return;
      try {
        const exists = await Order.exists({ orderId });
        if (exists) {
          socket.join(`order-${orderId}`);
        }
      } catch {
        // Order lookup failed — do not join the room.
      }
    });

    socket.on("leaveOrderRoom", (orderId) => {
      if (orderId && typeof orderId === "string") {
        socket.leave(`order-${orderId}`);
      }
    });

    // Loyalty: join a private room keyed by phone so the customer instantly
    // receives the flash message the moment an admin approves their claim.
    socket.on("joinPhoneRoom", (phone) => {
      if (typeof phone === "string" && /^\d{10}$/.test(phone)) {
        socket.join(`phone-${phone}`);
      }
    });

    socket.on("leavePhoneRoom", (phone) => {
      if (typeof phone === "string" && /^\d{10}$/.test(phone)) {
        socket.leave(`phone-${phone}`);
      }
    });

    socket.on("disconnect", () => {
      // Rooms are cleaned up automatically by Socket.IO on disconnect.
    });
  });

  return io;
}

export function getSocketIO() {
  return io;
}
