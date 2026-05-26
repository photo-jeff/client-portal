import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { submitVscoShotList } from '@/lib/vsco-shot-list'

export async function POST(request: NextRequest) {
  const { slug, text } = await request.json()
  if (!slug || !text) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = createAdminClient()

  // Save to Supabase
  const { error } = await admin
    .from('clients')
    .update({ shot_list_text: text } as Record<string, unknown>)
    .eq('portal_slug', slug)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Submit to VSCO if a shot list URL is set for this client
  const { data: client } = await admin
    .from('clients')
    .select('vsco_shot_list_url')
    .eq('portal_slug', slug)
    .single()

  const vscoUrl = (client as Record<string, unknown> | null)?.vsco_shot_list_url as string | null
  if (vscoUrl) {
    try {
      await submitVscoShotList(vscoUrl, text)
      console.log(`[shot-list] VSCO submission succeeded for ${slug}`)
    } catch (e) {
      // Log but don't fail the request — the list is already saved in Supabase
      console.error(`[shot-list] VSCO submission failed for ${slug}:`, e)
    }
  }

  return NextResponse.json({ ok: true })
}
