import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useOrganization } from '../context/OrganizationContext'
import { StatusPill } from '../components/ui/StatusPill'
import { Button } from '../components/ui/Button'
import { api } from '../utils/api'

interface Discussion {
  id: string
  title: string
  status: string
}

interface Post {
  id: string
  parentPostId: string | null
  authorId: string
  body: string
  createdAt: string
}

/** screens.md: threaded, per discussion_posts.parent_post_id — top-level posts with their replies nested underneath. */
export function CourseDiscussion() {
  const { discussionId } = useParams<{ discussionId: string }>()
  const { organizationId } = useOrganization()
  const [discussion, setDiscussion] = useState<Discussion | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [draft, setDraft] = useState('')
  const [replyDraft, setReplyDraft] = useState<Map<string, string>>(new Map())

  function load(): void {
    if (!discussionId) {
      return
    }
    api.get<Discussion>(`/organizations/${organizationId}/discussions/${discussionId}`).then(setDiscussion)
    api.get<Post[]>(`/organizations/${organizationId}/discussions/${discussionId}/posts`).then(setPosts)
  }

  useEffect(load, [organizationId, discussionId])

  async function post(body: string, parentPostId: string | null): Promise<void> {
    if (!body.trim() || !discussionId) {
      return
    }
    await api.post(`/organizations/${organizationId}/discussions/${discussionId}/posts`, { body, parentPostId })
    load()
  }

  if (!discussion) {
    return null
  }

  const topLevel = posts.filter((p) => p.parentPostId === null)
  const repliesTo = (postId: string) => posts.filter((p) => p.parentPostId === postId)

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-lg font-semibold text-text-primary">{discussion.title}</h1>
        <StatusPill status={discussion.status} />
      </div>

      <div className="mt-6 space-y-4">
        {topLevel.map((thread) => (
          <div key={thread.id} className="rounded-md border border-border bg-surface p-4">
            <p className="text-text-primary">{thread.body}</p>

            <div className="mt-3 space-y-2 border-l-2 border-border pl-4">
              {repliesTo(thread.id).map((reply) => (
                <p key={reply.id} className="text-sm text-text-secondary">{reply.body}</p>
              ))}
            </div>

            {discussion.status === 'open' && (
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  value={replyDraft.get(thread.id) ?? ''}
                  onChange={(e) => setReplyDraft((prev) => new Map(prev).set(thread.id, e.target.value))}
                  placeholder="Reply…"
                  className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary"
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    void post(replyDraft.get(thread.id) ?? '', thread.id)
                    setReplyDraft((prev) => new Map(prev).set(thread.id, ''))
                  }}
                >
                  Reply
                </Button>
              </div>
            )}
          </div>
        ))}
        {topLevel.length === 0 && <p className="text-text-secondary">No posts yet.</p>}
      </div>

      {discussion.status === 'open' && (
        <div className="mt-6 flex flex-wrap gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Start a new thread…"
            className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
          />
          <Button
            onClick={() => {
              void post(draft, null)
              setDraft('')
            }}
          >
            Post
          </Button>
        </div>
      )}
    </div>
  )
}
