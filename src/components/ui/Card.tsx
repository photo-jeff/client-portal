interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white border border-[#e0ddd8] p-8 rounded-2xl ${className}`}>
      {children}
    </div>
  )
}
