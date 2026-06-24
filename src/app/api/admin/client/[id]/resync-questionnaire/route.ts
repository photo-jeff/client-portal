import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { submitVscoQuestionnaire } from '@/lib/vsco-questionnaire'
import { NextRequest, NextResponse } from 'next/server'

// POST — re-push a client's current questionnaire answers to their VSCO form.
// Use when a client edits their answers (or sends a change outside the portal)
// and VSCO needs to be brought back in sync. Uses the same safe web-form path
// the portal uses on completion.

export async function POST(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('vsco_questionnaire_url')
    .eq('id', id)
    .single()

  const vscoUrl = (client as Record<string, unknown> | null)?.vsco_questionnaire_url as string | null
  if (!vscoUrl) {
    return NextResponse.json({ error: 'No VSCO questionnaire URL set for this client.' }, { status: 400 })
  }

  const { data: questionnaire } = await admin
    .from('questionnaire_responses')
    .select('data')
    .eq('client_id', id)
    .single()

  const data = questionnaire?.data as Record<string, string> | undefined
  if (!data || Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No questionnaire answers to sync yet.' }, { status: 400 })
  }

  try {
    await submitVscoQuestionnaire(vscoUrl, data)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `VSCO sync failed: ${message}` }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
