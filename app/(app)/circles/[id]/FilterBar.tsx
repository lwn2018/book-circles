'use client'

type FilterBarProps = {
  sortBy: string
  onSortChange: (value: string) => void
  availableOnly: boolean
  onAvailableOnlyChange: (value: boolean) => void
  totalBooks: number
  filteredCount: number
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
    <div className="bg-[#27272A] rounded-xl px-4 py-3 mb-4">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Sort dropdown and Available toggle */}
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 text-xs font-medium border border-[#3F3F46] rounded-lg bg-[#18181B] text-white hover:bg-[#27272A] focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer appearance-none pr-8 bg-no-repeat bg-right"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '12px'
            }}
          >
            <option value="recently_added">Recent</option>
            <option value="title_asc">Title A-Z</option>
            <option value="title_desc">Title Z-A</option>
            <option value="most_requested">Popular</option>
          </select>

          {/* Available only toggle */}
          <button
            onClick={() => onAvailableOnlyChange(!availableOnly)}
            className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              availableOnly
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                : 'border border-[#3F3F46] text-gray-300 hover:bg-[#3F3F46]'
            }`}
          >
            Available only
          </button>
        </div>

        {/* Right: Results count */}
        <div className="text-xs text-gray-400">
          {hasActiveFilter && filteredCount !== totalBooks ? (
            <>
              <span className="text-orange-400">{filteredCount}</span> of {totalBooks}
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
