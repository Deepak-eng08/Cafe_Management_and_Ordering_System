import { useState, useEffect } from "react"
import MenuCard from "../components/MenuCard"
import CategoryFilter from "../components/CategoryFilter"
import SearchBar from "../components/SearchBar"
import { API_URL } from "../apiUrl"

// Menu page — search, category filters, and food grid
function Menu({ onAddToCart, kitchenOpen }) {
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState(["All"])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchText, setSearchText] = useState("")
  const [query, setQuery] = useState("")

  useEffect(() => {
    fetchMenu()
    fetchCategories()

    const menuChannel = new BroadcastChannel("menu-updates")
    menuChannel.onmessage = () => { fetchMenu(); fetchCategories() }

    function handleStorage(e) {
      if (e.key === "menuUpdated") { fetchMenu(); fetchCategories() }
    }
    window.addEventListener("storage", handleStorage)

    const interval = setInterval(() => { fetchMenu(); fetchCategories() }, 5000)

    return () => {
      menuChannel.close()
      window.removeEventListener("storage", handleStorage)
      clearInterval(interval)
    }
  }, [])

  async function fetchMenu() {
    try {
      const res = await fetch(`${API_URL}/api/menu`)
      const data = await res.json()
      setMenuItems(data)
    } catch (err) {
      console.error("Failed to load menu:", err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch(`${API_URL}/api/categories`)
      const data = await res.json()
      setCategories(["All", ...data.map((c) => c.name)])
    } catch (err) {
      console.error("Failed to load categories:", err)
    }
  }

  function applySearch() {
    setQuery(searchText.trim())
  }

  function handleSearchChange(value) {
    setSearchText(value)
    setQuery(value.trim())
  }

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory

    const matchesSearch =
      query === "" ||
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(query.toLowerCase())

    return matchesCategory && matchesSearch
  })

  return (
    <main className="min-h-screen bg-[#FDF0F0]">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#37261E] via-[#4B352A] to-[#37261E] pt-14 pb-16 text-white sm:pt-20 sm:pb-24">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#C69214]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#C69214]/15 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="font-serif text-xs font-semibold uppercase tracking-[0.25em] text-[#C69214]">
            Artisanal Culinary Selection
          </p>
          <h1 className="mt-2 font-serif text-3xl font-extrabold text-[#FFFDF9] sm:text-5xl lg:text-6xl">
            Our <span className="italic text-[#C69214]">Menu</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[#E7DCCB]/90 sm:mt-4 sm:text-base">
            From freshly brewed espresso & wood-fired pizzas to gourmet burgers and decadent desserts.
          </p>
        </div>
      </section>

      {/* Main Menu Content */}
      <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          
          {/* ── Kitchen Status Banner ──────────────────────── */}
          <div
            className={`mb-6 flex items-center justify-center gap-3 rounded-2xl border px-6 py-3.5 text-center text-sm font-semibold shadow-warm-soft sm:mb-8 sm:text-base ${
              kitchenOpen
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <span
              className={`h-3 w-3 rounded-full ${
                kitchenOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            {kitchenOpen
              ? "Kitchen is Open \u2014 Accepting live orders."
              : "Kitchen is Closed \u2014 Orders are currently unavailable."}
          </div>

          {/* Search bar */}
          <div className="mb-6 sm:mb-8">
            <SearchBar
              searchText={searchText}
              onSearchChange={handleSearchChange}
              onSearch={applySearch}
            />
          </div>

          {/* Category Filter Pills */}
          <div className="mb-8 sm:mb-10">
            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>

          {/* Items Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#E7DCCB] border-t-[#C69214]" />
              <p className="mt-4 text-sm font-semibold text-[#4B352A]">Loading menu items...</p>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6">
              {filteredItems.map((item) => (
                <MenuCard
                  key={item._id}
                  item={item}
                  onAddToCart={onAddToCart}
                  kitchenOpen={kitchenOpen}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E7DCCB] bg-[#FFFDF9] py-16 text-center shadow-warm-soft">
              <p className="font-serif text-lg font-bold text-[#1F1F1F]">
                No menu items found
              </p>
              <p className="mt-1 text-sm text-[#655B54]">
                Try adjusting your search terms or category selection.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default Menu

