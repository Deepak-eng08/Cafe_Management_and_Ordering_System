// Small popup message — used when an order is placed or something fails
function Toast({ message, type = "success", onClose }) {
  if (!message) return null

  const isSuccess = type === "success"

  return (
    <div
      className="fixed bottom-4 left-1/2 z-[100] w-[min(92vw,400px)] -translate-x-1/2 animate-fade-up sm:bottom-6"
      role="status"
    >
      <div
        className={`flex items-start gap-3 rounded-2xl border border-[#C69214]/50 px-4 py-3.5 shadow-2xl backdrop-blur-md ${
          isSuccess
            ? "bg-[#37261E] text-[#FFFDF9]"
            : "bg-rose-900 text-white"
        }`}
      >
        <div className="text-base shrink-0">
          {isSuccess ? "☕" : "⚠️"}
        </div>
        <p className="flex-1 text-xs leading-relaxed sm:text-sm">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-[#C69214] transition hover:text-white"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default Toast

