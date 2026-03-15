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
    <div className="min-h-screen bg-[#121212] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Metadata Backfill</h1>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 text-[#9CA3AF] hover:text-white"
          >
            ← Back to Admin
          </button>
        </div>

        <div className="bg-[#1E293B] rounded-xl shadow p-6 mb-6 border border-[#2D3748]">
          <h2 className="text-xl font-semibold mb-4 text-white">What this does:</h2>
          <ul className="list-disc list-inside space-y-2 text-[#9CA3AF] mb-6">
            <li>Queries all books missing cover art, prices, or metadata</li>
            <li>Runs comprehensive lookup: Google Books → ISBNdb → Open Library</li>
            <li>Downloads and caches cover images to Supabase Storage</li>
            <li>Populates retail price, description, publisher, page count, etc.</li>
            <li>Rate limited to 300ms between ISBNdb calls (safe for API limits)</li>
          </ul>

          <button
            onClick={runBackfill}
            disabled={running}
            className={`w-full py-3 rounded-xl font-semibold text-white ${
              running
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-[#55B2DE] hover:bg-[#4A9FCB]'
            }`}
          >
            {running ? 'Running backfill...' : 'Start Backfill'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700/30 rounded-xl p-4 mb-6">
            <p className="text-red-400 font-semibold">Error:</p>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {results && (
          <div className="bg-[#1E293B] rounded-xl shadow p-6 border border-[#2D3748]">
            <h2 className="text-xl font-semibold mb-4 text-white">Results</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#55B2DE]/20 p-4 rounded-xl border border-[#55B2DE]/30">
                <p className="text-sm text-[#9CA3AF]">Total Books</p>
                <p className="text-2xl font-bold text-[#55B2DE]">{results.total}</p>
              </div>

              <div className="bg-green-900/30 p-4 rounded-xl border border-green-700/30">
                <p className="text-sm text-[#9CA3AF]">Processed</p>
                <p className="text-2xl font-bold text-green-400">{results.processed}</p>
              </div>

              <div className="bg-purple-900/30 p-4 rounded-xl border border-purple-700/30">
                <p className="text-sm text-[#9CA3AF]">Covers Found</p>
                <p className="text-2xl font-bold text-purple-400">{results.coversFound}</p>
              </div>

              <div className="bg-yellow-900/30 p-4 rounded-xl border border-yellow-700/30">
                <p className="text-sm text-[#9CA3AF]">Prices Found</p>
                <p className="text-2xl font-bold text-yellow-400">{results.pricesFound}</p>
              </div>

              <div className="bg-indigo-900/30 p-4 rounded-xl border border-indigo-700/30">
                <p className="text-sm text-[#9CA3AF]">Descriptions Found</p>
                <p className="text-2xl font-bold text-indigo-400">{results.descriptionsFound}</p>
              </div>

              {results.errors?.length > 0 && (
                <div className="bg-red-900/30 p-4 rounded-xl border border-red-700/30">
                  <p className="text-sm text-[#9CA3AF]">Errors</p>
                  <p className="text-2xl font-bold text-red-400">{results.errors.length}</p>
                </div>
              )}
            </div>

            {results.coversBySource && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2 text-white">Covers by Source:</h3>
                <div className="space-y-1 text-sm text-[#9CA3AF]">
                  <p>Google Books: {results.coversBySource.google}</p>
                  <p>ISBNdb: {results.coversBySource.isbndb}</p>
                  <p>Open Library: {results.coversBySource.openlibrary}</p>
                </div>
              </div>
            )}

            {results.noCoverISBNs && results.noCoverISBNs.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-white">ISBNs with no cover from any source:</h3>
                <div className="bg-[#121212] p-4 rounded-xl max-h-60 overflow-y-auto border border-[#2D3748]">
                  <ul className="space-y-1 text-sm font-mono text-[#9CA3AF]">
                    {results.noCoverISBNs.map((isbn: string) => (
                      <li key={isbn}>{isbn}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {results.errors && results.errors.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-red-400">Errors:</h3>
                <div className="bg-red-900/20 p-4 rounded-xl max-h-60 overflow-y-auto border border-red-700/30">
                  <ul className="space-y-1 text-sm text-red-300">
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
