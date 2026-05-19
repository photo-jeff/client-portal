import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

function formatField(key: string, value: unknown): string {
  if (!value) return ''
  const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  return `<tr><td style="padding:6px 12px 6px 0;color:#888;font-size:13px;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 0;font-size:13px">${String(value)}</td></tr>`
}

async function sendEmail(partnerNames: string, slug: string, data: Record<string, unknown>) {
  if (!process.env.RESEND_API_KEY) return // silently skip if not configured

  const rows = Object.entries(data)
    .map(([k, v]) => formatField(k, v))
    .filter(Boolean)
    .join('')

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
      <h2 style="font-family:Georgia,serif;font-weight:400;margin:0 0 8px">
        Questionnaire submitted
      </h2>
      <p style="color:#888;font-size:13px;margin:0 0 24px">
        ${partnerNames} · <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/clients" style="color:#888">View in admin</a>
      </p>
      <table style="width:100%;border-collapse:collapse">${rows}</table>
    </div>
  `

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'portal@jeffoliverphotography.com',
      to: 'mrjeffoliver@gmail.com',
      subject: `Questionnaire submitted — ${partnerNames}`,
      html,
    }),
  }).catch(err => console.error('Email send failed:', err))
}

export async function POST(request: NextRequest) {
  const { slug, data, completed_at } = await request.json()
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, partner1_name, partner2_name, vsco_questionnaire_url')
    .eq('portal_slug', slug)
    .single()

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await admin
    .from('questionnaire_responses')
    .upsert({ client_id: client.id, data, completed_at: completed_at ?? null }, { onConflict: 'client_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send email to Jeff and fire Mac webhook when questionnaire is fully submitted
  if (completed_at) {
    const partnerNames = `${client.partner1_name} & ${client.partner2_name}`
    await sendEmail(partnerNames, slug, data as Record<string, unknown>)

    const vscoUrl = (client as Record<string, unknown>).vsco_questionnaire_url as string | null
    if (vscoUrl && process.env.MAC_WEBHOOK_URL) {
      fetch(`${process.env.MAC_WEBHOOK_URL}/vsco-questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vsco_questionnaire_url: vscoUrl, data }),
      }).catch(err => console.error('Mac webhook error:', err))
    }
  }

  return NextResponse.json({ ok: true })
}
