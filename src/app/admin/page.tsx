import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Divider } from '@/components/ui/Divider'
import { Button } from '@/components/ui/Button'
import { AdminClientList } from './AdminClientList'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') redirect('/login')

  const admin = createAdminClient()
  const { data: clients } = await admin
    .from('clients')
    .select('*')
    .order('wedding_date', { ascending: true })

  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      <header className="bg-white border-b border-[#e0ddd8]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="font-serif text-xl">Jeff Oliver Photography — Admin</h1>
          <div className="flex items-center gap-3">
            <Link href="/admin/faq">
              <Button variant="outline" size="sm">Edit FAQ</Button>
            </Link>
            <Link href="/admin/clients/new">
              <Button variant="outline" size="sm">New portal</Button>
            </Link>
          </div>
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
