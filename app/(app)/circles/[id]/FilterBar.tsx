'use client'

type FilterBarProps = {
  sortBy: string
  onSortChange: (value: string) => void
  activeFilter: 'all' | 'available' | 'borrowed' | 'in_queue'
  onFilterChange: (value: 'all' | 'available' | 'borrowed' | 'in_queue') => void
  totalBooks: number
  filteredCount: number
  viewMode?: 'card' | 'list'
  onViewModeChange?: (value: 'card' | 'list') => void
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
  filteredCount,
  viewMode = 'card',
  onViewModeChange
}: FilterBarProps) {
  return (
    <div className="mb-4">
      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              activeFilter === filter.key
                ? 'bg-[#55B2DE] text-white'
                : 'bg-[#1E293B] text-[#94A3B8] border border-[#334155] hover:bg-[#334155]'
            }`}
            style={{ fontFamily: 'var(--font-figtree)', fontSize: '14px', fontWeight: 500 }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Sort dropdown + View toggle + Count */}
      <div className="flex items-center justify-between mt-3 gap-3">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-1.5 text-xs font-medium border border-[#334155] rounded-lg bg-[#1E293B] text-[#94A3B8] hover:bg-[#334155] focus:outline-none focus:ring-1 focus:ring-[#55B2DE] cursor-pointer appearance-none pr-8 bg-no-repeat bg-right"
          style={{
            fontFamily: 'var(--font-inter)',
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

        {/* View Toggle */}
        {onViewModeChange && (
          <div className="flex bg-[#1E293B] rounded-lg p-1 border border-[#334155]">
            <button
              onClick={() => onViewModeChange('card')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'card' ? 'bg-[#55B2DE] text-white' : 'text-[#94A3B8] hover:text-white'
              }`}
              title="Card view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list' ? 'bg-[#55B2DE] text-white' : 'text-[#94A3B8] hover:text-white'
              }`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        )}

        <div className="text-xs text-[#94A3B8]" style={{ fontFamily: 'var(--font-inter)' }}>
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
