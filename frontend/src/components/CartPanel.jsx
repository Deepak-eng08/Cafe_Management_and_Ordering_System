import { useState } from "react"
import { placeOrder } from "../api"
import { joinOrderRoom } from "../services/socketClient"
import { formatPrice } from "../price"

// Side cart — review items, enter name, place order
function CartPanel({
  open,
  cart,
  onClose,
  onUpdateQty,
  onRemove,
  onClear,
  onNotify,
  onOrderPlaced,
  kitchenOpen,
}) {
  const [customerName, setCustomerName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [tableNumber, setTableNumber] = useState("")

  const [loading, setLoading] = useState(false)

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  async function handlePlaceOrder(e) {
    e.preventDefault()

    if (cart.length === 0) {
      onNotify("Your cart is empty.", "error")
      return
    }

    if (!phoneNumber.trim()) {
      onNotify("Phone number is required.", "error")
      return
    }

    setLoading(true)
    try {
      const order = await placeOrder({
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        tableNumber: tableNumber.trim(),
        items: cart.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      })

      onClear()
      setCustomerName("")
      setPhoneNumber("")
      setTableNumber("")
      onClose()
      localStorage.setItem("currentOrderId", order.orderId)
      joinOrderRoom(order.orderId)
      onNotify(
        `Order placed! Total ₹${formatPrice(order.total)}. The kitchen has been notified.`,
        "success"
      )
      onOrderPlaced?.()
    } catch (err) {
      onNotify(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Dimmed background overlay */}
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-[#1F1F1F]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-label="Close cart"
      />

      <aside className="fixed inset-0 z-[70] flex h-full w-full flex-col border-l border-[#E7DCCB] bg-[#FFFDF9] shadow-2xl transition-all sm:inset-auto sm:top-0 sm:right-0 sm:max-w-md">
        {/* Cart Header */}
        <div className="flex items-center justify-between border-b border-[#E7DCCB] px-5 py-4">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C69214" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <h2 className="font-serif text-xl font-bold text-[#1F1F1F]">
              Your Cinephile Order
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-3d-flat flex h-10 w-10 items-center justify-center rounded-xl border border-[#E7DCCB] bg-[#FDF0F0] text-[#4B352A] sm:h-9 sm:w-9"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#FDF0F0] text-[#C69214]">
                🛒
              </div>
              <p className="font-serif text-base font-bold text-[#1F1F1F]">
                Your cart is empty
              </p>
              <p className="mt-1 text-xs text-[#655B54]">
                Explore our menu and add your favourite items.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {cart.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[#E7DCCB]/60 bg-[#FDF0F0]/50 p-3.5 shadow-sm"
                >
                  <div className="flex-1">
                    <p className="font-serif text-sm font-bold text-[#1F1F1F]">{item.name}</p>
                    <p className="text-xs text-[#C69214] font-semibold">₹{formatPrice(item.price)} each</p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                        className="btn-3d-flat flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7DCCB] bg-[#FFFDF9] text-sm font-bold text-[#1F1F1F] sm:h-7 sm:w-7"
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-xs font-bold text-[#1F1F1F]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                        className="btn-3d-flat flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7DCCB] bg-[#FFFDF9] text-sm font-bold text-[#1F1F1F] sm:h-7 sm:w-7"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-base font-extrabold text-[#1F1F1F]">
                      ₹{formatPrice(item.price * item.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="mt-2.5 px-2 py-1 text-xs text-rose-700 underline hover:text-rose-900"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Checkout Form */}
        <form
          onSubmit={handlePlaceOrder}
          className="border-t border-[#E7DCCB] bg-[#FFFDF9] p-5 shadow-lg"
        >
          <div className="mb-4 flex items-center justify-between border-b border-[#E7DCCB]/60 pb-3">
            <span className="font-serif text-base font-bold text-[#1F1F1F]">Grand Total</span>
            <span className="font-sans text-2xl font-extrabold text-[#C69214]">₹{formatPrice(total)}</span>
          </div>

          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#4B352A]">
              Your Name
            </span>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-xl border border-[#E7DCCB] bg-[#FDF0F0] px-3.5 py-2.5 text-sm text-[#1F1F1F] outline-none transition focus:border-[#C69214] focus:ring-2 focus:ring-[#C69214]/20"
              placeholder="e.g. Riya"
            />
          </label>

          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#4B352A]">
              Table Number <span className="text-rose-600">*</span>
            </span>
            <input
              type="text"
              required
              inputMode="numeric"
              pattern="[0-9]*"
              title="Enter a table number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl border border-[#E7DCCB] bg-[#FDF0F0] px-3.5 py-2.5 text-sm text-[#1F1F1F] outline-none transition focus:border-[#C69214] focus:ring-2 focus:ring-[#C69214]/20"
              placeholder="e.g. 12"
            />
          </label>

          <div className="relative mb-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#4B352A]">
                Phone Number <span className="text-rose-600">*</span>
              </span>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-xl border border-[#E7DCCB] bg-[#FDF0F0] px-3.5 py-2.5 text-sm text-[#1F1F1F] outline-none transition focus:border-[#C69214] focus:ring-2 focus:ring-[#C69214]/20"
                placeholder="e.g. 9876543210"
              />
            </label>

            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[#4B352A]">
              <span>🎁</span>
              <span>Fill correct phone number to track your loyalty rewards.</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || cart.length === 0 || !kitchenOpen}
            className={`btn-3d-gold-sm w-full min-h-[48px] py-3.5 text-sm${
              kitchenOpen ? "" : " !cursor-not-allowed !bg-gray-200 !text-gray-400 !shadow-none"
            }`}
          >
            {loading
              ? "Placing order..."
              : kitchenOpen
                ? "Place Order Now"
                : "Kitchen is Closed"}
          </button>

          {!kitchenOpen && cart.length > 0 && (
            <p className="mt-3 text-center text-xs font-medium text-rose-600">
              Sorry! The kitchen is currently closed. Please visit again later.
            </p>
          )}
        </form>
      </aside>
    </>
  )
}

export default CartPanel

