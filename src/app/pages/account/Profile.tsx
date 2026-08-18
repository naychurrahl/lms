import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { api } from '../../utils/api'

interface Me {
  id: string
  name: string
  email: string
  profile: { displayName: string | null; bio: string | null; locale: string | null; timezone: string | null } | null
}

/** screens.md: users, profiles. Name/email are managed at the User resource level (no self-service edit endpoint exists for those); only the Profile sub-resource is editable here. */
export function Profile() {
  const { user } = useAuth()
  const [me, setMe] = useState<Me | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get<Me>('/me').then((data) => {
      setMe(data)
      setDisplayName(data.profile?.displayName ?? '')
      setBio(data.profile?.bio ?? '')
    })
  }, [])

  async function save(): Promise<void> {
    if (!user) {
      return
    }
    await api.patch(`/users/${user.id}/profile`, { displayName, bio })
    setSaved(true)
  }

  if (!me) {
    return null
  }

  return (
    <div className="mx-auto max-w-xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Profile</h1>

      <div className="mt-6 space-y-4 rounded-md border border-border bg-surface p-4">
        <div>
          <p className="text-sm text-text-secondary">Name</p>
          <p className="text-text-primary">{me.name}</p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Email</p>
          <p className="text-text-primary">{me.email}</p>
        </div>

        <label className="block">
          <span className="text-sm text-text-secondary">Display name</span>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary" />
        </label>
        <label className="block">
          <span className="text-sm text-text-secondary">Bio</span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary" />
        </label>

        <Button onClick={() => void save()}>Save</Button>
        {saved && <p className="text-sm text-text-secondary">Saved.</p>}
      </div>
    </div>
  )
}
