'use client'

import { useState, useEffect } from 'react'

type QueueStats = {
  totalQueueEntries: number
  booksWithQueues: number
  totalPasses: number
  passRate: number
  passReasons: Record<string, number>
  averageWaitDays: number
  acceptCount: number
}

type Props = {
  dateRange: { start: string; end: string }
}

export default function QueueStats({ dateRange }: Props) {
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)

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
      
      const response = await fetch(`/api/admin/queue-stats?${params}`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch queue stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading queue analytics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {loading && stats && (
        <div className="bg-blue-50 text-blue-600 rounded-lg p-3 text-sm">
          Updating metrics...
        </div>
      )}

      {/* Overview Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Queue Entries</h3>
          <p className="text-3xl font-bold">{stats?.totalQueueEntries || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Books with Queues</h3>
          <p className="text-3xl font-bold">{stats?.booksWithQueues || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Pass Rate</h3>
          <p className="text-3xl font-bold">{stats?.passRate || 0}%</p>
          <p className="text-xs text-gray-500 mt-1">Target: &lt;30%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Wait Time</h3>
          <p className="text-3xl font-bold">{stats?.averageWaitDays || 0}</p>
          <p className="text-xs text-gray-500 mt-1">days</p>
        </div>
      </div>

      {/* Pass vs Accept */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Pass vs Accept (In Date Range)</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700 font-medium">Passes</p>
            <p className="text-4xl font-bold text-red-600">{stats?.totalPasses || 0}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 font-medium">Accepts</p>
            <p className="text-4xl font-bold text-green-600">{stats?.acceptCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Pass Reasons */}
      {stats?.passReasons && Object.keys(stats.passReasons).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Pass Reasons</h2>
          <div className="space-y-3">
            {Object.entries(stats.passReasons)
              .sort(([, a], [, b]) => b - a)
              .map(([reason, count]) => (
                <div key={reason} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">{reason}</span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
