import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Divider } from '@/components/ui/Divider'
import { Button } from '@/components/ui/Button'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') redirect('/login')

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('wedding_date', { ascending: true })

  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      <header className="bg-white border-b border-[#e0ddd8]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="font-serif text-xl">Jeff Oliver Photography — Admin</h1>
          <Link href="/admin/clients/new">
            <Button variant="outline" size="sm">New portal</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl mb-2">Client Portals</h2>
          <Divider />
        </div>

        <div className="bg-white border border-[#e0ddd8]">
          {(!clients || clients.length === 0) ? (
            <p className="p-8 text-center text-sm text-[#888]">No portals yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0ddd8]">
                  <th className="text-left px-6 py-3 text-xs tracking-[0.1em] uppercase text-[#888] font-medium">Couple</th>
                  <th className="text-left px-6 py-3 text-xs tracking-[0.1em] uppercase text-[#888] font-medium">Email</th>
                  <th className="text-left px-6 py-3 text-xs tracking-[0.1em] uppercase text-[#888] font-medium">Wedding date</th>
                  <th className="text-left px-6 py-3 text-xs tracking-[0.1em] uppercase text-[#888] font-medium">Invite sent</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ede8]">
                {clients.map((c: Record<string, unknown>) => (
                  <tr key={c.id as string} className="hover:bg-[#faf9f7]">
                    <td className="px-6 py-4 font-serif text-lg">{c.partner1_name as string} & {c.partner2_name as string}</td>
                    <td className="px-6 py-4 text-[#888]">{c.email as string}</td>
                    <td className="px-6 py-4 text-[#888]">
                      {c.wedding_date ? new Date(c.wedding_date as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-4 text-[#888]">
                      {c.invite_sent_at ? '✓' : <span className="text-[#bbb]">Not sent</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/clients/${c.id}`} className="text-xs tracking-[0.08em] uppercase underline hover:no-underline">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
