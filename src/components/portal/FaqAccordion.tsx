'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FaqItem {
  title: string
  content: string
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border border-[#e0ddd8] rounded-2xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-7 py-5 text-left group"
          >
            <span className="font-display text-sm tracking-[0.12em] uppercase text-[#535353]">
              {item.title}
            </span>
            <ChevronDown
              size={15}
              className={`text-[#c2c5c8] group-hover:text-[#535353] transition-all duration-200 shrink-0 ${open === i ? 'rotate-180' : ''}`}
            />
          </button>
          {open === i && (
            <div className="px-7 pb-6 border-t border-[#f0ede8]">
              <p className="text-sm text-[#919295] leading-relaxed pt-5 whitespace-pre-line">
                {item.content}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
