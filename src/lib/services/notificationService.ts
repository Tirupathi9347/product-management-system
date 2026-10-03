import { NotificationItem } from '@/types'
import { getSupabaseConfig } from '@/lib/supabase/config'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { ProductService } from '@/lib/services/productService'

/**
 * In-session set of notification IDs the user has marked as read.
 * Persisted to sessionStorage so it survives page navigation within the tab.
 */
function getReadSet(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = sessionStorage.getItem('spms_notif_read')
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch { /* ignore */ }
  return new Set()
}

function saveReadSet(set: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem('spms_notif_read', JSON.stringify([...set]))
  } catch { /* ignore */ }
}

function markIdRead(id: string) {
  const set = getReadSet()
  set.add(id)
  saveReadSet(set)
}

function markAllRead(ids: string[]) {
  const set = getReadSet()
  ids.forEach((id) => set.add(id))
  saveReadSet(set)
}

/**
 * Generate live notifications from real product data.
 */
async function generateLiveNotifications(): Promise<NotificationItem[]> {
  const products = await ProductService.getProducts()
  const readSet = getReadSet()
  const now = new Date()
  const notifications: NotificationItem[] = []

  for (const p of products) {
    // Expiry alerts
    if (p.expiry_date) {
      const expiry = new Date(p.expiry_date)
      const daysLeft = Math.ceil((expiry.getTime() - now.setHours(0,0,0,0)) / 86400000)

      if (daysLeft < 0) {
        const id = `notif_expired_${p.id}`
        notifications.push({
          id,
          user_id: p.user_id,
          product_id: p.id,
          type: 'EXPIRED',
          title: `${p.name} has expired`,
          message: `This item expired ${Math.abs(daysLeft)} day(s) ago. Remove it from stock.`,
          severity: 'danger',
          is_read: readSet.has(id),
          created_at: p.expiry_date!,
          metadata: {},
        })
      } else if (daysLeft <= 7) {
        const id = `notif_expiry_critical_${p.id}`
        notifications.push({
          id,
          user_id: p.user_id,
          product_id: p.id,
          type: 'URGENT_EXPIRY',
          title: `${p.name} expires in ${daysLeft} day(s)`,
          message: `Use or dispose before ${expiry.toLocaleDateString('en-IN')}.`,
          severity: 'urgent',
          is_read: readSet.has(id),
          created_at: now.toISOString(),
          metadata: {},
        })
      } else if (daysLeft <= 30) {
        const id = `notif_expiry_warn_${p.id}`
        notifications.push({
          id,
          user_id: p.user_id,
          product_id: p.id,
          type: 'EXPIRY',
          title: `${p.name} expires in ${daysLeft} day(s)`,
          message: `Plan consumption before ${expiry.toLocaleDateString('en-IN')}.`,
          severity: 'warning',
          is_read: readSet.has(id),
          created_at: now.toISOString(),
          metadata: {},
        })
      }
    }

    // Low stock alerts
    const minLevel = p.minimum_stock_level ?? 1
    if (p.quantity <= 0) {
      const id = `notif_oos_${p.id}`
      notifications.push({
        id,
        user_id: p.user_id,
        product_id: p.id,
        type: 'OUT_OF_STOCK',
        title: `${p.name} is out of stock`,
        message: `Current quantity is 0 ${p.unit}. Restock immediately.`,
        severity: 'danger',
        is_read: readSet.has(id),
        created_at: now.toISOString(),
        metadata: {},
      })
    } else if (p.quantity <= minLevel) {
      const id = `notif_low_stock_${p.id}`
      notifications.push({
        id,
        user_id: p.user_id,
        product_id: p.id,
        type: 'LOW_STOCK',
        title: `${p.name} is running low`,
        message: `Only ${p.quantity} ${p.unit} left (minimum: ${minLevel}).`,
        severity: 'warning',
        is_read: readSet.has(id),
        created_at: now.toISOString(),
        metadata: {},
      })
    }
  }

  // Sort: unread first, then by severity
  const severityOrder: Record<string, number> = { danger: 0, urgent: 1, warning: 2, info: 3 }
  return notifications.sort((a, b) => {
    if (a.is_read !== b.is_read) return a.is_read ? 1 : -1
    return (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  })
}

export class NotificationService {
  /**
   * Retrieves active system notifications generated from real product data.
   */
  public static async getNotifications(unreadOnly = false): Promise<NotificationItem[]> {
    const { isConfigured } = getSupabaseConfig()

    // When Supabase is configured, generate live notifications from product data
    if (isConfigured) {
      try {
        const all = await generateLiveNotifications()
        return unreadOnly ? all.filter((n) => !n.is_read) : all
      } catch {
        return []
      }
    }

    // Dev mode fallback
    const { devStore } = await import('@/lib/dev/devStore')
    return devStore.getNotifications(unreadOnly)
  }

  /**
   * Retrieves current unread notification count (same source as the page).
   */
  public static async getUnreadCount(): Promise<number> {
    const list = await this.getNotifications(true)
    return list.length
  }

  /**
   * Marks a single notification as read (session-persisted).
   */
  public static async markAsRead(id: string): Promise<void> {
    const { isConfigured } = getSupabaseConfig()
    if (isConfigured) {
      markIdRead(id)
      return
    }
    const { devStore } = await import('@/lib/dev/devStore')
    devStore.markNotificationRead(id)
  }

  /**
   * Marks all current notifications as read.
   */
  public static async markAllAsRead(): Promise<void> {
    const { isConfigured } = getSupabaseConfig()
    if (isConfigured) {
      const all = await generateLiveNotifications()
      markAllRead(all.map((n) => n.id))
      return
    }
    const { devStore } = await import('@/lib/dev/devStore')
    devStore.markAllNotificationsRead()
  }

  /**
   * Clears a notification (adds to read set in live mode).
   */
  public static async clearNotification(id: string): Promise<void> {
    const { isConfigured } = getSupabaseConfig()
    if (isConfigured) {
      // Mark as read acts as dismissal for generated notifications
      markIdRead(id)
      return
    }
    const { devStore } = await import('@/lib/dev/devStore')
    devStore.clearNotification(id)
  }

  /**
   * Writes a notification to Supabase (used by background engine if table exists).
   */
  public static async pushNotification(
    notification: Omit<NotificationItem, 'id' | 'created_at' | 'is_read'>
  ): Promise<void> {
    const { isConfigured } = getSupabaseConfig()
    if (!isConfigured) return

    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.from('notifications' as never).insert({
        ...notification,
        is_read: false,
        created_at: new Date().toISOString(),
      } as never)
    } catch { /* silent — notifications table may not exist */ }
  }
}
