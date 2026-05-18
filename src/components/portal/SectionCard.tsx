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
    <Link href={href} className="group block">
      <div className="flex items-center justify-between py-6 border-b border-[#e0ddd8] hover:border-[#535353] transition-colors">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 text-[#919295] group-hover:text-[#535353] transition-colors">
            {completed
              ? <CheckCircle size={18} className="text-[#535353]" />
              : <Circle size={18} />
            }
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg text-[#535353]">{title}</h3>
              {required && !completed && (
                <span className="text-[0.6rem] tracking-[0.1em] uppercase text-[#919295] border border-[#e0ddd8] px-2 py-0.5">Action needed</span>
              )}
              {completed && (
                <span className="text-[0.6rem] tracking-[0.1em] uppercase text-[#919295] border border-[#e0ddd8] px-2 py-0.5">Complete</span>
              )}
            </div>
            <p className="text-sm text-[#919295] mt-0.5">{description}</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-[#c2c5c8] group-hover:text-[#535353] transition-colors flex-shrink-0 ml-4" />
      </div>
    </Link>
  )
}
