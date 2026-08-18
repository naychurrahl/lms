import { useEffect, useState } from 'react'
import { useOrganization } from '../../context/OrganizationContext'
import { StatusPill } from '../../components/ui/StatusPill'
import { Button } from '../../components/ui/Button'
import { api } from '../../utils/api'

interface ContentItem {
  id: string
  title: string
  contentType: string
  currentVersionId: string | null
  status: string
}

const CONTENT_TYPES = ['video', 'document', 'audio', 'presentation', 'external_link', 'scorm']

/**
 * screens.md: upload, categorize, and version reusable Content Items. Only
 * the external_link content type is wired up here — video/document/etc.
 * versions require a Media File upload pipeline that's out of scope for
 * this pass, so those types can be created but not versioned/published yet.
 */
export function ContentLibrary() {
  const { organizationId } = useOrganization()
  const [items, setItems] = useState<ContentItem[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('external_link')
  const [urlByItem, setUrlByItem] = useState<Map<string, string>>(new Map())

  function load(): void {
    api.get<ContentItem[]>(`/organizations/${organizationId}/content-items`).then(setItems)
  }

  useEffect(load, [organizationId])

  async function createItem(): Promise<void> {
    if (!newTitle.trim()) {
      return
    }
    await api.post(`/organizations/${organizationId}/content-items`, { title: newTitle, contentType: newType, visibility: 'private' })
    setNewTitle('')
    load()
  }

  async function addAndPublishLink(itemId: string): Promise<void> {
    const url = urlByItem.get(itemId)?.trim()
    if (!url) {
      return
    }
    const version = await api.post<{ id: string }>(`/organizations/${organizationId}/content-items/${itemId}/versions`, { externalUrl: url })
    await api.post(`/organizations/${organizationId}/content-items/${itemId}/versions/${version.id}/approve`)
    await api.post(`/organizations/${organizationId}/content-items/${itemId}/versions/${version.id}/publish`)
    await api.post(`/organizations/${organizationId}/content-items/${itemId}/publish`)
    setUrlByItem((prev) => new Map(prev).set(itemId, ''))
    load()
  }

  async function archiveItem(itemId: string): Promise<void> {
    await api.post(`/organizations/${organizationId}/content-items/${itemId}/archive`)
    load()
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Content Library</h1>

      <div className="mt-6 divide-y divide-border rounded-md border border-border bg-surface">
        {items.map((item) => (
          <div key={item.id} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-primary">{item.title}</p>
                <p className="text-sm text-text-secondary">{item.contentType}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={item.status} />
                {item.status !== 'archived' && <Button variant="ghost" onClick={() => void archiveItem(item.id)}>Archive</Button>}
              </div>
            </div>

            {!item.currentVersionId && item.contentType === 'external_link' && (
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  value={urlByItem.get(item.id) ?? ''}
                  onChange={(e) => setUrlByItem((prev) => new Map(prev).set(item.id, e.target.value))}
                  placeholder="https://…"
                  className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary"
                />
                <Button variant="secondary" onClick={() => void addAndPublishLink(item.id)}>Publish link</Button>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="px-4 py-3 text-text-secondary">No content items yet.</p>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New content item title"
          className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
        />
        <select value={newType} onChange={(e) => setNewType(e.target.value)} className="rounded-md border border-border bg-bg px-3 py-2 text-text-primary">
          {CONTENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <Button onClick={() => void createItem()}>Create</Button>
      </div>
    </div>
  )
}
