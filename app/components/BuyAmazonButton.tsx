'use client'

import { isNative } from '@/lib/platform'
import { openExternal } from '@/lib/externalLinks'

type Props = {
  book: {
    id?: string
    title: string
    author?: string | null
    isbn?: string | null
  }
  context: 
    | 'unavailable_to_borrow'
    | 'post_read_buy_own_copy'
    | 'browsing_recommendation'
    | 'gift_purchase'
    | 'post_pagepass_self'
    | 'post_pagepass_gift'
    | 'search_fallback'
  circleId?: string
  searchQuery?: string
  variant?: 'primary' | 'secondary' | 'link'
  children?: React.ReactNode
}

/**
 * Build Amazon.ca search URL with affiliate tag
 * Uses i=stripbooks to restrict to Books department
 */
function buildAmazonUrl(query: string): string {
  const affiliateTag = 'pagepass-20'
  const encodedQuery = encodeURIComponent(query.trim())
  return `https://www.amazon.ca/s?k=${encodedQuery}&i=stripbooks&tag=${affiliateTag}`
}

export default function BuyAmazonButton({
  book,
  context,
  circleId,
  searchQuery,
  variant = 'primary',
  children
}: Props) {
  // Build search query: prefer ISBN, then title + author
  const query = book.isbn 
    ? book.isbn
    : `${book.title} ${book.author || ''}`.trim()
  
  const amazonUrl = buildAmazonUrl(query)

  // Track click asynchronously (fire and forget)
  const trackClick = () => {
    fetch('/api/track-purchase-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        book_id: book.id || null,
        isbn: book.isbn || null,
        book_title: book.title,
        book_author: book.author || null,
        click_context: context,
        circle_id: circleId || null,
        search_query: searchQuery || null,
        affiliate_url: amazonUrl
      })
    }).catch(err => console.error('Failed to track purchase click:', err))

    // Also log to user_events for analytics
    fetch('/api/events/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'amazon_link_clicked',
        metadata: {
          query: searchQuery || query,
          book_title: book.title
        }
      })
    }).catch(() => {})
  }

  const handleClick = async (e: React.MouseEvent) => {
    trackClick()
    
    if (isNative()) {
      e.preventDefault()
      await openExternal(amazonUrl)
    }
  }

  const baseStyles = 'inline-flex items-center justify-center font-medium rounded transition'
  const variantStyles = {
    primary: 'px-4 py-2 bg-[#FF9900] text-[#232F3E] hover:bg-[#FFB84D]',
    secondary: 'px-3 py-1.5 bg-[#27272A] text-[#9CA3AF] hover:bg-[#3F3F46]',
    link: 'text-[#FF9900] hover:underline'
  }

  return (
    <a
      href={amazonUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles[variant]}`}
    >
      {children || '🛒 Buy on Amazon'}
    </a>
  )
}

// Export URL builder for use elsewhere
export { buildAmazonUrl }
