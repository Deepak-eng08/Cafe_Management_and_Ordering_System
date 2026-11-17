import { useState, useEffect, useRef, useCallback } from "react"
import { getRewardsByPhone, claimReward, getClaimStatus } from "../api"
import { onSocketEvent, joinPhoneRoom, leavePhoneRoom } from "../services/socketClient"
import { playCustomerDing } from "../services/notificationService"
import RewardApprovedPopup from "../components/notifications/RewardApprovedPopup"

const REWARDS = [
  { pointsCost: 5, prize: "Free Coffee ☕", icon: "☕", description: "Enjoy one complimentary Hot or Cold Coffee." },
  { pointsCost: 10, prize: "Free Dessert 🍰", icon: "🍰", description: "Enjoy one complimentary Dessert of your choice." },
  { pointsCost: 20, prize: "Free Pizza 🍕", icon: "🍕", description: "Enjoy one complimentary Pizza from our menu." },
]

const FLASH_MS = 8000

function Rewards() {
  const [phone, setPhone] = useState("")
  const [customer, setCustomer] = useState(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [loading, setLoading] = useState(false)
  const [claiming, setClaiming] = useState(null)
  const [confirmReward, setConfirmReward] = useState(null)
  const [pendingClaim, setPendingClaim] = useState(null)
  const [approvedReward, setApprovedReward] = useState(null)
  const pollRef = useRef(null)
  const flashTimerRef = useRef(null)
  const shownClaimsRef = useRef(new Set())
  const activePhoneRef = useRef(null)

  async function fetchClaimStatus(phoneNum) {
    try {
      const data = await getClaimStatus(phoneNum)
      setPendingClaim(data.pendingClaim)
      return data.latestClaim || null
    } catch {
      setPendingClaim(null)
      return null
    }
  }

  const showApprovedFlash = useCallback((claimId, rewardName) => {
    const key = String(claimId || rewardName)
    if (shownClaimsRef.current.has(key)) return
    shownClaimsRef.current.add(key)
    setApprovedReward(rewardName)
    playCustomerDing()
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = window.setTimeout(() => {
      setApprovedReward(null)
      flashTimerRef.current = null
    }, FLASH_MS)
  }, [])

  // Join a private socket room for this phone so the "reward approved" flash
  // arrives the instant an admin approves the claim.
  useEffect(() => {
    if (!customer) return
    activePhoneRef.current = customer.phone
    joinPhoneRoom(customer.phone)
    return () => {
      leavePhoneRoom(customer.phone)
      if (activePhoneRef.current === customer.phone) activePhoneRef.current = null
    }
  }, [customer?.phone])

  // Real-time flash on approval (delivered via the phone room).
  useEffect(() => {
    const off = onSocketEvent("rewardApproved", (data) => {
      if (!data || !data.rewardName) return
      if (activePhoneRef.current && data.phone && data.phone !== activePhoneRef.current) return
      showApprovedFlash(data.claimId, data.rewardName)
    })
    return off
  }, [showApprovedFlash])

  useEffect(() => {
    if (!customer) {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }
    pollRef.current = setInterval(async () => {
      try {
        const data = await getRewardsByPhone(customer.phone)
        setCustomer(data)
        const latest = await fetchClaimStatus(customer.phone)
        if (latest && latest.status === "approved") {
          showApprovedFlash(latest._id, latest.rewardName)
        }
      } catch {}
    }, 5000)
    return () => clearInterval(pollRef.current)
  }, [customer?.phone, showApprovedFlash])

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    }
  }, [])

  async function handleSearch(e) {
    e.preventDefault()
    setCustomer(null)
    setErrorMsg("")
    setSuccessMsg("")
    setPendingClaim(null)
    setApprovedReward(null)
    if (pollRef.current) clearInterval(pollRef.current)

    if (!/^\d{10}$/.test(phone)) {
      setErrorMsg("Please enter a valid 10-digit phone number.")
      return
    }

    setLoading(true)
    try {
      const data = await getRewardsByPhone(phone)
      setCustomer(data)
      const latest = await fetchClaimStatus(phone)
      if (latest && latest.status === "approved") {
        showApprovedFlash(latest._id, latest.rewardName)
      }
    } catch (err) {
      setErrorMsg(err.message || "No reward history found.")
    } finally {
      setLoading(false)
    }
  }

  function handleOpenConfirm(reward) {
    setConfirmReward(reward)
    setSuccessMsg("")
  }

  function handleCancelConfirm() {
    setConfirmReward(null)
  }

  async function handleConfirmClaim() {
    if (!customer || !confirmReward) return
    setClaiming(confirmReward.prize)
    setErrorMsg("")
    setSuccessMsg("")
    try {
      const result = await claimReward(customer.phone, confirmReward.prize)
      setPendingClaim(result.claim)
      setSuccessMsg("Your reward request has been sent to the cafe. Please collect your reward after admin approval.")
      setConfirmReward(null)
    } catch (err) {
      setErrorMsg(err.message || "Could not submit claim.")
    } finally {
      setClaiming(null)
    }
  }

  function isClaimable(reward) {
    return customer && customer.loyaltyPoints >= reward.pointsCost
  }

  const hasPendingClaim = !!pendingClaim

  return (
    <main className="min-h-screen bg-[#FDF0F0]">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#37261E] via-[#4B352A] to-[#37261E] pt-14 pb-16 text-white sm:pt-20 sm:pb-24">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#C69214]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#C69214]/15 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-2xl px-4 text-center sm:px-6">
          <p className="font-serif text-xs font-semibold uppercase tracking-[0.25em] text-[#C69214]">
            Cinephile Club Loyalty
          </p>
          <h1 className="mt-2 font-serif text-3xl font-extrabold text-[#FFFDF9] sm:text-5xl">
            Your <span className="italic text-[#C69214]">Rewards</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#E7DCCB]/90 sm:text-base">
            Enter your phone number to check your balance and redeem free coffee, desserts, & pizzas!
          </p>
        </div>
      </section>

      {/* Main Section */}
      <section className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-md">
          
          {/* Phone Search Form */}
          <form
            onSubmit={handleSearch}
            className="rounded-2xl border border-[#E7DCCB] bg-[#FFFDF9] p-5 shadow-warm-soft sm:p-8"
          >
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#4B352A]">
                Phone Number
              </span>
              <input
                type="tel"
                id="rewards-phone"
                autoComplete="off"
                inputMode="numeric"
                pattern="[0-9]*"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                required
                placeholder="Enter your 10-digit number"
                className="w-full rounded-xl border border-[#E7DCCB] bg-[#FDF0F0] px-4 py-3 text-sm text-[#1F1F1F] outline-none transition focus:border-[#C69214] focus:ring-2 focus:ring-[#C69214]/20 sm:text-base"
              />
            </label>

            <button
              type="submit"
              id="check-rewards-btn"
              disabled={loading}
              className="btn-3d-gold-sm mt-6 w-full min-h-[48px] py-3.5 text-sm sm:text-base"
            >
              {loading ? "Checking status..." : "Check My Rewards"}
            </button>
          </form>

          {/* Feedback messages */}
          {errorMsg && !loading && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-center">
              <p className="text-xs font-semibold text-rose-700 sm:text-sm">{errorMsg}</p>
            </div>
          )}

          {successMsg && !loading && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center">
              <p className="text-xs font-semibold text-emerald-800 sm:text-sm">{successMsg}</p>
            </div>
          )}

          {/* Customer Profile & Rewards Card */}
          {customer && !loading && (
            <div className="mt-6 rounded-2xl border border-[#E7DCCB] bg-[#FFFDF9] p-6 shadow-warm-soft sm:p-7">
              <div className="mb-5 text-center">
                <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#C69214]">
                  Cinephile Club Member
                </span>
                <p className="mt-1 font-serif text-2xl font-bold text-[#1F1F1F]">
                  {customer.name}
                </p>
                <p className="mt-0.5 text-xs text-[#655B54]">{customer.phone}</p>
              </div>

              {/* Points Box */}
              <div className="mb-6 rounded-xl border border-[#C69214]/30 bg-gradient-to-r from-[#FDF0F0] via-[#FFFDF9] to-[#FDF0F0] p-4 text-center shadow-inner">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4B352A]">
                  Total Loyalty Balance
                </p>
                <p className="mt-1 font-serif text-3xl font-extrabold text-[#C69214]">
                  {customer.loyaltyPoints} <span className="text-sm font-sans font-semibold text-[#4B352A]">Points</span>
                </p>
              </div>

              {hasPendingClaim && (
                <div className="mb-6 rounded-xl border border-gold/20 bg-gold/5 p-4 text-center">
                  <p className="text-xs font-bold text-gold">
                    🟡 Pending Claim Request
                  </p>
                  <p className="mt-1 text-xs text-gold">
                    {pendingClaim.rewardName} — Waiting for cafe staff approval.
                  </p>
                </div>
              )}

              {/* Rewards Items with Progress Indicator */}
              <div className="space-y-4 border-t border-[#E7DCCB] pt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#4B352A]">
                  Available Rewards Milestones
                </p>

                {REWARDS.map((r) => {
                  const claimable = isClaimable(r)
                  const remaining = Math.max(0, r.pointsCost - customer.loyaltyPoints)
                  const progress = Math.min(100, Math.round((customer.loyaltyPoints / r.pointsCost) * 100))

                  return (
                    <div
                      key={r.pointsCost}
                      className={`rounded-xl border p-4.5 transition-all duration-300 ${
                        claimable && !hasPendingClaim
                          ? "border-[#C69214] bg-[#C69214]/10 shadow-md"
                          : "border-[#E7DCCB]/80 bg-[#FDF0F0]/60"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <span className="text-3xl shrink-0 p-1.5 bg-[#FFFDF9] rounded-xl border border-[#E7DCCB] shadow-xs">{r.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-serif text-base font-bold text-[#1F1F1F]">
                              {r.prize}
                            </p>
                            <span className="text-xs font-bold text-[#C69214]">
                              {r.pointsCost} PTS
                            </span>
                          </div>
                          
                          <p className="mt-1 text-xs text-[#655B54]">{r.description}</p>

                          {!claimable && (
                            <div className="mt-3">
                              <div className="h-2 w-full overflow-hidden rounded-full bg-[#E7DCCB]">
                                <div
                                  className="h-2 rounded-full bg-[#C69214] transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#655B54]">
                                <span>{progress}% Progress</span>
                                <span>Need {remaining} more {remaining === 1 ? "point" : "points"}</span>
                              </div>
                            </div>
                          )}

                          {claimable && !hasPendingClaim && (
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-700">
                                🟢 Ready to Claim
                              </span>
                              <button
                                onClick={() => handleOpenConfirm(r)}
                                disabled={claiming === r.prize}
                                className="btn-3d-gold-sm rounded-xl px-4 py-2 text-xs"
                              >
                                {claiming === r.prize ? "Submitting..." : "Claim Reward"}
                              </button>
                            </div>
                          )}

                          {claimable && hasPendingClaim && (
                            <div className="mt-2.5">
                              <span className="text-xs font-semibold text-gold/80">
                                🟡 Request pending approval
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Claim Confirmation Modal */}
      {confirmReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F1F1F]/60 backdrop-blur-xs px-4">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-[#E7DCCB] bg-[#FFFDF9] p-5 shadow-2xl sm:p-6">
            <h3 className="font-serif text-xl font-bold text-[#1F1F1F]">
              Confirm Reward Claim
            </h3>
            <div className="mt-4 rounded-xl border border-[#E7DCCB] bg-[#FDF0F0] p-4 text-center">
              <span className="text-4xl">{confirmReward.icon}</span>
              <p className="mt-2 font-serif text-lg font-bold text-[#1F1F1F]">
                {confirmReward.prize}
              </p>
              <p className="mt-1 text-xs text-[#655B54]">
                This will submit a reward claim request to the cafe admin.
              </p>
              <p className="mt-2 text-xs font-bold text-[#C69214]">
                {confirmReward.pointsCost} points will be deducted upon approval.
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCancelConfirm}
                className="btn-3d-outline flex-1 rounded-xl border border-[#E7DCCB] bg-[#FFFDF9] py-2.5 text-sm font-semibold text-[#4B352A]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClaim}
                disabled={claiming === confirmReward.prize}
                className="btn-3d-gold-sm flex-1 py-2.5 text-sm"
              >
                {claiming === confirmReward.prize ? "Submitting..." : "Confirm Claim"}
              </button>
            </div>
          </div>
        </div>
      )}
      <RewardApprovedPopup
        rewardName={approvedReward}
        onClose={() => setApprovedReward(null)}
      />
    </main>
  )
}

export default Rewards

