import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useCourseTitles } from '../hooks/useCourseTitles'
import { StatusPill } from '../components/ui/StatusPill'
import { cn } from '../utils/cn'
import { api } from '../utils/api'

interface Enrollment {
  id: string
  courseId: string
  status: string
  progress: { completionPercentage: number } | null
}

const TABS = ['active', 'completed', 'withdrawn'] as const
type Tab = (typeof TABS)[number]

const TAB_STATUSES: Record<Tab, string[]> = {
  active: ['active', 'pending'],
  completed: ['completed'],
  withdrawn: ['withdrawn', 'cancelled'],
}

/** screens.md: tabbed by Active / Completed / Withdrawn. */
export function MyLearning() {
  const { organizationId } = useOrganization()
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [tab, setTab] = useState<Tab>('active')
  const courseTitles = useCourseTitles(organizationId)

  useEffect(() => {
    if (!user) {
      return
    }
    api.get<Enrollment[]>(`/organizations/${organizationId}/users/${user.id}/enrollments`).then(setEnrollments)
  }, [organizationId, user])

  const visible = enrollments.filter((e) => TAB_STATUSES[tab].includes(e.status))

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">My Learning</h1>

      <div className="mt-4 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium capitalize',
              tab === t ? 'border-primary text-text-primary' : 'border-transparent text-text-secondary'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 divide-y divide-border rounded-md border border-border bg-surface">
        {visible.map((enrollment) => (
          <Link
            key={enrollment.id}
            to={`/organizations/${organizationId}/my-learning/${enrollment.id}/play`}
            className="flex items-center justify-between px-4 py-3 hover:bg-bg"
          >
            <span className="text-text-primary">{courseTitles.get(enrollment.courseId) ?? 'Course'}</span>
            <div className="flex items-center gap-3">
              {enrollment.progress && <span className="text-sm text-text-secondary">{Math.round(enrollment.progress.completionPercentage)}%</span>}
              <StatusPill status={enrollment.status} />
            </div>
          </Link>
        ))}
        {visible.length === 0 && <p className="px-4 py-3 text-text-secondary">Nothing here yet.</p>}
      </div>
    </div>
  )
}
