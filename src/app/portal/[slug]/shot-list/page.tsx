import { createAdminClient } from '@/lib/supabase/admin'
import { Divider } from '@/components/ui/Divider'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ShotListWizard } from './ShotListWizard'

export default async function ShotListPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('*')
    .eq('portal_slug', slug)
    .single()

  if (!client) notFound()

  const { data: existingItems } = await admin
    .from('shot_list_items')
    .select('*')
    .eq('client_id', client.id)
    .order('sort_order')

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/portal/${slug}`} className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a] mb-8 transition-colors">
        <ChevronLeft size={14} /> Back
      </Link>
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-2">Shot List</h1>
        <Divider />
        <p className="text-sm text-[#888] mt-4 max-w-md mx-auto">
          Build your list of must-have group photos. We recommend no more than 15 combinations — please submit at least 2–3 weeks before your wedding.
        </p>
      </div>
      <ShotListWizard
        clientId={client.id}
        slug={slug}
        partner1={client.partner1_name}
        partner2={client.partner2_name}
        initialItems={existingItems ?? []}
      />
    </div>
  )
}
