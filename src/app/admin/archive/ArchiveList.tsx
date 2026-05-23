'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Client = Record<string, unknown>

export function ArchiveList({ clients }: { clients: Client[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === clients.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(clients.map(c => c.id as string)))
    }
  }

  async function deleteSelected() {
    if (selected.size === 0) return
    const names = clients
      .filter(c => selected.has(c.id as string))
      .map(c => `${c.partner1_name} & ${c.partner2_name}`)
      .join(', ')

    if (!confirm(`Permanently delete ${selected.size} portal${selected.size > 1 ? 's' : ''}?\n\n${names}\n\nThis cannot be undone.`)) return

    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/clients/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Delete failed')
      router.refresh()
      setSelected(new Set())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setDeleting(false)
    }
  }

  if (clients.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-[#888]">
        No archived portals yet — portals move here automatically 10 weeks after the wedding date.
      </p>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#888]">{clients.length} portal{clients.length !== 1 ? 's' : ''}</p>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-500">{error}</span>}
          <button
            onClick={deleteSelected}
            disabled={selected.size === 0 || deleting}
            className={`text-xs tracking-[0.08em] uppercase px-4 py-2 border transition-colors ${
              selected.size > 0
                ? 'border-red-300 text-red-600 hover:bg-red-50 cursor-pointer'
                : 'border-[#e0ddd8] text-[#ccc] cursor-not-allowed'
            }`}
          >
            {deleting ? 'Deleting…' : `Delete selected${selected.size > 0 ? ` (${selected.size})` : ''}`}
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e0ddd8]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e0ddd8]">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selected.size === clients.length && clients.length > 0}
                  onChange={toggleAll}
                  className="accent-[#535353]"
                  title="Select all"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs tracking-[0.1em] uppercase text-[#888] font-medium">Couple</th>
              <th className="text-left px-4 py-3 text-xs tracking-[0.1em] uppercase text-[#888] font-medium">Email</th>
              <th className="text-left px-4 py-3 text-xs tracking-[0.1em] uppercase text-[#888] font-medium">Wedding date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0ede8]">
            {clients.map(c => (
              <tr
                key={c.id as string}
                className={`hover:bg-[#faf9f7] cursor-pointer ${selected.has(c.id as string) ? 'bg-[#fdf6ee]' : ''}`}
                onClick={() => toggle(c.id as string)}
              >
                <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(c.id as string)}
                    onChange={() => toggle(c.id as string)}
                    className="accent-[#535353]"
                  />
                </td>
                <td className="px-4 py-4 font-serif text-lg">{c.partner1_name as string} & {c.partner2_name as string}</td>
                <td className="px-4 py-4 text-[#888]">{c.email as string || '—'}</td>
                <td className="px-4 py-4 text-[#888]">
                  {c.wedding_date ? new Date(c.wedding_date as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td className="px-4 py-4 text-right" onClick={e => e.stopPropagation()}>
                  <Link
                    href={`/admin/clients/${c.id as string}`}
                    className="text-xs tracking-[0.08em] uppercase underline hover:no-underline text-[#888]"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
