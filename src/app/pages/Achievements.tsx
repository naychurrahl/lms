import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { StatusPill } from '../components/ui/StatusPill'
import { api } from '../utils/api'

interface Certificate {
  id: string
  certificateNumber: string
  issueDate: string
  status: string
}

interface BadgeAward {
  id: string
  badgeId: string
  badgeName: string
  status: string
  awardedAt: string
}

/** screens.md: grid of Certificate + Badge cards; each Certificate links to the shareable public verification URL. */
export function Achievements() {
  const { organizationId } = useOrganization()
  const { user } = useAuth()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [badgeAwards, setBadgeAwards] = useState<BadgeAward[]>([])

  useEffect(() => {
    if (!user) {
      return
    }
    api.get<Certificate[]>(`/organizations/${organizationId}/users/${user.id}/certificates`).then(setCertificates)
    api.get<BadgeAward[]>(`/organizations/${organizationId}/users/${user.id}/badge-awards`).then(setBadgeAwards)
  }, [organizationId, user])

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Achievements</h1>

      <h2 className="mt-6 text-heading-sm font-medium text-text-primary">Certificates</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {certificates.map((cert) => (
          <Link
            key={cert.id}
            to={`/organizations/${organizationId}/achievements/certificates/${cert.id}`}
            className="block rounded-md border border-border bg-surface p-4 hover:border-primary"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-text-primary">{cert.certificateNumber}</span>
              <StatusPill status={cert.status} />
            </div>
            <p className="mt-1 text-sm text-text-secondary">Issued {new Date(cert.issueDate).toLocaleDateString()}</p>
          </Link>
        ))}
        {certificates.length === 0 && <p className="text-text-secondary">No certificates yet.</p>}
      </div>

      <h2 className="mt-8 text-heading-sm font-medium text-text-primary">Badges</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {badgeAwards.map((award) => (
          <div key={award.id} className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-text-primary">{award.badgeName}</span>
              <StatusPill status={award.status} />
            </div>
            <p className="mt-1 text-sm text-text-secondary">Awarded {new Date(award.awardedAt).toLocaleDateString()}</p>
          </div>
        ))}
        {badgeAwards.length === 0 && <p className="text-text-secondary">No badges yet.</p>}
      </div>
    </div>
  )
}
