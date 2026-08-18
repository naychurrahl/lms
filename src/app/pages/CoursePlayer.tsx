import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { StatusPill } from '../components/ui/StatusPill'
import { Button } from '../components/ui/Button'
import { cn } from '../utils/cn'
import { api } from '../utils/api'

interface Enrollment {
  id: string
  courseId: string
  status: string
  progress: { currentLessonId: string | null; completionPercentage: number; status: string } | null
}

interface Module {
  id: string
  title: string
  displayOrder: number
}

interface Lesson {
  id: string
  moduleId: string
  title: string
  lessonType: string
  displayOrder: number
}

interface Attachment {
  id: string
  contentItemId: string
}

interface ContentItem {
  id: string
  title: string
  contentType: string
}

interface Assessment {
  id: string
  title: string
  status: string
}

/** screens.md Wireframe 3 — module/lesson tree on the side, selected lesson's content in the main pane. */
export function CoursePlayer() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>()
  const [searchParams] = useSearchParams()
  const deepLinkedLessonId = searchParams.get('lesson')
  const { organizationId } = useOrganization()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [lessonsByModule, setLessonsByModule] = useState<Map<string, Lesson[]>>(new Map())
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<ContentItem[]>([])
  const [note, setNote] = useState('')
  const [assessments, setAssessments] = useState<Assessment[]>([])

  useEffect(() => {
    if (!enrollmentId) {
      return
    }
    api.get<Enrollment>(`/organizations/${organizationId}/enrollments/${enrollmentId}`).then(async (e) => {
      setEnrollment(e)
      setSelectedLessonId(deepLinkedLessonId ?? e.progress?.currentLessonId ?? null)
      const mods = await api.get<Module[]>(`/organizations/${organizationId}/courses/${e.courseId}/modules`)
      setModules(mods)
      const entries = await Promise.all(
        mods.map(async (m) => [m.id, await api.get<Lesson[]>(`/organizations/${organizationId}/modules/${m.id}/lessons`)] as const)
      )
      setLessonsByModule(new Map(entries))
      const courseAssessments = await api.get<Assessment[]>(`/organizations/${organizationId}/courses/${e.courseId}/assessments`)
      setAssessments(courseAssessments.filter((a) => a.status === 'published'))
    })
  }, [organizationId, enrollmentId, deepLinkedLessonId])

  async function startAssessment(assessmentId: string): Promise<void> {
    if (!enrollment) {
      return
    }
    const attempt = await api.post<{ id: string }>(`/organizations/${organizationId}/assessments/${assessmentId}/attempts`)
    navigate(`/organizations/${organizationId}/courses/${enrollment.courseId}/assessments/${assessmentId}/attempt/${attempt.id}`)
  }

  useEffect(() => {
    if (!selectedLessonId) {
      setAttachments([])
      return
    }
    api.get<Attachment[]>(`/organizations/${organizationId}/lessons/${selectedLessonId}/attachments`).then(async (list) => {
      const items = await Promise.all(list.map((a) => api.get<ContentItem>(`/organizations/${organizationId}/content-items/${a.contentItemId}`)))
      setAttachments(items)
    })
  }, [organizationId, selectedLessonId])

  async function selectLesson(lessonId: string): Promise<void> {
    setSelectedLessonId(lessonId)
    if (!enrollmentId) {
      return
    }
    const updated = await api.post<Enrollment>(`/organizations/${organizationId}/enrollments/${enrollmentId}/lessons/${lessonId}/start`)
    setEnrollment(updated)
  }

  async function completeLesson(): Promise<void> {
    if (!enrollmentId || !selectedLessonId) {
      return
    }
    const updated = await api.post<Enrollment>(`/organizations/${organizationId}/enrollments/${enrollmentId}/lessons/${selectedLessonId}/complete`)
    setEnrollment(updated)
  }

  async function addBookmark(): Promise<void> {
    if (!user || !selectedLessonId) {
      return
    }
    await api.post(`/organizations/${organizationId}/users/${user.id}/bookmarks`, { lessonId: selectedLessonId, note: note || null })
    setNote('')
  }

  if (!enrollment) {
    return null
  }

  const allLessons = [...lessonsByModule.values()].flat()
  const selectedLesson = allLessons.find((l) => l.id === selectedLessonId) ?? null

  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col lg:flex-row">
      <aside className="w-full shrink-0 border-b border-border bg-surface p-4 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-text-secondary">Progress</span>
          <span className="text-sm font-medium text-text-primary">{Math.round(enrollment.progress?.completionPercentage ?? 0)}%</span>
        </div>
        {modules
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((module) => (
            <div key={module.id} className="mb-4">
              <h3 className="mb-1 text-sm font-medium text-text-primary">{module.title}</h3>
              <ul>
                {(lessonsByModule.get(module.id) ?? [])
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((lesson) => (
                    <li key={lesson.id}>
                      <button
                        onClick={() => void selectLesson(lesson.id)}
                        className={cn(
                          'w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-bg',
                          lesson.id === selectedLessonId ? 'bg-bg text-text-primary' : 'text-text-secondary'
                        )}
                      >
                        {lesson.title}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}

        {assessments.length > 0 && (
          <div className="mt-6 border-t border-border pt-4">
            <h3 className="mb-2 text-sm font-medium text-text-primary">Assessments</h3>
            {assessments.map((assessment) => (
              <button
                key={assessment.id}
                onClick={() => void startAssessment(assessment.id)}
                className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-text-secondary hover:bg-bg hover:text-text-primary"
              >
                {assessment.title}
              </button>
            ))}
          </div>
        )}
      </aside>

      <main className="flex-1 p-4 sm:p-8">
        {selectedLesson ? (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-heading-lg font-semibold text-text-primary">{selectedLesson.title}</h1>
              <StatusPill status={selectedLesson.lessonType} />
            </div>

            <ul className="mt-6 space-y-2">
              {attachments.map((item) => (
                <li key={item.id} className="rounded-md border border-border bg-surface px-4 py-3 text-text-primary">
                  {item.title} <span className="text-sm text-text-secondary">({item.contentType})</span>
                </li>
              ))}
              {attachments.length === 0 && <p className="text-text-secondary">No attachments on this lesson.</p>}
            </ul>

            <div className="mt-6 flex items-center gap-3">
              <Button onClick={() => void completeLesson()}>Mark complete</Button>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Bookmark note (optional)"
                className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary"
              />
              <Button variant="secondary" onClick={() => void addBookmark()}>
                Bookmark
              </Button>
            </div>
          </>
        ) : (
          <p className="text-text-secondary">Select a lesson to begin.</p>
        )}
      </main>
    </div>
  )
}
