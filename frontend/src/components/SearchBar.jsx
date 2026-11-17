// Search bar with a button — filters menu items by name
function SearchBar({ searchText, onSearchChange, onSearch }) {
  function handleSubmit(e) {
    e.preventDefault()
    onSearch?.()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-xl gap-2 sm:gap-3"
    >
      <label htmlFor="menu-search" className="sr-only">
        Search food by name
      </label>
      <input
        id="menu-search"
        type="search"
        placeholder="Search food by name..."
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#E7DCCB] bg-[#FFFDF9] px-4 text-sm text-[#1F1F1F] placeholder:text-[#655B54]/70 shadow-warm-soft focus:border-[#C69214] focus:outline-none focus:ring-2 focus:ring-[#C69214]/30 sm:px-5 sm:text-base"
      />
      <button
        type="submit"
        className="btn-3d-gold-sm min-h-12 shrink-0 gap-2 px-6 text-sm sm:px-7"
        aria-label="Search menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  )
}

export default SearchBar

