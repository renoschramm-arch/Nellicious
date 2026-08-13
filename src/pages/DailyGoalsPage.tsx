import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../lib/useProfile'
import { useWeightLogs, formatWeightKg } from '../lib/useWeightLogs'
import { calculateTargets } from '../lib/calorieCalculator'

const MISSING_FIELD_LABELS: Record<string, { label: string; to: string }> = {
  gender: { label: 'Geschlecht', to: '/mehr/profil' },
  age: { label: 'Alter', to: '/mehr/profil' },
  heightCm: { label: 'Größe', to: '/mehr/profil' },
  activityLevel: { label: 'Aktivitätslevel', to: '/mehr/profil' },
  goal: { label: 'Ziel', to: '/mehr/ziele' },
  weightKg: { label: 'Gewicht (Verlauf)', to: '/verlauf' },
}

export function DailyGoalsPage() {
  const { profile, updateProfile } = useProfile()
  const { logs: weightLogs } = useWeightLogs()
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

  const latestWeight = weightLogs[0]
  const missing = Object.keys(MISSING_FIELD_LABELS).filter((key) => {
    if (key === 'weightKg') return !latestWeight
    if (key === 'gender') return !profile?.gender
    if (key === 'age') return profile?.age == null
    if (key === 'heightCm') return profile?.height_cm == null
    if (key === 'activityLevel') return !profile?.activity_level
    if (key === 'goal') return !profile?.goal
    return false
  })

  const suggestion =
    missing.length === 0 && profile && latestWeight
      ? calculateTargets({
          gender: profile.gender!,
          age: profile.age!,
          heightCm: profile.height_cm!,
          weightKg: Number(latestWeight.weight_kg),
          activityLevel: profile.activity_level!,
          goal: profile.goal!,
        })
      : null

  function applySuggestion() {
    if (!suggestion) return
    setKcal(String(suggestion.kcal))
    setProtein(String(suggestion.proteinG))
    setCarbs(String(suggestion.carbsG))
    setFat(String(suggestion.fatG))
  }

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

      {suggestion && (
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
          <span className="text-sm font-medium">Berechneter Vorschlag</span>
          <p className="text-sm text-text-muted">
            Basierend auf deinem Profil und aktuellen Gewicht ({formatWeightKg(Number(latestWeight!.weight_kg))} kg):
          </p>
          <p className="font-mono text-sm">
            {suggestion.kcal} kcal · {suggestion.proteinG} g Protein · {suggestion.carbsG} g Kohlenh. · {suggestion.fatG} g Fett
          </p>
          <button
            type="button"
            onClick={applySuggestion}
            className="bg-surface-2 border border-border rounded-xl py-2 text-sm font-medium hover:border-primary transition-colors w-fit px-4"
          >
            Übernehmen
          </button>
        </div>
      )}

      {missing.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
          <span className="text-sm font-medium">Automatischer Vorschlag möglich, sobald ergänzt:</span>
          <ul className="flex flex-wrap gap-1.5">
            {missing.map((key) => (
              <li key={key}>
                <Link
                  to={MISSING_FIELD_LABELS[key].to}
                  className="text-xs bg-surface-2 border border-border rounded-full px-3 py-1 text-text-muted hover:text-text"
                >
                  {MISSING_FIELD_LABELS[key].label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

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
