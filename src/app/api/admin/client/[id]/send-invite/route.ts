import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_SUBJECT = '{partner_names} — your wedding portal is ready'
const DEFAULT_BODY = "Everything you need in the run-up to your wedding day is in one place — your timeline, questionnaire, shot list, invoice, and more. It'll update as your day gets closer, so it's worth bookmarking."

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()

  const [{ data: client }, { data: settingsRows }] = await Promise.all([
    admin.from('clients').select('id, partner1_name, partner2_name, email, portal_slug').eq('id', id).single(),
    admin.from('portal_settings').select('key, value').in('key', ['invite_email_subject', 'invite_email_body']),
  ])

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!client.email) return NextResponse.json({ error: 'Client has no email address' }, { status: 400 })
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'Email not configured (RESEND_API_KEY missing)' }, { status: 500 })

  const settings = Object.fromEntries((settingsRows ?? []).map(r => [r.key, r.value]))

  const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/portal/${client.portal_slug}`
  const firstName = client.partner1_name?.trim().split(/\s+/)[0] ?? 'there'
  const partnerNames = `${client.partner1_name} & ${client.partner2_name}`

  const subject = (settings.invite_email_subject ?? DEFAULT_SUBJECT)
    .replace('{partner_names}', partnerNames)
    .replace('{first_name}', firstName)

  const bodyText = (settings.invite_email_body ?? DEFAULT_BODY)
    .replace('{partner_names}', partnerNames)
    .replace('{first_name}', firstName)

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a;background:#faf9f7;padding:40px 32px">
      <p style="font-size:13px;color:#888;letter-spacing:1px;text-transform:uppercase;margin:0 0 32px">Jeff Oliver Photography</p>
      <h1 style="font-size:28px;font-weight:400;margin:0 0 16px;line-height:1.3">Your wedding portal is ready</h1>
      <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 24px">Hi ${firstName},</p>
      <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 32px">${bodyText}</p>
      <a href="${portalUrl}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:14px 32px;font-family:sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase">
        Open your portal →
      </a>
      <p style="font-size:12px;color:#aaa;margin:24px 0 0;line-height:1.7">
        Or copy this link: <a href="${portalUrl}" style="color:#aaa">${portalUrl}</a>
      </p>
      <hr style="border:none;border-top:1px solid #e8e4df;margin:40px 0 24px" />
      <p style="font-size:12px;color:#bbb;line-height:1.6">Jeff Oliver Photography</p>
    </div>
  `

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Jeff Oliver Photography <hello@portal.jeffoliverphotography.com>',
      to: client.email,
      subject,
      html,
    }),
  })

  if (!emailRes.ok) {
    const err = await emailRes.text()
    return NextResponse.json({ error: `Email failed: ${err}` }, { status: 500 })
  }

  await admin.from('clients').update({ invite_sent_at: new Date().toISOString() }).eq('id', id)
  return NextResponse.json({ ok: true })
}
