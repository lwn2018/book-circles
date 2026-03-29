'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function LoadingBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Reset when route changes
    setLoading(false)
    setProgress(0)
  }, [pathname, searchParams])

  useEffect(() => {
    // Listen for navigation start
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (link && link.href && link.href.startsWith(window.location.origin)) {
        // Internal link clicked
        const url = new URL(link.href)
        if (url.pathname !== pathname) {
          setLoading(true)
          setProgress(20)
          
          // Animate progress
          const interval = setInterval(() => {
            setProgress(p => {
              if (p >= 90) {
                clearInterval(interval)
                return 90
              }
              return p + Math.random() * 10
            })
          }, 200)
          
          // Cleanup after 10 seconds max
          setTimeout(() => {
            clearInterval(interval)
            setLoading(false)
            setProgress(0)
          }, 10000)
        }
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [pathname])

  if (!loading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div 
        className="h-full bg-[#55B2DE] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
