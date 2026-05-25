export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Divider } from '@/components/ui/Divider'
import { RichText } from '@/components/portal/RichText'

export default async function PrewedFaqPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id')
    .eq('portal_slug', slug)
    .single()

  if (!client) notFound()

  const { data: items } = await admin
    .from('prewed_faq')
    .select('id, question, answer')
    .order('sort_order')

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/portal/${slug}/pre-wed-shoot`}
        className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#919295] hover:text-[#535353] mb-8 transition-colors"
      >
        <ChevronLeft size={14} /> Back
      </Link>

      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-2">Pre-Wedding Shoot</h1>
        <Divider />
        <p className="text-sm text-[#919295] mt-4">Everything you need to know before the day.</p>
      </div>

      {/* Photo strip */}
      <div className="grid grid-cols-3 gap-2 mb-12">
        {([
          { src: '/B_and_L-019.jpg', position: '50% 30%' },
          { src: '/M_and_D-026.jpg', position: '50% 40%' },
          { src: '/B_and_L-021.jpg', position: '50% 35%' },
        ] as { src: string; position: string }[]).map(({ src, position }) => (
          <div key={src} className="relative overflow-hidden rounded-xl" style={{ paddingBottom: '120%' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: position }}
            />
          </div>
        ))}
      </div>

      {/* FAQ items */}
      <div className="space-y-0 divide-y divide-[#e0ddd8] border-t border-b border-[#e0ddd8]">
        {(items ?? []).map(item => (
          <details key={item.id} className="group py-5">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <span className="font-medium text-[#1a1a1a] pr-4">{item.question}</span>
              <span className="shrink-0 text-[#919295] transition-transform group-open:rotate-45 text-xl leading-none">+</span>
            </summary>
            <p className="mt-3 text-sm text-[#555] leading-relaxed"><RichText text={item.answer} /></p>
          </details>
        ))}
      </div>

      <p className="text-center text-xs text-[#b5b8ba] mt-12">
        Still have a question?{' '}
        <a href="mailto:hello@jeffoliverphotography.com" className="underline hover:text-[#535353]">
          Get in touch
        </a>
      </p>
    </div>
  )
}
