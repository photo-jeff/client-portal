import { createClient } from '@/lib/supabase/server'
import { Divider } from '@/components/ui/Divider'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { InvoiceList } from './InvoiceList'

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('portal_slug', slug)
    .single()

  if (!client) redirect('/login')

  // Fetch invoices from Zoho via our API route
  // We pass the zoho_contact_id stored on the client record
  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/portal/${slug}`} className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a] mb-8 transition-colors">
        <ChevronLeft size={14} /> Back
      </Link>
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-2">Invoices</h1>
        <Divider />
      </div>
      <InvoiceList clientId={client.id} zohoContactId={client.zoho_contact_id} />

      <div className="mt-8 bg-[#faf9f7] border border-[#e0ddd8] p-6">
        <p className="text-xs tracking-[0.1em] uppercase text-[#888] mb-2">Bank transfer</p>
        <p className="text-sm text-[#888]">
          You can also pay by bank transfer. Please use your invoice number as the reference and email us once sent.
        </p>
      </div>
    </div>
  )
}
