import { useNotifications } from "../../context/NotificationContext"
import { formatPrice } from "../../price"

// Queued stack of "New Order" toasts in the top-right corner.
// Multiple orders arriving together stack instead of replacing each other.
function AdminToast({ toast, onDismiss, onViewOrder }) {
  const d = toast.data

  return (
    <div className="animate-toast-slide-in overflow-hidden rounded-2xl border border-[#C69214]/40 bg-[#37261E] text-[#FDF0F0] shadow-2xl shadow-[#1F1F1F]/40">
      <div className="flex items-center gap-2 border-b border-[#C69214]/25 bg-[#4B352A]/60 px-4 py-2.5">
        <span className="text-base" aria-hidden="true">🔔</span>
        <p className="font-serif text-sm font-bold text-[#C69214]">New Order Received</p>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-auto flex h-6 w-6 items-center justify-center rounded-lg text-xs text-[#E7DCCB]/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>

      <div className="px-4 py-3 text-sm">
        <p className="text-[#E7DCCB]/90">
          Table : <span className="font-bold text-[#C69214]">{d.tableNumber}</span>
        </p>
        <p className="text-[#E7DCCB]/90">
          Customer : <span className="font-semibold text-[#FDF0F0]">{d.customerName}</span>
        </p>
        <ul className="mt-2 space-y-0.5 border-t border-white/10 pt-2 text-xs text-[#E7DCCB]/80">
          {(d.items || []).slice(0, 3).map((item, i) => (
            <li key={i}>
              {item.quantity} × {item.name}
            </li>
          ))}
          {d.items && d.items.length > 3 && (
            <li className="text-[#E7DCCB]/50">+{d.items.length - 3} more</li>
          )}
        </ul>
        <p className="mt-2 font-sans text-base font-bold text-[#C69214]">₹{formatPrice(d.total)}</p>
      </div>

      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={onViewOrder}
          className="btn-3d-gold-sm w-full text-sm"
        >
          View Order
        </button>
      </div>
    </div>
  )
}

export default function AdminToastStack({ onViewOrder }) {
  const { adminToasts, dismissAdminToast } = useNotifications()

  if (adminToasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[90] flex w-[19rem] flex-col gap-3 sm:w-80">
      {adminToasts.map((toast) => (
        <AdminToast
          key={toast.id}
          toast={toast}
          onDismiss={() => dismissAdminToast(toast.id)}
          onViewOrder={() => {
            onViewOrder()
            dismissAdminToast(toast.id)
          }}
        />
      ))}
    </div>
  )
}
