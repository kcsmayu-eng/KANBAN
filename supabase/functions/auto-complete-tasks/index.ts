import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async () => {
  const now = new Date()

  // 1. Mark delayed tasks
  await supabase
    .from('tasks')
    .update({ delayed: true })
    .lt('proposed_finish_date', now.toISOString().split('T')[0])
    .not('status', 'in', '("finished")')
    .eq('delayed', false)

  // 2. Auto-complete tasks in 'review' for > 3 days
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()

  await supabase
    .from('tasks')
    .update({
      status: 'finished',
      auto_completed: true,
      manager_reviewed_at: now.toISOString(),
      notes: 'Auto-completed: manager did not review within 3 days.'
    })
    .eq('status', 'review')
    .lt('finished_at', threeDaysAgo)
    .is('manager_reviewed_at', null)

  return new Response(JSON.stringify({ ok: true, ts: now.toISOString() }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
