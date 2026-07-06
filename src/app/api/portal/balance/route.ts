import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('vsco_job_id')
    .eq('portal_slug', slug)
    .single()

  if (!client?.vsco_job_id) {
    return NextResponse.json({ total: null, outstanding: null })
  }

  try {
    const res = await fetch(`https://workspace.vsco.co/api/v2/job/${client.vsco_job_id}`, {
      headers: {
        'X-API-KEY': process.env.VSCO_API_KEY!,
        'Content-Type': 'application/json',
      },
      // Short cache: clients act on this figure and expect it to reflect a
      // payment quickly. VSCO's balance is only refreshed when a payment is
      // recorded (via /sync-payments), so a long TTL left the portal showing an
      // already-paid balance as outstanding for up to an hour.
      next: { revalidate: 60 },
    })

    if (!res.ok) return NextResponse.json({ total: null, outstanding: null })

    const data = await res.json()

    const total = typeof data.totalRevenue === 'number'
      ? parseFloat((data.totalRevenue / 100).toFixed(2))
      : null

    const outstanding = typeof data.accountBalance === 'number'
      ? parseFloat((data.accountBalance / 100).toFixed(2))
      : null

    return NextResponse.json({ total, outstanding })
  } catch {
    return NextResponse.json({ total: null, outstanding: null })
  }
}
