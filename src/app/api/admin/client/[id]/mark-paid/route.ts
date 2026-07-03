import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST { paid: boolean }
//   true  — mark this client's externally-raised invoice as paid (stamps external_paid_at = now)
//   false — clear the marker (external_paid_at = null)
//
// For clients whose portal payment is switched off (payments_disabled): the
// invoice is raised through the separate business, and when they pay Jeff marks
// it here so the portal shows "Paid".

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { paid } = await request.json() as { paid: boolean }
  if (typeof paid !== 'boolean') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('clients')
    .update({ external_paid_at: paid ? new Date().toISOString() : null })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
