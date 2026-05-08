'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError('Something went wrong. Please try again.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border border-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
          <span className="text-lg">✓</span>
        </div>
        <p className="font-serif text-xl">Check your email</p>
        <p className="text-sm text-[#888]">
          We've sent a sign-in link to <strong>{email}</strong>
        </p>
        <p className="text-xs text-[#aaa] mt-4">The link expires in 1 hour.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Email address"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        autoComplete="email"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Button variant="filled" className="w-full" type="submit" disabled={loading}>
        {loading ? 'Sending…' : 'Send sign-in link'}
      </Button>
    </form>
  )
}
