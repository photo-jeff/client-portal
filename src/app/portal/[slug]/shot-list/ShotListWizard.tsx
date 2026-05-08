'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Trash2, GripVertical, CheckCircle } from 'lucide-react'
import type { ShotListItem } from '@/lib/types'

interface Props {
  clientId: string
  partner1: string
  partner2: string
  initialItems: ShotListItem[]
}

const SUGGESTED_CATEGORIES = [
  'Immediate family',
  'Extended family',
  'Bridesmaids & groomsmen',
  'Bride with bridesmaids',
  'Groom with groomsmen',
  'Friends',
  'Couples',
  'Other',
]

const QUICK_SUGGESTIONS = (p1: string, p2: string) => [
  { description: `${p1} & ${p2} with both sets of parents`, category: 'Immediate family', people: `Both sets of parents` },
  { description: `${p1} & ${p2} with ${p1}'s parents`, category: 'Immediate family', people: `${p1}'s parents` },
  { description: `${p1} & ${p2} with ${p2}'s parents`, category: 'Immediate family', people: `${p2}'s parents` },
  { description: `${p1} & ${p2} with full bridal party`, category: 'Bridesmaids & groomsmen', people: 'Full bridal party' },
  { description: `${p1} with bridesmaids`, category: 'Bride with bridesmaids', people: 'Bridesmaids' },
  { description: `${p2} with groomsmen`, category: 'Groom with groomsmen', people: 'Groomsmen' },
]

export function ShotListWizard({ clientId, partner1, partner2, initialItems }: Props) {
  const [items, setItems] = useState<Omit<ShotListItem, 'id' | 'client_id' | 'sort_order'>[]>(
    initialItems.map(i => ({ description: i.description, category: i.category, people: i.people }))
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newItem, setNewItem] = useState({ description: '', category: SUGGESTED_CATEGORIES[0], people: '' })

  function addItem() {
    if (!newItem.description.trim()) return
    setItems(prev => [...prev, { ...newItem }])
    setNewItem({ description: '', category: SUGGESTED_CATEGORIES[0], people: '' })
  }

  function addSuggestion(s: { description: string; category: string; people: string }) {
    if (items.some(i => i.description === s.description)) return
    setItems(prev => [...prev, s])
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  async function saveList() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('shot_list_items').delete().eq('client_id', clientId)
    if (items.length > 0) {
      await supabase.from('shot_list_items').insert(
        items.map((item, i) => ({
          client_id: clientId,
          description: item.description,
          category: item.category,
          people: item.people,
          sort_order: i,
        }))
      )
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const suggestions = QUICK_SUGGESTIONS(partner1, partner2)

  return (
    <div className="space-y-6">
      {/* Quick suggestions */}
      <div className="bg-white border border-[#e0ddd8] p-6">
        <h3 className="text-xs tracking-[0.12em] uppercase text-[#888] mb-4">Popular suggestions — click to add</h3>
        <div className="flex flex-wrap gap-2">
          {suggestions.map(s => {
            const added = items.some(i => i.description === s.description)
            return (
              <button
                key={s.description}
                onClick={() => addSuggestion(s)}
                disabled={added}
                className={`text-xs px-3 py-1.5 border transition-all ${
                  added
                    ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white'
                    : 'border-[#e0ddd8] text-[#888] hover:border-[#1a1a1a] hover:text-[#1a1a1a]'
                }`}
              >
                {added && <CheckCircle size={10} className="inline mr-1.5" />}
                {s.description}
              </button>
            )
          })}
        </div>
      </div>

      {/* Add custom item */}
      <div className="bg-white border border-[#e0ddd8] p-6">
        <h3 className="text-xs tracking-[0.12em] uppercase text-[#888] mb-4">Add a shot</h3>
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              label="Description"
              value={newItem.description}
              onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
              placeholder={`${partner1} & ${partner2} with…`}
            />
            <div className="space-y-1">
              <label className="block text-xs tracking-[0.1em] uppercase text-[#888] font-medium">Category</label>
              <select
                value={newItem.category}
                onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                className="w-full border border-[#e0ddd8] bg-white px-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
              >
                {SUGGESTED_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <Input
            label="Who is in this shot?"
            value={newItem.people}
            onChange={e => setNewItem(p => ({ ...p, people: e.target.value }))}
            placeholder="Name the people included"
          />
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus size={13} className="mr-1.5" /> Add shot
          </Button>
        </div>
      </div>

      {/* Shot list */}
      {items.length > 0 && (
        <div className="bg-white border border-[#e0ddd8]">
          <div className="px-6 py-4 border-b border-[#e0ddd8] flex items-center justify-between">
            <h3 className="text-xs tracking-[0.12em] uppercase text-[#888]">Your shot list</h3>
            <span className={`text-xs tracking-[0.08em] uppercase ${items.length > 15 ? 'text-red-500' : 'text-[#888]'}`}>
              {items.length} / 15 recommended
            </span>
          </div>
          <ul className="divide-y divide-[#f0ede8]">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-4 px-6 py-4">
                <span className="text-[#ddd] mt-0.5"><GripVertical size={16} /></span>
                <div className="flex-1">
                  <p className="text-sm text-[#1a1a1a]">{item.description}</p>
                  {item.people && <p className="text-xs text-[#888] mt-0.5">{item.people}</p>}
                  <span className="text-[0.6rem] tracking-[0.08em] uppercase text-[#bbb]">{item.category}</span>
                </div>
                <button onClick={() => removeItem(i)} className="text-[#ccc] hover:text-red-400 transition-colors mt-0.5">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {items.length > 15 && (
        <p className="text-sm text-red-500 text-center">
          You have more than 15 shots. Each takes ~3 minutes — consider trimming to keep time with guests.
        </p>
      )}

      <div className="flex justify-end">
        <Button variant="filled" onClick={saveList} disabled={saving || items.length === 0}>
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save shot list'}
        </Button>
      </div>
    </div>
  )
}
