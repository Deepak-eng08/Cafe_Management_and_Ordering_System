export function formatPrice(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return "0"
  return Math.round(n).toLocaleString("en-IN")
}
