'use client'

import { useState } from 'react'

export default function DownloadDataSection() {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/account/export')
      
      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : 'pagepass-data-export.json'

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Download My Data</h2>
      <p className="text-gray-600 mb-4">
        Download a copy of all your PagePass data including your profile, books, circle memberships, 
        borrow history, and feedback.
      </p>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Preparing Download...' : '📥 Download My Data'}
      </button>
    </div>
  )
}
