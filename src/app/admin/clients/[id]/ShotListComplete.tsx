'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  clientId: string
  completed: boolean
  hasList: boolean
}

export function ShotListComplete({ clientId, completed, hasList }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  async function set(next: boolean) {
    await fetch(`/api/admin/client/${clientId}/shot-list-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: next }),
    })
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => set(!completed)}
        disabled={pending}
        className={`text-xs tracking-[0.1em] uppercase px-4 py-2 border rounded transition-colors ${
          completed
            ? 'bg-green-600 text-white border-green-600'
            : 'border-[#e0ddd8] text-[#535353] hover:border-[#535353]'
        }`}
      >
        {completed ? 'Marked complete ✓' : 'Mark shot list complete'}
      </button>
      {pending && <span className="text-xs text-[#aaa]">Saving…</span>}
      {hasList && !completed && (
        <span className="text-xs text-[#aaa]">Already complete from a submitted list.</span>
      )}
    </div>
  )
}
