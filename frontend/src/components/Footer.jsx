function Footer() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer id="contact" className="slate-surface relative border-t border-[#C69214]/50 text-[#FDF0F0] shadow-[0_-8px_25px_rgba(0,0,0,0.6)]">
      {/* Top Edge: Cinematic clapboard clapper strip with hinge bracket */}
      <div aria-hidden="true" className="clapboard-strip relative">
        <div className="clapboard-hinge">
          <span className="slate-rivet" />
          <span className="slate-rivet" />
        </div>
      </div>

      <div aria-hidden="true" className="film-sprocket mx-auto hidden w-full max-w-7xl sm:block" />

      {/* Main Production Slate Grid */}
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Metallic Screw Heads in Top Corners of Footer Slate */}
        <div aria-hidden="true" className="pointer-events-none absolute top-4 left-4 hidden sm:block">
          <span className="screw-head" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute top-4 right-4 hidden sm:block">
          <span className="screw-head" />
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:gap-8">
          
          {/* COLUMN 1: PROD. — CINEPHILE'S CAFÉ BRAND */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              {/* Slate Section Header */}
              <div className="mb-3 flex items-center gap-2 border-b border-[#C69214]/30 pb-2">
                <span className="slate-label">PROD.</span>
                <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#FFFDF9]">CINEPHILE&apos;S CAFÉ</span>
              </div>

              {/* Logo & Description */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="footer-hover flex items-center gap-3 text-left focus:outline-none"
                >
                  <div className="animate-wave-logo relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden shadow-md ring-2 ring-[#C69214] bg-white">
                    <img
                      src="/logo.png"
                      alt="Cinephile's Café Logo"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="animate-wave-text font-serif text-base font-bold text-[#FFFDF9]">Cinephile&apos;s</p>
                    <p className="animate-wave-text font-serif text-[10px] font-bold tracking-[0.25em] text-[#C69214]">CAFÉ</p>
                  </div>
                </button>

                <p className="text-xs leading-relaxed text-[#E7DCCB]/85">
                  Good Coffee. Great Movies. A cozy sanctuary where cinema meets culinary perfection for food lovers and movie enthusiasts.
                </p>
              </div>
            </div>
          </div>

          {/* COLUMN 2: TAKE & ROLL — PRODUCTION SLATE BOX CARDS */}
          <div className="space-y-4">
            {/* TAKE BOX: KITCHEN NOTE */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="slate-label">TAKE</span>
              </div>
              <div className="slate-box p-3.5">
                <div className="flex items-start gap-2.5">
                  <span className="text-base">🎬</span>
                  <div>
                    <p className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#C69214]">NOTE</p>
                    <p className="mt-0.5 text-xs font-medium leading-tight text-[#FFFDF9]">
                      Our kitchen is open & ready to serve you!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ROLL BOX: THANK YOU CARD */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="slate-label">ROLL</span>
              </div>
              <div className="slate-box p-3.5 border-dashed border-[#C69214]/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-serif text-sm font-black tracking-wide text-[#C69214]">THANK YOU!</p>
                    <p className="mt-0.5 text-xs text-[#E7DCCB]/85">
                      Enjoy your meal and have a great day!
                    </p>
                  </div>
                  <span className="text-xl text-[#C69214]">♡</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM SLATE BAR & COPYRIGHT */}
        <div className="mt-8 border-t border-[#C69214]/30 pt-5">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            {/* Left Screw + Copyright */}
            <div className="flex items-center gap-2 text-xs text-[#E7DCCB]/70">
              <span className="screw-head" />
              <span>
                &copy; {new Date().getFullYear()} Cinephile&apos;s Café. Good Coffee. Great Movies. All rights reserved.
              </span>
            </div>

            {/* Slate Production Metadata Caption Band */}
            <div aria-hidden="true" className="hidden items-center gap-2 text-[10px] sm:flex">
              <span className="slate-label">Prod. Cinephile&apos;s</span>
              <span className="text-[#C69214]/50">•</span>
              <span className="slate-label">Scene 01</span>
              <span className="text-[#C69214]/50">•</span>
              <span className="slate-label">Take 01</span>
              <span className="text-[#C69214]/50">•</span>
              <span className="slate-label">Roll A</span>
              <span className="screw-head ml-1" />
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer

