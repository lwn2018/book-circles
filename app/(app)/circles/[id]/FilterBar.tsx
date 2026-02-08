'use client'

type FilterBarProps = {
  sortBy: string
  onSortChange: (value: string) => void
  availableOnly: boolean
  onAvailableOnlyChange: (value: boolean) => void
  searchQuery: string
  onSearchChange: (value: string) => void
  hideMyBooks: boolean
  onHideMyBooksChange: (value: boolean) => void
  totalBooks: number
  filteredCount: number
}

const sortLabels: Record<string, string> = {
  recently_added: 'Recent',
  title_asc: 'Title',
  title_desc: 'Title',
  most_requested: 'Popular'
}

export default function FilterBar({
  sortBy,
  onSortChange,
  availableOnly,
  onAvailableOnlyChange,
  searchQuery,
  onSearchChange,
  hideMyBooks,
  onHideMyBooksChange,
  totalBooks,
  filteredCount
}: FilterBarProps) {
  const hasActiveFilter = searchQuery.trim() || availableOnly || hideMyBooks
  const isSearching = searchQuery.trim().length > 0

  return (
    <div className="fixed top-16 left-0 right-0 z-30 bg-white border-b border-gray-200 px-3 sm:px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-2">
        {/* Row 1: Search field - full width */}
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title or author..."
            className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Row 2: Filter pills - one horizontal line */}
        <div className="flex items-center gap-2">
          {/* Sort dropdown - compact pill, greyed out when searching */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            disabled={isSearching}
            className={`px-2.5 py-1.5 text-xs font-medium border border-gray-300 rounded-full bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none pr-6 bg-no-repeat bg-right transition ${
              isSearching ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '12px'
            }}
          >
            <option value="recently_added">Recent</option>
            <option value="title_asc">Title</option>
            <option value="title_desc">Title ↓</option>
            <option value="most_requested">Popular</option>
          </select>

          {/* Available only toggle - pill/chip */}
          <button
            onClick={() => onAvailableOnlyChange(!availableOnly)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition ${
              availableOnly
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Available only
          </button>

          {/* Hide mine toggle - pill/chip */}
          <button
            onClick={() => onHideMyBooksChange(!hideMyBooks)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition ${
              hideMyBooks
                ? 'bg-purple-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Hide mine
          </button>
        </div>

        {/* Active filter count - only show when filtering */}
        {hasActiveFilter && filteredCount !== totalBooks && (
          <div className="text-xs text-gray-600">
            Showing {filteredCount} of {totalBooks} book{totalBooks !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
