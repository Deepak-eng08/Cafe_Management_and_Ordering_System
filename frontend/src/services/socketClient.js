import { io } from "socket.io-client"
import { API_URL } from "../apiUrl"
import { getToken } from "../adminAuth"

let socket = null
let adminRegistered = false
const orderRooms = new Set()
const phoneRooms = new Set()

// Single shared Socket.IO connection with automatic reconnection.
// Rooms are re-joined and admin registration is re-emitted on every
// (re)connect so refresh + flaky networks keep working seamlessly.
function getSocket() {
  if (socket) return socket

  socket = io(API_URL || undefined, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    // Send the current admin JWT in the handshake so the server can verify it.
    auth: { token: getToken() },
  })

  socket.on("connect", () => {
    // Re-register on every (re)connect with the current token. The server
    // verifies it before granting access to the "admins" room.
    if (adminRegistered) socket.emit("registerAdmin", { token: getToken() })
    for (const orderId of orderRooms) {
      socket.emit("joinOrderRoom", orderId)
    }
    for (const phone of phoneRooms) {
      socket.emit("joinPhoneRoom", phone)
    }
  })

  return socket
}

// Admin panel: join the shared "admins" room (re-joined on reconnect).
export function registerAdminSocket() {
  const s = getSocket()
  adminRegistered = true
  if (s.connected) s.emit("registerAdmin", { token: getToken() })
  return s
}

// Customer: join a private room for their order (re-joined on reconnect).
export function joinOrderRoom(orderId) {
  if (!orderId) return null
  const s = getSocket()
  orderRooms.add(orderId)
  if (s.connected) s.emit("joinOrderRoom", orderId)
  return s
}

export function leaveOrderRoom(orderId) {
  orderRooms.delete(orderId)
  if (socket && orderId) socket.emit("leaveOrderRoom", orderId)
}

// Customer: join a private room keyed by their phone so the flash message
// arrives instantly when an admin approves their loyalty claim (re-joined on reconnect).
export function joinPhoneRoom(phone) {
  if (!phone) return null
  const s = getSocket()
  phoneRooms.add(phone)
  if (s.connected) s.emit("joinPhoneRoom", phone)
  return s
}

export function leavePhoneRoom(phone) {
  phoneRooms.delete(phone)
  if (socket && phone) socket.emit("leavePhoneRoom", phone)
}

// Subscribe to a socket event. Returns an unsubscribe function.
export function onSocketEvent(event, handler) {
  const s = getSocket()
  s.on(event, handler)
  return () => s.off(event, handler)
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  adminRegistered = false
  orderRooms.clear()
  phoneRooms.clear()
}
