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
    .select('zoho_contact_id')
    .eq('portal_slug', slug)
    .single()

  if (!client?.zoho_contact_id) {
    return NextResponse.json({ url: null, status: 'no-contact' })
  }

  if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_CLIENT_SECRET || !process.env.ZOHO_REFRESH_TOKEN) {
    return NextResponse.json({ url: null, status: 'error' })
  }

  try {
    const token = await getZohoAccessToken()
    const res = await fetch(
      `https://www.zohoapis.eu/books/v3/invoices?organization_id=${ORG_ID}&customer_id=${client.zoho_contact_id}&status=unpaid&sort_column=created_time&sort_order=D`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    )

    if (!res.ok) {
      console.error('Zoho invoices fetch error:', await res.text())
      return NextResponse.json({ url: null, status: 'error' })
    }

    const data = await res.json()
    const invoices: Array<{ invoice_id: string; invoice_url?: string; status: string }> = data.invoices ?? []
    const unpaid = invoices.find(inv => inv.status === 'unpaid' || inv.status === 'overdue')

    if (!unpaid) return NextResponse.json({ url: null, status: 'none' })
    return NextResponse.json({ url: unpaid.invoice_url ?? null, status: 'outstanding' })
  } catch (e) {
    console.error('Zoho invoice GET failed:', e)
    return NextResponse.json({ url: null, status: 'error' })
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

    // Due date: 14 days before the wedding, or 30 days from now — whichever is later
    const today = new Date()
    const weddingDate = client.wedding_date ? new Date(client.wedding_date) : null
    const dueDateFromWedding = weddingDate ? new Date(weddingDate.getTime() - 14 * 86400_000) : null
    const fallback = new Date(today.getTime() + 30 * 86400_000)
    const dueDate = dueDateFromWedding && dueDateFromWedding > today ? dueDateFromWedding : fallback

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
          due_date: dueDate.toISOString().split('T')[0],
          line_items: [{ name: lineItemName, quantity: 1, rate: outstanding }],
          notes: [
            `Final balance for ${client.partner1_name} & ${client.partner2_name}`,
            weddingDateStr ? `Wedding date: ${weddingDateStr}` : null,
          ].filter(Boolean).join('\n'),
        }),
      }
    )

    if (!createRes.ok) {
      console.error('Zoho create invoice error:', await createRes.text())
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    const createData = await createRes.json()
    const invoice = createData.invoice
    let invoiceUrl: string | null = invoice?.invoice_url ?? null

    // Draft invoices may not have a payment URL yet — submit to activate
    if (!invoiceUrl && invoice?.invoice_id) {
      const submitRes = await fetch(
        `https://www.zohoapis.eu/books/v3/invoices/${invoice.invoice_id}/submit?organization_id=${ORG_ID}`,
        { method: 'POST', headers: { Authorization: `Zoho-oauthtoken ${token}` } }
      )
      if (submitRes.ok) {
        const refetchRes = await fetch(
          `https://www.zohoapis.eu/books/v3/invoices/${invoice.invoice_id}?organization_id=${ORG_ID}`,
          { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
        )
        if (refetchRes.ok) {
          const refetchData = await refetchRes.json()
          invoiceUrl = refetchData.invoice?.invoice_url ?? null
        }
      }
    }

    return NextResponse.json({ url: invoiceUrl })
  } catch (e) {
    console.error('Zoho create invoice POST failed:', e)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
