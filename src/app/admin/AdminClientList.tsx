'use client'

import { useState } from 'react'
import Link from 'next/link'

type Client = Record<string, unknown>

function SendInviteCell({ client }: { client: Client }) {
  const [sending, setSending] = useState(false)
  const [sentAt, setSentAt] = useState(client.invite_sent_at as string | null)

  async function send(e: React.MouseEvent) {
    e.stopPropagation()
    if (!client.email || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/client/${client.id as string}/send-invite`, { method: 'POST' })
      if (res.ok) setSentAt(new Date().toISOString())
    } finally {
      setSending(false)
    }
  }

  if (sentAt) {
    return (
      <span className="text-[#888]" title={new Date(sentAt).toLocaleString('en-GB')}>
        ✓ {new Date(sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
      </span>
    )
  }

  return (
    <button
      onClick={send}
      disabled={sending || !client.email}
      className="text-xs tracking-[0.06em] uppercase text-[#C9A96E] hover:underline disabled:text-[#ccc] disabled:cursor-not-allowed"
    >
      {sending ? 'Sending…' : 'Send invite'}
    </button>
  )
}

export function AdminClientList({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? clients.filter(c => {
        const q = query.toLowerCase()
        return (
          (c.partner1_name as string)?.toLowerCase().includes(q) ||
          (c.partner2_name as string)?.toLowerCase().includes(q) ||
          (c.email as string)?.toLowerCase().includes(q) ||
          (c.ceremony_venue as string)?.toLowerCase().includes(q)
        )
      })
    : clients

  return (
    <>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name, email or venue…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full max-w-sm px-4 py-2 text-sm border border-[#e0ddd8] rounded-lg bg-white focus:outline-none focus:border-[#c8c4be] placeholder:text-[#bbb]"
        />
      </div>

      <div className="bg-white border border-[#e0ddd8]">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#888]">
            {query ? 'No results.' : 'No active portals yet.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0ddd8]">
                <th className="text-left px-6 py-3 text-xs tracking-[0.1em] uppercase text-[#888] font-medium">Couple</th>
                <th className="text-left px-6 py-3 text-xs tracking-[0.1em] uppercase text-[#888] font-medium">Email</th>
                <th className="text-left px-6 py-3 text-xs tracking-[0.1em] uppercase text-[#888] font-medium">Wedding date</th>
                <th className="text-left px-6 py-3 text-xs tracking-[0.1em] uppercase text-[#888] font-medium">Invite</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ede8]">
              {filtered.map(c => (
                <tr key={c.id as string} className="hover:bg-[#faf9f7]">
                  <td className="px-6 py-4 font-serif text-lg">{c.partner1_name as string} & {c.partner2_name as string}</td>
                  <td className="px-6 py-4 text-[#888]">{c.email as string || '—'}</td>
                  <td className="px-6 py-4 text-[#888]">
                    {c.wedding_date ? new Date(c.wedding_date as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <SendInviteCell client={c} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/clients/${c.id as string}`} className="text-xs tracking-[0.08em] uppercase underline hover:no-underline">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
