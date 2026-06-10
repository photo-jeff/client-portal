import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { slug, messages } = await request.json()
  if (!slug || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Missing slug or messages' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id')
    .eq('portal_slug', slug)
    .single()

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await admin.from('shot_list_chats').insert({
    client_id: client.id,
    messages,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
