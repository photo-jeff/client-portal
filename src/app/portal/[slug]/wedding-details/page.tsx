import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="py-4 border-b border-[#f0ede8] last:border-0 flex flex-col sm:flex-row sm:gap-8">
      <dt className="text-xs tracking-[0.1em] uppercase text-[#919295] sm:w-40 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-[#535353] mt-1 sm:mt-0">{value}</dd>
    </div>
  )
}

export default async function WeddingDetailsPage({
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

  const weddingDate = client.wedding_date
    ? new Date(client.wedding_date).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      })
    : null

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/portal/${slug}`} className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#919295] hover:text-[#535353] mb-8 transition-colors">
        <ChevronLeft size={14} /> Back
      </Link>

      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-2">Wedding Details</h1>
        <Divider />
      </div>

      <Card>
        <dl>
          <DetailRow label="Couple" value={`${client.partner1_name} & ${client.partner2_name}`} />
          <DetailRow label="Wedding date" value={weddingDate ?? undefined} />
          <DetailRow label="Ceremony venue" value={client.ceremony_venue} />
          <DetailRow label="Ceremony time" value={client.ceremony_time} />
          <DetailRow label="Reception venue" value={client.reception_venue} />
          <DetailRow label="Package" value={client.package_name} />
        </dl>
      </Card>

      <div className="mt-6 bg-[#faf9f7] border border-[#e0ddd8] p-6 rounded-xl">
        <p className="text-xs tracking-[0.1em] uppercase text-[#919295] mb-2">Need to update something?</p>
        <p className="text-sm text-[#919295]">
          If any details are incorrect, please get in touch at{' '}
          <a href="mailto:hello@jeffoliverphotography.com" className="underline hover:text-[#535353]">
            hello@jeffoliverphotography.com
          </a>
        </p>
      </div>
    </div>
  )
}
