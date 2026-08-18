import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useOrganization } from '../../context/OrganizationContext'
import { api } from '../../utils/api'

interface Enrollment {
  status: string
}

interface Assessment {
  id: string
}

interface Submission {
  score: number | null
  gradeStatus: string | null
}

interface Stats {
  totalEnrolled: number
  completionRate: number
  averageScore: number | null
  ungradedCount: number
}

/**
 * screens.md cites the generic dashboards/metrics resources, but those model
 * admin-configured reporting widgets (Reporting section), not an
 * auto-computed per-course rollup. This computes completion rate and
 * average score directly from Enrollments/Submissions instead — "engagement
 * over time" would need an activity time-series endpoint that doesn't exist
 * yet, so it's left out rather than faked.
 */
export function CourseAnalytics() {
  const { courseId } = useParams<{ courseId: string }>()
  const { organizationId } = useOrganization()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (!courseId) {
      return
    }
    Promise.all([
      api.get<Enrollment[]>(`/organizations/${organizationId}/courses/${courseId}/enrollments`),
      api.get<Assessment[]>(`/organizations/${organizationId}/courses/${courseId}/assessments`),
    ]).then(async ([enrollments, assessments]) => {
      const submissionLists = await Promise.all(
        assessments.map((a) => api.get<Submission[]>(`/organizations/${organizationId}/assessments/${a.id}/submissions`))
      )
      const submissions = submissionLists.flat()
      const scored = submissions.filter((s) => s.score !== null)
      const completed = enrollments.filter((e) => e.status === 'completed')

      setStats({
        totalEnrolled: enrollments.length,
        completionRate: enrollments.length > 0 ? (completed.length / enrollments.length) * 100 : 0,
        averageScore: scored.length > 0 ? scored.reduce((sum, s) => sum + (s.score ?? 0), 0) / scored.length : null,
        ungradedCount: submissions.filter((s) => s.gradeStatus === null).length,
      })
    })
  }, [organizationId, courseId])

  if (!stats) {
    return null
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Course Analytics</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-sm text-text-secondary">Enrolled</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{stats.totalEnrolled}</p>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-sm text-text-secondary">Completion rate</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{Math.round(stats.completionRate)}%</p>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-sm text-text-secondary">Average score</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{stats.averageScore !== null ? stats.averageScore.toFixed(1) : '—'}</p>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-sm text-text-secondary">Ungraded submissions</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{stats.ungradedCount}</p>
        </div>
      </div>
    </div>
  )
}
