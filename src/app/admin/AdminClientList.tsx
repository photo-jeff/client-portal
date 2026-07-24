'use client'

import { useState } from 'react'
import Link from 'next/link'

type Client = Record<string, unknown>

function PortalSentCell({ client }: { client: Client }) {
  const [sentAt, setSentAt] = useState(client.invite_sent_at as string | null)
  const [saving, setSaving] = useState(false)

  async function toggle(e: React.MouseEvent | React.ChangeEvent) {
    e.stopPropagation()
    if (saving) return
    const prev = sentAt
    const next = !sentAt
    setSaving(true)
    setSentAt(next ? new Date().toISOString() : null)  // optimistic
    try {
      const res = await fetch(`/api/admin/client/${client.id as string}/portal-sent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sent: next }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error()
      setSentAt(json.invite_sent_at)
    } catch {
      setSentAt(prev)  // revert
    } finally {
      setSaving(false)
    }
  }

  return (
    <label
      className="inline-flex items-center gap-2 cursor-pointer select-none"
      onClick={e => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={!!sentAt}
        onChange={toggle}
        disabled={saving}
        className="w-4 h-4 accent-[#535353] cursor-pointer"
      />
      {sentAt && (
        <span className="text-xs text-[#888]" title={new Date(sentAt).toLocaleString('en-GB')}>
          {new Date(sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      )}
    </label>
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
                <th className="text-left px-6 py-3 text-xs tracking-[0.1em] uppercase text-[#888] font-medium">Portal sent</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ede8]">
              {filtered.map(c => (
                <tr key={c.id as string} className="hover:bg-[#faf9f7]">
                  <td className="px-6 py-4 font-serif text-lg">
                    <a
                      href={`/portal/${c.portal_slug as string}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#C9A96E] transition-colors"
                    >
                      {c.partner1_name as string} & {c.partner2_name as string}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-[#888]">{c.email as string || '—'}</td>
                  <td className="px-6 py-4 text-[#888]">
                    {c.wedding_date ? new Date(c.wedding_date as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <PortalSentCell client={c} />
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
