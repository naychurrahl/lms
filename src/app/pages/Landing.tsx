import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../utils/api'

interface PublicOrganization {
  id: string
  name: string
  code: string
}

/**
 * Shown to a visitor with no session and no known Organization (no
 * :organizationId in the URL, nothing remembered from a previous visit) —
 * previously just a paragraph telling them to find a sign-in link elsewhere.
 * Lists every Organization that has opted into self-registration
 * (GET /organizations/public) so there's an actual way in; an Organization
 * that's invitation-only simply doesn't appear here, matching how
 * PublicCatalog only offers "create an account" when the Organization
 * itself has turned it on.
 */
export function Landing() {
  const [organizations, setOrganizations] = useState<PublicOrganization[] | null>(null)

  useEffect(() => {
    api
      .get<PublicOrganization[]>('/organizations/public')
      .then(setOrganizations)
      .catch(() => setOrganizations([]))
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm space-y-4 rounded-md border border-border bg-surface p-4 sm:p-8">
        <h1 className="text-heading-lg font-semibold text-text-primary">Welcome</h1>
        <p className="text-sm text-text-secondary">Choose your institution to get started.</p>

        {organizations === null && <p className="text-sm text-text-secondary">Loading…</p>}

        {organizations?.length === 0 && (
          <p className="text-sm text-text-secondary">
            Use the sign-in link provided by your institution to get started.
          </p>
        )}

        {organizations && organizations.length > 0 && (
          <ul className="divide-y divide-border rounded-md border border-border">
            {organizations.map((org) => (
              <li key={org.id}>
                <Link
                  to={`/explore/${org.code}`}
                  className="block px-4 py-3 text-text-primary hover:bg-bg"
                >
                  {org.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
