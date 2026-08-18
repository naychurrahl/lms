import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { api } from '../utils/api'
import { ApiError } from '../utils/apiBase'

interface PublicOrganization {
  id: string
  name: string
}

/**
 * Every sign-in is now Organization-scoped — there is no generic /sign-in
 * anymore (information_architecture.md's "the Organization is always
 * explicit" now applies to the entry point too, not just authenticated
 * screens). :organizationId in the URL accepts either the real id or the
 * Organization's short `code` (backend: getPublicOrganization), so an
 * institution can share the friendlier "/explore/acme/sign-in".
 *
 * Login itself is still global (a User's identity isn't Organization-scoped
 * — authentication.md), so after a successful login this double-checks the
 * caller actually belongs to the Organization whose door they walked
 * through, rather than silently landing them in a different Organization
 * they also happen to be a member of.
 */
export function OrgSignIn() {
  const { organizationId: routeOrgId } = useParams<{ organizationId: string }>()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [organization, setOrganization] = useState<PublicOrganization | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!routeOrgId) {
      return
    }
    api
      .get<PublicOrganization>(`/organizations/${routeOrgId}/public`)
      .then(setOrganization)
      .catch(() => setNotFound(true))
  }, [routeOrgId])

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (!organization) {
      return
    }
    setError(null)
    setIsSubmitting(true)

    try {
      const user = await login(email, password)
      if (!user.organizationIds.includes(organization.id)) {
        setError(`Your account isn't part of ${organization.name}.`)
        return
      }
      navigate(`/organizations/${organization.id}/dashboard`)
    } catch (err) {
      // authentication.md: identical message whether the email doesn't
      // exist or the password is wrong — the backend already enforces
      // this, so we just surface whatever it says.
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-4">
        <p className="text-text-secondary">This sign-in link isn't valid.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-md border border-border bg-surface p-4 sm:p-8">
        <h1 className="text-heading-lg font-semibold text-text-primary">
          Sign in{organization ? ` to ${organization.name}` : ''}
        </h1>

        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

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
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
          />
        </label>

        <Button type="submit" disabled={isSubmitting || !organization} className="w-full">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="text-sm text-text-secondary">
          <Link to="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </p>
      </form>
    </div>
  )
}
