'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BackfillMetadataPage() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const runBackfill = async () => {
    setRunning(true)
    setError('')
    setResults(null)

    try {
      const response = await fetch('/api/admin/backfill-metadata', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Backfill failed')
      }

      setResults(data.results)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Metadata Backfill</h1>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            ← Back to Admin
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">What this does:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
            <li>Queries all books missing cover art, prices, or metadata</li>
            <li>Runs comprehensive lookup: Google Books → ISBNdb → Open Library</li>
            <li>Downloads and caches cover images to Supabase Storage</li>
            <li>Populates retail price, description, publisher, page count, etc.</li>
            <li>Rate limited to 300ms between ISBNdb calls (safe for API limits)</li>
          </ul>

          <button
            onClick={runBackfill}
            disabled={running}
            className={`w-full py-3 rounded-lg font-semibold text-white ${
              running
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {running ? 'Running backfill...' : 'Start Backfill'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {results && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600">Total Books</p>
                <p className="text-2xl font-bold text-blue-600">{results.total}</p>
              </div>

              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600">Processed</p>
                <p className="text-2xl font-bold text-green-600">{results.processed}</p>
              </div>

              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-gray-600">Covers Found</p>
                <p className="text-2xl font-bold text-purple-600">{results.coversFound}</p>
              </div>

              <div className="bg-yellow-50 p-4 rounded">
                <p className="text-sm text-gray-600">Prices Found</p>
                <p className="text-2xl font-bold text-yellow-600">{results.pricesFound}</p>
              </div>

              <div className="bg-indigo-50 p-4 rounded">
                <p className="text-sm text-gray-600">Descriptions Found</p>
                <p className="text-2xl font-bold text-indigo-600">{results.descriptionsFound}</p>
              </div>

              {results.errors?.length > 0 && (
                <div className="bg-red-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{results.errors.length}</p>
                </div>
              )}
            </div>

            {results.coversBySource && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Covers by Source:</h3>
                <div className="space-y-1 text-sm">
                  <p>Google Books: {results.coversBySource.google}</p>
                  <p>ISBNdb: {results.coversBySource.isbndb}</p>
                  <p>Open Library: {results.coversBySource.openlibrary}</p>
                </div>
              </div>
            )}

            {results.noCoverISBNs && results.noCoverISBNs.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">ISBNs with no cover from any source:</h3>
                <div className="bg-gray-50 p-4 rounded max-h-60 overflow-y-auto">
                  <ul className="space-y-1 text-sm font-mono">
                    {results.noCoverISBNs.map((isbn: string) => (
                      <li key={isbn}>{isbn}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {results.errors && results.errors.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-red-600">Errors:</h3>
                <div className="bg-red-50 p-4 rounded max-h-60 overflow-y-auto">
                  <ul className="space-y-1 text-sm">
                    {results.errors.map((err: string, idx: number) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
