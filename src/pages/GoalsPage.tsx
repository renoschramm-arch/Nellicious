import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../lib/useProfile'
import { GOALS, GOAL_LABELS, type Goal } from '../lib/useProfile'

export function GoalsPage() {
  const { profile, updateProfile } = useProfile()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [goalNote, setGoalNote] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!profile) return
    setGoal(profile.goal)
    setGoalNote(profile.goal_note)
  }, [profile])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await updateProfile({ goal, goal_note: goalNote })
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
      <h1 className="font-display font-bold text-2xl">Ziele</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Was möchtest du erreichen?</span>
          <div className="flex flex-wrap gap-1.5">
            {GOALS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setGoal(goal === value ? null : value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  goal === value
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-2 border border-border text-text-muted hover:text-text'
                }`}
              >
                {GOAL_LABELS[value]}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Notiz (optional)
          <textarea
            value={goalNote}
            onChange={(e) => setGoalNote(e.target.value)}
            rows={3}
            placeholder="z. B. bis zur Hochzeit im Sommer"
            className="rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-primary resize-none"
          />
        </label>

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
