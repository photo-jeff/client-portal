'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  clientId: string
  initialText: string | null
}

export function ShotListEditor({ clientId, initialText }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(initialText ?? '')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function save() {
    if (!text.trim() || saving) return
    setSaving(true)
    setStatus(null)
    try {
      const res = await fetch(`/api/admin/client/${clientId}/shot-list-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`)
      setStatus('Saved ✓')
      setEditing(false)
      startTransition(() => router.refresh())
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Save failed')
    }
    setSaving(false)
  }

  if (!editing) {
    return (
      <div className="mt-6">
        {initialText ? (
          <pre className="text-sm text-[#1a1a1a] whitespace-pre-wrap leading-relaxed font-sans">
            {initialText}
          </pre>
        ) : (
          <p className="text-sm text-[#888]">Client hasn&apos;t completed their shot list in the portal.</p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => { setText(initialText ?? ''); setEditing(true); setStatus(null) }}
            className="text-xs tracking-[0.1em] uppercase px-4 py-2 border border-[#e0ddd8] text-[#535353] rounded hover:border-[#535353] transition-colors"
          >
            {initialText ? 'Amend list' : 'Add list'}
          </button>
          {status && <span className="text-xs text-[#888]">{status}</span>}
          {pending && <span className="text-xs text-[#aaa]">Refreshing…</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={Math.max(12, text.split('\n').length + 2)}
        className="w-full text-sm leading-relaxed border border-[#e0ddd8] rounded-lg p-4 font-sans focus:outline-none focus:border-[#535353]"
        placeholder="Paste or write the shot list here…"
        disabled={saving}
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || !text.trim()}
          className="text-xs tracking-[0.1em] uppercase px-4 py-2 border rounded bg-[#1a1a1a] text-white border-[#1a1a1a] hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save list'}
        </button>
        <button
          onClick={() => { setEditing(false); setStatus(null) }}
          disabled={saving}
          className="text-xs tracking-[0.1em] uppercase px-4 py-2 border border-[#e0ddd8] text-[#535353] rounded hover:border-[#535353] transition-colors"
        >
          Cancel
        </button>
        {status && <span className="text-xs text-red-500">{status}</span>}
      </div>
      <p className="mt-2 text-xs text-[#aaa]">
        Saving replaces the stored list and updates what the couple sees in the portal. Nothing is sent to VSCO.
      </p>
    </div>
  )
}
