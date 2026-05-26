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

  const existingList = (client as Record<string, unknown>).shot_list_text as string | null

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/portal/${slug}`} className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#919295] hover:text-[#535353] mb-8 transition-colors">
        <ChevronLeft size={14} /> Back
      </Link>
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-2">Shot List</h1>
        <Divider />
        <p className="text-sm text-[#919295] mt-4 max-w-md mx-auto">
          Answer a few questions right here in the portal and we&apos;ll build your personalised group shot list together — usually takes about 10 minutes.
        </p>
      </div>
      <ShotListWizard
        slug={slug}
        partner1={client.partner1_name}
        partner2={client.partner2_name}
        partner1Role={(client as Record<string, unknown>).partner1_role as string ?? 'Bride'}
        partner2Role={(client as Record<string, unknown>).partner2_role as string ?? 'Groom'}
        weddingDate={client.wedding_date ?? null}
        existingList={existingList}
      />
    </div>
  )
}
