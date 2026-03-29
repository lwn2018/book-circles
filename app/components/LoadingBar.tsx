'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function FlippingBook() {
  return (
    <div className="relative w-12 h-10 perspective-500">
      {/* Book spine */}
      <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-full bg-[#55B2DE] rounded-sm z-10" />
      
      {/* Left pages (static) */}
      <div className="absolute left-0 top-0 w-5 h-full bg-[#2d7a9e] rounded-l-md border-r border-[#55B2DE]/30" />
      
      {/* Right pages (static) */}
      <div className="absolute right-0 top-0 w-5 h-full bg-[#2d7a9e] rounded-r-md border-l border-[#55B2DE]/30" />
      
      {/* Animated flipping pages */}
      <div className="absolute right-[7px] top-0 w-5 h-full origin-left animate-[pageFlip_1.2s_ease-in-out_infinite]">
        <div className="w-full h-full bg-[#55B2DE] rounded-r-md shadow-lg" />
      </div>
      <div className="absolute right-[7px] top-0 w-5 h-full origin-left animate-[pageFlip_1.2s_ease-in-out_infinite_0.3s]">
        <div className="w-full h-full bg-[#4AA3CC] rounded-r-md shadow-lg" />
      </div>
      <div className="absolute right-[7px] top-0 w-5 h-full origin-left animate-[pageFlip_1.2s_ease-in-out_infinite_0.6s]">
        <div className="w-full h-full bg-[#3d96bd] rounded-r-md shadow-lg" />
      </div>
    </div>
  )
}

export default function LoadingBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(false)
  }, [pathname, searchParams])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (link && link.href && link.href.startsWith(window.location.origin)) {
        const url = new URL(link.href)
        if (url.pathname !== pathname) {
          setLoading(true)
          setTimeout(() => setLoading(false), 10000)
        }
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [pathname])

  if (!loading) return null

  return (
    <div 
      className="fixed inset-0 z-[100] bg-[#121212]/90 flex items-center justify-center"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex flex-col items-center gap-4">
        <FlippingBook />
        <span className="text-[#55B2DE] text-sm font-medium">Turning pages...</span>
      </div>
    </div>
  )
}
