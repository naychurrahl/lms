import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useOrganization } from '../../context/OrganizationContext'
import { StatusPill } from '../../components/ui/StatusPill'
import { api } from '../../utils/api'

interface Assessment {
  id: string
  title: string
}

interface Submission {
  id: string
  userId: string
  status: string
  submittedAt: string | null
  gradeStatus: string | null
  score: number | null
}

interface Row extends Submission {
  assessmentTitle: string
}

/** screens.md Wireframe 7 — every ungraded/graded Submission across the course's Assessments, one flat list. */
export function Gradebook() {
  const { courseId } = useParams<{ courseId: string }>()
  const { organizationId } = useOrganization()
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    if (!courseId) {
      return
    }
    api.get<Assessment[]>(`/organizations/${organizationId}/courses/${courseId}/assessments`).then(async (assessments) => {
      const entries = await Promise.all(
        assessments.map(async (a) => {
          const submissions = await api.get<Submission[]>(`/organizations/${organizationId}/assessments/${a.id}/submissions`)
          return submissions.map((s) => ({ ...s, assessmentTitle: a.title }))
        })
      )
      setRows(entries.flat())
    })
  }, [organizationId, courseId])

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Gradebook</h1>

      <div className="mt-6 divide-y divide-border rounded-md border border-border bg-surface">
        {rows.map((row) => (
          <Link
            key={row.id}
            to={`/organizations/${organizationId}/teaching/courses/${courseId}/gradebook/${row.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-bg"
          >
            <div>
              <p className="text-text-primary">{row.assessmentTitle}</p>
              <p className="text-sm text-text-secondary">{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '—'}</p>
            </div>
            <div className="flex items-center gap-3">
              {row.score !== null && <span className="text-sm text-text-secondary">{row.score}</span>}
              <StatusPill status={row.gradeStatus ?? 'not_started'} />
            </div>
          </Link>
        ))}
        {rows.length === 0 && <p className="px-4 py-3 text-text-secondary">No submissions yet.</p>}
      </div>
    </div>
  )
}
