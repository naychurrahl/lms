import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router'
import { useAuth } from './AuthContext'
import { api } from '../utils/api'
import { rememberLastOrganization } from '../utils/lastOrganization'

interface OrganizationContextValue {
  organizationId: string
  /** Whether the caller holds this permission key in this Organization — there's no self-service "my role" endpoint, so gating is permission-key-based, not role-name-based. */
  can: (permissionKey: string) => boolean
  isLoading: boolean
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null)

/**
 * information_architecture.md: the Organization is always explicit in the
 * URL, never hidden session state — this reads it from the route param and
 * loads the caller's flattened permission set once per Organization, so
 * Layout's nav and every org-scoped screen can gate on it without refetching.
 */
export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { organizationId } = useParams<{ organizationId: string }>()
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user || !organizationId) {
      return
    }
    rememberLastOrganization(organizationId)
    setIsLoading(true)
    api
      .get<{ permissionKeys: string[] }>(`/organizations/${organizationId}/users/${user.id}/permissions`)
      .then((result) => setPermissions(new Set(result.permissionKeys)))
      .finally(() => setIsLoading(false))
  }, [organizationId, user])

  if (!organizationId) {
    return null
  }

  return (
    <OrganizationContext.Provider
      value={{ organizationId, can: (key) => permissions.has(key), isLoading }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}
