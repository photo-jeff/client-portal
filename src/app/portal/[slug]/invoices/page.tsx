import { createAdminClient } from '@/lib/supabase/admin'
import { Divider } from '@/components/ui/Divider'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { InvoiceList } from './InvoiceList'

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, wedding_date, payments_disabled')
    .eq('portal_slug', slug)
    .single()

  if (!client) notFound()

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/portal/${slug}`} className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a] mb-8 transition-colors">
        <ChevronLeft size={14} /> Back
      </Link>
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-2">Invoices</h1>
        <Divider />
      </div>
      <InvoiceList
        slug={slug}
        weddingDate={client.wedding_date ?? null}
        paymentsDisabled={(client as { payments_disabled?: boolean }).payments_disabled ?? false}
      />
    </div>
  )
}
