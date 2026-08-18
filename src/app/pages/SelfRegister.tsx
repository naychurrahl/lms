import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { ApiError } from '../utils/apiBase'

/**
 * The self-registration option added alongside Invitation-based onboarding
 * (authentication.md documents invitation as the only path — this is the
 * deliberate addition), reachable from the Public Catalog of an Organization
 * that has opted in. "I am a..." picks the Role the account gets — Lecturer
 * additionally queues an Org Admin approval (backend: role_requests), so the
 * account works as a Student immediately either way rather than being locked
 * out while pending.
 */
export function SelfRegister() {
  const { organizationId } = useParams<{ organizationId: string }>()
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleKind, setRoleKind] = useState<'student' | 'lecturer'>('student')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingLecturerApproval, setPendingLecturerApproval] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (!organizationId) {
      return
    }
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await register(organizationId, name, email, password, roleKind)
      if (result.pendingLecturerApproval) {
        setPendingLecturerApproval(true)
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (pendingLecturerApproval) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-4">
        <div className="w-full max-w-sm space-y-4 rounded-md border border-border bg-surface p-4 text-center sm:p-8">
          <h1 className="text-heading-lg font-semibold text-text-primary">Account created</h1>
          <p className="text-sm text-text-secondary">
            You're signed in as a Student for now. Your request for Lecturer access is waiting on an
            administrator's approval — you'll get Lecturer access automatically once it's reviewed.
          </p>
          <Button className="w-full" onClick={() => navigate('/')}>
            Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-md border border-border bg-surface p-4 sm:p-8">
        <h1 className="text-heading-lg font-semibold text-text-primary">Create your account</h1>

        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <label className="block space-y-1">
          <span className="text-sm text-text-secondary">Full name</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-text-secondary">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-text-secondary">Password</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm text-text-secondary">I am a...</legend>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input type="radio" name="roleKind" checked={roleKind === 'student'} onChange={() => setRoleKind('student')} />
              Student
            </label>
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input type="radio" name="roleKind" checked={roleKind === 'lecturer'} onChange={() => setRoleKind('lecturer')} />
              Lecturer
            </label>
          </div>
          {roleKind === 'lecturer' && (
            <p className="text-xs text-text-secondary">
              Lecturer access needs an administrator's approval — you'll have Student access right away in the
              meantime.
            </p>
          )}
        </fieldset>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to={`/explore/${organizationId}/sign-in`} className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
