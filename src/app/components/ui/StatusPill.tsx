import { cn } from '../../utils/cn'

/**
 * design_system.md's Status Color Vocabulary: every lifecycle status in
 * database_schema.md maps onto exactly one of five buckets, so "green"
 * means the same thing on a Course card as it does on a Certificate. New
 * statuses get classified here — never given a one-off color where they
 * first appear.
 */
type StatusBucket = 'neutral' | 'progress' | 'live' | 'wound-down' | 'negative'

const STATUS_BUCKETS: Record<string, StatusBucket> = {
  draft: 'neutral',
  not_started: 'neutral',
  queued: 'neutral',
  scheduled: 'neutral',
  created: 'neutral',

  review: 'progress',
  pending: 'progress',
  in_progress: 'progress',
  paused: 'progress',
  generating: 'progress',
  processing: 'progress',

  active: 'live',
  published: 'live',
  completed: 'live',
  issued: 'live',
  verified: 'live',
  awarded: 'live',
  current: 'live',
  approved: 'live',

  archived: 'wound-down',
  closed: 'wound-down',
  expired: 'wound-down',
  retired: 'wound-down',
  superseded: 'wound-down',
  withdrawn: 'wound-down',

  revoked: 'negative',
  failed: 'negative',
  rejected: 'negative',
  cancelled: 'negative',
  suspended: 'negative',
  removed: 'negative',
}

const BUCKET_CLASSES: Record<StatusBucket, string> = {
  neutral: 'border border-border bg-surface text-text-secondary',
  progress: 'border border-warning/30 bg-warning/10 text-warning',
  live: 'border border-success/30 bg-success/10 text-success',
  'wound-down': 'border border-border bg-surface text-text-secondary',
  negative: 'border border-danger/30 bg-danger/10 text-danger',
}

export function StatusPill({ status }: { status: string }) {
  const bucket = STATUS_BUCKETS[status] ?? 'neutral'

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', BUCKET_CLASSES[bucket])}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
