import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useOrganization } from '../../context/OrganizationContext'
import { StatusPill } from '../../components/ui/StatusPill'
import { Button } from '../../components/ui/Button'
import { api } from '../../utils/api'

interface Course {
  id: string
  title: string
  description: string | null
  visibility: string
  status: string
  version: number
}

interface Instructor {
  userId: string
  roleInCourse: string
  name: string
}

/** screens.md: general fields + the Publish/Submit-for-Review actions + an Instructors tab. Approve/Reject lives on the Admin "All Courses" screen instead, per screens.md's own division of labor. */
export function CourseSettings() {
  const { courseId } = useParams<{ courseId: string }>()
  const { organizationId } = useOrganization()
  const [course, setCourse] = useState<Course | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [newInstructorId, setNewInstructorId] = useState('')

  function load(): void {
    if (!courseId) {
      return
    }
    api.get<Course>(`/organizations/${organizationId}/courses/${courseId}`).then((c) => {
      setCourse(c)
      setTitle(c.title)
      setDescription(c.description ?? '')
    })
    api.get<Instructor[]>(`/organizations/${organizationId}/courses/${courseId}/instructors`).then(setInstructors)
  }

  useEffect(load, [organizationId, courseId])

  async function saveFields(): Promise<void> {
    if (!course) {
      return
    }
    const updated = await api.patch<Course>(
      `/organizations/${organizationId}/courses/${course.id}`,
      { title, description: description || null },
      { ifMatch: course.version }
    )
    setCourse(updated)
  }

  async function runTransition(action: string): Promise<void> {
    if (!course) {
      return
    }
    const updated = await api.post<Course>(`/organizations/${organizationId}/courses/${course.id}/${action}`)
    setCourse(updated)
  }

  async function addInstructor(): Promise<void> {
    if (!newInstructorId.trim() || !courseId) {
      return
    }
    await api.post(`/organizations/${organizationId}/courses/${courseId}/instructors`, { userId: newInstructorId, roleInCourse: 'instructor' })
    setNewInstructorId('')
    load()
  }

  async function removeInstructor(userId: string): Promise<void> {
    if (!courseId) {
      return
    }
    await api.delete(`/organizations/${organizationId}/courses/${courseId}/instructors/${userId}`)
    load()
  }

  if (!course) {
    return null
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-lg font-semibold text-text-primary">Course Settings</h1>
        <StatusPill status={course.status} />
      </div>

      <div className="mt-6 space-y-4 rounded-md border border-border bg-surface p-4">
        <label className="block">
          <span className="text-sm text-text-secondary">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary" />
        </label>
        <label className="block">
          <span className="text-sm text-text-secondary">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
          />
        </label>
        <Button onClick={() => void saveFields()}>Save</Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {course.status === 'draft' && <Button variant="secondary" onClick={() => void runTransition('submit-for-review')}>Submit for review</Button>}
        {course.status === 'published' && <Button variant="secondary" onClick={() => void runTransition('unpublish')}>Unpublish</Button>}
        {course.status === 'published' && <Button variant="secondary" onClick={() => void runTransition('retire')}>Retire</Button>}
        {course.status !== 'archived' && <Button variant="destructive" onClick={() => void runTransition('archive')}>Archive</Button>}
      </div>

      <h2 className="mt-8 text-heading-sm font-medium text-text-primary">Instructors</h2>
      <div className="mt-3 divide-y divide-border rounded-md border border-border bg-surface">
        {instructors.map((instructor) => (
          <div key={instructor.userId} className="flex items-center justify-between px-4 py-3">
            <span className="text-text-primary">{instructor.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary">{instructor.roleInCourse}</span>
              <Button variant="ghost" onClick={() => void removeInstructor(instructor.userId)}>Remove</Button>
            </div>
          </div>
        ))}
        {instructors.length === 0 && <p className="px-4 py-3 text-text-secondary">No instructors added yet.</p>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={newInstructorId}
          onChange={(e) => setNewInstructorId(e.target.value)}
          placeholder="User ID"
          className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary"
        />
        <Button variant="secondary" onClick={() => void addInstructor()}>Add</Button>
      </div>
    </div>
  )
}
