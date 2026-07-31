import { createAdminClient } from '@/lib/supabase/admin'
import { Divider } from '@/components/ui/Divider'
import { FaqAccordion } from '@/components/portal/FaqAccordion'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCoupleType } from '@/lib/couple-type'

export default async function FaqPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, wedding_date, partner1_role, partner2_role')
    .eq('portal_slug', slug)
    .single()

  if (!client) notFound()

  // Two brides don't see "The Groom", two grooms don't see "The Bride".
  // Jeff controls this per block in /admin/faq.
  const { data: blocks } = await admin
    .from('faq_blocks')
    .select('title, subtitle, content')
    .contains('audiences', [getCoupleType(client)])
    .order('sort_order')

  const deliveryDate = client.wedding_date
    ? new Date(new Date(client.wedding_date).getTime() + 8 * 7 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'within 8 weeks of your wedding day'

  const items = (blocks ?? []).map(b => ({
    title: b.title,
    subtitle: (b as { subtitle?: string | null }).subtitle ?? null,
    content: b.content.replace(/\{\{delivery_date\}\}/g, deliveryDate),
  }))

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/portal/${slug}`} className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#919295] hover:text-[#535353] mb-8 transition-colors">
        <ChevronLeft size={14} /> Back
      </Link>

      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-2">FAQ</h1>
        <Divider />
        <p className="text-sm text-[#919295] mt-4 max-w-md mx-auto">
          Important information about your day.
        </p>
      </div>

      <FaqAccordion items={items} />
    </div>
  )
}
