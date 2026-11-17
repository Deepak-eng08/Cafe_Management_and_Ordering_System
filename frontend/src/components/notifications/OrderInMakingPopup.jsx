import { useEffect } from "react"

// Flashy centered popup shown right after a customer places an order.
// Auto-dismisses after 8 seconds or on click / "OK".
export default function OrderInMakingPopup({ onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#1F1F1F]/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="order-in-making animate-toast-pop relative w-full max-w-sm overflow-hidden rounded-3xl border-2 border-[#C69214] bg-[#37261E] p-8 text-center shadow-2xl shadow-[#C69214]/40"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Order in making"
      >
        <div className="confetti-dot absolute left-7 top-9" aria-hidden="true" />
        <div className="confetti-dot absolute right-9 top-16" style={{ animationDelay: "0.3s" }} aria-hidden="true" />
        <div className="confetti-dot absolute bottom-12 left-10" style={{ animationDelay: "0.6s" }} aria-hidden="true" />
        <div className="confetti-dot absolute bottom-16 right-7" style={{ animationDelay: "0.9s" }} aria-hidden="true" />

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#C69214]/20 text-4xl shadow-gold-glow" aria-hidden="true">
          ☕
        </div>

        <h2 className="order-in-making-text mt-5 font-serif text-2xl font-bold uppercase tracking-wide">
          Your Order is in the Making!
        </h2>

        <div className="mx-auto mt-4 mb-1 h-px w-40 bg-gradient-to-r from-transparent via-[#C69214]/80 to-transparent" />

        <p className="mt-3 text-sm leading-relaxed text-[#E7DCCB]/90">
          Keep this page open. We'll notify you when your order is ready.
        </p>

        <button type="button" onClick={onClose} className="btn-3d-gold-sm mt-7 w-full text-sm">
          OK
        </button>
      </div>
    </div>
  )
}
