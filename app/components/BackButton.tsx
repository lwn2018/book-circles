'use client'

import { useRouter } from 'next/navigation'

interface BackButtonProps {
  className?: string
  fallbackHref?: string
}

export default function BackButton({ className = '', fallbackHref }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back()
    } else if (fallbackHref) {
      router.push(fallbackHref)
    } else {
      router.push('/circles')
    }
  }

  return (
    <button 
      onClick={handleBack}
      className={`text-[#9CA3AF] hover:text-white transition-colors ${className}`}
      aria-label="Go back"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  )
}
