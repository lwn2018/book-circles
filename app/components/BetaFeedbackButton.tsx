'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function BetaFeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackType, setFeedbackType] = useState<'bug' | 'confusing' | 'idea' | null>(null)
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackText.trim()) return

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('Please sign in to submit feedback')
        setLoading(false)
        return
      }

      const response = await fetch('/api/beta-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_url: window.location.href,
          current_path: pathname,
          device_info: navigator.userAgent,
          screen_size: `${window.innerWidth}x${window.innerHeight}`,
          app_version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
          feedback_type: feedbackType,
          feedback_text: feedbackText.trim()
        })
      })

      if (!response.ok) throw new Error('Failed to submit feedback')

      setShowConfirmation(true)
      setFeedbackText('')
      setFeedbackType(null)

      setTimeout(() => {
        setShowConfirmation(false)
        setIsOpen(false)
      }, 2000)

    } catch (error) {
      console.error('Failed to submit feedback:', error)
      alert('Failed to submit feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 z-40 bg-[#55B2DE] text-white p-3 rounded-full shadow-lg hover:bg-[#4A9FCB] active:scale-95 transition" style={{ bottom: "calc(5rem + env(safe-area-inset-bottom) + 1rem)" }}
        aria-label="Report issue"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setIsOpen(false)} />

          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto">
            <div className="bg-[#1E293B] rounded-2xl shadow-2xl p-6">
              {showConfirmation ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#55B2DE]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-white">
                    Thanks — the PagePass team will see this.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Close Button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="text-[#6B7280] hover:text-white transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Type (optional)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['bug', 'confusing', 'idea'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFeedbackType(feedbackType === type ? null : type)}
                          className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 transition ${
                            feedbackType === type
                              ? 'border-[#55B2DE] bg-[#55B2DE]/10'
                              : 'border-[#333] hover:border-[#55B2DE]/50'
                          }`}
                        >
                          <span className="text-xl">
                            {type === 'bug' ? '🐛' : type === 'confusing' ? '🤔' : '💡'}
                          </span>
                          <span className="text-sm text-white capitalize">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Text */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      What happened?
                    </label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full px-4 py-3 bg-[#27272A] border-2 border-[#333] rounded-xl text-white placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#55B2DE] focus:border-transparent resize-none"
                      rows={5}
                      placeholder="Describe what you experienced..."
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !feedbackText.trim()}
                    className="w-full py-4 bg-[#55B2DE] text-white rounded-xl font-semibold hover:bg-[#4A9FCB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Sending...' : 'Send Feedback'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
