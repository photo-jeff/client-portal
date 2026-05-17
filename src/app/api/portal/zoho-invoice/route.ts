import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('zoho_contact_id')
    .eq('portal_slug', slug)
    .single()

  if (!client?.zoho_contact_id) {
    return NextResponse.json({ url: null })
  }

  if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_CLIENT_SECRET || !process.env.ZOHO_REFRESH_TOKEN) {
    return NextResponse.json({ url: null })
  }

  try {
    const token = await getZohoAccessToken()
    const orgId = process.env.ZOHO_ORG_ID || '20063085751'

    const res = await fetch(
      `https://www.zohoapis.eu/books/v3/invoices?organization_id=${orgId}&customer_id=${client.zoho_contact_id}&status=unpaid&sort_column=created_time&sort_order=D`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!res.ok) {
      console.error('Zoho invoices error:', await res.text())
      return NextResponse.json({ url: null })
    }

    const data = await res.json()
    const invoices: Array<{ invoice_id: string; invoice_url?: string; status: string }> = data.invoices ?? []

    // Find the most recent unpaid invoice
    const unpaid = invoices.find(inv => inv.status === 'unpaid' || inv.status === 'overdue')
    if (!unpaid) return NextResponse.json({ url: null })

    // Zoho Books EU customer portal payment URL
    const paymentUrl = unpaid.invoice_url || null

    return NextResponse.json({ url: paymentUrl })
  } catch (e) {
    console.error('Zoho invoice fetch failed:', e)
    return NextResponse.json({ url: null })
  }
}
