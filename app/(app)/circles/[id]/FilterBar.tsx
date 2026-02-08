'use client'

import { useState } from 'react'

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
  title_asc: 'A-Z',
  title_desc: 'Z-A',
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
  return (
    <div className="sticky top-16 z-30 bg-white border-b border-gray-200 px-3 sm:px-4 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        {/* Search field - takes most space */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title or author..."
          className="flex-1 min-w-0 px-2.5 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />

        {/* Sort dropdown - compact pill */}
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
          <option value="title_asc">A-Z</option>
          <option value="title_desc">Z-A</option>
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

        {/* Hide my books toggle - pill/chip */}
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
    </div>
  )
}
