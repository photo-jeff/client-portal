import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const ORG_ID = process.env.ZOHO_ORG_ID || '20063085751'

async function getZohoAccessToken(): Promise<string> {
  const res = await fetch('https://accounts.zoho.eu/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
    }),
  })
  if (!res.ok) throw new Error('Failed to refresh Zoho token')
  const data = await res.json()
  if (!data.access_token) throw new Error('No access token in Zoho response')
  return data.access_token
}

async function getVscoOutstanding(vscoJobId: string): Promise<number | null> {
  try {
    const res = await fetch(`https://workspace.vsco.co/api/v2/job/${vscoJobId}`, {
      headers: { 'X-API-KEY': process.env.VSCO_API_KEY! },
    })
    if (!res.ok) return null
    const data = await res.json()
    return typeof data.accountBalance === 'number'
      ? parseFloat((data.accountBalance / 100).toFixed(2))
      : null
  } catch {
    return null
  }
}

// GET — check for existing unpaid invoice
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('zoho_contact_id, vsco_job_id')
    .eq('portal_slug', slug)
    .single()

  if (!client?.zoho_contact_id) {
    return NextResponse.json({ url: null, status: 'none', due_date: null })
  }

  if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_CLIENT_SECRET || !process.env.ZOHO_REFRESH_TOKEN) {
    return NextResponse.json({ url: null, status: 'error', due_date: null })
  }

  try {
    const token = await getZohoAccessToken()
    // status=unpaid returns invoices with individual status 'sent' or 'overdue' (Zoho's filter label
    // is 'unpaid' but each returned invoice.status is 'sent'/'overdue', NOT 'unpaid')
    const res = await fetch(
      `https://www.zohoapis.eu/books/v3/invoices?organization_id=${ORG_ID}&customer_id=${client.zoho_contact_id}&status=unpaid&sort_column=created_time&sort_order=D`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    )

    if (!res.ok) {
      console.error('[invoice GET] Zoho invoices fetch error:', await res.text())
      return NextResponse.json({ url: null, status: 'error', due_date: null })
    }

    const data = await res.json()
    const invoices: Array<{ invoice_id: string; invoice_url?: string; status: string; due_date?: string }> = data.invoices ?? []

    console.log('[invoice GET] invoices returned by Zoho:', invoices.map(i => ({ id: i.invoice_id, status: i.status, due_date: i.due_date })))

    // Individual invoice status from Zoho is 'sent', 'overdue', 'paid' — never 'unpaid'
    const unpaid = invoices.find(inv => inv.status === 'sent' || inv.status === 'overdue')
    if (unpaid) return NextResponse.json({ url: unpaid.invoice_url ?? null, status: 'outstanding', due_date: unpaid.due_date ?? null })

    // No unpaid invoice. VSCO's account balance — not the mere existence of a paid
    // invoice — decides whether the balance is settled. (A paid *deposit* invoice
    // must NOT make the whole balance read as "all paid".)
    const vscoOutstanding = client.vsco_job_id ? await getVscoOutstanding(client.vsco_job_id) : null

    // Balance genuinely cleared in VSCO
    if (vscoOutstanding !== null && vscoOutstanding <= 0) {
      return NextResponse.json({ url: null, status: 'paid', due_date: null })
    }

    // VSCO still shows a balance. Check whether a recent online payment likely
    // covers it but hasn't been reconciled into VSCO yet — if so, report 'paid' to
    // suppress the Pay button and avoid double-charging. A paid deposit (total
    // below the outstanding balance) does not qualify.
    const paidRes = await fetch(
      `https://www.zohoapis.eu/books/v3/invoices?organization_id=${ORG_ID}&customer_id=${client.zoho_contact_id}&status=paid&sort_column=created_time&sort_order=D&per_page=1`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    )
    if (paidRes.ok) {
      const paidData = await paidRes.json()
      const paid = (paidData.invoices ?? []).find(
        (inv: { status: string }) => inv.status === 'paid'
      ) as { total?: number } | undefined
      if (paid && vscoOutstanding !== null && typeof paid.total === 'number' && paid.total >= vscoOutstanding) {
        console.log('[invoice GET] recent paid invoice covers VSCO balance (pending reconciliation) for', slug)
        return NextResponse.json({ url: null, status: 'paid', due_date: null })
      }
    }

    return NextResponse.json({ url: null, status: 'none', due_date: null })
  } catch (e) {
    console.error('[invoice GET] failed:', e)
    return NextResponse.json({ url: null, status: 'error', due_date: null })
  }
}

