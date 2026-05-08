import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Verify the requesting user owns this client record
  const { data: client } = await supabase
    .from('clients')
    .select('id, email, zoho_contact_id')
    .eq('id', clientId)
    .eq('email', user.email)
    .single()

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // TODO: fetch from Zoho MCP using client.zoho_contact_id
  // For now return mock data — replace with Zoho API call
  const mockInvoices = [
    {
      id: '1',
      invoice_number: 'INV-001',
      date: '2025-01-01',
      due_date: '2025-02-01',
      total: 500,
      balance: 500,
      status: 'sent',
      payment_url: null,
      currency_symbol: '£',
    },
  ]

  return NextResponse.json(mockInvoices)
}
