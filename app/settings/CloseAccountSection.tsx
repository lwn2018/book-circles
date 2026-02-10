'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CloseAccountSection({ userEmail }: { userEmail: string }) {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showGoodbye, setShowGoodbye] = useState(false)
  const [checking, setChecking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [checkResult, setCheckResult] = useState<any>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleCheckDeletion = async () => {
    setChecking(true)
    setError('')

    try {
      const response = await fetch('/api/account/check-deletion')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check account status')
      }

      setCheckResult(data)

      if (data.can_delete) {
        setShowConfirmation(true)
      } else {
        // Show blockers
        setError('Cannot close account yet')
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setChecking(false)
    }
  }

  const handleDelete = async () => {
    // Accept either "DELETE" or the user's email address
    if (confirmText !== 'DELETE' && confirmText !== userEmail) {
      setError('Please type DELETE or your email address to confirm')
      return
    }

    setDeleting(true)
    setError('')

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      // Success - show goodbye screen
      setShowGoodbye(true)

    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
    }
  }

  const handleFeedbackAndExit = async (reason?: string) => {
    // Log feedback if provided
    if (reason) {
      try {
        await fetch('/api/account/deletion-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        })
      } catch (err) {
        // Don't block exit if feedback fails
        console.error('Failed to log deletion feedback:', err)
      }
    }

    // Redirect to homepage
    router.push('/')
  }

  const renderBlockers = () => {
    if (!checkResult || checkResult.can_delete) return null

    const { active_borrows, blockers } = checkResult
    const borrowingCount = active_borrows.borrowing?.length || 0
    const lentOutCount = active_borrows.lent_out?.length || 0

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="font-semibold text-red-900 mb-3">
          You have {lentOutCount} book{lentOutCount !== 1 ? 's' : ''} currently lent out 
          and are borrowing {borrowingCount} book{borrowingCount !== 1 ? 's' : ''}.
        </p>
        <p className="text-sm text-red-800 mb-2">
          Please return borrowed books and recall your lent books before closing your account.
        </p>
        
        {blockers.has_active_borrows && active_borrows.borrowing.length > 0 && (
          <div className="mb-3 mt-4">
            <p className="text-sm font-medium text-red-800 mb-1">
              Books you're currently borrowing:
            </p>
            <ul className="text-sm text-red-700 list-disc list-inside ml-2">
              {active_borrows.borrowing.map((book: any) => (
                <li key={book.id}>{book.title} {book.author ? `by ${book.author}` : ''}</li>
              ))}
            </ul>
          </div>
        )}

        {blockers.has_lent_books && active_borrows.lent_out.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium text-red-800 mb-1">
              Your books currently lent out:
            </p>
            <ul className="text-sm text-red-700 list-disc list-inside ml-2">
              {active_borrows.lent_out.map((book: any) => (
                <li key={book.id}>
                  {book.title} {book.author ? `by ${book.author}` : ''} 
                  (with {book.current_borrower?.full_name || 'someone'})
                </li>
              ))}
            </ul>
          </div>
        )}

        {blockers.has_pending_handoffs && active_borrows.pending_handoffs.length > 0 && (
          <div>
            <p className="text-sm font-medium text-red-800 mb-1">
              Pending handoff confirmations:
            </p>
            <ul className="text-sm text-red-700 list-disc list-inside ml-2">
              {active_borrows.pending_handoffs.map((handoff: any) => (
                <li key={handoff.id}>{handoff.book?.title || 'Book'}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  // Goodbye screen after successful deletion
  if (showGoodbye) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">We're sorry to see you go</h2>
        <p className="text-gray-600 mb-6">
          Your account has been closed. Your data will be permanently deleted in 30 days.
        </p>
        
        <p className="text-sm text-gray-600 mb-4">
          Want to help us improve? Let us know why you're leaving (optional):
        </p>
        
        <div className="space-y-2 mb-6">
          <button
            onClick={() => handleFeedbackAndExit('too_complicated')}
            className="w-full px-4 py-2 text-left text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Too complicated
          </button>
          <button
            onClick={() => handleFeedbackAndExit('not_enough_friends')}
            className="w-full px-4 py-2 text-left text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Not enough friends using it
          </button>
          <button
            onClick={() => handleFeedbackAndExit('privacy_concerns')}
            className="w-full px-4 py-2 text-left text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Privacy concerns
          </button>
          <button
            onClick={() => handleFeedbackAndExit('other')}
            className="w-full px-4 py-2 text-left text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Other
          </button>
        </div>

        <button
          onClick={() => handleFeedbackAndExit()}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Skip feedback
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6 border-2 border-red-200">
      <h2 className="text-xl font-bold mb-4 text-red-900">Close Account</h2>
      
      {!showConfirmation ? (
        <>
          <p className="text-gray-600 mb-4">
            Permanently close your PagePass account. This action cannot be undone after 30 days.
          </p>

          {checkResult && renderBlockers()}

          {error && !checkResult && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleCheckDeletion}
            disabled={checking}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checking ? 'Checking...' : 'Close Account'}
          </button>
        </>
      ) : (
        <>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="font-semibold text-yellow-900 mb-3">
              This will permanently delete your account, remove your books from all circles, and delete your data.
            </p>
            <p className="text-sm text-yellow-800 font-semibold mb-1">
              This cannot be undone.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-mono font-bold">DELETE</span> or your email address to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE or your email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting || (confirmText !== 'DELETE' && confirmText !== userEmail)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? 'Closing Account...' : 'Close My Account'}
            </button>
            <button
              onClick={() => {
                setShowConfirmation(false)
                setConfirmText('')
                setError('')
              }}
              disabled={deleting}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}