// POST — create an invoice from VSCO outstanding balance, return payment URL
export async function POST(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_CLIENT_SECRET || !process.env.ZOHO_REFRESH_TOKEN) {
    return NextResponse.json({ error: 'Zoho not configured' }, { status: 503 })
  }

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('zoho_contact_id, package_name, wedding_date, vsco_job_id, partner1_name, partner2_name')
    .eq('portal_slug', slug)
    .single()

  if (!client?.zoho_contact_id) {
    return NextResponse.json({ error: 'No Zoho contact for this client' }, { status: 400 })
  }

  if (!client.vsco_job_id) {
    return NextResponse.json({ error: 'No VSCO job ID — cannot determine outstanding balance' }, { status: 400 })
  }

  const outstanding = await getVscoOutstanding(client.vsco_job_id)
  if (!outstanding || outstanding <= 0) {
    return NextResponse.json({ error: 'No outstanding balance found' }, { status: 400 })
  }

  try {
    const token = await getZohoAccessToken()

    // Due date: 28 days before the wedding date.
    // If that's already past (or no wedding date), fall back to 28 days from today.
    const today = new Date()
    const weddingDate = client.wedding_date ? new Date(client.wedding_date) : null
    const dueDateFromWedding = weddingDate ? new Date(weddingDate.getTime() - 28 * 86400_000) : null
    const fallback = new Date(today.getTime() + 28 * 86400_000)
    const dueDate = dueDateFromWedding && dueDateFromWedding > today ? dueDateFromWedding : fallback
    const dueDateStr = dueDate.toISOString().split('T')[0]

    const lineItemName = client.package_name
      ? `Wedding Photography — ${client.package_name}`
      : 'Wedding Photography — Final Balance'

    const weddingDateStr = client.wedding_date
      ? new Date(client.wedding_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : null

    const createRes = await fetch(
      `https://www.zohoapis.eu/books/v3/invoices?organization_id=${ORG_ID}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: client.zoho_contact_id,
          invoice_date: today.toISOString().split('T')[0],
          due_date: dueDateStr,
          line_items: [{ name: lineItemName, quantity: 1, rate: outstanding }],
          notes: [
            `Final balance for ${client.partner1_name} & ${client.partner2_name}`,
            weddingDateStr ? `Wedding date: ${weddingDateStr}` : null,
          ].filter(Boolean).join('\n'),
        }),
      }
    )

    if (!createRes.ok) {
      console.error('[invoice POST] Zoho create error:', await createRes.text())
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    const createData = await createRes.json()
    const invoice = createData.invoice
    console.log('[invoice POST] created invoice_id:', invoice?.invoice_id, 'status:', invoice?.status)

    if (!invoice?.invoice_id) {
      console.error('[invoice POST] no invoice_id in response:', createData)
      return NextResponse.json({ error: 'Invoice created but no ID returned' }, { status: 500 })
    }

    // Send invoice email to Jeff — this moves the invoice from draft → sent and notifies Jeff.
    // The client does NOT receive an automated email; they get the payment URL in their browser.
    const emailRes = await fetch(
      `https://www.zohoapis.eu/books/v3/invoices/${invoice.invoice_id}/email?organization_id=${ORG_ID}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_mail_ids: ['jeff@jeffoliverphotography.com'],
          subject: `Invoice generated — ${client.partner1_name} & ${client.partner2_name}`,
          body: `<p>An invoice for the final balance (£${outstanding.toFixed(2)}) has been generated for <strong>${client.partner1_name} &amp; ${client.partner2_name}</strong>${weddingDateStr ? ` (wedding ${weddingDateStr})` : ''} via the client portal.</p>`,
        }),
      }
    )
    const emailBody = await emailRes.json().catch(() => null)
    console.log('[invoice POST] email response status:', emailRes.status, 'body:', JSON.stringify(emailBody))

    if (!emailRes.ok) {
      console.error('[invoice POST] email failed — invoice left in draft')
      return NextResponse.json({ error: 'Invoice created but could not be activated' }, { status: 500 })
    }

    // Refetch to confirm status and get the payment URL
    const refetchRes = await fetch(
      `https://www.zohoapis.eu/books/v3/invoices/${invoice.invoice_id}?organization_id=${ORG_ID}`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    )
    if (!refetchRes.ok) {
      console.error('[invoice POST] refetch error:', await refetchRes.text())
      return NextResponse.json({ error: 'Invoice submitted but could not fetch payment URL' }, { status: 500 })
    }

    const refetchData = await refetchRes.json()
    console.log('[invoice POST] refetched status:', refetchData.invoice?.status, 'url:', refetchData.invoice?.invoice_url)

    const invoiceUrl: string | null = refetchData.invoice?.invoice_url ?? null

    return NextResponse.json({ url: invoiceUrl, due_date: dueDateStr })
  } catch (e) {
    console.error('[invoice POST] unexpected error:', e)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
