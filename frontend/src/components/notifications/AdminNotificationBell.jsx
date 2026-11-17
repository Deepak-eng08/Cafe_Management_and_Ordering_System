import { useEffect, useRef, useState } from "react"
import { useNotifications } from "../../context/NotificationContext"
import { formatRelativeTime } from "../../services/notificationService"

// Bell icon in the admin header showing unread count + dropdown of the
// latest real-time notifications. Clicking one jumps to the Orders page.
export default function AdminNotificationBell({ onNavigateOrders }) {
  const { bellNotifications, unreadBell, markBellAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [])

  function handleItemClick() {
    setOpen(false)
    markBellAllRead()
    onNavigateOrders()
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-3d-flat relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#C69214]/30 bg-[#FFFDF9] text-[#4B352A]"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadBell > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C69214] px-1.5 text-[10px] font-bold text-white ring-2 ring-[#FFFDF9]">
            {unreadBell > 99 ? "99+" : unreadBell}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-slide-down absolute right-0 z-[95] mt-2 w-80 overflow-hidden rounded-2xl border border-[#E7DCCB] bg-[#FFFDF9] shadow-2xl shadow-[#1F1F1F]/20">
          <div className="flex items-center justify-between border-b border-[#E7DCCB] bg-[#FDF0F0] px-4 py-3">
            <p className="font-serif text-sm font-bold text-[#1F1F1F]">Notifications</p>
            {unreadBell > 0 && (
              <button
                type="button"
                onClick={markBellAllRead}
                className="text-xs font-medium text-[#C69214] hover:text-[#A6780C]"
              >
                Mark all read
              </button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {bellNotifications.length === 0 ? (
              <li className="px-4 py-10 text-center text-xs text-[#655B54]">
                No notifications yet.
              </li>
            ) : (
              bellNotifications.map((notif) => (
                <li key={notif.id}>
                  <button
                    type="button"
                    onClick={handleItemClick}
                    className={`flex w-full items-start gap-3 border-b border-[#E7DCCB]/50 px-4 py-3 text-left transition hover:bg-[#FDF0F0] ${
                      notif.read ? "" : "bg-[#C69214]/5"
                    }`}
                  >
                    <span className="mt-0.5 text-base" aria-hidden="true">🔔</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-[#1F1F1F]">
                        New Order
                      </span>
                      <span className="block text-[11px] text-[#655B54]">
                        Table {notif.data?.tableNumber} · {notif.data?.customerName}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-[#C69214]">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </span>
                    {!notif.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#C69214]" />
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
