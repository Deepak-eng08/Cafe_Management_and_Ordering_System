function Navbar({
  currentPage,
  onNavigate,
  cartCount,
  onOpenCart,
}) {
  const links = [
    { id: "home", label: "Home" },
    { id: "menu", label: "Menu" },
    { id: "offers", label: "Offers" },
    { id: "rewards", label: "Loyalty Rewards" },
    { id: "about", label: "About Us" },
  ]

  function handleNav(id) {
    if (id === "home" || id === "menu" || id === "offers" || id === "rewards") {
      onNavigate(id)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    onNavigate(currentPage === "menu" ? "menu" : "home")
    setTimeout(() => {
      const el = document.getElementById("about")
      el?.scrollIntoView({ behavior: "smooth" })
    }, 50)
  }

  return (
    <header className="animate-slate-in sticky top-0 z-50 w-full border-b border-[#C69214]/40 bg-gradient-to-b from-[#181411] via-[#221B16] to-[#181411] backdrop-blur-md shadow-[0_6px_22px_rgba(0,0,0,0.6)] transition-all duration-300">
      {/* Cinematic clapboard top stick with metal hinge bracket */}
      <div aria-hidden="true" className="clapboard-strip relative">
        {/* Metal clapper hinge bracket with rivets */}
        <div className="clapboard-hinge">
          <span className="slate-rivet" />
          <span className="slate-rivet" />
        </div>
      </div>

      <div aria-hidden="true" className="film-sprocket mx-auto hidden w-full max-w-7xl sm:block" />

      <nav className="slate-surface relative mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-8">
        {/* Viewfinder film corner details (desktop) */}
        <div aria-hidden="true" className="viewfinder-corners pointer-events-none absolute inset-0 hidden lg:block" />

        {/* Top row: logo (left) + cart & table badge (right) on mobile/tablet */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Cinephile's Café Logo matching the reference hanging sign */}
          <button
            type="button"
            onClick={() => handleNav("home")}
            className="group flex items-center gap-3 focus:outline-none"
            aria-label="Cinephile's Café home"
          >
            {/* Circular Badge Logo with slate metallic frame */}
            <div className="animate-wave-logo relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full overflow-hidden shadow-lg ring-2 ring-[#C69214] bg-white transition-transform duration-300 group-hover:scale-105">
              <img
                src="/logo_image.png"
                alt="Cinephile's Café Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="text-left leading-none">
              <span className="animate-wave-text block font-serif text-lg font-bold tracking-tight text-[#FFFDF9] sm:text-xl">
                CINEPHILE&apos;S
              </span>
              <span className="animate-wave-text mt-0.5 block font-serif text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C69214]">
                CAFÉ
              </span>
            </div>
          </button>

          {/* Mobile/tablet: Cart trigger button */}
          <div className="flex items-center gap-2.5 lg:hidden">
            {currentPage === "menu" && (
              <button
                type="button"
                onClick={onOpenCart}
                className="btn-3d-flat relative inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#C69214]/60 bg-gradient-to-b from-[#FFFDF9] to-[#E7DCCB] px-3 text-xs font-semibold text-[#1F1F1F] shadow-md"
                aria-label="Open cart"
              >
                Cart
                {cartCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C69214] px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Navigation links — movie slate nav bar */}
        <ul className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 lg:flex-1 lg:flex-nowrap lg:gap-6 xl:gap-8">
          {links.map((link) => {
            const isActive = currentPage === link.id
            return (
              <li key={link.id}>
                <button
                  type="button"
                  onClick={() => handleNav(link.id)}
                  className={`hover-underline-gold relative py-1 text-xs font-medium tracking-wide transition-all duration-200 hover:-translate-y-px sm:text-sm ${isActive
                    ? "font-semibold text-[#C69214]"
                    : "text-[#E7DCCB]/90 hover:text-[#C69214]"
                    }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-[#C69214] shadow-[0_0_10px_rgba(198,146,20,0.9)]" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {/* Desktop: Cart trigger button */}
        <div className="hidden items-center gap-3.5 lg:flex">
          {currentPage === "menu" && (
            <button
              type="button"
              onClick={onOpenCart}
              className="btn-add-cart group gap-2 px-4 py-2 text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-[2px]">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Cart
              {cartCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C69214] px-1 text-xs font-bold text-white group-hover:bg-white group-hover:text-[#C69214] transition-colors duration-300">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
