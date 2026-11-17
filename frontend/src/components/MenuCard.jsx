// Single menu item card with Add to Cart
import { formatPrice } from "../price"

function MenuCard({ item, onAddToCart, kitchenOpen }) {
  const isUnavailable = item.available === false

  return (
    <article className={`group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E7DCCB] bg-[#FFFDF9] shadow-warm-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-[#C69214]/50 hover:shadow-warm-hover ${isUnavailable ? "opacity-60" : ""}`}>
      <div>
        <div className="relative overflow-hidden p-2.5">
          <img
            src={item.image}
            alt={item.name}
            className="aspect-[4/3] w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-105 sm:aspect-[4/3]"
            loading="lazy"
          />
          {isUnavailable && (
            <span className="absolute top-4 right-4 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-md">
              Unavailable
            </span>
          )}
        </div>

        <div className="space-y-2 px-5 py-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-serif text-lg font-bold sm:text-xl ${isUnavailable ? "text-[#4B352A]" : "text-[#1F1F1F]"}`}>
              {item.name}
            </h3>
          </div>

          <p className="text-xs leading-relaxed text-[#655B54] line-clamp-2 sm:text-sm">{item.description}</p>

          <div className="flex flex-wrap gap-1 pt-1">
            {item.bestseller && <span className="rounded-full bg-[#C69214]/15 px-2 py-0.5 text-[10px] font-bold text-[#C69214]">★ Bestseller</span>}
            {item.recommended && <span className="rounded-full bg-[#4B352A]/10 px-2 py-0.5 text-[10px] font-semibold text-[#4B352A]">Recommended</span>}
            {item.newArrival && <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold">New</span>}
            {item.chefsSpecial && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-800">Chef&apos;s</span>}
            {item.cinephilesPick && <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold">🎬 Pick</span>}
            {item.customersFavourite && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800">Fav</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#E7DCCB]/60 px-5 py-4">
        <div>
          <span className="block text-[10px] font-medium text-[#655B54] uppercase tracking-wider">Price</span>
          <p className={`font-sans text-xl font-extrabold text-[#C69214] ${isUnavailable ? "text-[#655B54]" : ""}`}>
            ₹{formatPrice(item.price)}
          </p>
        </div>

        {isUnavailable ? (
          <span className="rounded-xl bg-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-500 cursor-not-allowed">
            Unavailable
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onAddToCart(item)}
            disabled={!kitchenOpen}
            className={`group/cartbtn btn-add-cart min-h-[44px] gap-2 px-5 py-2.5 text-xs sm:text-sm${
              kitchenOpen ? "" : " !cursor-not-allowed !border-gray-200 !bg-gray-100 !text-gray-400 !shadow-none opacity-60"
            }`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300 group-hover/cartbtn:translate-x-[2px]"
            >
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span>{kitchenOpen ? "Add to Cart" : "Closed"}</span>
          </button>
        )}
      </div>
    </article>
  )
}

export default MenuCard

