'use client'

import Link from 'next/link'

type Book = {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  owner_id: string
  created_at: string
  owner: { full_name: string } | null
}

type RecentlyAddedCarouselProps = {
  books: Book[]
  userId: string
  circleId: string
}

const COVER_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6']

function hashColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
  }
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length]
}

export default function RecentlyAddedCarousel({ books, userId, circleId }: RecentlyAddedCarouselProps) {
  if (books.length === 0) return null

  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 
          className="text-white text-lg font-semibold"
          style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600 }}
        >
          Recently Added
        </h2>
        <Link 
          href={`/circles/${circleId}?filter=recent`}
          className="text-[#55B2DE] text-sm hover:text-[#6BC4EC] transition-colors"
          style={{ fontFamily: 'var(--font-figtree)', fontSize: '14px', fontWeight: 500 }}
        >
          View all
        </Link>
      </div>

      {/* Horizontal Carousel */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {books.map((book) => {
          const isOwner = book.owner_id === userId
          const ownerName = book.owner?.full_name?.split(' ')[0] || 'Someone'

          return (
            <Link 
              key={book.id} 
              href={`/books/${book.id}`}
              className="flex-shrink-0 w-[120px] group"
            >
              {/* Book Cover */}
              <div className="relative mb-2">
                <div 
                  className="w-[120px] h-[175px] rounded-lg overflow-hidden flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
                  style={{ backgroundColor: book.cover_url ? '#2A3441' : hashColor(book.title) }}
                >
                  {book.cover_url ? (
                    <img 
                      src={book.cover_url} 
                      alt={book.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => { 
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = `<span class="text-white text-[11px] font-medium text-center px-2 line-clamp-4">${book.title}</span>`
                      }}
                    />
                  ) : (
                    <span className="text-white text-[11px] font-medium text-center px-2 line-clamp-4">
                      {book.title}
                    </span>
                  )}
                </div>
                
                {/* "You added" badge */}
                {isOwner && (
                  <div 
                    className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ 
                      backgroundColor: 'rgba(74, 222, 128, 0.2)', 
                      color: '#4ADE80',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    You added
                  </div>
                )}
              </div>

              {/* Title */}
              <h3 
                className="text-white text-sm font-medium line-clamp-2 mb-0.5 group-hover:text-[#55B2DE] transition-colors"
                style={{ fontFamily: 'var(--font-figtree)', fontSize: '13px', fontWeight: 500, lineHeight: '1.3' }}
              >
                {book.title}
              </h3>

              {/* Added by */}
              <p 
                className="text-[#9F9FA9] text-xs"
                style={{ fontFamily: 'var(--font-figtree)', fontSize: '11px', fontWeight: 400 }}
              >
                Added by {isOwner ? 'you' : ownerName}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
