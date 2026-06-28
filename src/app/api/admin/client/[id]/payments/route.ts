import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST { disabled: boolean }
//   true  — switch off portal payment for this client (hide Pay Here + bank details, block invoice creation)
//   false — allow portal payment (default)

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { disabled } = await request.json() as { disabled: boolean }
  if (typeof disabled !== 'boolean') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('clients').update({ payments_disabled: disabled }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
