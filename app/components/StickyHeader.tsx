'use client'

import { useRouter } from 'next/navigation'

interface StickyHeaderProps {
  title?: string
  fallbackHref?: string
  children?: React.ReactNode
  showBack?: boolean
}

export default function StickyHeader({ 
  title, 
  fallbackHref = '/circles',
  children,
  showBack = true
}: StickyHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <div 
      className="sticky top-0 z-40 bg-[#121212] border-b border-[#334155]"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="px-4 py-3 flex items-center gap-3">
        {showBack && (
          <button 
            onClick={handleBack}
            className="text-[#55B2DE] hover:text-[#4A9FCB] transition-colors p-1 -ml-1"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {title && (
          <h1 className="text-lg font-semibold text-white">{title}</h1>
        )}
        {children}
      </div>
    </div>
  )
}
