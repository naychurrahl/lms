import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useOrganization } from '../context/OrganizationContext'
import { StatusPill } from '../components/ui/StatusPill'
import { api } from '../utils/api'

interface Submission {
  id: string
  status: string
}

interface Grade {
  id: string
  score: number | null
  percentage: number | null
  passed: boolean | null
  status: string
}

interface Feedback {
  id: string
  body: string
}

/** screens.md Wireframe 5 — only meaningfully reachable once grades.status = released; earlier statuses just show "not graded yet." */
export function AssessmentResult() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const { organizationId } = useOrganization()

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [grade, setGrade] = useState<Grade | null>(null)
  const [feedback, setFeedback] = useState<Feedback[]>([])

  useEffect(() => {
    if (!attemptId) {
      return
    }
    api.get<Submission>(`/organizations/${organizationId}/attempts/${attemptId}/submission`).then(async (sub) => {
      setSubmission(sub)
      try {
        const g = await api.get<Grade>(`/organizations/${organizationId}/submissions/${sub.id}/grade`)
        setGrade(g)
        setFeedback(await api.get<Feedback[]>(`/organizations/${organizationId}/grades/${g.id}/feedback`))
      } catch {
        return
      }
    })
  }, [organizationId, attemptId])

  if (!submission) {
    return null
  }

  if (!grade || grade.status !== 'released') {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-8">
        <h1 className="text-heading-lg font-semibold text-text-primary">Result</h1>
        <p className="mt-4 text-text-secondary">Your submission is being graded. Check back once it's released.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Result</h1>

      <div className="mt-6 rounded-md border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-text-primary">Score</span>
          <span className="font-medium text-text-primary">
            {grade.score ?? '—'} {grade.percentage !== null && `(${grade.percentage}%)`}
          </span>
        </div>
        {grade.passed !== null && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-text-primary">Outcome</span>
            <StatusPill status={grade.passed ? 'approved' : 'failed'} />
          </div>
        )}
      </div>

      {feedback.length > 0 && (
        <div className="mt-6">
          <h2 className="text-heading-sm font-medium text-text-primary">Feedback</h2>
          <ul className="mt-3 space-y-2">
            {feedback.map((f) => (
              <li key={f.id} className="rounded-md border border-border bg-surface p-4 text-text-primary">
                {f.body}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
