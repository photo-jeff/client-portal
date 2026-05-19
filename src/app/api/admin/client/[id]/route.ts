import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_FIELDS = [
  'partner1_name', 'partner2_name', 'email', 'wedding_date',
  'ceremony_time', 'ceremony_venue', 'reception_venue', 'package_name',
  'zoho_contact_id', 'vsco_job_id', 'vsco_questionnaire_url',
]

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json()
  const updates: Record<string, string> = {}

  for (const field of ALLOWED_FIELDS) {
    if (field in body) updates[field] = body[field] ?? ''
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('clients').update(updates).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
