import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useOrganization } from '../../context/OrganizationContext'
import { StatusPill } from '../../components/ui/StatusPill'
import { Button } from '../../components/ui/Button'
import { api } from '../../utils/api'

interface Answer {
  id: string
  questionId: string
  selectedOptionId: string | null
  responseText: string | null
}

interface Grade {
  id: string
  score: number | null
  percentage: number | null
  status: string
}

interface Rubric {
  id: string
  title: string
  maxScore: number
}

interface Feedback {
  id: string
  body: string
}

/** screens.md Wireframe 8 — opens as a side panel from the Gradebook in the wireframe; here a standalone route reachable from the Gradebook list. */
export function SubmissionGrading() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const { organizationId } = useOrganization()

  const [answers, setAnswers] = useState<Answer[]>([])
  const [grade, setGrade] = useState<Grade | null>(null)
  const [rubrics, setRubrics] = useState<Rubric[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [score, setScore] = useState('')
  const [rubricId, setRubricId] = useState('')
  const [feedbackBody, setFeedbackBody] = useState('')

  function load(): void {
    if (!submissionId) {
      return
    }
    api.get<Answer[]>(`/organizations/${organizationId}/submissions/${submissionId}/answers`).then(setAnswers)
    api.get<Rubric[]>(`/organizations/${organizationId}/rubrics`).then(setRubrics)
    api
      .get<Grade>(`/organizations/${organizationId}/submissions/${submissionId}/grade`)
      .then((g) => {
        setGrade(g)
        setScore(g.score !== null ? String(g.score) : '')
        api.get<Feedback[]>(`/organizations/${organizationId}/grades/${g.id}/feedback`).then(setFeedback)
      })
      .catch(() => setGrade(null))
  }

  useEffect(load, [organizationId, submissionId])

  async function saveGrade(): Promise<void> {
    if (!submissionId) {
      return
    }
    await api.put(`/organizations/${organizationId}/submissions/${submissionId}/grade`, {
      score: Number(score),
      rubricId: rubricId || undefined,
    })
    load()
  }

  async function runTransition(action: 'finalize' | 'release' | 'reopen'): Promise<void> {
    if (!submissionId) {
      return
    }
    await api.post(`/organizations/${organizationId}/submissions/${submissionId}/grade/${action}`)
    load()
  }

  async function addFeedback(): Promise<void> {
    if (!grade || !feedbackBody.trim()) {
      return
    }
    await api.post(`/organizations/${organizationId}/grades/${grade.id}/feedback`, { body: feedbackBody })
    setFeedbackBody('')
    load()
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Grade Submission</h1>

      <h2 className="mt-6 text-heading-sm font-medium text-text-primary">Answers</h2>
      <ul className="mt-3 space-y-2">
        {answers.map((answer) => (
          <li key={answer.id} className="rounded-md border border-border bg-surface p-3 text-sm text-text-primary">
            Question {answer.questionId}: {answer.responseText ?? answer.selectedOptionId}
          </li>
        ))}
        {answers.length === 0 && <p className="text-text-secondary">No answers recorded.</p>}
      </ul>

      <h2 className="mt-6 text-heading-sm font-medium text-text-primary">Grade</h2>
      <div className="mt-3 rounded-md border border-border bg-surface p-4">
        {grade && (
          <div className="mb-3 flex items-center justify-between">
            <span className="text-text-secondary">Status</span>
            <StatusPill status={grade.status} />
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="text-sm text-text-secondary">Score</span>
            <input value={score} onChange={(e) => setScore(e.target.value)} type="number" className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary" />
          </label>
          <label className="flex-1">
            <span className="text-sm text-text-secondary">Rubric</span>
            <select value={rubricId} onChange={(e) => setRubricId(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary">
              <option value="">None</option>
              {rubrics.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </label>
          <Button onClick={() => void saveGrade()}>Save</Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(!grade || grade.status === 'draft') && <Button variant="secondary" onClick={() => void runTransition('finalize')}>Finalize</Button>}
          {grade?.status === 'finalized' && <Button variant="secondary" onClick={() => void runTransition('release')}>Release</Button>}
          {grade && (grade.status === 'finalized' || grade.status === 'released') && (
            <Button variant="ghost" onClick={() => void runTransition('reopen')}>Reopen</Button>
          )}
        </div>
      </div>

      {grade && (
        <>
          <h2 className="mt-6 text-heading-sm font-medium text-text-primary">Feedback</h2>
          <ul className="mt-3 space-y-2">
            {feedback.map((f) => (
              <li key={f.id} className="rounded-md border border-border bg-surface p-3 text-text-primary">{f.body}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={feedbackBody}
              onChange={(e) => setFeedbackBody(e.target.value)}
              placeholder="Add feedback"
              className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary"
            />
            <Button variant="secondary" onClick={() => void addFeedback()}>Add</Button>
          </div>
        </>
      )}
    </div>
  )
}
