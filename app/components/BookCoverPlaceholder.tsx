/**
 * Styled placeholder component for books without cover art
 * Uses a color derived from book hash with title/author text
 */

interface BookCoverPlaceholderProps {
  title: string
  author?: string | null
  isbn?: string | null
  className?: string
  status?: 'available' | 'borrowed' | 'in_transit' | 'off_shelf'
}

// Muted jewel tone palette (matches user avatar circles)
const COVER_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#14b8a6', // teal
  '#a855f7', // purple
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

function getColorForBook(isbn?: string | null, title?: string): string {
  const seed = isbn || title || 'default'
  const hash = hashString(seed)
  return COVER_COLORS[hash % COVER_COLORS.length]
}

export default function BookCoverPlaceholder({
  title,
  author,
  isbn,
  className = '',
  status = 'available'
}: BookCoverPlaceholderProps) {
  const backgroundColor = getColorForBook(isbn, title)

  // Apply opacity based on book status
  // Available: 100%, Borrowed/Passing: 70%, Off Shelf: 50%
  const getOpacityClass = () => {
    if (status === 'off_shelf') return 'opacity-50'
    if (status === 'borrowed' || status === 'in_transit') return 'opacity-70'
    return 'opacity-100'
  }

  const opacityClass = getOpacityClass()

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-4 ${className} ${opacityClass}`}
      style={{
        aspectRatio: '2/3',
        backgroundColor,
        borderRadius: '4px',
      }}
    >
      <div className="text-center px-2 space-y-2">
        <h3 
          className="text-white font-bold text-sm leading-tight line-clamp-3"
          style={{ 
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {title}
        </h3>
        {author && (
          <p 
            className="text-white/80 text-xs font-normal line-clamp-2"
            style={{ 
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {author}
          </p>
        )}
      </div>
    </div>
  )
}
