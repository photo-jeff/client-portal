import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { submitVscoQuestionnaire } from '@/lib/vsco-questionnaire'
import { getCoupleType } from '@/lib/couple-type'

function label(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function formatField(key: string, value: unknown): string {
  if (!value) return ''
  return `<tr><td style="padding:6px 12px 6px 0;color:#888;font-size:13px;white-space:nowrap;vertical-align:top">${label(key)}</td><td style="padding:6px 0;font-size:13px">${String(value)}</td></tr>`
}

interface FieldChange { key: string; from: string; to: string }

// Compare the newly-submitted answers against the last set we emailed Jeff
// about. Empty/missing values are normalised so "" -> "" never registers.
function diffData(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown>
): FieldChange[] {
  const norm = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim())
  const keys = new Set([...Object.keys(oldData ?? {}), ...Object.keys(newData)])
  const changes: FieldChange[] = []
  for (const key of keys) {
    const from = norm(oldData?.[key])
    const to = norm(newData[key])
    if (from !== to) changes.push({ key, from, to })
  }
  return changes
}

async function sendEmail(subject: string, partnerNames: string, slug: string, bodyHtml: string) {
  if (!process.env.RESEND_API_KEY) return

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
      <h2 style="font-family:Georgia,serif;font-weight:400;margin:0 0 8px">${subject}</h2>
      <p style="color:#888;font-size:13px;margin:0 0 24px">
        ${partnerNames} · <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/clients" style="color:#888">View in admin</a>
      </p>
      ${bodyHtml}
    </div>
  `

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Jeff Oliver Photography <hello@portal.jeffoliverphotography.com>',
      to: 'mrjeffoliver@gmail.com',
      subject: `${subject} — ${partnerNames}`,
      html,
    }),
  }).catch(err => console.error('Email send failed:', err))
}

function fullTable(data: Record<string, unknown>): string {
  const rows = Object.entries(data).map(([k, v]) => formatField(k, v)).filter(Boolean).join('')
  return `<table style="width:100%;border-collapse:collapse">${rows}</table>`
}

function changesTable(changes: FieldChange[]): string {
  const rows = changes.map(c => `
    <tr>
      <td style="padding:10px 12px 10px 0;color:#888;font-size:13px;white-space:nowrap;vertical-align:top">${label(c.key)}</td>
      <td style="padding:10px 0;font-size:13px">
        <div style="color:#b00;text-decoration:line-through">${c.from || '<em style="color:#bbb;text-decoration:none">(empty)</em>'}</div>
        <div style="color:#1a7a1a">${c.to || '<em style="color:#bbb">(empty)</em>'}</div>
      </td>
    </tr>`).join('')
  return `
    <p style="font-size:13px;color:#1a1a1a;margin:0 0 16px">
      ${changes.length} field${changes.length === 1 ? '' : 's'} changed since you were last notified:
    </p>
    <table style="width:100%;border-collapse:collapse">${rows}</table>`
}

export async function POST(request: NextRequest) {
  const { slug, data, completed_at } = await request.json()
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, partner1_name, partner2_name, partner1_role, partner2_role, vsco_questionnaire_url')
    .eq('portal_slug', slug)
    .single()

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Snapshot of what we last told Jeff about, for change detection.
  const { data: existing } = await admin
    .from('questionnaire_responses')
    .select('notified_data')
    .eq('client_id', client.id)
    .single()

  const { error } = await admin
    .from('questionnaire_responses')
    .upsert({ client_id: client.id, data, completed_at: completed_at ?? null }, { onConflict: 'client_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notifications + VSCO sync only fire on completion (not on draft saves).
  if (completed_at) {
    const partnerNames = `${client.partner1_name} & ${client.partner2_name}`
    const vscoUrl = (client as Record<string, unknown>).vsco_questionnaire_url as string | null
    const newData = (data ?? {}) as Record<string, unknown>
    const notifiedData = ((existing as Record<string, unknown> | null)?.notified_data ?? null) as Record<string, unknown> | null

    // First time we're notifying: send the full questionnaire.
    // Otherwise only email if something actually changed, and show the diff.
    const isFirstNotification = notifiedData === null
    const changes = isFirstNotification ? [] : diffData(notifiedData, newData)
    const shouldEmail = isFirstNotification || changes.length > 0

    const emailTask = shouldEmail
      ? sendEmail(
          isFirstNotification ? 'Questionnaire submitted' : 'Questionnaire updated',
          partnerNames,
          slug,
          isFirstNotification ? fullTable(newData) : changesTable(changes),
        ).then(() =>
          // Record the snapshot we just notified about so the next edit diffs against it.
          admin
            .from('questionnaire_responses')
            .update({ notified_data: newData } as Record<string, unknown>)
            .eq('client_id', client.id),
        )
      : Promise.resolve()

    await Promise.allSettled([
      emailTask,
      vscoUrl
        ? submitVscoQuestionnaire(vscoUrl, data as Record<string, string>, getCoupleType(client))
            .catch(err => console.error('VSCO submission failed:', err instanceof Error ? err.message : String(err)))
        : Promise.resolve(),
    ])
  }

  return NextResponse.json({ ok: true })
}
