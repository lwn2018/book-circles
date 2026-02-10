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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('Please sign in to submit feedback')
        setLoading(false)
        return
      }

      // Capture context
      const pageUrl = window.location.href
      const currentPath = pathname
      const deviceInfo = navigator.userAgent
      const screenSize = `${window.innerWidth}x${window.innerHeight}`
      const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'

      // Submit feedback
      const response = await fetch('/api/beta-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_url: pageUrl,
          current_path: currentPath,
          device_info: deviceInfo,
          screen_size: screenSize,
          app_version: appVersion,
          feedback_type: feedbackType,
          feedback_text: feedbackText.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      // Show confirmation
      setShowConfirmation(true)
      setFeedbackText('')
      setFeedbackType(null)

      // Close after 2 seconds
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
      {/* Feedback Button - Bottom Left */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 transition"
        aria-label="Send feedback"
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" 
          />
        </svg>
      </button>

      {/* Feedback Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Feedback Form */}
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-2xl p-6">
              {showConfirmation ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">✓</div>
                  <p className="text-lg font-medium text-gray-900">
                    Thanks — the PagePass team will see this.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Send Feedback</h3>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Feedback Type Toggle (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type (optional)
                    </label>
                    <div className="flex gap-2">
                      {(['bug', 'confusing', 'idea'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFeedbackType(feedbackType === type ? null : type)}
                          className={`flex-1 px-3 py-2 text-sm rounded-lg border transition ${
                            feedbackType === type
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {type === 'bug' ? '🐛 Bug' : type === 'confusing' ? '🤔 Confusing' : '💡 Idea'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What happened?
                    </label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                      placeholder="Describe what you experienced..."
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !feedbackText.trim()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
