import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

function slugify(p1: string, p2: string) {
  return [p1, p2]
    .map(n => n.toLowerCase().trim().replace(/[^a-z0-9]/g, ''))
    .join('-') + '-' + Date.now().toString(36)
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (!process.env.VSCO_WEBHOOK_SECRET || secret !== process.env.VSCO_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Accept JSON from Mac webhook (fields already parsed and normalised)
  const body = await request.json() as {
    partner1_name?: string
    partner2_name?: string
    email?: string
    wedding_date?: string | null    // YYYY-MM-DD
    ceremony_time?: string | null   // HH:MM
    ceremony_venue?: string | null
    package_name?: string | null
    vsco_job_id?: string | null
    zoho_contact_id?: string | null
  }

  const partner1 = body.partner1_name?.trim() ?? ''
  const partner2 = body.partner2_name?.trim() ?? ''
  const email = body.email?.trim() ?? ''

  if (!partner1 || !email) {
    return NextResponse.json({ error: 'Missing required fields (partner1_name or email)' }, { status: 400 })
  }

  const vscoJobId = body.vsco_job_id?.trim() || null
  const slug = slugify(partner1, partner2 || partner1)

  const admin = createAdminClient()

  // Deduplicate — if this job ID already has a portal, skip silently
  if (vscoJobId) {
    const { data: existing } = await admin
      .from('clients')
      .select('portal_slug')
      .eq('vsco_job_id', vscoJobId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        portalUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/portal/${existing.portal_slug}`,
      })
    }
  }

  const { error } = await admin.from('clients').insert({
    email,
    partner1_name: partner1,
    partner2_name: partner2 || '',
    wedding_date: body.wedding_date ?? null,
    ceremony_venue: body.ceremony_venue ?? null,
    ceremony_time: body.ceremony_time ?? null,
    package_name: body.package_name ?? null,
    portal_slug: slug,
    vsco_job_id: vscoJobId,
    zoho_contact_id: body.zoho_contact_id ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/portal/${slug}`
  console.log(`[VSCO webhook] Portal created — ${partner1} & ${partner2} → ${portalUrl}`)

  return NextResponse.json({ ok: true, portalUrl })
}
