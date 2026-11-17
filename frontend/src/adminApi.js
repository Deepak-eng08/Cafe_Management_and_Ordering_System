import { API_URL } from "./apiUrl";
import { getToken, clearToken } from "./adminAuth";

function authHeaders(extra = {}) {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, ...extra } : { ...extra };
}

// Expired/invalid JWT: clear it and bounce back to the login screen.
function handleUnauthorized(res) {
  if (res.status === 401) {
    clearToken();
    window.location.reload();
    return true;
  }
  return false;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders(options.headers) },
    ...options,
  });
  if (handleUnauthorized(res)) throw new Error("Session expired. Please log in again.");
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

async function multipartRequest(path, data, imageFile, method = "POST") {
  const formData = new FormData();
  for (const key in data) {
    formData.append(key, data[key]);
  }
  formData.append("image", imageFile, imageFile.name);
  const res = await fetch(`${API_URL}${path}`, {
    method,
    body: formData,
    headers: authHeaders(),
  });
  if (handleUnauthorized(res)) throw new Error("Session expired. Please log in again.");
  const parsed = await res.json();
  if (!res.ok) throw new Error(parsed.message || "Request failed");
  return parsed;
}

// Admin login — plain request (no token yet). Wrong credentials must NOT
// trigger the 401 session handler, so this bypasses `request`.
async function login(username, password) {
  const res = await fetch(`${API_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Invalid username or password");
  return data; // { success: true, token }
}

export const adminApi = {
  // Auth
  login,
  // Orders
  getOrders: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.status) q.set("filter", "today");
    if (params.page) q.set("page", params.page);
    if (params.limit) q.set("limit", params.limit);
    const qs = q.toString();
    return request(`/api/orders${qs ? "?" + qs : ""}`);
  },
  getAllOrders: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.filter) q.set("filter", params.filter);
    if (params.from) q.set("from", params.from);
    if (params.to) q.set("to", params.to);
    if (params.page) q.set("page", params.page);
    if (params.limit) q.set("limit", params.limit);
    const qs = q.toString();
    return request(`/api/orders${qs ? "?" + qs : ""}`);
  },
  updateOrderStatus: (id, status) =>
    request(`/api/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getActiveOrdersCount: () => request("/api/orders/active-count"),

  // Menu
  getMenu: (params = {}) => {
    const q = new URLSearchParams();
    if (params.category) q.set("category", params.category);
    if (params.available !== undefined) q.set("available", params.available);
    if (params.search) q.set("search", params.search);
    const qs = q.toString();
    return request(`/api/menu${qs ? "?" + qs : ""}`);
  },
  createMenuItem: (data, imageFile) =>
    imageFile
      ? multipartRequest("/api/menu", data, imageFile, "POST")
      : request("/api/menu", { method: "POST", body: JSON.stringify(data) }),
  updateMenuItem: (id, data, imageFile) =>
    imageFile
      ? multipartRequest(`/api/menu/${id}`, data, imageFile, "PUT")
      : request(`/api/menu/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMenuItem: (id) =>
    request(`/api/menu/${id}`, { method: "DELETE" }),

  // Categories
  getCategories: () => request("/api/categories"),
  createCategory: (data) =>
    request("/api/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id, data) =>
    request(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategory: (id) =>
    request(`/api/categories/${id}`, { method: "DELETE" }),
  reorderCategories: (order) =>
    request("/api/categories/reorder", { method: "PUT", body: JSON.stringify({ order }) }),

  // Offers
  getOffers: (params = {}) => {
    const q = new URLSearchParams();
    if (params.active !== undefined) q.set("active", params.active);
    const qs = q.toString();
    return request(`/api/offers${qs ? "?" + qs : ""}`);
  },
  createOffer: (data, imageFile) =>
    imageFile
      ? multipartRequest("/api/offers", data, imageFile, "POST")
      : request("/api/offers", { method: "POST", body: JSON.stringify(data) }),
  updateOffer: (id, data, imageFile) =>
    imageFile
      ? multipartRequest(`/api/offers/${id}`, data, imageFile, "PUT")
      : request(`/api/offers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteOffer: (id) =>
    request(`/api/offers/${id}`, { method: "DELETE" }),

  // Loyalty
  getLoyaltyMembers: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.page) q.set("page", params.page);
    if (params.limit) q.set("limit", params.limit);
    const qs = q.toString();
    return request(`/api/loyalty${qs ? "?" + qs : ""}`);
  },
  getLoyaltyMember: (phone) => request(`/api/loyalty/${phone}`),
  updateLoyaltyPoints: (phone, points) =>
    request(`/api/loyalty/${phone}/points`, {
      method: "PUT",
      body: JSON.stringify({ points }),
    }),
  redeemReward: (phone, reward, pointsCost) =>
    request(`/api/loyalty/${phone}/redeem`, {
      method: "POST",
      body: JSON.stringify({ reward, pointsCost }),
    }),
  deleteLoyaltyMembers: (ids) =>
    request(`/api/loyalty`, {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
  deleteAllLoyaltyMembers: () =>
    request(`/api/loyalty/all`, { method: "DELETE" }),

  // Reward Claims
  getPendingClaims: () => request("/api/loyalty/claims/pending"),
  getAllClaims: (params = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", params.page);
    if (params.limit) q.set("limit", params.limit);
    const qs = q.toString();
    return request(`/api/loyalty/claims/all${qs ? "?" + qs : ""}`);
  },
  getPendingClaimsCount: () => request("/api/loyalty/claims/pending-count"),
  approveClaim: (id) =>
    request(`/api/loyalty/claims/${id}/approve`, { method: "PUT" }),
  rejectClaim: (id) =>
    request(`/api/loyalty/claims/${id}/reject`, { method: "PUT" }),
  getRewardHistory: (params = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", params.page);
    if (params.limit) q.set("limit", params.limit);
    const qs = q.toString();
    return request(`/api/loyalty/history${qs ? "?" + qs : ""}`);
  },

  // Kitchen
  getKitchenStatus: () => request("/api/kitchen-status"),
  setKitchenStatus: (status) =>
    request("/api/kitchen-status", {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  // Customers (from loyalty)
  getCustomers: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.page) q.set("page", params.page);
    if (params.limit) q.set("limit", params.limit);
    const qs = q.toString();
    return request(`/api/loyalty${qs ? "?" + qs : ""}`);
  },

  // Website Content
  getWebsiteContent: () => request("/api/website-content"),
  updateWebsiteContent: (data) =>
    request("/api/website-content", { method: "PUT", body: JSON.stringify(data) }),

  // Cloudinary
  uploadCloudinaryImage: (fileData, folder = "cafe") =>
    request("/api/cloudinary/upload", {
      method: "POST",
      body: JSON.stringify({ file: fileData, folder }),
    }),
  getCloudinaryImages: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.folder) q.set("folder", params.folder);
    if (params.nextCursor) q.set("nextCursor", params.nextCursor);
    const qs = q.toString();
    return request(`/api/cloudinary/images${qs ? "?" + qs : ""}`);
  },
  deleteCloudinaryImage: (publicId) =>
    request(`/api/cloudinary/images/${encodeURIComponent(publicId)}`, {
      method: "DELETE",
    }),

  // Notifications
  getNotifications: (params = {}) => {
    const q = new URLSearchParams();
    if (params.unread) q.set("unread", "true");
    const qs = q.toString();
    return request(`/api/notifications${qs ? "?" + qs : ""}`);
  },
  getUnreadCount: () => request("/api/notifications/unread-count"),
  markNotificationRead: (id) =>
    request(`/api/notifications/${id}/read`, { method: "PUT" }),
  markAllRead: () =>
    request("/api/notifications/read-all", { method: "PUT" }),
  deleteNotification: (id) =>
    request(`/api/notifications/${id}`, { method: "DELETE" }),
  clearAllNotifications: () =>
    request("/api/notifications", { method: "DELETE" }),
};
