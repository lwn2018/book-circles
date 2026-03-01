'use client'

import { useState, useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'
import { isNative } from '@/lib/platform'
import { openExternal } from '@/lib/externalLinks'

type Props = {
  bookId: string
  isbn?: string | null
  title: string
  author?: string | null
}

type AffiliateSettings = {
  indigoId: string
  amazonTag: string
  amazonCaTag: string
  priority: 'indigo' | 'amazon-ca' | 'amazon'
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

  const generateIndigoLink = () => {
    if (!settings.indigoId) return null
    
    if (isbn) {
      // Indigo ISBN link format
      return `https://www.chapters.indigo.ca/en-ca/books/?isbn=${isbn}&ikwid=${isbn}&ikwsec=Home#algoliaQueryId=&affiliate=${settings.indigoId}`
    }
    
    // Search link fallback
    const query = encodeURIComponent(`${title} ${author || ''}`.trim())
    return `https://www.chapters.indigo.ca/en-ca/books/search/?keywords=${query}&affiliate=${settings.indigoId}`
  }

  const generateAmazonCaLink = () => {
    const affiliateTag = 'pagepass04-20'
    const query = isbn 
      ? encodeURIComponent(isbn)
      : encodeURIComponent(`${title} ${author || ''}`.trim())
    return `https://www.amazon.ca/s?k=${query}&tag=${affiliateTag}`
  }

  const generateAmazonLink = () => {
    const affiliateTag = 'pagepass04-20'
    const query = isbn 
      ? encodeURIComponent(isbn)
      : encodeURIComponent(`${title} ${author || ''}`.trim())
    return `https://www.amazon.ca/s?k=${query}&tag=${affiliateTag}`
  }

  const handleClick = async (source: 'bookshop' | 'amazon' | 'indigo' | 'amazon-ca', link: string) => {
    trackEvent.affiliateLinkClicked(bookId, source, 'book_card')
    
    if (isNative()) {
      // Open in system browser on native app
      await openExternal(link)
    } else {
      // Open in new tab on web
      window.open(link, '_blank', 'noopener,noreferrer')
    }
  }

  const indigoLink = generateIndigoLink()
  const amazonCaLink = generateAmazonCaLink()
  const amazonLink = generateAmazonLink()

  // Determine primary and secondary links based on priority
  type AffiliateSource = 'bookshop' | 'amazon' | 'indigo' | 'amazon-ca'
  let primaryLink: string | null = null
  let primarySource: AffiliateSource = 'amazon'
  let primaryLabel = ''
  let secondaryLinks: Array<{ link: string; source: AffiliateSource; label: string }> = []

  if (settings.priority === 'indigo') {
    primaryLink = indigoLink
    primarySource = 'indigo'
    primaryLabel = '🇨🇦 Indigo'
    if (amazonCaLink) secondaryLinks.push({ link: amazonCaLink, source: 'amazon-ca', label: '📦 Amazon.ca' })
    if (amazonLink) secondaryLinks.push({ link: amazonLink, source: 'amazon', label: '📦 Amazon.com' })
  } else if (settings.priority === 'amazon-ca') {
    primaryLink = amazonCaLink
    primarySource = 'amazon-ca'
    primaryLabel = '📦 Amazon.ca'
    if (indigoLink) secondaryLinks.push({ link: indigoLink, source: 'indigo', label: '🇨🇦 Indigo' })
    if (amazonLink) secondaryLinks.push({ link: amazonLink, source: 'amazon', label: '📦 Amazon.com' })
  } else { // amazon
    primaryLink = amazonLink
    primarySource = 'amazon'
    primaryLabel = '📦 Amazon.com'
    if (amazonCaLink) secondaryLinks.push({ link: amazonCaLink, source: 'amazon-ca', label: '📦 Amazon.ca' })
    if (indigoLink) secondaryLinks.push({ link: indigoLink, source: 'indigo', label: '🇨🇦 Indigo' })
  }

  if (!primaryLink && secondaryLinks.length === 0) {
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
            {primaryLabel}
          </button>
        )}
        {secondaryLinks.map((secondary, idx) => (
          <button
            key={idx}
            onClick={() => handleClick(secondary.source, secondary.link)}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
          >
            {secondary.label}
          </button>
        ))}
      </div>
      {!isbn && (
        <p className="text-xs text-gray-400 mt-1">
          No ISBN - showing search results
        </p>
      )}
    </div>
  )
}
