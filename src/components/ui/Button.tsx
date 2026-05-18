'use client'
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'outline' | 'filled'
  size?: 'sm' | 'md'
}

export function Button({ variant = 'outline', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center tracking-[0.15em] uppercase font-sans font-medium transition-all duration-200 disabled:opacity-40 cursor-pointer'
  const sizes = { sm: 'px-4 py-2 text-[0.65rem]', md: 'px-6 py-3 text-[0.7rem]' }
  const variants = {
    outline: 'border border-[#535353] text-[#535353] bg-transparent hover:bg-[#535353] hover:text-white',
    filled: 'border border-[#535353] bg-[#535353] text-white hover:opacity-80',
  }
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
