'use client'

import * as React from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { NotificationService } from '@/lib/services'
import { NotificationItem } from '@/types'
import {
  CheckCheck,
  Bell,
  AlertTriangle,
  AlertOctagon,
  Clock,
  ExternalLink,
  Trash2,
  Package,
} from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<'all' | 'unread'>('all')
  const { success } = useToast()

  const fetchNotifications = React.useCallback(async () => {
    try {
      const data = await NotificationService.getNotifications()
      setNotifications(data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkAsRead = async (id: string) => {
    await NotificationService.markAsRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    success('Alert Read', 'Notification marked as read.')
  }

  const handleMarkAllRead = async () => {
    await NotificationService.markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    success('All Read', 'All notifications marked as read.')
  }

  const handleClear = async (id: string) => {
    await NotificationService.markAsRead(id)
    await NotificationService.clearNotification(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    success('Alert Dismissed', 'Notification removed.')
  }

  const filtered = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.is_read
    return true
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'danger':
        return <AlertOctagon className="h-5 w-5 text-rose-500" />
      case 'urgent':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'warning':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <Bell className="h-5 w-5 text-indigo-500" />
    }
  }

  const formatTimeAgo = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch {
      return 'Recent'
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeader
        title="Notifications"
        description="Review alerts for upcoming expirations, low stock levels, and inventory events."
        action={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              leftIcon={<CheckCheck className="h-4 w-4" />}
            >
              Mark All Read ({unreadCount})
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'unread'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900/60"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
          description={
            activeTab === 'unread'
              ? 'You have caught up with all inventory alerts.'
              : 'System notifications, expiration warnings, and restock alerts will appear here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((notif) => (
            <Card
              key={notif.id}
              className={`p-4 transition-all flex items-start justify-between gap-4 ${
                !notif.is_read
                  ? 'border-l-4 border-l-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/15'
                  : 'opacity-85'
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 shrink-0 mt-0.5">
                  {getSeverityIcon(notif.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatTimeAgo(notif.created_at)}
                    </span>
                    {!notif.is_read && (
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {notif.message}
                  </p>

                  {/* Related Product Link */}
                  {notif.product_id && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <Link
                        href={`/products/${notif.product_id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <Package className="h-3.5 w-3.5" />
                        <span>Inspect Product</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 pt-0.5">
                {!notif.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notif.id)}
                    title="Mark as Read"
                  >
                    <CheckCheck className="h-4 w-4 text-slate-500 hover:text-indigo-600" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleClear(notif.id)}
                  title="Dismiss Notification"
                >
                  <Trash2 className="h-4 w-4 text-slate-400 hover:text-rose-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
