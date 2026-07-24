import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Divider } from '@/components/ui/Divider'
import { AdminClientList } from './AdminClientList'
import { AdminNavMenu } from './AdminNavMenu'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') redirect('/login')

  // Active portals = wedding date is null OR in the future, or within the last week
  const archiveThreshold = new Date(Date.now() - 7 * 86_400_000).toISOString().split('T')[0]

  const admin = createAdminClient()
  const { data: clients } = await admin
    .from('clients')
    .select('*')
    .or(`wedding_date.is.null,wedding_date.gte.${archiveThreshold}`)
    .order('wedding_date', { ascending: true, nullsFirst: false })

  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      <header className="bg-white border-b border-[#e0ddd8]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="font-serif text-xl">Jeff Oliver Photography — Admin</h1>
          <AdminNavMenu />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl mb-2">Client Portals</h2>
          <Divider />
        </div>

        <AdminClientList clients={clients ?? []} />
      </main>
    </div>
  )
}
