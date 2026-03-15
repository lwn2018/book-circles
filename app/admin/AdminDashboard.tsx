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
          <p className="text-[#9CA3AF]">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Date Range Picker */}
      <DateRangePicker onChange={setDateRange} />

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <a 
          href="/admin/signup-analytics"
          className="block p-4 bg-[#1E293B] rounded-xl shadow hover:shadow-md transition border border-[#2D3748]"
        >
          <h3 className="font-semibold text-[#55B2DE] mb-1">👥 Signup Analytics</h3>
          <p className="text-sm text-[#9CA3AF]">Sources, referrers, invite tracking</p>
        </a>
        <a 
          href="/admin/queue-analytics"
          className="block p-4 bg-[#1E293B] rounded-xl shadow hover:shadow-md transition border border-[#2D3748]"
        >
          <h3 className="font-semibold text-purple-400 mb-1">📋 Queue Analytics</h3>
          <p className="text-sm text-[#9CA3AF]">Pass rates, wait times, acceptance</p>
        </a>
        <a 
          href="/admin/idle-books"
          className="block p-4 bg-[#1E293B] rounded-xl shadow hover:shadow-md transition border border-[#2D3748]"
        >
          <h3 className="font-semibold text-[#55B2DE] mb-1">😴 Idle Books</h3>
          <p className="text-sm text-[#9CA3AF]">Books never borrowed</p>
        </a>
      </div>

      {/* Ad Controls */}
      <div className="bg-[#1E293B] rounded-xl shadow p-6 mb-8 border border-[#2D3748]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Ad & Affiliate Controls</h2>
          <a 
            href="/admin/affiliate"
            className="text-sm text-[#55B2DE] hover:underline"
          >
            Configure Affiliate IDs →
          </a>
        </div>
        <AdToggle initialEnabled={adsEnabled} />
      </div>

      {loading && stats && (
        <div className="bg-[#55B2DE]/20 text-[#55B2DE] rounded-xl p-3 mb-6 text-sm">
          Updating metrics...
        </div>
      )}

      {/* Real-time User Metrics (not affected by date range) */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-[#9CA3AF]">Real-time Activity</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-[#1E293B] rounded-xl shadow p-6 border border-[#2D3748]">
            <h3 className="text-sm font-medium text-[#9CA3AF] mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
          </div>
          <div className="bg-[#1E293B] rounded-xl shadow p-6 border border-[#2D3748]">
            <h3 className="text-sm font-medium text-[#9CA3AF] mb-2">DAU</h3>
            <p className="text-3xl font-bold text-white">{stats?.dau || 0}</p>
          </div>
          <div className="bg-[#1E293B] rounded-xl shadow p-6 border border-[#2D3748]">
            <h3 className="text-sm font-medium text-[#9CA3AF] mb-2">WAU</h3>
            <p className="text-3xl font-bold text-white">{stats?.wau || 0}</p>
          </div>
          <div className="bg-[#1E293B] rounded-xl shadow p-6 border border-[#2D3748]">
            <h3 className="text-sm font-medium text-[#9CA3AF] mb-2">MAU</h3>
            <p className="text-3xl font-bold text-white">{stats?.mau || 0}</p>
          </div>
        </div>
      </div>

      {/* Date Range Metrics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-[#9CA3AF]">Selected Date Range</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#1E293B] rounded-xl shadow p-6 border border-[#2D3748]">
            <h3 className="text-sm font-medium text-[#9CA3AF] mb-2">New Users</h3>
            <p className="text-3xl font-bold text-white">{stats?.newUsers || 0}</p>
          </div>
          <div className="bg-[#1E293B] rounded-xl shadow p-6 border border-[#2D3748]">
            <h3 className="text-sm font-medium text-[#9CA3AF] mb-2">Books Added</h3>
            <p className="text-3xl font-bold text-white">{stats?.booksAddedInRange || 0}</p>
          </div>
          <div className="bg-[#1E293B] rounded-xl shadow p-6 border border-[#2D3748]">
            <h3 className="text-sm font-medium text-[#9CA3AF] mb-2">Books Borrowed</h3>
            <p className="text-3xl font-bold text-white">{stats?.booksBorrowedInRange || 0}</p>
          </div>
        </div>
      </div>

      {/* Engagement */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#1E293B] rounded-xl shadow p-6 border border-[#2D3748]">
          <h3 className="text-sm font-medium text-[#9CA3AF] mb-2">Stickiness (DAU/MAU)</h3>
          <p className="text-3xl font-bold text-white">{stats?.stickiness || 0}%</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Target: 40%+</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl shadow p-6 border border-[#2D3748]">
          <h3 className="text-sm font-medium text-[#9CA3AF] mb-2">Active Circles</h3>
          <p className="text-3xl font-bold text-white">{stats?.activeCircles || 0}</p>
          <p className="text-xs text-[#9CA3AF] mt-1">In selected range</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl shadow p-6 border border-[#2D3748]">
          <h3 className="text-sm font-medium text-[#9CA3AF] mb-2">Affiliate Clicks</h3>
          <p className="text-3xl font-bold text-white">{stats?.affiliateClicks || 0}</p>
          <p className="text-xs text-[#9CA3AF] mt-1">In selected range</p>
        </div>
      </div>

      {/* Book Metrics */}
      <div className="bg-[#1E293B] rounded-xl shadow p-6 mb-8 border border-[#2D3748]">
        <h2 className="text-xl font-semibold mb-4 text-white">Books (All Time)</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-[#9CA3AF]">Total Books</p>
            <p className="text-2xl font-bold text-white">{stats?.totalBooks || 0}</p>
          </div>
          <div>
            <p className="text-sm text-[#9CA3AF]">Currently Borrowed</p>
            <p className="text-2xl font-bold text-white">{stats?.booksOnLoan || 0}</p>
          </div>
          <div>
            <p className="text-sm text-[#9CA3AF]">Available</p>
            <p className="text-2xl font-bold text-white">
              {(stats?.totalBooks || 0) - (stats?.booksOnLoan || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Circles */}
      <div className="bg-[#1E293B] rounded-xl shadow p-6 border border-[#2D3748]">
        <h2 className="text-xl font-semibold mb-4 text-white">Circles (All Time)</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-[#9CA3AF]">Total Circles</p>
            <p className="text-2xl font-bold text-white">{stats?.totalCircles || 0}</p>
          </div>
          <div>
            <p className="text-sm text-[#9CA3AF]">Active in Range</p>
            <p className="text-2xl font-bold text-white">{stats?.activeCircles || 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
