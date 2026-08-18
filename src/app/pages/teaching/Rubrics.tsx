import { useEffect, useState } from 'react'
import { useOrganization } from '../../context/OrganizationContext'
import { Button } from '../../components/ui/Button'
import { api } from '../../utils/api'

interface Rubric {
  id: string
  title: string
  maxScore: number
}

/** screens.md: simple CRUD list; a rubric is selected, not authored, from within Grading. */
export function Rubrics() {
  const { organizationId } = useOrganization()
  const [rubrics, setRubrics] = useState<Rubric[]>([])
  const [title, setTitle] = useState('')
  const [maxScore, setMaxScore] = useState('100')

  function load(): void {
    api.get<Rubric[]>(`/organizations/${organizationId}/rubrics`).then(setRubrics)
  }

  useEffect(load, [organizationId])

  async function createRubric(): Promise<void> {
    if (!title.trim()) {
      return
    }
    await api.post(`/organizations/${organizationId}/rubrics`, { title, maxScore: Number(maxScore), criteria: {} })
    setTitle('')
    load()
  }

  async function deleteRubric(id: string): Promise<void> {
    await api.delete(`/organizations/${organizationId}/rubrics/${id}`)
    load()
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Rubrics</h1>

      <div className="mt-6 divide-y divide-border rounded-md border border-border bg-surface">
        {rubrics.map((rubric) => (
          <div key={rubric.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-text-primary">{rubric.title}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary">/ {rubric.maxScore}</span>
              <Button variant="ghost" onClick={() => void deleteRubric(rubric.id)}>Delete</Button>
            </div>
          </div>
        ))}
        {rubrics.length === 0 && <p className="px-4 py-3 text-text-secondary">No rubrics yet.</p>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New rubric title"
          className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
        />
        <input
          value={maxScore}
          onChange={(e) => setMaxScore(e.target.value)}
          type="number"
          className="w-24 rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
        />
        <Button onClick={() => void createRubric()}>Create</Button>
      </div>
    </div>
  )
}
