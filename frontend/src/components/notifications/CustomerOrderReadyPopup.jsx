import { useNotifications } from "../../context/NotificationContext"

// Centered popup shown to a customer when their order is ready.
// Auto-dismisses after 8 seconds (handled in the context) or on "OK".
export default function CustomerOrderReadyPopup() {
  const { customerReady, dismissCustomerReady } = useNotifications()

  if (!customerReady) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1F1F1F]/60 p-4 backdrop-blur-sm"
      onClick={dismissCustomerReady}
    >
      <div
        className="animate-toast-pop w-full max-w-sm rounded-3xl border border-[#C69214]/50 bg-[#37261E] p-6 text-center shadow-2xl shadow-[#1F1F1F]/50"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Order ready"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#C69214]/20 text-3xl" aria-hidden="true">
          🍽️
        </div>
        <h2 className="mt-4 font-serif text-2xl font-bold text-[#FDF0F0]">
          Your Order is Ready!
        </h2>
        <p className="mt-1 font-serif text-lg font-semibold text-[#C69214]">
          Table {customerReady.tableNumber}
        </p>
        <p className="mt-2 text-sm text-[#E7DCCB]/90">
          Please collect your order from the counter.
        </p>
        <button
          type="button"
          onClick={dismissCustomerReady}
          className="btn-3d-gold-sm mt-6 w-full text-sm"
        >
          OK
        </button>
      </div>
    </div>
  )
}
