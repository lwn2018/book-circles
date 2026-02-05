'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'ads_enabled',
          value: !enabled
        })
      })

      if (response.ok) {
        setEnabled(!enabled)
        router.refresh()
      } else {
        alert('Failed to update setting')
      }
    } catch (error) {
      console.error('Failed to toggle ads:', error)
      alert('Failed to update setting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-medium">Affiliate Links / Ads</h3>
        <p className="text-sm text-gray-600">
          When enabled, "Buy This Book" affiliate links will appear on book pages
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-gray-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
