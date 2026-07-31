'use client'
import { useState } from 'react'

interface FaqBlock {
  id: number
  sort_order: number
  title: string
  subtitle: string | null
  content: string
  audiences: string[] | null
}

const AUDIENCES = [
  { key: 'bg', label: 'Bride & Groom' },
  { key: 'bb', label: 'Two Brides' },
  { key: 'gg', label: 'Two Grooms' },
] as const

function BlockEditor({ block }: { block: FaqBlock }) {
  const [value, setValue] = useState(block.content)
  const [subtitle, setSubtitle] = useState(block.subtitle ?? '')
  const [audiences, setAudiences] = useState<string[]>(block.audiences ?? ['bg', 'bb', 'gg'])
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  async function toggleAudience(key: string) {
    const next = audiences.includes(key)
      ? audiences.filter(a => a !== key)
      : [...AUDIENCES.map(a => a.key)].filter(a => audiences.includes(a) || a === key)
    setAudiences(next)
    setStatus('saving')
    await fetch(`/api/admin/faq/${block.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audiences: next }),
    })
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
  }

  async function save() {
    if (value === block.content) return
    setStatus('saving')
    await fetch(`/api/admin/faq/${block.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: value }),
    })
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
  }

  async function saveSubtitle() {
    if (subtitle === (block.subtitle ?? '')) return
    setStatus('saving')
    await fetch(`/api/admin/faq/${block.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtitle }),
    })
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <div className="bg-white border border-[#e0ddd8] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm tracking-[0.12em] uppercase text-[#535353]">
          {block.title}
        </h3>
        <span className="text-xs">
          {status === 'saving' && <span className="text-[#aaa]">Saving…</span>}
          {status === 'saved' && <span className="text-green-600">Saved ✓</span>}
        </span>
      </div>
      <input
        type="text"
        value={subtitle}
        onChange={e => { setSubtitle(e.target.value); setStatus('idle') }}
        onBlur={saveSubtitle}
        placeholder="Sub-text shown under the heading…"
        className="w-full text-sm text-[#535353] border border-[#e0ddd8] rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-[#C9A96E] bg-[#faf9f7]"
      />
      <textarea
        value={value}
        onChange={e => { setValue(e.target.value); setStatus('idle') }}
        onBlur={save}
        rows={7}
        placeholder="Add content for this section…"
        className="w-full text-sm text-[#535353] leading-relaxed border border-[#e0ddd8] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#C9A96E] resize-y bg-[#faf9f7]"
      />
      <p className="text-xs text-[#bbb] mt-1.5">
        To add a link: <code className="bg-[#f0ede8] px-1 py-0.5 rounded text-[#888]">[link text](https://example.com)</code>
      </p>

      <div className="mt-4 pt-4 border-t border-[#f0ede8]">
        <p className="text-xs tracking-[0.1em] uppercase text-[#919295] mb-2">Show this block to</p>
        <div className="flex flex-wrap gap-4">
          {AUDIENCES.map(a => (
            <label key={a.key} className="flex items-center gap-2 text-sm text-[#535353] cursor-pointer">
              <input
                type="checkbox"
                checked={audiences.includes(a.key)}
                onChange={() => toggleAudience(a.key)}
                className="accent-[#C9A96E]"
              />
              {a.label}
            </label>
          ))}
        </div>
        {audiences.length === 0 && (
          <p className="text-xs text-red-500 mt-2">Nobody sees this block while all three are unticked.</p>
        )}
      </div>
    </div>
  )
}

export function FaqEditor({ blocks }: { blocks: FaqBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map(block => (
        <BlockEditor key={block.id} block={block} />
      ))}
    </div>
  )
}
