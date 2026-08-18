import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { cn } from '../utils/cn'
import { api } from '../utils/api'

interface Notification {
  id: string
  type: string
  channel: string
  payload: Record<string, unknown> | null
  deliveryStatus: string
  createdAt: string
}

/** screens.md: reachable from the global bell on every screen. */
export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  function load(): void {
    api.get<Notification[]>('/me/notifications').then(setNotifications)
  }

  useEffect(load, [])

  async function markRead(id: string): Promise<void> {
    await api.post(`/me/notifications/${id}/read`)
    load()
  }

  async function markAllRead(): Promise<void> {
    await api.post('/me/notifications/read-all')
    load()
  }

  return (
    <div className="mx-auto max-w-xl p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-lg font-semibold text-text-primary">Notifications</h1>
        <Button variant="ghost" onClick={() => void markAllRead()}>Mark all read</Button>
      </div>

      <div className="mt-6 divide-y divide-border rounded-md border border-border bg-surface">
        {notifications.map((notification) => (
          <button
            key={notification.id}
            onClick={() => void markRead(notification.id)}
            className={cn('block w-full px-4 py-3 text-left hover:bg-bg', notification.deliveryStatus !== 'delivered' && 'bg-primary/5')}
          >
            <p className="text-text-primary">{notification.type.replace(/_/g, ' ')}</p>
            <p className="text-sm text-text-secondary">{new Date(notification.createdAt).toLocaleString()}</p>
          </button>
        ))}
        {notifications.length === 0 && <p className="px-4 py-3 text-text-secondary">No notifications yet.</p>}
      </div>
    </div>
  )
}
