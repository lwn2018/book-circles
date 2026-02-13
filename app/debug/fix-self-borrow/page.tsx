'use client'

import { useState } from 'react'

export default function FixSelfBorrowPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function runFix() {
    setLoading(true)
    try {
      const res = await fetch('/api/debug/fix-self-borrow', { method: 'POST' })
      const data = await res.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Fix Self-Borrowed Books</h1>
      <p className="mb-4 text-gray-600">
        This will find and fix any books where you're set as borrowing your own book.
      </p>

      <button
        onClick={runFix}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Fixing...' : 'Run Fix'}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
