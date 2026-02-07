'use client'

import { useState } from 'react'

type FilterBarProps = {
  sortBy: string
  onSortChange: (value: string) => void
  availableOnly: boolean
  onAvailableOnlyChange: (value: boolean) => void
  searchQuery: string
  onSearchChange: (value: string) => void
  totalBooks: number
  filteredCount: number
}

export default function FilterBar({
  sortBy,
  onSortChange,
  availableOnly,
  onAvailableOnlyChange,
  searchQuery,
  onSearchChange,
  totalBooks,
  filteredCount
}: FilterBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Left: Search */}
        <div className="flex-1 w-full sm:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title or author..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Right: Sort and Filter */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="recently_added">Recently Added</option>
            <option value="title_asc">Title A-Z</option>
            <option value="title_desc">Title Z-A</option>
            <option value="most_requested">Most Requested</option>
          </select>

          {/* Available Only Toggle */}
          <label className="flex items-center gap-2 cursor-pointer px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => onAvailableOnlyChange(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Available only</span>
          </label>
        </div>
      </div>

      {/* Results Count */}
      <div className="mt-2 text-sm text-gray-600">
        {filteredCount === totalBooks ? (
          <span>{totalBooks} book{totalBooks !== 1 ? 's' : ''}</span>
        ) : (
          <span>
            Showing {filteredCount} of {totalBooks} book{totalBooks !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}
