import { useState } from "react"

function Home({ onViewMenu }) {
  const [viewMenuAnim, setViewMenuAnim] = useState(false)

  function handleViewMenuClick() {
    if (viewMenuAnim) return
    setViewMenuAnim(true)
    window.setTimeout(() => {
      setViewMenuAnim(false)
      onViewMenu()
    }, 320)
  }

  return (
    <main className="bg-[#FDF0F0]">

      {/* Hero — split two-column layout */}
      <section className="relative mx-auto grid min-h-[90vh] max-w-7xl grid-cols-1 items-center gap-8 overflow-hidden px-4 py-8 sm:gap-12 sm:px-6 sm:py-12 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:overflow-visible lg:py-16">

        {/* Radial Background Glow */}
        <div className="pointer-events-none absolute top-1/2 left-1/4 -z-10 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(198,146,20,0.18)_0%,_transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 right-10 -z-10 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(75,53,42,0.12)_0%,_transparent_70%)] blur-3xl" />

        {/* Left — text content */}
        <div className="flex flex-col items-start text-left">
          <h1 className="cursor-default animate-fade-up font-serif text-[1.75rem] font-extrabold leading-[1.15] text-[#1F1F1F] sm:text-4xl lg:text-5xl xl:text-6xl">
            Welcome to <br />
            <span className="animate-wave-text text-[#C69214]">Cinephile&apos;s</span>{" "}
            <span className="animate-wave-text italic text-[#4B352A]">Café</span>
          </h1>

          <p className="animate-fade-up-delay mt-4 max-w-lg font-sans text-base leading-relaxed text-[#4B352A]/90 sm:text-lg">
            A warm cinematic sanctuary for coffee connoisseurs and film lovers. Experience handcrafted brews and artisanal meals in an atmosphere inspired by silver-screen classics.
          </p>

          {/* Action CTAs */}
          <div className="animate-fade-up-delay-2 mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4 sm:mt-10">
            <button
              type="button"
              onClick={handleViewMenuClick}
              className={`btn-view-menu min-h-[52px] w-full justify-center px-7 py-3.5 text-sm sm:w-auto sm:text-base${
                viewMenuAnim ? " view-menu-clicked" : ""
              }`}
            >
              <span aria-hidden="true" className="view-menu-flash" />
              <span aria-hidden="true" className="view-menu-sprockets" />
              <span
                aria-hidden="true"
                className="view-menu-reel flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#2E2A24] to-[#16120D] ring-1 ring-[#C69214]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C69214" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="2" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="22" y2="12" />
                </svg>
              </span>
              <span className="view-menu-text font-serif text-sm font-bold sm:text-base">
                View Menu
              </span>
              <span aria-hidden="true" className="view-menu-star hidden text-[#C69214] sm:inline-block">
                ✦
              </span>
            </button>
          </div>
        </div>

        {/* Right — premium coffee cup image with movie reel badges */}
        <div className="animate-fade-up-delay-3 relative flex items-center justify-center lg:justify-end">
          {/* Subtle glowing ring behind card */}
          <div className="absolute inset-0 rounded-[2.5rem] bg-[#C69214]/15 blur-2xl" />

          {/* Floating Card Container */}
          <div className="relative animate-soft-float w-full max-w-md overflow-hidden sm:overflow-visible">
            <div className="relative overflow-hidden rounded-[2rem] border border-[#E7DCCB] bg-[#FFFDF9] p-3 shadow-2xl shadow-[#4B352A]/10 sm:p-4">
              <img
                src="/hero_coffee.png"
                alt="Artisanal steaming coffee cup at Cinephile's Cafe"
                className="h-64 w-full rounded-[1.5rem] object-cover sm:h-96 lg:h-[28rem]"
              />

              {/* Overlay tagline pill on image */}
              <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-white/20 bg-[#1F1F1F]/75 p-3.5 backdrop-blur-md">
                <p className="font-serif text-sm font-semibold text-[#FFFDF9]">
                  &quot;Good coffee, like a good movie, stays with you forever.&quot;
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-[#C69214]">
                  Cinephile&apos;s Signature Roast
                </p>
              </div>
            </div>

            {/* Film Reel Badge — Top Right */}
            <div className="absolute top-2 right-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#1F1F1F] shadow-lg ring-2 ring-[#C69214] sm:-top-5 sm:-right-5 sm:h-16 sm:w-16">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C69214" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
              </svg>
            </div>

            {/* Gold Star Badge — Bottom Left */}
            <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-full border border-[#E7DCCB] bg-[#FFFDF9] px-3 py-1.5 shadow-lg sm:-bottom-4 sm:-left-4 sm:px-4 sm:py-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C69214] text-white">
                ★
              </span>
              <span className="font-serif text-xs font-bold text-[#1F1F1F]">
                Movie Night Special
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section — Display FOUR premium cards */}
      <section id="about" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-serif text-xs font-semibold uppercase tracking-[0.25em] text-[#C69214]">
            Why Cinephile&apos;s Café
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-[#1F1F1F] sm:text-4xl">
            The Cinema & Coffee Experience
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#655B54] sm:text-base">
            We blend classic cinema aesthetics with artisanal food & specialty brews to give you an unforgettable hangout.
          </p>
        </div>

        {/* 4 Premium Cards Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Cozy Ambience",
              text: "Warm cinematic lighting, plush seating, and ambient film scores create the perfect escape.",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              ),
            },
            {
              title: "For Cinephiles",
              text: "Classic film screenings, movie trivia nights, and drinks named after cinema masterpieces.",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                  <line x1="7" y1="2" x2="7" y2="22" />
                  <line x1="17" y1="2" x2="17" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="2" y1="7" x2="7" y2="7" />
                  <line x1="2" y1="17" x2="7" y2="17" />
                  <line x1="17" y1="17" x2="22" y2="17" />
                  <line x1="17" y1="7" x2="22" y2="7" />
                </svg>
              ),
            },
            {
              title: "Tasty Food",
              text: "From wood-fired pizzas and creamy pastas to gourmet burgers and handcrafted desserts.",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                  <line x1="6" x2="6" y1="2" y2="4" />
                  <line x1="10" x2="10" y1="2" y2="4" />
                  <line x1="14" x2="14" y1="2" y2="4" />
                </svg>
              ),
            },
            {
              title: "Loyalty Rewards",
              text: "Earn points with every purchase and redeem free coffees, treats, and exclusive discounts.",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
              ),
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E7DCCB] bg-[#FFFDF9] p-6 shadow-warm-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-[#C69214]/50 hover:shadow-warm-hover"
            >
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FDF0F0] text-[#C69214] ring-1 ring-[#C69214]/20 transition-all duration-300 group-hover:bg-[#C69214] group-hover:text-white group-hover:shadow-md">
                  {feature.icon}
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-xs leading-relaxed text-[#655B54] sm:text-sm">
                  {feature.text}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E7DCCB]/60 flex items-center text-xs font-semibold text-[#C69214] group-hover:translate-x-1 transition-transform">
                <span>Learn more &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner — Cinematic Atmosphere Strip */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-[#E7DCCB] bg-gradient-to-r from-[#37261E] via-[#4B352A] to-[#37261E] px-6 py-14 text-center shadow-2xl sm:px-12 sm:py-20">
          {/* Decorative Film Strip Graphic */}
          <div className="pointer-events-none absolute -top-12 -left-12 h-56 w-56 rounded-full bg-[#C69214]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-[#C69214]/10 blur-3xl" />

          <h2 className="relative font-serif text-3xl font-bold text-[#FFFDF9] sm:text-4xl lg:text-5xl">
            Come for the food,{" "}
            <span className="italic text-[#C69214]">stay for the vibes.</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-sm text-[#E7DCCB]/90 sm:text-base">
            Every cup brewed, every meal served feels like a scene from your favorite film. Join us today or order directly from your table.
          </p>
          <div className="flex flex-col sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onViewMenu}
              className="btn-3d-gold group relative mt-8 min-h-[48px] w-full justify-center gap-2.5 px-8 py-3.5 text-sm sm:w-auto sm:text-base"
            >
              <span>Explore Our Menu</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-[2px]">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
      </section>

    </main>
  )
}

export default Home
