'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Notification = {
  id: string
  type: string
  message: string
  action_url: string | null
  book_id: string | null
  sender_id: string | null
  read: boolean
  created_at: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=10')
      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications/mark-all-read', { method: 'POST' })
      if (!response.ok) {
        console.error('Failed to mark all as read')
        return
      }
      await fetchNotifications()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await fetch(`/api/notifications/${notificationId}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to dismiss notification:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) markAsRead(notification.id)
    if (notification.action_url) {
      router.push(notification.action_url)
      setShowDropdown(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'book_ready': return '📚'
      case 'pass_reminder': return '⏰'
      case 'book_due': return '📅'
      case 'book_returned': return '↩️'
      case 'invite_accepted': return '🎉'
      case 'new_book': return '✨'
      case 'badge_earned': return '🏆'
      default: return '🔔'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-[#1E1E1E] transition"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="fixed sm:absolute right-4 sm:right-0 left-4 sm:left-auto top-20 sm:top-auto sm:mt-2 w-auto sm:w-96 bg-[#1E293B] rounded-xl shadow-2xl border border-[#333] z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#333]">
            <h3 className="font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-sm text-[#55B2DE] hover:text-[#6BC4EC] disabled:opacity-50 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-4xl mb-3">🔔</p>
                <p className="text-[#9CA3AF]">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#333]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 pl-6 hover:bg-[#27272A] transition cursor-pointer relative ${
                      !notification.read ? 'bg-[#55B2DE]/10' : ''
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!notification.read && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#55B2DE] rounded-full" />
                    )}
                    
                    <div className="flex gap-3">
                      <span className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-white" style={{ fontFamily: 'var(--font-inter)' }}>
                            {notification.message}
                          </p>
                          <button
                            onClick={(e) => dismissNotification(notification.id, e)}
                            className="text-[#6B7280] hover:text-white flex-shrink-0 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-[#6B7280] mt-2">{formatTime(notification.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-[#333] text-center">
              <button
                onClick={() => {
                  router.push('/notifications')
                  setShowDropdown(false)
                }}
                className="text-sm text-[#55B2DE] hover:text-[#6BC4EC] transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
