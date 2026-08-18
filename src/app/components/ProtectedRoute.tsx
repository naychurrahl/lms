import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { getLastOrganization } from '../utils/lastOrganization'

/**
 * There's no generic sign-in anymore — every entry point is
 * Organization-scoped (`/explore/:organizationId/sign-in`). An unauthenticated
 * visit deep inside `/organizations/:organizationId/...` (e.g. a session that
 * expired mid-use) already carries the right Organization in its own URL, so
 * it bounces back to exactly that Organization's sign-in. A bare,
 * contextless visit (no :organizationId anywhere in the matched route) falls
 * back to whichever Organization this browser last actively used
 * (OrganizationContext remembers it); with neither, there's genuinely no
 * Organization to send them to — this simply says so rather than guessing.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const { organizationId } = useParams<{ organizationId: string }>()

  if (isLoading) {
    // A real loading state lands with the rest of design_system.md's
    // components in Phase 12 — this is a deliberate placeholder, not a bug.
    return null
  }

  if (!user) {
    const target = organizationId ?? getLastOrganization()
    if (target) {
      return <Navigate to={`/explore/${target}/sign-in`} replace />
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-4">
        <p className="max-w-sm text-center text-text-secondary">
          Use the sign-in link provided by your institution to get started.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
