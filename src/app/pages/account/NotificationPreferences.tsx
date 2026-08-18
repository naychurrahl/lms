import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { api } from '../../utils/api'

interface Me {
  profile: { notificationPreferences: { email?: boolean; inApp?: boolean } | null } | null
}

/** screens.md: notification channel settings. */
export function NotificationPreferences() {
  const { user } = useAuth()
  const [email, setEmail] = useState(true)
  const [inApp, setInApp] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get<Me>('/me').then((me) => {
      setEmail(me.profile?.notificationPreferences?.email ?? true)
      setInApp(me.profile?.notificationPreferences?.inApp ?? true)
    })
  }, [])

  async function save(): Promise<void> {
    if (!user) {
      return
    }
    await api.patch(`/users/${user.id}/profile`, { notificationPreferences: { email, inApp } })
    setSaved(true)
  }

  return (
    <div className="mx-auto max-w-md p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Notification Preferences</h1>

      <div className="mt-6 space-y-4 rounded-md border border-border bg-surface p-4">
        <label className="flex items-center justify-between">
          <span className="text-text-primary">Email</span>
          <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between">
          <span className="text-text-primary">In-app</span>
          <input type="checkbox" checked={inApp} onChange={(e) => setInApp(e.target.checked)} />
        </label>
        <Button onClick={() => void save()}>Save</Button>
        {saved && <p className="text-sm text-text-secondary">Saved.</p>}
      </div>
    </div>
  )
}
