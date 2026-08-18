import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useOrganization } from '../../context/OrganizationContext'
import { StatusPill } from '../../components/ui/StatusPill'
import { Button } from '../../components/ui/Button'
import { api } from '../../utils/api'

interface RosterRow {
  id: string
  userId: string
  status: string
  userName: string
  userEmail: string
}

/** screens.md: approve/reject pending Enrollments; take Attendance. */
export function Roster() {
  const { courseId } = useParams<{ courseId: string }>()
  const { organizationId } = useOrganization()
  const [rows, setRows] = useState<RosterRow[]>([])

  function load(): void {
    if (!courseId) {
      return
    }
    api.get<RosterRow[]>(`/organizations/${organizationId}/courses/${courseId}/roster`).then(setRows)
  }

  useEffect(load, [organizationId, courseId])

  async function approve(enrollmentId: string): Promise<void> {
    await api.post(`/organizations/${organizationId}/enrollments/${enrollmentId}/approve`)
    load()
  }

  async function reject(enrollmentId: string): Promise<void> {
    await api.post(`/organizations/${organizationId}/enrollments/${enrollmentId}/reject`)
    load()
  }

  async function markAttendance(enrollmentId: string, status: string): Promise<void> {
    await api.post(`/organizations/${organizationId}/enrollments/${enrollmentId}/attendance`, { status, sessionDate: new Date().toISOString().slice(0, 10) })
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Roster</h1>

      <div className="mt-6 divide-y divide-border rounded-md border border-border bg-surface">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-text-primary">{row.userName}</p>
              <p className="text-sm text-text-secondary">{row.userEmail}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={row.status} />
              {row.status === 'pending' && (
                <>
                  <Button variant="secondary" onClick={() => void approve(row.id)}>Approve</Button>
                  <Button variant="destructive" onClick={() => void reject(row.id)}>Reject</Button>
                </>
              )}
              {row.status === 'active' && (
                <>
                  <Button variant="ghost" onClick={() => void markAttendance(row.id, 'present')}>Present</Button>
                  <Button variant="ghost" onClick={() => void markAttendance(row.id, 'absent')}>Absent</Button>
                </>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="px-4 py-3 text-text-secondary">No enrollments yet.</p>}
      </div>
    </div>
  )
}
