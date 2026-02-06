'use client'

import { useState, useEffect } from 'react'
import { analytics } from '@/lib/analytics'

type Props = {
  bookId: string
  isbn?: string | null
  title: string
  author?: string | null
}

type AffiliateSettings = {
  bookshopId: string
  amazonTag: string
  priority: 'bookshop' | 'amazon'
  adsEnabled: boolean
}

export default function BuyBookButton({ bookId, isbn, title, author }: Props) {
  const [settings, setSettings] = useState<AffiliateSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/affiliate-settings')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Failed to fetch affiliate settings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !settings || !settings.adsEnabled) {
    return null
  }

  const generateBookshopLink = () => {
    if (!settings.bookshopId) return null
    
    if (isbn) {
      // Direct ISBN link
      return `https://bookshop.org/a/${settings.bookshopId}/${isbn}`
    }
    
    // Search link fallback
    const query = encodeURIComponent(`${title} ${author || ''}`.trim())
    return `https://bookshop.org/search?keywords=${query}&affiliate=${settings.bookshopId}`
  }

  const generateAmazonLink = () => {
    if (!settings.amazonTag) return null
    
    if (isbn) {
      // Direct ISBN link
      return `https://www.amazon.com/dp/${isbn}?tag=${settings.amazonTag}`
    }
    
    // Search link fallback
    const query = encodeURIComponent(`${title} ${author || ''}`.trim())
    return `https://www.amazon.com/s?k=${query}&tag=${settings.amazonTag}`
  }

  const handleClick = (source: 'bookshop' | 'amazon', link: string) => {
    analytics.affiliateLinkClicked(bookId, source, 'book_card')
    window.open(link, '_blank', 'noopener,noreferrer')
  }

  const bookshopLink = generateBookshopLink()
  const amazonLink = generateAmazonLink()

  const primaryLink = settings.priority === 'bookshop' ? bookshopLink : amazonLink
  const primarySource = settings.priority
  const secondaryLink = settings.priority === 'bookshop' ? amazonLink : bookshopLink
  const secondarySource = settings.priority === 'bookshop' ? 'amazon' : 'bookshop'

  if (!primaryLink && !secondaryLink) {
    return null // No links available
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <p className="text-xs text-gray-500 mb-2">📚 Buy this book:</p>
      <div className="flex flex-wrap gap-2">
        {primaryLink && (
          <button
            onClick={() => handleClick(primarySource, primaryLink)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            {primarySource === 'bookshop' ? '🏪 Bookshop.org' : '📦 Amazon'}
          </button>
        )}
        {secondaryLink && (
          <button
            onClick={() => handleClick(secondarySource as 'bookshop' | 'amazon', secondaryLink)}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
          >
            {secondarySource === 'bookshop' ? '🏪 Bookshop.org' : '📦 Amazon'}
          </button>
        )}
      </div>
      {!isbn && (
        <p className="text-xs text-gray-400 mt-1">
          No ISBN - showing search results
        </p>
      )}
    </div>
  )
}
