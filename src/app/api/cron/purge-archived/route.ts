import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// Daily Vercel Cron job. Deletes clients whose wedding was long enough ago that
// they've been in the archive for ~3 months.
//   archived  = wedding_date < today − 7 days
//   purge     = wedding_date < today − (7 + 90) days  ≈ 3 months in archive
// FK "on delete cascade" removes each client's questionnaire / shot-list rows.
//
// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when the
// CRON_SECRET env var is set. We reject anything without the matching secret.

const PURGE_AFTER_DAYS = 7 + 90  // 1 week to archive + 3 months held

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - PURGE_AFTER_DAYS * 86_400_000)
    .toISOString()
    .split('T')[0]

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('clients')
    .delete()
    .lt('wedding_date', cutoff)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const deleted = data?.length ?? 0
  console.log(`[purge-archived] deleted ${deleted} client(s) with wedding_date < ${cutoff}`)
  return NextResponse.json({ ok: true, deleted, cutoff })
}
