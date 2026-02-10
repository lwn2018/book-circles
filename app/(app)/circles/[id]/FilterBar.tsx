'use client'

type FilterBarProps = {
  sortBy: string
  onSortChange: (value: string) => void
  availableOnly: boolean
  onAvailableOnlyChange: (value: boolean) => void
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
  totalBooks,
  filteredCount
}: FilterBarProps) {
  const hasActiveFilter = availableOnly

  return (
    <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3 shadow-sm mb-4">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Sort dropdown and Available toggle */}
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium border border-gray-300 rounded-full bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none pr-6 bg-no-repeat bg-right"
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

          {/* Available only toggle */}
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
        </div>

        {/* Right: Results count */}
        <div className="text-xs text-gray-600">
          {hasActiveFilter && filteredCount !== totalBooks ? (
            <>
              {filteredCount} of {totalBooks}
            </>
          ) : (
            <>
              {totalBooks} book{totalBooks !== 1 ? 's' : ''}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
