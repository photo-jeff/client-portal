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

  // Insert client record via SECURITY DEFINER function (bypasses RLS)
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

  // Send magic link invite
  const { error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 })

  await admin.from('clients').update({ invite_sent_at: new Date().toISOString() }).eq('email', email)

  return NextResponse.json({ ok: true })
}
