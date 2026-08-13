import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../lib/useProfile'
import {
  ACTIVITY_LEVELS,
  ACTIVITY_LEVEL_LABELS,
  INTOLERANCES,
  INTOLERANCE_LABELS,
  NUTRITION_TYPES,
  NUTRITION_TYPE_LABELS,
  type ActivityLevel,
  type NutritionType,
} from '../lib/useProfile'

export function ProfileEditPage() {
  const { profile, updateProfile } = useProfile()
  const [displayName, setDisplayName] = useState('')
  const [nutritionType, setNutritionType] = useState<NutritionType | null>(null)
  const [intolerances, setIntolerances] = useState<string[]>([])
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name ?? '')
    setNutritionType(profile.nutrition_type)
    setIntolerances(profile.intolerances)
    setActivityLevel(profile.activity_level)
  }, [profile])

  function toggleIntolerance(value: string) {
    setIntolerances((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await updateProfile({
      display_name: displayName || null,
      nutrition_type: nutritionType,
      intolerances,
      activity_level: activityLevel,
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
      <h1 className="font-display font-bold text-2xl">Mein Profil</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-5"
      >
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Dein Name"
            className="rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Ernährungstyp</span>
          <div className="flex flex-wrap gap-1.5">
            {NUTRITION_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setNutritionType(nutritionType === type ? null : type)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  nutritionType === type
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-2 border border-border text-text-muted hover:text-text'
                }`}
              >
                {NUTRITION_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Unverträglichkeiten</span>
          <div className="flex flex-wrap gap-1.5">
            {INTOLERANCES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleIntolerance(value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  intolerances.includes(value)
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-2 border border-border text-text-muted hover:text-text'
                }`}
              >
                {INTOLERANCE_LABELS[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Fitness-/Aktivitätslevel</span>
          <div className="flex flex-col gap-1.5">
            {ACTIVITY_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setActivityLevel(activityLevel === level ? null : level)}
                className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activityLevel === level
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-2 border border-border text-text-muted hover:text-text'
                }`}
              >
                {ACTIVITY_LEVEL_LABELS[level]}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm"
        >
          {saved ? 'Gespeichert ✓' : 'Speichern'}
        </button>
      </form>
    </div>
  )
}
