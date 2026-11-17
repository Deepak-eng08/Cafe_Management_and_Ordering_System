import { useEffect, useRef } from "react";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  icon = "🗑️",
  confirmText = "Delete",
  cancelText = "Cancel",
  confirmColor = "red",
  loading = false,
  theme = "dark",
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (open) {
      cancelButtonRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const isDark = theme === "dark";

  const colorClasses = {
    red: isDark
      ? "bg-red-500 hover:bg-red-600 focus:ring-red-500"
      : "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    amber: isDark
      ? "bg-gold hover:bg-gold-hover focus:ring-gold text-gray-950"
      : "bg-gold hover:bg-gold-hover focus:ring-gold text-espresso",
    blue: isDark
      ? "bg-blue-500 hover:bg-blue-600 focus:ring-blue-500"
      : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
  };

  const confirmClass = colorClasses[confirmColor] || colorClasses.red;

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${isDark ? "bg-black/60" : "bg-black/40"}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl ${isDark ? "bg-gray-900 border border-gray-800" : "bg-white ring-1 ring-latte"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full text-3xl ${isDark ? "bg-gray-800" : "bg-cream"}`}>
            {icon}
          </div>
          <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-espresso"}`}>{title}</h3>
          <p className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-mocha"}`}>{description}</p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={`btn-3d-flat flex-1 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${
              isDark
                ? "bg-gray-800 text-gray-400 hover:text-white"
                : "bg-cream border border-latte text-mocha hover:text-espresso"
            }`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`btn-3d-flat flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${confirmClass} ${isDark ? "focus:ring-offset-gray-900" : "focus:ring-offset-white"}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
