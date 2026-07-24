'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { RichText } from './RichText'

interface FaqItem {
  title: string
  subtitle?: string | null
  content: string
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div
            key={i}
            className={`relative overflow-hidden rounded-2xl bg-[#faf9f7] transition-all duration-300 ${
              isOpen
                ? 'shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-[#C9A96E]/40'
                : 'shadow-[0_2px_10px_rgba(0,0,0,0.03)] ring-1 ring-[#ece8e2] hover:ring-[#e0d8c9]'
            }`}
          >
            {/* Left accent bar */}
            <span
              aria-hidden
              className={`absolute inset-y-0 left-0 w-[3px] transition-colors duration-300 ${
                isOpen ? 'bg-[#C9A96E]' : 'bg-[#e6ddcd]'
              }`}
            />
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center gap-4 sm:gap-5 px-6 sm:px-7 py-5 text-left group"
            >
              {/* Numbered badge */}
              <span
                className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-full font-serif text-base transition-all duration-300 ${
                  isOpen
                    ? 'bg-[#C9A96E] text-white'
                    : 'bg-white text-[#C9A96E] ring-1 ring-[#e6ddcd] group-hover:ring-[#C9A96E]/50'
                }`}
              >
                {i + 1}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-display text-sm tracking-[0.12em] uppercase text-[#535353]">
                  {item.title}
                </span>
                {item.subtitle && (
                  <span className="block text-[13px] leading-snug text-[#919295] mt-1 font-light normal-case tracking-normal">
                    {item.subtitle}
                  </span>
                )}
              </span>
              <ChevronDown
                size={16}
                className={`text-[#c2c5c8] group-hover:text-[#535353] transition-all duration-300 shrink-0 ${isOpen ? 'rotate-180 text-[#C9A96E]' : ''}`}
              />
            </button>
            {isOpen && (
              <div className="px-6 sm:px-7 pb-6 pl-[4.75rem] sm:pl-[5.25rem] border-t border-[#ece8e2]">
                <p className="text-sm text-[#75767a] leading-relaxed pt-5">
                  <RichText text={item.content} />
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
