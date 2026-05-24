import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// Lightweight endpoint polled by PrewedBookingWidget after a booking.
// Returns the current prewedding_shoot_at for the given portal slug.
export async function GET(_request: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const admin = createAdminClient()

  const { data } = await admin
    .from('clients')
    .select('prewedding_shoot_at, prewedding_reschedule_url')
    .eq('portal_slug', slug)
    .single()

  const shootAt = (data as Record<string, unknown> | null)?.prewedding_shoot_at as string | null ?? null

  return NextResponse.json({ shootAt }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
