import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useProfile } from '../lib/useProfile'
import { useTheme, type ThemePreference } from '../lib/theme'
import { PageFlatlay } from '../components/PageFlatlay'

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
]

export function ProfilePage() {
  const { user, signOut } = useAuth()
  const { profile, updateGoals } = useProfile()
  const { theme, setTheme } = useTheme()
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
    await updateGoals({
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
      <PageFlatlay file="profile.jpg" />
      <div>
        <h1 className="font-display font-bold text-2xl">Profil</h1>
        <p className="text-text-muted text-sm mt-1">{user?.email}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3"
      >
        <h2 className="font-display font-semibold text-lg">Tagesziele</h2>
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

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <h2 className="font-display font-semibold text-lg">Darstellung</h2>
        <div className="flex items-center gap-1 bg-surface-2 rounded-full p-1 w-fit">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                theme === option.value
                  ? 'bg-primary text-on-primary'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => signOut()}
        className="border border-border bg-surface/80 backdrop-blur-sm rounded-xl py-2.5 text-sm text-text-muted"
      >
        Abmelden
      </button>
    </div>
  )
}
