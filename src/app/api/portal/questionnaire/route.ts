import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { slug, data, completed_at } = await request.json()
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id')
    .eq('portal_slug', slug)
    .single()

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await admin
    .from('questionnaire_responses')
    .upsert({ client_id: client.id, data, completed_at: completed_at ?? null }, { onConflict: 'client_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
