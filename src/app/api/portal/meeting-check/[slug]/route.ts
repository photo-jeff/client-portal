import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// Lightweight endpoint polled by MeetingBookingWidget after a booking.
// Returns the current meeting date for the given portal slug, for whichever
// meeting type is enabled (final meeting or phone call).
export async function GET(_request: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const admin = createAdminClient()

  const { data } = await admin
    .from('clients')
    .select('final_meeting_enabled, phone_call_enabled, final_meeting_at, final_meeting_reschedule_url, phone_call_at, phone_call_reschedule_url')
    .eq('portal_slug', slug)
    .single()

  const row = (data as Record<string, unknown> | null) ?? {}
  const finalEnabled = (row.final_meeting_enabled as boolean) ?? false

  const meetingAt = (finalEnabled ? row.final_meeting_at : row.phone_call_at) as string | null ?? null
  const rescheduleUrl = (finalEnabled ? row.final_meeting_reschedule_url : row.phone_call_reschedule_url) as string | null ?? null

  return NextResponse.json({ meetingAt, rescheduleUrl }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
