'use client'
import { useState } from 'react'

interface FaqBlock {
  id: number
  sort_order: number
  title: string
  content: string
}

function BlockEditor({ block }: { block: FaqBlock }) {
  const [value, setValue] = useState(block.content)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

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
