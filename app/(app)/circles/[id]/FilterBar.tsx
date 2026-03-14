'use client'

type FilterBarProps = {
  sortBy: string
  onSortChange: (value: string) => void
  activeFilter: 'all' | 'available' | 'borrowed' | 'in_queue'
  onFilterChange: (value: 'all' | 'available' | 'borrowed' | 'in_queue') => void
  totalBooks: number
  filteredCount: number
}

const filters = [
  { key: 'all', label: 'All Books' },
  { key: 'available', label: 'Available' },
  { key: 'borrowed', label: 'Borrowed' },
  { key: 'in_queue', label: 'In Queue' },
] as const

export default function FilterBar({
  sortBy,
  onSortChange,
  activeFilter,
  onFilterChange,
  totalBooks,
  filteredCount
}: FilterBarProps) {
  return (
    <div className="mb-4">
      {/* Filter pills - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === filter.key
                ? 'bg-[#55B2DE] text-white'
                : 'bg-[#1E293B] text-[#94A3B8] border border-[#334155] hover:bg-[#334155]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Sort dropdown - subtle */}
      <div className="flex items-center justify-between mt-3">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-1.5 text-xs font-medium border border-[#334155] rounded-lg bg-[#1E293B] text-[#94A3B8] hover:bg-[#334155] focus:outline-none focus:ring-1 focus:ring-[#55B2DE] cursor-pointer appearance-none pr-8 bg-no-repeat bg-right"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394A3B8' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
            backgroundPosition: 'right 0.75rem center',
            backgroundSize: '12px'
          }}
        >
          <option value="recently_added">Recent</option>
          <option value="title_asc">Title A-Z</option>
          <option value="title_desc">Title Z-A</option>
          <option value="most_requested">Popular</option>
        </select>

        {/* Results count */}
        <div className="text-xs text-[#94A3B8]">
          {activeFilter !== 'all' && filteredCount !== totalBooks ? (
            <>
              <span className="text-[#55B2DE]">{filteredCount}</span> of {totalBooks}
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
