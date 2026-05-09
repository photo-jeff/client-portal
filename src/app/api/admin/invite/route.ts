import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, slug, partner1_name, partner2_name, wedding_date,
          ceremony_venue, ceremony_time, reception_venue,
          package_name, vsco_job_id, zoho_contact_id } = body
  const admin = createAdminClient()

  const { error: insertError } = await admin.rpc('insert_client', {
    p_email: email,
    p_partner1_name: partner1_name,
    p_partner2_name: partner2_name,
    p_wedding_date: wedding_date || null,
    p_ceremony_venue: ceremony_venue || null,
    p_ceremony_time: ceremony_time || null,
    p_reception_venue: reception_venue || null,
    p_package_name: package_name || null,
    p_portal_slug: slug,
    p_vsco_job_id: vsco_job_id || null,
    p_zoho_contact_id: zoho_contact_id || null,
  })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/portal/${slug}`
  return NextResponse.json({ ok: true, portalUrl })
}
