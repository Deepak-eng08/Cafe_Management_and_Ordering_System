// Centered popup shown to a customer when the cafe approves their loyalty
// reward claim. Auto-dismisses after a few seconds (handled by the Rewards
// page) or on button tap.
export default function RewardApprovedPopup({ rewardName, onClose }) {
  if (!rewardName) return null

  const confettiPositions = [
    "-left-1 top-3",
    "-right-2 top-8",
    "left-7 -top-2",
    "right-12 -top-1",
    "left-2 bottom-14",
    "right-3 bottom-9",
    "-top-3 left-1/2",
    "bottom-2 right-1/2",
  ]

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1F1F1F]/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-toast-pop relative w-full max-w-sm overflow-hidden rounded-3xl border border-[#C69214]/50 bg-[#37261E] p-7 text-center shadow-2xl shadow-[#1F1F1F]/50"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Reward claimed"
      >
        <div className="pointer-events-none absolute -top-16 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[#C69214]/30 blur-3xl" aria-hidden="true" />
        <div aria-hidden="true">
          {confettiPositions.map((pos, i) => (
            <span
              key={i}
              className={`confetti-dot absolute ${pos}`}
              style={{ animationDelay: `${i * 0.14}s` }}
            />
          ))}
        </div>

        <div className="relative">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#C69214] to-[#A97400] text-4xl shadow-gold-glow ring-4 ring-[#C69214]/20" aria-hidden="true">
            🎉
          </div>
          <h2 className="mt-5 font-serif text-2xl font-bold text-[#FDF0F0]">
            Reward Claimed!
          </h2>
          <p className="mt-2 font-serif text-lg font-semibold text-[#C69214]">
            {rewardName}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#E7DCCB]/90">
            Your claimed reward has been approved and will be served soon.
          </p>
          <div className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300">
            <span aria-hidden="true">✓</span> Approved by the cafe
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-3d-gold-sm mt-6 w-full text-sm"
          >
            Enjoy!
          </button>
        </div>
      </div>
    </div>
  )
}
