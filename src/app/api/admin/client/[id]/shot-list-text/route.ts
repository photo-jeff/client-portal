import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { submitVscoShotList } from '@/lib/vsco-shot-list'

// POST { text: string }
// Amend or replace a client's saved shot list (e.g. after the final details
// meeting changes it). Re-pushes to VSCO when a shot list URL is set, same as
// the portal wizard's save.

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { text } = await request.json() as { text: string }
  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('clients')
    .update({ shot_list_text: text.trim() } as Record<string, unknown>)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: client } = await admin
    .from('clients')
    .select('vsco_shot_list_url')
    .eq('id', id)
    .single()

  const vscoUrl = (client as Record<string, unknown> | null)?.vsco_shot_list_url as string | null
  let vscoSynced = false
  if (vscoUrl) {
    try {
      await submitVscoShotList(vscoUrl, text.trim())
      vscoSynced = true
    } catch (e) {
      // The list is already saved in Supabase — report the sync failure, don't fail the save
      console.error(`[shot-list] admin VSCO submission failed for client ${id}:`, e)
    }
  }

  return NextResponse.json({ ok: true, vscoSynced })
}
