import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useOrganization } from '../context/OrganizationContext'
import { StatusPill } from '../components/ui/StatusPill'
import { api } from '../utils/api'

interface Certificate {
  id: string
  certificateNumber: string
  verificationCode: string
  issueDate: string
  status: string
}

/** screens.md: PDF/print view + the same verification code shown on the public Verify screen. */
export function CertificateDetail() {
  const { id } = useParams<{ id: string }>()
  const { organizationId } = useOrganization()
  const [certificate, setCertificate] = useState<Certificate | null>(null)

  useEffect(() => {
    if (!id) {
      return
    }
    api.get<Certificate>(`/organizations/${organizationId}/certificates/${id}`).then(setCertificate)
  }, [organizationId, id])

  if (!certificate) {
    return null
  }

  return (
    <div className="mx-auto max-w-xl p-4 sm:p-8 print:p-0">
      <div className="rounded-md border border-border bg-surface p-4 sm:p-8 text-center">
        <p className="text-sm uppercase tracking-wide text-text-secondary">Certificate</p>
        <h1 className="mt-2 text-heading-lg font-semibold text-text-primary">{certificate.certificateNumber}</h1>
        <div className="mt-3 flex justify-center">
          <StatusPill status={certificate.status} />
        </div>
        <p className="mt-4 text-text-secondary">Issued {new Date(certificate.issueDate).toLocaleDateString()}</p>

        <div className="mt-6 rounded-md border border-border bg-bg p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Verification code</p>
          <p className="mt-1 font-mono text-text-primary">{certificate.verificationCode}</p>
        </div>

        <p className="mt-4 text-sm text-text-secondary">
          Anyone can confirm this certificate at <Link to="/verify" className="text-primary hover:underline">the public verification page</Link>.
        </p>
      </div>

      <button onClick={() => window.print()} className="mt-4 text-sm text-primary hover:underline print:hidden">
        Print / Save as PDF
      </button>
    </div>
  )
}
