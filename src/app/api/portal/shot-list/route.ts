import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { slug, items } = await request.json()
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id')
    .eq('portal_slug', slug)
    .single()

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Replace the entire shot list
  await admin.from('shot_list_items').delete().eq('client_id', client.id)

  if (items && items.length > 0) {
    const { error } = await admin.from('shot_list_items').insert(
      items.map((item: { description: string; category: string; people: string }, i: number) => ({
        client_id: client.id,
        description: item.description,
        category: item.category,
        people: item.people,
        sort_order: i,
      }))
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
