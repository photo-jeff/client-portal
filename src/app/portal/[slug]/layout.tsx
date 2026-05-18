import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { PortalNav } from '@/components/portal/PortalNav'

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('partner1_name, partner2_name')
    .eq('portal_slug', slug)
    .single()

  if (!client) notFound()

  const partnerNames = `${client.partner1_name} & ${client.partner2_name}`

  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      <PortalNav slug={slug} partnerNames={partnerNames} />
      <main className="max-w-5xl mx-auto px-6 py-12">
        {children}
      </main>
    </div>
  )
}
