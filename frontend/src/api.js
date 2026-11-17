import { API_URL } from "./apiUrl"
import { getToken, clearToken } from "./adminAuth"

// Admin-only requests carry the JWT. On 401 (expired/invalid token) the token
// is cleared and the page reloads to the login screen.
async function adminFetch(url, options = {}) {
  const token = getToken()
  const headers = { ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, { ...options, headers })
  if (res.status === 401) {
    clearToken()
    window.location.reload()
    throw new Error("Session expired. Please log in again.")
  }
  return res
}

export async function placeOrder(orderData) {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Could not place order")
  return data
}

export async function getOrders(params = {}) {
  const query = new URLSearchParams()
  if (params.filter) query.set("filter", params.filter)
  if (params.search) query.set("search", params.search)
  if (params.from) query.set("from", params.from)
  if (params.to) query.set("to", params.to)
  if (params.page) query.set("page", params.page)
  if (params.limit) query.set("limit", params.limit)
  const qs = query.toString()
  const res = await adminFetch(`${API_URL}/api/orders${qs ? "?" + qs : ""}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Could not load orders")
  return data
}

export async function getSalesStats(params = {}) {
  const query = new URLSearchParams()
  if (params.filter) query.set("filter", params.filter)
  if (params.search) query.set("search", params.search)
  if (params.from) query.set("from", params.from)
  if (params.to) query.set("to", params.to)
  const qs = query.toString()
  const res = await adminFetch(`${API_URL}/api/orders/stats${qs ? "?" + qs : ""}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Could not load stats")
  return data
}

// Downloads the admin-only .xlsx sales report for the active date range (a
// preset filter like today/thisWeek/thisMonth/lastMonth, or a custom from/to
// pair). Uses a raw fetch so we can grab the binary blob (JSON parsing would
// corrupt it).
export async function exportSalesToExcel({ filter, from, to }) {
  const query = new URLSearchParams()
  if (filter) query.set("filter", filter)
  if (from) query.set("from", from)
  if (to) query.set("to", to)
  const qs = query.toString()
  const token = getToken()
  const res = await fetch(`${API_URL}/api/orders/export?${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (res.status === 401) {
    clearToken()
    window.location.reload()
    throw new Error("Session expired. Please log in again.")
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || "Unable to generate sales report. Please try again.")
  }
  const blob = await res.blob()
  const disposition = res.headers.get("Content-Disposition") || ""
  const nameMatch = /filename="?([^";]+)"?/.exec(disposition)
  const fallbackName =
    from && to
      ? `Sales_Report_${from}_to_${to}.xlsx`
      : `Sales_Report_${filter || "date-range"}.xlsx`
  const filename = nameMatch ? nameMatch[1] : fallbackName
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return { filename }
}

export async function updateOrderStatus(orderId, status) {
  const res = await adminFetch(`${API_URL}/api/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Could not update status")
  return data
}

export async function deleteOrders(ids) {
  const res = await adminFetch(`${API_URL}/api/orders`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Could not delete orders")
  return data
}

export async function deleteAllOrders() {
  const res = await adminFetch(`${API_URL}/api/orders/all`, {
    method: "DELETE",
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Could not delete orders")
  return data
}

export async function getRewardsByPhone(phone) {
  const res = await fetch(`${API_URL}/api/customers/${phone}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "No reward history found.")
  return data
}

export async function getKitchenStatus() {
  const res = await fetch(`${API_URL}/api/kitchen-status`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Could not get kitchen status")
  return data
}

export async function getActiveOffers() {
  const res = await fetch(`${API_URL}/api/offers/customer`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Could not load offers")
  return data
}

export async function setKitchenStatus(status) {
  const res = await adminFetch(`${API_URL}/api/kitchen-status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Could not update kitchen status")
  return data
}

export async function claimReward(phone, rewardName) {
  const res = await fetch(`${API_URL}/api/loyalty/${phone}/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rewardName }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Could not submit reward claim")
  return data
}

export async function getClaimStatus(phone) {
  const res = await fetch(`${API_URL}/api/loyalty/${phone}/claim-status`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Could not check claim status")
  return data
}

export async function getCustomerLoyalty(phone) {
  const res = await fetch(`${API_URL}/api/loyalty/${phone}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Could not load loyalty data")
  return data
}
