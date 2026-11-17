import { useEffect, useState } from "react"
import { getActiveOffers } from "../api"

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function daysLeft(dateStr) {
  const diff = new Date(dateStr) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function OfferCard({ offer, type }) {
  const isAvailable = type === "available"

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#E7DCCB] bg-[#FFFDF9] shadow-warm-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-[#C69214]/50 hover:shadow-warm-hover sm:rounded-2xl">
      {offer.image && (
        <div className="relative h-44 overflow-hidden sm:h-56">
          <img
            src={offer.image}
            alt={offer.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F1F1F]/80 via-[#1F1F1F]/20 to-transparent" />
          {isAvailable && (
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-md backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              Live Deal
            </span>
          )}
          {!isAvailable && (
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-[#C69214]/90 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-md backdrop-blur-md">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Coming Soon
            </span>
          )}
          
          {/* Movie-themed badge icon */}
          <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F1F1F]/80 text-[#C69214] border border-[#C69214]/40 backdrop-blur-md">
            🎬
          </div>
        </div>
      )}

      {!offer.image && (
        <div className={`relative flex flex-col items-center justify-center py-10 px-6 text-center border-b border-[#E7DCCB]/60 ${
          isAvailable
            ? "bg-gradient-to-br from-[#C69214]/10 via-[#FDF0F0] to-[#C69214]/5"
            : "bg-gradient-to-br from-[#4B352A]/10 via-[#FDF0F0] to-[#4B352A]/5"
        }`}>
          <div className="mb-2 text-3xl">🍿</div>
          {isAvailable ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Deal
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#C69214]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#C69214] border border-[#C69214]/20">
              Coming Soon
            </span>
          )}
        </div>
      )}

      <div className="px-5 py-5 sm:px-7 sm:py-7">
        <h3 className="font-serif text-xl font-bold text-[#1F1F1F] sm:text-2xl">
          {offer.title}
        </h3>

        {offer.description && (
          <p className="mt-2.5 text-xs leading-relaxed text-[#655B54] sm:text-sm">
            {offer.description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E7DCCB]/60 pt-4">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7DCCB] bg-[#FDF0F0] px-3.5 py-1.5 text-xs font-semibold text-[#4B352A]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
            {formatDate(offer.startDate)} — {formatDate(offer.endDate)}
          </span>

          {isAvailable && (
            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-3.5 py-1.5 text-xs font-bold text-emerald-800">
              {daysLeft(offer.endDate) === 0
                ? "Ends today!"
                : `${daysLeft(offer.endDate)} day${daysLeft(offer.endDate) > 1 ? "s" : ""} left`}
            </span>
          )}

          {!isAvailable && (
            <span className="inline-flex items-center gap-1 rounded-xl bg-[#C69214]/15 px-3.5 py-1.5 text-xs font-bold text-[#C69214]">
              Starts {formatDate(offer.startDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ type }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7DCCB] bg-[#FFFDF9] px-6 py-14 text-center shadow-warm-soft">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FDF0F0] text-[#C69214]">
        {type === "available" ? "🎟️" : "⏰"}
      </div>
      <p className="font-serif text-lg font-bold text-[#1F1F1F]">
        {type === "available"
          ? "No active offers right now"
          : "No upcoming offers yet"}
      </p>
      <p className="mt-1.5 max-w-xs text-xs text-[#655B54] sm:text-sm">
        {type === "available"
          ? "Check back soon — special cinema deals are always cooking!"
          : "Stay tuned! Exciting promotions are coming your way."}
      </p>
    </div>
  )
}

function Offers() {
  const [availableOffers, setAvailableOffers] = useState([])
  const [upcomingOffers, setUpcomingOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("available")

  useEffect(() => {
    async function fetchOffers() {
      try {
        const allOffers = await getActiveOffers()
        const available = []
        const upcoming = []

        for (const offer of allOffers) {
          const status = offer.status || "active"
          if (status === "upcoming") {
            upcoming.push(offer)
          } else {
            available.push(offer)
          }
        }

        setAvailableOffers(available)
        setUpcomingOffers(upcoming)
      } catch {
        setError("Could not load offers. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchOffers()

    const offerChannel = new BroadcastChannel("offer-updates")
    offerChannel.onmessage = () => fetchOffers()

    function handleStorage(e) {
      if (e.key === "offerUpdated") fetchOffers()
    }
    window.addEventListener("storage", handleStorage)

    const interval = setInterval(fetchOffers, 10000)

    return () => {
      offerChannel.close()
      window.removeEventListener("storage", handleStorage)
      clearInterval(interval)
    }
  }, [])

  const currentOffers = activeTab === "available" ? availableOffers : upcomingOffers

  return (
    <main className="min-h-screen bg-[#FDF0F0]">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#37261E] via-[#4B352A] to-[#37261E] pt-14 pb-16 text-white sm:pt-20 sm:pb-24">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#C69214]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#C69214]/15 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-2xl px-4 text-center sm:px-6">
          <p className="font-serif text-xs font-semibold uppercase tracking-[0.25em] text-[#C69214]">
            Exclusive Cinema Discounts
          </p>
          <h1 className="mt-2 font-serif text-3xl font-extrabold text-[#FFFDF9] sm:text-5xl">
            Our <span className="italic text-[#C69214]">Offers</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#E7DCCB]/90 sm:text-base">
            Don&apos;t miss out on special combo deals, student discounts, and film night vouchers!
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-5xl">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#E7DCCB] border-t-[#C69214]" />
              <p className="mt-4 text-sm font-semibold text-[#4B352A]">Loading offers...</p>
            </div>
          )}

          {error && !loading && (
            <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-center">
              <p className="text-xs font-medium text-rose-700">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Tab Switcher */}
              <div className="mb-8 flex rounded-xl border border-[#E7DCCB] bg-[#FFFDF9] p-1.5 shadow-warm-soft">
                <button
                  type="button"
                  onClick={() => setActiveTab("available")}
                  className={`btn-tab-pill relative flex-1 px-4 py-3 text-xs sm:text-sm ${
                    activeTab === "available" ? "active" : ""
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  Live Offers
                  {availableOffers.length > 0 && (
                    <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                      activeTab === "available"
                        ? "bg-white text-[#C69214]"
                        : "bg-[#C69214]/15 text-[#C69214]"
                    }`}>
                      {availableOffers.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("upcoming")}
                  className={`btn-tab-pill relative flex-1 px-4 py-3 text-xs sm:text-sm ${
                    activeTab === "upcoming" ? "active" : ""
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Upcoming Offers
                  {upcomingOffers.length > 0 && (
                    <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                      activeTab === "upcoming"
                        ? "bg-white text-[#C69214]"
                        : "bg-[#C69214]/15 text-[#C69214]"
                    }`}>
                      {upcomingOffers.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Header Title */}
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDF0F0] text-[#C69214] border border-[#E7DCCB]">
                  {activeTab === "available" ? "🎟️" : "⏳"}
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#1F1F1F] sm:text-2xl">
                    {activeTab === "available" ? "Available Offers" : "Upcoming Offers"}
                  </h2>
                  <p className="text-xs text-[#655B54]">
                    {activeTab === "available"
                      ? "Grab these exclusive cafe deals before they expire!"
                      : "Promotions and film combo deals coming soon"}
                  </p>
                </div>
              </div>

              {/* Offers List */}
              {currentOffers.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {currentOffers.map((offer) => (
                    <OfferCard key={offer._id} offer={offer} type={activeTab} />
                  ))}
                </div>
              ) : (
                <EmptyState type={activeTab} />
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default Offers

