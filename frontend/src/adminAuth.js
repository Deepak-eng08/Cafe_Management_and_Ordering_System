// Server-side admin authentication — JWT based.
// The security boundary is the BACKEND: it verifies the JWT on every admin
// request. This module only stores the token returned by POST /api/admin/login.
// No password ever lives in the frontend.
export const TOKEN_KEY = "cafe_admin_token"

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

export function isAdminUnlocked() {
  return Boolean(getToken())
}

export function unlockAdmin(token) {
  setToken(token)
}

export function lockAdmin() {
  clearToken()
}
