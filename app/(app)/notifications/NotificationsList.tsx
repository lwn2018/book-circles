'use client'

import { useState, useEffect } from 'react'
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
  metadata?: {
    action_buttons?: Array<{
      label: string
      action: string
    }>
  }
}

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const url = filter === 'unread' 
        ? '/api/notifications?unreadOnly=true&limit=100'
        : '/api/notifications?limit=100'
      const response = await fetch(url)
      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
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
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
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
    if (notification.type === 'soft_reminder') return
    if (!notification.read) markAsRead(notification.id)
    if (notification.action_url) router.push(notification.action_url)
  }

  const handleStillReading = async (notification: Notification) => {
    try {
      const response = await fetch('/api/notifications/actions/still-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: notification.book_id,
          notification_id: notification.id
        })
      })
      const data = await response.json()
      if (data.success) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Failed to handle still reading:', error)
    }
  }

  const handleReadyToPagepass = (notification: Notification) => {
    markAsRead(notification.id)
    router.push('/dashboard/borrowed')
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'book_ready': return '📚'
      case 'pass_reminder': return '⏰'
      case 'book_due': return '📅'
      case 'book_returned': return '↩️'
      case 'invite_accepted': return '🎉'
      case 'new_book': return '✨'
      case 'soft_reminder': return '📖'
      case 'badge_earned': return '🏆'
      default: return '🔔'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center justify-between p-4 border-b border-[#333]">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#55B2DE] text-white'
                : 'bg-[#27272A] text-[#9CA3AF] hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-[#55B2DE] text-white'
                : 'bg-[#27272A] text-[#9CA3AF] hover:text-white'
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {unreadCount > 0 && filter === 'all' && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-[#55B2DE] hover:text-[#6BC4EC] transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications */}
      {loading ? (
        <div className="p-12 text-center">
          <p className="text-[#9CA3AF]">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-5xl mb-4">🔔</p>
          <p className="font-medium text-white mb-2">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-sm text-[#9CA3AF]">
            {filter === 'unread' 
              ? "You're all caught up!"
              : "You'll be notified when books are ready, due soon, and more."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#333]">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-5 pl-8 hover:bg-[#27272A] transition cursor-pointer relative ${
                !notification.read ? 'bg-[#55B2DE]/10' : ''
              }`}
            >
              {/* Unread indicator dot */}
              {!notification.read && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#55B2DE] rounded-full" />
              )}
              
              <div className="flex gap-4">
                <span className="text-3xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 
                      className="font-medium text-white"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      {notification.message}
                    </h3>
                    <button
                      onClick={(e) => dismissNotification(notification.id, e)}
                      className="text-[#6B7280] hover:text-white flex-shrink-0 p-1 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-[#6B7280] mt-1">{formatTime(notification.created_at)}</p>
                  
                  {/* Action Buttons for Soft Reminders */}
                  {notification.type === 'soft_reminder' && notification.metadata?.action_buttons && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStillReading(notification)
                        }}
                        className="px-4 py-2 bg-[#55B2DE] text-white text-sm font-medium rounded-lg hover:bg-[#4A9FCB] transition-colors"
                      >
                        Still reading
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReadyToPagepass(notification)
                        }}
                        className="px-4 py-2 bg-[#27272A] text-white text-sm font-medium rounded-lg hover:bg-[#3F3F46] transition-colors"
                      >
                        Ready to pagepass
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
