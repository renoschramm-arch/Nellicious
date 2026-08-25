import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfile } from '../lib/useProfile'
import { useWeightLogs, formatWeightKg } from '../lib/useWeightLogs'
import { calculateTargets } from '../lib/calorieCalculator'
import { useGoalProfiles } from '../lib/useGoalProfiles'
import { usePremium } from '../lib/usePremium'
import { PremiumModal } from '../components/PremiumModal'

export function DailyGoalsPage() {
  const { t } = useTranslation()
  const MISSING_FIELD_LABELS: Record<string, { label: string; to: string }> = {
    gender: { label: t('dailyGoals.fieldGender'), to: '/mehr/profil' },
    age: { label: t('dailyGoals.fieldAge'), to: '/mehr/profil' },
    heightCm: { label: t('dailyGoals.fieldHeight'), to: '/mehr/profil' },
    activityLevel: { label: t('dailyGoals.fieldActivityLevel'), to: '/mehr/profil' },
    goal: { label: t('dailyGoals.fieldGoal'), to: '/mehr/ziele' },
    weightKg: { label: t('dailyGoals.fieldWeight'), to: '/verlauf' },
  }
  const { profile, updateProfile, reload: reloadProfile } = useProfile()
  const { logs: weightLogs } = useWeightLogs()
  const [kcal, setKcal] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [saved, setSaved] = useState(false)
  const [showFormula, setShowFormula] = useState(false)
  const { hasPremium } = usePremium()
  const { profiles: goalProfiles, createProfile, removeProfile, activateProfile } = useGoalProfiles()
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')

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

  function handleAddProfileClick() {
    if (!hasPremium) {
      setShowPremiumModal(true)
      return
    }
    setShowNameInput(true)
  }

  async function handleSaveNewProfile(e: FormEvent) {
    e.preventDefault()
    if (!newProfileName.trim()) return
    await createProfile({
      name: newProfileName.trim(),
      daily_kcal_goal: Number(kcal),
      daily_protein_goal: Number(protein),
      daily_carbs_goal: Number(carbs),
      daily_fat_goal: Number(fat),
      goal: profile?.goal ?? null,
    })
    setNewProfileName('')
    setShowNameInput(false)
  }

  async function handleActivateProfile(id: string) {
    if (!hasPremium) {
      setShowPremiumModal(true)
      return
    }
    const target = goalProfiles.find((p) => p.id === id)
    if (!target) return
    // activateProfile schreibt direkt über Supabase in die profiles-Zeile,
    // ohne den lokalen State von useProfile() zu berühren — ohne reload()
    // bleiben Eingabefelder und aktive Markierung auf dem alten Stand.
    await activateProfile(target)
    await reloadProfile()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          to="/mehr"
          className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-muted hover:text-text"
        >
          {t('dailyGoals.back')}
        </Link>
      </div>
      <h1 className="font-display font-bold text-2xl">{t('dailyGoals.title')}</h1>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <span className="text-sm font-medium">
          {t('dailyGoals.goalProfiles')}{!hasPremium && ' 🔒'}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {goalProfiles.map((gp) => (
            <div key={gp.id} className="relative">
              <button
                type="button"
                onClick={() => handleActivateProfile(gp.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  profile?.active_goal_profile_id === gp.id
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-2 border border-border text-text-muted hover:text-text'
                }`}
              >
                {gp.name}
                <span className="ml-1.5 font-mono text-xs opacity-70">{gp.daily_kcal_goal} kcal</span>
              </button>
              {profile?.active_goal_profile_id !== gp.id && (
                <button
                  type="button"
                  onClick={() => removeProfile(gp.id)}
                  aria-label={t('dailyGoals.deleteProfileAria', { name: gp.name })}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-surface border border-border text-text-muted text-xs leading-none hover:text-danger hover:border-danger transition-colors flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddProfileClick}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-surface-2 border border-dashed border-border text-text-muted hover:text-text hover:border-primary transition-colors"
          >
            {t('dailyGoals.saveCurrentValues')}
          </button>
        </div>

        {showNameInput && (
          <form onSubmit={handleSaveNewProfile} className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder={t('dailyGoals.newProfileNamePlaceholder')}
              className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="bg-primary text-on-primary font-semibold rounded-lg px-4 text-sm"
            >
              {t('dailyGoals.save')}
            </button>
          </form>
        )}

        <p className="text-xs text-text-muted">{t('dailyGoals.goalProfilesHint')}</p>
      </div>

      {suggestion && (
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
          <span className="text-sm font-medium">{t('dailyGoals.calculatedSuggestion')}</span>
          <p className="text-sm text-text-muted">
            {t('dailyGoals.basedOnProfile', { weight: formatWeightKg(Number(latestWeight!.weight_kg)) })}
          </p>
          <p className="font-mono text-sm">
            {t('dailyGoals.suggestionLine', {
              kcal: suggestion.kcal,
              protein: suggestion.proteinG,
              carbs: suggestion.carbsG,
              fat: suggestion.fatG,
            })}
          </p>
          <button
            type="button"
            onClick={applySuggestion}
            className="bg-surface-2 border border-border rounded-xl py-2 text-sm font-medium hover:border-primary transition-colors w-fit px-4"
          >
            {t('dailyGoals.apply')}
          </button>
        </div>
      )}

      {missing.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
          <span className="text-sm font-medium">{t('dailyGoals.missingFieldsHint')}</span>
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
            {t('dailyGoals.proteinG')}
            <input
              type="number"
              min={0}
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="rounded-lg border border-border bg-bg px-2 py-1.5 font-mono outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            {t('dailyGoals.carbsG')}
            <input
              type="number"
              min={0}
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              className="rounded-lg border border-border bg-bg px-2 py-1.5 font-mono outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            {t('dailyGoals.fatG')}
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
          {saved ? t('dailyGoals.saved') : t('dailyGoals.save')}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setShowFormula((v) => !v)}
        className="bg-surface-2 border border-border rounded-xl py-2.5 text-sm font-medium text-text-muted hover:text-text transition-colors"
      >
        {showFormula ? t('dailyGoals.hideFormula') : t('dailyGoals.showFormula')}
      </button>

      {showFormula && (
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-4 text-sm text-text-muted">
          <div>
            <p className="font-medium text-text">{t('dailyGoals.formulaStep1Title')}</p>
            <p className="mt-1">{t('dailyGoals.formulaStep1Text')}</p>
            <ul className="font-mono text-xs mt-2 flex flex-col gap-1">
              <li>{t('dailyGoals.formulaMale')}</li>
              <li>{t('dailyGoals.formulaFemale')}</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-text">{t('dailyGoals.formulaStep2Title')}</p>
            <p className="mt-1">{t('dailyGoals.formulaStep2Text')}</p>
            <ul className="text-xs mt-2 flex flex-col gap-1">
              <li>{t('dailyGoals.activitySitzend')}</li>
              <li>{t('dailyGoals.activityLeicht')}</li>
              <li>{t('dailyGoals.activityMaessig')}</li>
              <li>{t('dailyGoals.activitySehr')}</li>
              <li>{t('dailyGoals.activityExtrem')}</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-text">{t('dailyGoals.formulaStep3Title')}</p>
            <p className="mt-1">{t('dailyGoals.formulaStep3Text')}</p>
            <ul className="text-xs mt-2 flex flex-col gap-1">
              <li>{t('dailyGoals.goalAbnehmen')}</li>
              <li>{t('dailyGoals.goalHalten')}</li>
              <li>{t('dailyGoals.goalZunehmen')}</li>
              <li>{t('dailyGoals.goalMuskelaufbau')}</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-text">{t('dailyGoals.formulaStep4Title')}</p>
            <ul className="text-xs mt-2 flex flex-col gap-1">
              <li>{t('dailyGoals.macroProtein')}</li>
              <li>{t('dailyGoals.macroFat')}</li>
              <li>{t('dailyGoals.macroCarbs')}</li>
            </ul>
          </div>

          <p className="text-xs">{t('dailyGoals.formulaDisclaimer')}</p>
        </div>
      )}

      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}
    </div>
  )
}
