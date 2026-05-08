'use client'
import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1">
      <label className="block text-xs tracking-[0.1em] uppercase text-[#888] font-medium">{label}</label>
      {hint && <p className="text-xs text-[#aaa]">{hint}</p>}
      <input
        className={`w-full border border-[#e0ddd8] bg-white px-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] transition-colors placeholder:text-[#bbb] ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function Textarea({ label, hint, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="space-y-1">
      <label className="block text-xs tracking-[0.1em] uppercase text-[#888] font-medium">{label}</label>
      {hint && <p className="text-xs text-[#aaa]">{hint}</p>}
      <textarea
        className={`w-full border border-[#e0ddd8] bg-white px-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] transition-colors placeholder:text-[#bbb] resize-y min-h-[100px] ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
