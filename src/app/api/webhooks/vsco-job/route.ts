import { createAdminClient } from '@/lib/supabase/admin'
import { fetchVscoJobDetails } from '@/lib/vsco-job'
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
    partner1_role?: string
    partner2_role?: string
    email?: string
    wedding_date?: string | null    // YYYY-MM-DD
    ceremony_time?: string | null   // HH:MM
    ceremony_venue?: string | null
    reception_venue?: string | null
    package_name?: string | null
    vsco_job_id?: string | null
    zoho_contact_id?: string | null
  }

  const partner1 = body.partner1_name?.trim() ?? ''
  const partner2 = body.partner2_name?.trim() ?? ''
  const email = body.email?.trim() ?? ''

  // The Mac webhook derives these from which partner slots the VSCO booking
  // email filled (bride/groom/bride_2/groom_2). Fall back to the historic
  // Bride & Groom default for anything that predates that, or arrives from a
  // source that doesn't send roles.
  const VALID_ROLES = ['Bride', 'Groom', 'Partner']
  const role = (v: string | undefined, fallback: string) => {
    const r = v?.trim() ?? ''
    return VALID_ROLES.includes(r) ? r : fallback
  }
  const partner1Role = role(body.partner1_role, 'Bride')
  const partner2Role = role(body.partner2_role, 'Groom')

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

  // The booking form is the source of truth — it now carries the ceremony &
  // reception addresses, date and package. The VSCO job API is only a fallback to
  // fill gaps for bookings that didn't come through the form (e.g. planner
  // referrals). VSCO has just one venue, so it can only ever seed the ceremony.
  let weddingDate = body.wedding_date ?? null
  let ceremonyVenue = body.ceremony_venue ?? null
  const receptionVenue = body.reception_venue ?? null
  let packageName = body.package_name ?? null

  if (vscoJobId && (!weddingDate || !ceremonyVenue || !packageName)) {
    const details = await fetchVscoJobDetails(vscoJobId)
    if (details) {
      weddingDate = weddingDate ?? details.wedding_date
      ceremonyVenue = ceremonyVenue ?? details.venue
      packageName = packageName ?? details.package_name
    }
  }

  const { error } = await admin.from('clients').insert({
    email,
    partner1_name: partner1,
    partner2_name: partner2 || '',
    partner1_role: partner1Role,
    partner2_role: partner2Role,
    wedding_date: weddingDate,
    ceremony_venue: ceremonyVenue,
    reception_venue: receptionVenue,
    ceremony_time: body.ceremony_time ?? null,
    package_name: packageName,
    portal_slug: slug,
    vsco_job_id: vscoJobId,
    zoho_contact_id: body.zoho_contact_id ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/portal/${slug}`
  console.log(`[VSCO webhook] Portal created — ${partner1} & ${partner2} → ${portalUrl}`)

  return NextResponse.json({ ok: true, portalUrl })
}
