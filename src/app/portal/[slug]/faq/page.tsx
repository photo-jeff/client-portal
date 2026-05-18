import { createAdminClient } from '@/lib/supabase/admin'
import { Divider } from '@/components/ui/Divider'
import { FaqAccordion } from '@/components/portal/FaqAccordion'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function FaqPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('wedding_date')
    .eq('portal_slug', slug)
    .single()

  if (!client) notFound()

  const deliveryDate = client.wedding_date
    ? new Date(new Date(client.wedding_date).getTime() + 8 * 7 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const items = [
    {
      title: 'The Bride',
      content: `We will be with you 2 hours prior to the time you're due to leave for the ceremony and will need you all ready in your dress an hour prior to ceremony.

As best you can, try and keep the room you're getting ready in tidy. Even if you can keep any mess at one end of the room so we have a clear space for shots.

Please do not put on any jewellery or perfume you'll be wearing on the day until we arrive — we want photos first!

Please can you have all your detail items ready in one place: shoes, jewellery, garter, perfume.

Try not to wear anything tight fitting that could leave marks prior to putting your dress on — especially if you are wearing a backless dress!

You will look amazing on your wedding day, but if you have any part of you that you're not so comfortable with — tattoos, blemishes, etc. — please let us know at the beginning of the day, rather than the end hoping we can work wonders with Photoshop!

Tradition says it's a bride's prerogative to be late. Well, some traditions are better off being resigned to history and this is probably one of them! Please, please, please try to be on time and let your hair and makeup artist know the time you need to be ready for. Remember — 1 hour before you're due to leave!`,
    },
    {
      title: 'The Groom',
      content: `We'll be with you around an hour and a half prior to ceremony, but we'll have a discussion about exact timings and logistics in the weeks before your big day.

We'll want to get some lovely shots of you adjusting your tie, cufflinks etc., plus some of you and the guys ahead of your main guests arriving. Then we can leave you to mingle and greet people as they arrive.`,
    },
    {
      title: 'Food',
      content: `We always ask that a hot meal is provided for both of us. Non-scientific research has proven that our photos are even more awesome on a full belly!

We have no special dietary requirements.`,
    },
    {
      title: 'The Photos',
      content: `We'll send you a number of sneak peeks within 24 hours of us leaving your wedding.${deliveryDate ? `\n\nWe plan to have your main gallery ready by ${deliveryDate}.` : '\n\nWe plan to have your main gallery ready within 8 weeks of your wedding day.'}`,
    },
  ]

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
