import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { StatusPill } from '../../components/ui/StatusPill'
import { api } from '../../utils/api'

interface Credential {
  id: string
  type: string
  status: string
  lastUsedAt: string | null
}

interface Session {
  id: string
  ipAddress: string | null
  userAgent: string | null
  lastSeenAt: string | null
}

/**
 * screens.md: MFA enrollment, "sign out of all devices." MFA enrollment here
 * takes a client-supplied secret directly — a real TOTP flow (server-generated
 * secret + QR code) needs a dedicated endpoint that doesn't exist yet, so
 * this is the simplest form that exercises the actual createCredential API.
 */
export function Security() {
  const { user, logout } = useAuth()
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [totpSecret, setTotpSecret] = useState('')

  function load(): void {
    if (!user) {
      return
    }
    api.get<Credential[]>(`/users/${user.id}/credentials`).then(setCredentials)
    api.get<Session[]>(`/users/${user.id}/sessions`).then(setSessions)
  }

  useEffect(load, [user])

  async function enrollMfa(): Promise<void> {
    if (!user || !totpSecret.trim()) {
      return
    }
    await api.post(`/users/${user.id}/credentials`, { type: 'mfa_totp', secret: totpSecret })
    setTotpSecret('')
    load()
  }

  async function revokeCredential(id: string): Promise<void> {
    if (!user) {
      return
    }
    await api.delete(`/users/${user.id}/credentials/${id}`)
    load()
  }

  async function signOutEverywhere(): Promise<void> {
    if (!user) {
      return
    }
    await api.delete(`/users/${user.id}/sessions`)
    await logout()
  }

  return (
    <div className="mx-auto max-w-xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Security</h1>

      <h2 className="mt-6 text-heading-sm font-medium text-text-primary">Credentials</h2>
      <div className="mt-3 divide-y divide-border rounded-md border border-border bg-surface">
        {credentials.map((credential) => (
          <div key={credential.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-text-primary">{credential.type}</span>
            <div className="flex items-center gap-3">
              <StatusPill status={credential.status} />
              {credential.type !== 'password' && (
                <Button variant="ghost" onClick={() => void revokeCredential(credential.id)}>Revoke</Button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={totpSecret}
          onChange={(e) => setTotpSecret(e.target.value)}
          placeholder="TOTP secret"
          className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary"
        />
        <Button variant="secondary" onClick={() => void enrollMfa()}>Enroll MFA</Button>
      </div>

      <h2 className="mt-8 text-heading-sm font-medium text-text-primary">Active sessions</h2>
      <div className="mt-3 divide-y divide-border rounded-md border border-border bg-surface">
        {sessions.map((session) => (
          <div key={session.id} className="px-4 py-3">
            <p className="text-text-primary">{session.ipAddress ?? 'Unknown IP'}</p>
            <p className="text-sm text-text-secondary">{session.userAgent ?? 'Unknown device'}</p>
          </div>
        ))}
        {sessions.length === 0 && <p className="px-4 py-3 text-text-secondary">No active sessions.</p>}
      </div>
      <Button variant="destructive" className="mt-3" onClick={() => void signOutEverywhere()}>
        Sign out of all devices
      </Button>
    </div>
  )
}
