'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/admin/client/${clientId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      const { error } = await res.json()
      alert(`Delete failed: ${error}`)
      setLoading(false)
      setConfirming(false)
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs tracking-[0.1em] uppercase text-red-400 hover:text-red-600 transition-colors"
      >
        Delete portal
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#888]">Delete {clientName}? This cannot be undone.</span>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs tracking-[0.1em] uppercase text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
      >
        {loading ? 'Deleting…' : 'Yes, delete'}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a] transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}
