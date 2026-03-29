'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import ReportUserModal from './ReportUserModal'
import BlockUserDialog from './BlockUserDialog'

type Props = {
  userId: string
  userName: string
  currentUserId: string
  onReportSuccess?: () => void
  onBlockSuccess?: () => void
  buttonClassName?: string
}

export default function UserActionsMenu({ 
  userId, 
  userName, 
  currentUserId,
  onReportSuccess,
  onBlockSuccess,
  buttonClassName = ''
}: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  // Don't show menu for own profile
  if (userId === currentUserId) {
    return null
  }

  const handleReportSuccess = () => {
    setToast('Report submitted. We\'ll review it shortly.')
    setTimeout(() => setToast(null), 4000)
    onReportSuccess?.()
  }

  const handleBlockSuccess = () => {
    setToast(`${userName} has been blocked.`)
    setTimeout(() => setToast(null), 4000)
    onBlockSuccess?.()
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className={`p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors ${buttonClassName}`}
          aria-label="User actions"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-1 w-48 bg-[#27272A] rounded-lg shadow-lg border border-zinc-700 py-1 z-20">
            <button
              onClick={() => {
                setShowMenu(false)
                setShowReportModal(true)
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-zinc-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Report {userName.split(' ')[0]}
            </button>
            <button
              onClick={() => {
                setShowMenu(false)
                setShowBlockDialog(true)
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Block {userName.split(' ')[0]}
            </button>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportUserModal
          userId={userId}
          userName={userName}
          onClose={() => setShowReportModal(false)}
          onSuccess={handleReportSuccess}
        />
      )}

      {/* Block Dialog */}
      {showBlockDialog && (
        <BlockUserDialog
          userId={userId}
          userName={userName}
          onClose={() => setShowBlockDialog(false)}
          onSuccess={handleBlockSuccess}
        />
      )}

      {/* Toast */}
      {toast && mounted && createPortal(
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm">{toast}</span>
        </div>,
        document.body
      )}
    </>
  )
}
