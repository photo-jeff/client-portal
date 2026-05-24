'use client'
import { useState } from 'react'

interface FaqItem {
  id: number
  sort_order: number
  question: string
  answer: string
}

function ItemEditor({ item }: { item: FaqItem }) {
  const [question, setQuestion] = useState(item.question)
  const [answer, setAnswer] = useState(item.answer)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function save(field: 'question' | 'answer', value: string) {
    const original = field === 'question' ? item.question : item.answer
    if (value === original) return
    setStatus('saving')
    const res = await fetch(`/api/admin/prewed-faq/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    setStatus(res.ok ? 'saved' : 'error')
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <div className="bg-white border border-[#e0ddd8] rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-[0.12em] uppercase text-[#b5b8ba]">Q{item.sort_order}</span>
        <span className="text-xs">
          {status === 'saving' && <span className="text-[#aaa]">Saving…</span>}
          {status === 'saved'  && <span className="text-green-600">Saved ✓</span>}
          {status === 'error'  && <span className="text-red-500">Error saving</span>}
        </span>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#535353] mb-1.5">Question</label>
        <input
          value={question}
          onChange={e => { setQuestion(e.target.value); setStatus('idle') }}
          onBlur={() => save('question', question)}
          className="w-full text-sm text-[#1a1a1a] border border-[#e0ddd8] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#1a1a1a] bg-[#faf9f7]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#535353] mb-1.5">Answer</label>
        <textarea
          value={answer}
          onChange={e => { setAnswer(e.target.value); setStatus('idle') }}
          onBlur={() => save('answer', answer)}
          rows={3}
          className="w-full text-sm text-[#535353] leading-relaxed border border-[#e0ddd8] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#1a1a1a] resize-y bg-[#faf9f7]"
        />
      </div>
    </div>
  )
}

export function PrewedFaqEditor({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-4">
      {items.map(item => (
        <ItemEditor key={item.id} item={item} />
      ))}
    </div>
  )
}
