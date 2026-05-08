import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PortalNav } from '@/components/portal/PortalNav'

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('portal_slug', slug)
    .single()

  if (!client) redirect('/login')

  // Verify the logged-in user owns this portal
  if (client.email !== user.email) redirect('/login')

  const partnerNames = `${client.partner1_name} & ${client.partner2_name}`

  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      <PortalNav slug={slug} partnerNames={partnerNames} />
      <main className="max-w-5xl mx-auto px-6 py-12">
        {children}
      </main>
    </div>
  )
}
