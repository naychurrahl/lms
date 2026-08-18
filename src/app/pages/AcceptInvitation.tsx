import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../utils/api'
import { Button } from '../components/ui/Button'
import { ApiError } from '../utils/apiBase'

type Outcome = 'accepted' | 'rejected'

/**
 * state_transitions.md: accepting creates a brand-new account in
 * pending_verification, one step short of Active — it cannot sign in until
 * an administrator calls the Verify action (IdentityFunctions::verifyUser(),
 * user.update). So this screen never assumes the invitee can sign in right
 * after accepting; it only claims that for an email that already had an
 * account (whose existing Active status is untouched by accepting).
 *
 * name/password are collected unconditionally since this screen has no way
 * to know in advance whether the invited email already has an account
 * (asking the backend would disclose account existence) — the backend
 * simply ignores them when one already exists.
 */
export function AcceptInvitation() {
  const { token } = useParams<{ token: string }>()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  async function handleAccept(event: FormEvent): Promise<void> {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const invitation = await api.post<{ organizationId: string }>(`/invitations/${token}/accept`, { name, password })
      setOrganizationId(invitation.organizationId)
      setOutcome('accepted')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReject(): Promise<void> {
    setError(null)
    setIsSubmitting(true)

    try {
      const invitation = await api.post<{ organizationId: string }>(`/invitations/${token}/reject`)
      setOrganizationId(invitation.organizationId)
      setOutcome('rejected')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (outcome === 'accepted') {
    return (
      <InvitationResult title="Invitation accepted" organizationId={organizationId}>
        If you already had an account, you can sign in now. If this created a new account, an
        administrator needs to verify it before you can sign in — you'll be notified once that's done.
      </InvitationResult>
    )
  }

  if (outcome === 'rejected') {
    return (
      <InvitationResult title="Invitation declined" organizationId={organizationId}>
        You can close this page.
      </InvitationResult>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <form onSubmit={handleAccept} className="w-full max-w-sm space-y-4 rounded-md border border-border bg-surface p-4 sm:p-8">
        <h1 className="text-heading-lg font-semibold text-text-primary">You've been invited</h1>
        <p className="text-sm text-text-secondary">
          If you don't have an account yet, fill in your name and choose a password. If you already
          do, these are ignored — just accept below.
        </p>

        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <label className="block space-y-1">
          <span className="text-sm text-text-secondary">Full name (new accounts only)</span>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-text-secondary">Password (new accounts only)</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
          />
        </label>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Accepting…' : 'Accept'}
          </Button>
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={handleReject} className="flex-1">
            Decline
          </Button>
        </div>
      </form>
    </div>
  )
}

function InvitationResult({
  title,
  organizationId,
  children,
}: {
  title: string
  organizationId: string | null
  children: string
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-sm space-y-4 rounded-md border border-border bg-surface p-4 sm:p-8">
        <h1 className="text-heading-lg font-semibold text-text-primary">{title}</h1>
        <p className="text-sm text-text-secondary">{children}</p>
        {organizationId && (
          <p className="text-sm text-text-secondary">
            <Link to={`/explore/${organizationId}/sign-in`} className="text-primary hover:underline">
              Go to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
