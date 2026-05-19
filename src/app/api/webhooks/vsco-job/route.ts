import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

function slugify(p1: string, p2: string) {
  return [p1, p2]
    .map(n => n.toLowerCase().trim().replace(/[^a-z0-9]/g, ''))
    .join('-') + '-' + Date.now().toString(36)
}

function parsePayload(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim()
    if (key) result[key] = value
  }
  return result
}

function parseDate(dateStr: string): string | null {
  // DD/M/YYYY or DD/MM/YYYY → YYYY-MM-DD
  if (!dateStr) return null
  const parts = dateStr.split('/')
  if (parts.length !== 3) return null
  const [day, month, year] = parts
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function parseTime(timeStr: string): string | null {
  // "2:00pm" or "14:00" → HH:MM
  if (!timeStr) return null
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i)
  if (!match) return null
  let hours = parseInt(match[1])
  const minutes = match[2]
  const ampm = match[3]?.toLowerCase()
  if (ampm === 'pm' && hours !== 12) hours += 12
  if (ampm === 'am' && hours === 12) hours = 0
  return `${String(hours).padStart(2, '0')}:${minutes}`
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (!process.env.VSCO_WEBHOOK_SECRET || secret !== process.env.VSCO_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const text = await request.text()
  const f = parsePayload(text)

  const partner1 = `${f['Bride First Name'] ?? ''} ${f['Bride Last Name'] ?? ''}`.trim()
  const partner2 = `${f['Groom First Name'] ?? ''} ${f['Groom Last Name'] ?? ''}`.trim()
  const email = f['Bride Email']?.trim() ?? ''

  if (!partner1 || !partner2 || !email) {
    return NextResponse.json({ error: 'Missing required fields (names or email)' }, { status: 400 })
  }

  const weddingDate = parseDate(f['Wedding Date'] ?? '')
  const ceremonyTime = parseTime(f['Ceremony Time'] ?? '')
  const ceremonyVenue = f['Wedding Venue']?.trim() || null
  const vscoJobId = f['Job ID']?.trim() || null
  const slug = slugify(partner1, partner2)

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

  const { error } = await admin.from('clients').insert({
    email,
    partner1_name: partner1,
    partner2_name: partner2,
    wedding_date: weddingDate,
    ceremony_venue: ceremonyVenue,
    ceremony_time: ceremonyTime,
    portal_slug: slug,
    vsco_job_id: vscoJobId,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/portal/${slug}`
  console.log(`[VSCO webhook] Portal created — ${partner1} & ${partner2} → ${portalUrl}`)

  return NextResponse.json({ ok: true, portalUrl })
}
