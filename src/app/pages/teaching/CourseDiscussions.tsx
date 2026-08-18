import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useOrganization } from '../../context/OrganizationContext'
import { StatusPill } from '../../components/ui/StatusPill'
import { Button } from '../../components/ui/Button'
import { api } from '../../utils/api'

interface Discussion {
  id: string
  title: string
  status: string
}

interface Post {
  id: string
  authorId: string
  body: string
  parentPostId: string | null
}

/** screens.md: adds Lock/Archive controls and post deletion over the Learner-facing Discussion screen. */
export function CourseDiscussions() {
  const { courseId } = useParams<{ courseId: string }>()
  const { organizationId } = useOrganization()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [postsByDiscussion, setPostsByDiscussion] = useState<Map<string, Post[]>>(new Map())
  const [newTitle, setNewTitle] = useState('')

  function load(): void {
    if (!courseId) {
      return
    }
    api.get<Discussion[]>(`/organizations/${organizationId}/courses/${courseId}/discussions`).then(async (list) => {
      setDiscussions(list)
      const entries = await Promise.all(
        list.map(async (d) => [d.id, await api.get<Post[]>(`/organizations/${organizationId}/discussions/${d.id}/posts`)] as const)
      )
      setPostsByDiscussion(new Map(entries))
    })
  }

  useEffect(load, [organizationId, courseId])

  async function createDiscussion(): Promise<void> {
    if (!newTitle.trim() || !courseId) {
      return
    }
    await api.post(`/organizations/${organizationId}/courses/${courseId}/discussions`, { title: newTitle })
    setNewTitle('')
    load()
  }

  async function lock(id: string): Promise<void> {
    await api.post(`/organizations/${organizationId}/discussions/${id}/lock`)
    load()
  }

  async function archive(id: string): Promise<void> {
    await api.post(`/organizations/${organizationId}/discussions/${id}/archive`)
    load()
  }

  async function deletePost(discussionId: string, postId: string): Promise<void> {
    await api.delete(`/organizations/${organizationId}/discussions/${discussionId}/posts/${postId}`)
    load()
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Discussions</h1>

      {discussions.map((discussion) => (
        <div key={discussion.id} className="mt-4 rounded-md border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-text-primary">{discussion.title}</h2>
            <div className="flex items-center gap-2">
              <StatusPill status={discussion.status} />
              {discussion.status === 'open' && <Button variant="ghost" onClick={() => void lock(discussion.id)}>Lock</Button>}
              {discussion.status !== 'archived' && <Button variant="ghost" onClick={() => void archive(discussion.id)}>Archive</Button>}
            </div>
          </div>

          <ul className="mt-3 space-y-2">
            {(postsByDiscussion.get(discussion.id) ?? []).map((post) => (
              <li key={post.id} className="flex items-center justify-between rounded-md border border-border bg-bg px-3 py-2">
                <span className="text-sm text-text-primary">{post.body}</span>
                <Button variant="ghost" onClick={() => void deletePost(discussion.id, post.id)}>Delete</Button>
              </li>
            ))}
            {(postsByDiscussion.get(discussion.id) ?? []).length === 0 && <p className="text-sm text-text-secondary">No posts yet.</p>}
          </ul>
        </div>
      ))}

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New discussion title"
          className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
        />
        <Button onClick={() => void createDiscussion()}>Create</Button>
      </div>
    </div>
  )
}
