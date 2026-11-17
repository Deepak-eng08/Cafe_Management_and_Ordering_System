// Pill-shaped category filter buttons — horizontal scroll on mobile
function CategoryFilter({ categories, activeCategory, onCategoryChange }) {
  return (
    <div className="max-w-full overflow-hidden sm:overflow-visible">
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none sm:flex-wrap sm:justify-center sm:gap-3 sm:pb-0">
        {categories.map((category) => {
          const isActive = category === activeCategory

          return (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={`btn-category-pill shrink-0 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider sm:px-6 sm:text-sm ${
                isActive
                  ? "active"
                  : ""
              }`}
            >
              {category}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryFilter

