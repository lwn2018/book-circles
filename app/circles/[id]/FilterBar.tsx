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
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 p-3 sm:p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title or author..."
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Sort and Filter - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="recently_added">Recently Added</option>
            <option value="title_asc">Title A-Z</option>
            <option value="title_desc">Title Z-A</option>
            <option value="most_requested">Most Requested</option>
          </select>

          {/* Available Only Toggle */}
          <label className="flex items-center justify-center gap-2 cursor-pointer px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => onAvailableOnlyChange(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Available only</span>
          </label>
        </div>

        {/* Results Count */}
        <div className="text-xs sm:text-sm text-gray-600">
          {filteredCount === totalBooks ? (
            <span>{totalBooks} book{totalBooks !== 1 ? 's' : ''}</span>
          ) : (
            <span>
              Showing {filteredCount} of {totalBooks} book{totalBooks !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
