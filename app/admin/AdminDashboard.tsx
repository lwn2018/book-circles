'use client'

import { useState, useEffect } from 'react'
import DateRangePicker from './DateRangePicker'
import AdToggle from './AdToggle'

type Stats = {
  totalUsers: number
  totalBooks: number
  totalCircles: number
  booksOnLoan: number
  dau: number
  wau: number
  mau: number
  stickiness: number
  booksAddedInRange: number
  activeCircles: number
  affiliateClicks: number
  newUsers: number
  booksBorrowedInRange: number
}

type Props = {
  adsEnabled: boolean
}

export default function AdminDashboard({ adsEnabled }: Props) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchStats()
  }, [dateRange])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        start: new Date(dateRange.start).toISOString(),
        end: new Date(dateRange.end + 'T23:59:59').toISOString()
      })
      
      const response = await fetch(`/api/admin/stats?${params}`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Date Range Picker */}
      <DateRangePicker onChange={setDateRange} />

      {/* Ad Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Ad Controls</h2>
        <AdToggle initialEnabled={adsEnabled} />
      </div>

      {loading && stats && (
        <div className="bg-blue-50 text-blue-600 rounded-lg p-3 mb-6 text-sm">
          Updating metrics...
        </div>
      )}

      {/* Real-time User Metrics (not affected by date range) */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Real-time Activity</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Users</h3>
            <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">DAU</h3>
            <p className="text-3xl font-bold">{stats?.dau || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">WAU</h3>
            <p className="text-3xl font-bold">{stats?.wau || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">MAU</h3>
            <p className="text-3xl font-bold">{stats?.mau || 0}</p>
          </div>
        </div>
      </div>

      {/* Date Range Metrics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Selected Date Range</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">New Users</h3>
            <p className="text-3xl font-bold">{stats?.newUsers || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Books Added</h3>
            <p className="text-3xl font-bold">{stats?.booksAddedInRange || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Books Borrowed</h3>
            <p className="text-3xl font-bold">{stats?.booksBorrowedInRange || 0}</p>
          </div>
        </div>
      </div>

      {/* Engagement */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Stickiness (DAU/MAU)</h3>
          <p className="text-3xl font-bold">{stats?.stickiness || 0}%</p>
          <p className="text-xs text-gray-500 mt-1">Target: 40%+</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Active Circles</h3>
          <p className="text-3xl font-bold">{stats?.activeCircles || 0}</p>
          <p className="text-xs text-gray-500 mt-1">In selected range</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Affiliate Clicks</h3>
          <p className="text-3xl font-bold">{stats?.affiliateClicks || 0}</p>
          <p className="text-xs text-gray-500 mt-1">In selected range</p>
        </div>
      </div>

      {/* Book Metrics */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Books (All Time)</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Total Books</p>
            <p className="text-2xl font-bold">{stats?.totalBooks || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Currently Borrowed</p>
            <p className="text-2xl font-bold">{stats?.booksOnLoan || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Available</p>
            <p className="text-2xl font-bold">
              {(stats?.totalBooks || 0) - (stats?.booksOnLoan || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Circles */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Circles (All Time)</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">Total Circles</p>
            <p className="text-2xl font-bold">{stats?.totalCircles || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Active in Range</p>
            <p className="text-2xl font-bold">{stats?.activeCircles || 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
