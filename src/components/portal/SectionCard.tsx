import Link from 'next/link'
import { CheckCircle, Circle, ChevronRight } from 'lucide-react'

interface SectionCardProps {
  title: string
  description: string
  href: string
  completed?: boolean
  required?: boolean
}

export function SectionCard({ title, description, href, completed, required }: SectionCardProps) {
  return (
    <Link href={href} className="group block h-full">
      <div className="h-full border border-[#e0ddd8] group-hover:border-[#535353] transition-all duration-200 p-7 rounded-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {completed
              ? <CheckCircle size={15} className="text-[#535353] shrink-0" />
              : <Circle size={15} className="text-[#c2c5c8] group-hover:text-[#919295] transition-colors shrink-0" />
            }
            {required && !completed && (
              <span className="text-[0.55rem] tracking-[0.1em] uppercase text-[#919295] border border-[#e0ddd8] px-2 py-0.5">
                Action needed
              </span>
            )}
            {completed && (
              <span className="text-[0.55rem] tracking-[0.1em] uppercase text-[#919295] border border-[#e0ddd8] px-2 py-0.5">
                Complete
              </span>
            )}
          </div>
          <ChevronRight size={14} className="text-[#c2c5c8] group-hover:text-[#535353] transition-colors shrink-0" />
        </div>
        <h3 className="font-display text-sm tracking-[0.12em] uppercase text-[#535353] mb-2">{title}</h3>
        <p className="text-sm text-[#919295] leading-relaxed">{description}</p>
      </div>
    </Link>
  )
}
