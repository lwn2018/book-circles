'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  initialIndigoId: string
  initialAmazonTag: string
  initialAmazonCaTag: string
  initialPriority: string
}

export default function AffiliateSettingsForm({ 
  initialIndigoId, 
  initialAmazonTag,
  initialAmazonCaTag,
  initialPriority 
}: Props) {
  const [indigoId, setIndigoId] = useState(initialIndigoId)
  const [amazonTag, setAmazonTag] = useState(initialAmazonTag)
  const [amazonCaTag, setAmazonCaTag] = useState(initialAmazonCaTag)
  const [priority, setPriority] = useState(initialPriority)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/admin/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indigoId: indigoId.trim(),
          amazonTag: amazonTag.trim(),
          amazonCaTag: amazonCaTag.trim(),
          priority
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings')
      }

      setMessage('✅ Affiliate settings saved successfully!')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {message && (
        <div className="p-4 bg-green-900/30 text-green-400 rounded-xl border border-green-700/30">
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/30 text-red-400 rounded-xl border border-red-700/30">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold mb-2 text-white">
          Indigo/Chapters Affiliate ID (Canada)
        </label>
        <input
          type="text"
          value={indigoId}
          onChange={(e) => setIndigoId(e.target.value)}
          placeholder="12345"
          className="w-full px-4 py-2 border border-[#3B4252] rounded-xl focus:ring-2 focus:ring-[#55B2DE] focus:border-transparent bg-[#121212] text-white placeholder-[#6B7280]"
        />
        <p className="text-xs text-[#9CA3AF] mt-1">
          Your Indigo affiliate ID (numeric, from your affiliate dashboard)
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-white">
          Amazon.ca Associate Tag (Canada)
        </label>
        <input
          type="text"
          value={amazonCaTag}
          onChange={(e) => setAmazonCaTag(e.target.value)}
          placeholder="yoursite-20"
          className="w-full px-4 py-2 border border-[#3B4252] rounded-xl focus:ring-2 focus:ring-[#55B2DE] focus:border-transparent bg-[#121212] text-white placeholder-[#6B7280]"
        />
        <p className="text-xs text-[#9CA3AF] mt-1">
          Your Amazon.ca Associates tracking ID (usually ends in -20)
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-white">
          Amazon.com Associate Tag (US/International)
        </label>
        <input
          type="text"
          value={amazonTag}
          onChange={(e) => setAmazonTag(e.target.value)}
          placeholder="yoursite-20"
          className="w-full px-4 py-2 border border-[#3B4252] rounded-xl focus:ring-2 focus:ring-[#55B2DE] focus:border-transparent bg-[#121212] text-white placeholder-[#6B7280]"
        />
        <p className="text-xs text-[#9CA3AF] mt-1">
          Your Amazon.com Associates tracking ID (optional - for US users)
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-white">
          Primary Affiliate Partner
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full px-4 py-2 border border-[#3B4252] rounded-xl focus:ring-2 focus:ring-[#55B2DE] focus:border-transparent bg-[#121212] text-white"
        >
          <option value="indigo">Indigo/Chapters (Canadian, supports local)</option>
          <option value="amazon-ca">Amazon.ca (Canadian, wider selection)</option>
          <option value="amazon">Amazon.com (US/International)</option>
        </select>
        <p className="text-xs text-[#9CA3AF] mt-1">
          Which service to show first when multiple are available
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-[#55B2DE] text-white rounded-xl hover:bg-[#4A9FCB] disabled:opacity-50 font-medium"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="px-6 py-2 border border-[#3B4252] rounded-xl hover:bg-[#2D3748] text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
