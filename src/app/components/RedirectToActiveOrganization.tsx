import { Navigate } from 'react-router'
import { useAuth } from '../context/AuthContext'

/**
 * There's no "current organization" session concept per
 * information_architecture.md — the Organization is always explicit in the
 * URL. This just picks the first active Membership from /me to land on,
 * standing in for the real Organization switcher until it's built.
 */
export function RedirectToActiveOrganization() {
  const { user } = useAuth()
  const organizationId = user?.organizationIds[0]

  if (!organizationId) {
    return <p className="p-8 text-text-secondary">You don't belong to any Organization yet.</p>
  }

  return <Navigate to={`/organizations/${organizationId}/dashboard`} replace />
}
