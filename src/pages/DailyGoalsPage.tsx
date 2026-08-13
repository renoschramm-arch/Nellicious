import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../lib/useProfile'

export function DailyGoalsPage() {
  const { profile, updateProfile } = useProfile()
  const [kcal, setKcal] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!profile) return
    setKcal(String(profile.daily_kcal_goal))
    setProtein(String(profile.daily_protein_goal))
    setCarbs(String(profile.daily_carbs_goal))
    setFat(String(profile.daily_fat_goal))
  }, [profile])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await updateProfile({
      daily_kcal_goal: Number(kcal),
      daily_protein_goal: Number(protein),
      daily_carbs_goal: Number(carbs),
      daily_fat_goal: Number(fat),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          to="/mehr"
          className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-muted hover:text-text"
        >
          ‹ Zurück
        </Link>
      </div>
      <h1 className="font-display font-bold text-2xl">Tagesziele</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3"
      >
        <div className="grid grid-cols-4 gap-2">
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            kcal
            <input
              type="number"
              min={0}
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
              className="rounded-lg border border-border bg-bg px-2 py-1.5 font-mono outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            Protein g
            <input
              type="number"
              min={0}
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="rounded-lg border border-border bg-bg px-2 py-1.5 font-mono outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            Kohlenh. g
            <input
              type="number"
              min={0}
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              className="rounded-lg border border-border bg-bg px-2 py-1.5 font-mono outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            Fett g
            <input
              type="number"
              min={0}
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              className="rounded-lg border border-border bg-bg px-2 py-1.5 font-mono outline-none focus:border-primary"
            />
          </label>
        </div>
        <button
          type="submit"
          className="bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm mt-1"
        >
          {saved ? 'Gespeichert ✓' : 'Speichern'}
        </button>
      </form>
    </div>
  )
}
