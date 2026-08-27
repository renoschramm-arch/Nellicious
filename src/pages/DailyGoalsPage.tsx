import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { OnboardingState } from '../lib/useOnboarding'
import {
  useProfile,
  ACTIVITY_LEVELS,
  getActivityLevelLabels,
  GENDERS,
  getGenderLabels,
  GOALS,
  getGoalLabels,
  type ActivityLevel,
  type Gender,
  type Goal,
} from '../lib/useProfile'
import { useWeightLogs, formatWeightKg, parseWeightKg } from '../lib/useWeightLogs'
import { calculateTargets } from '../lib/calorieCalculator'
import { useGoalProfiles } from '../lib/useGoalProfiles'
import { usePremium } from '../lib/usePremium'
import { toISODate } from '../lib/week'
import { PremiumModal } from '../components/PremiumModal'

export function DailyGoalsPage() {
  const { t } = useTranslation()
  const MISSING_FIELD_LABELS: Record<string, { label: string }> = {
    gender: { label: t('dailyGoals.fieldGender') },
    age: { label: t('dailyGoals.fieldAge') },
    heightCm: { label: t('dailyGoals.fieldHeight') },
    activityLevel: { label: t('dailyGoals.fieldActivityLevel') },
    goal: { label: t('dailyGoals.fieldGoal') },
    weightKg: { label: t('dailyGoals.fieldWeight') },
  }
  const { profile, updateProfile, reload: reloadProfile } = useProfile()
  const location = useLocation()
  const navigate = useNavigate()
  const onboarding = (location.state as OnboardingState | null)?.onboarding ?? false
  const { logs: weightLogs, upsertWeight } = useWeightLogs()
  const genderLabels = getGenderLabels(t)
  const activityLevelLabels = getActivityLevelLabels(t)
  const goalLabels = getGoalLabels(t)
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
  const [missingGender, setMissingGender] = useState<Gender | null>(null)
  const [missingAge, setMissingAge] = useState('')
  const [missingHeight, setMissingHeight] = useState('')
  const [missingActivityLevel, setMissingActivityLevel] = useState<ActivityLevel | null>(null)
  const [missingGoal, setMissingGoal] = useState<Goal | null>(null)
  const [missingWeight, setMissingWeight] = useState('')
  const [savingMissing, setSavingMissing] = useState(false)

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

  // Sanfte Plausibilitätsprüfung statt harter Validierung — analog zum
  // Wunschgewicht-Hinweis auf der Ziel-Seite: kcal aus Protein/Kohlenh./Fett
  // errechnet (4/4/9 kcal pro g) und mit dem eingetragenen kcal-Wert
  // verglichen. Nur ein Hinweis, kein Blocker, da Nutzer:innen bewusst von
  // der Formel abweichende Werte eintragen können.
  const kcalNum = Number(kcal) || 0
  const macroDerivedKcal = (Number(protein) || 0) * 4 + (Number(carbs) || 0) * 4 + (Number(fat) || 0) * 9
  const macroMismatch =
    kcalNum > 0 && macroDerivedKcal > 0 && Math.abs(macroDerivedKcal - kcalNum) / kcalNum > 0.15

  function applySuggestion() {
    if (!suggestion) return
    setKcal(String(suggestion.kcal))
    setProtein(String(suggestion.proteinG))
    setCarbs(String(suggestion.carbsG))
    setFat(String(suggestion.fatG))
  }

  // Speichert nur die tatsächlich fehlenden Angaben direkt hier auf der
  // Seite, statt zum Ausfüllen auf Profil/Ziele/Verlauf wechseln zu müssen —
  // updateProfile()/upsertWeight() aktualisieren `profile`/`weightLogs`
  // reaktiv, wodurch `missing` automatisch schrumpft und die Berechnung
  // sofort erscheint, sobald alles beisammen ist.
  async function handleSaveMissingFields(e: FormEvent) {
    e.preventDefault()
    setSavingMissing(true)
    await updateProfile({
      ...(missing.includes('gender') && missingGender ? { gender: missingGender } : {}),
      ...(missing.includes('age') && missingAge ? { age: Number(missingAge) } : {}),
      ...(missing.includes('heightCm') && missingHeight ? { height_cm: Number(missingHeight) } : {}),
      ...(missing.includes('activityLevel') && missingActivityLevel
        ? { activity_level: missingActivityLevel }
        : {}),
      ...(missing.includes('goal') && missingGoal ? { goal: missingGoal } : {}),
    })
    if (missing.includes('weightKg')) {
      const parsedWeight = parseWeightKg(missingWeight)
      if (parsedWeight != null) await upsertWeight(toISODate(new Date()), parsedWeight)
    }
    setSavingMissing(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await updateProfile({
      daily_kcal_goal: Number(kcal),
      daily_protein_goal: Number(protein),
      daily_carbs_goal: Number(carbs),
      daily_fat_goal: Number(fat),
    })
    if (onboarding) {
      navigate('/')
      return
    }
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
      <div className="flex flex-col gap-1">
        <h1 className="font-display font-bold text-2xl">{t('dailyGoals.title')}</h1>
        {onboarding && <p className="text-xs font-medium text-primary">{t('onboarding.step3')}</p>}
      </div>

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
                  onClick={() => {
                    if (window.confirm(t('dailyGoals.confirmDeleteProfile', { name: gp.name }))) removeProfile(gp.id)
                  }}
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
        <form
          onSubmit={handleSaveMissingFields}
          className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3"
        >
          <span className="text-sm font-medium">{t('dailyGoals.missingFieldsHint')}</span>
          <p className="text-xs text-text-muted -mt-1.5">
            {missing.map((key) => MISSING_FIELD_LABELS[key].label).join(' · ')}
          </p>

          {missing.includes('gender') && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-muted">{t('dailyGoals.fieldGender')}</span>
              <div className="flex flex-wrap gap-1.5">
                {GENDERS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMissingGender(missingGender === value ? null : value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      missingGender === value
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-2 border border-border text-text-muted hover:text-text'
                    }`}
                  >
                    {genderLabels[value]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(missing.includes('age') || missing.includes('heightCm')) && (
            <div className="grid grid-cols-2 gap-3">
              {missing.includes('age') && (
                <label className="flex flex-col gap-1 text-xs text-text-muted">
                  {t('dailyGoals.fieldAge')}
                  <input
                    type="number"
                    min={0}
                    value={missingAge}
                    onChange={(e) => setMissingAge(e.target.value)}
                    className="rounded-lg border border-border bg-bg px-3 py-2 text-sm font-mono outline-none focus:border-primary"
                  />
                </label>
              )}
              {missing.includes('heightCm') && (
                <label className="flex flex-col gap-1 text-xs text-text-muted">
                  {t('dailyGoals.fieldHeight')}
                  <input
                    type="number"
                    min={0}
                    value={missingHeight}
                    onChange={(e) => setMissingHeight(e.target.value)}
                    className="rounded-lg border border-border bg-bg px-3 py-2 text-sm font-mono outline-none focus:border-primary"
                  />
                </label>
              )}
            </div>
          )}

          {missing.includes('activityLevel') && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-muted">{t('dailyGoals.fieldActivityLevel')}</span>
              <div className="flex flex-col gap-1.5">
                {ACTIVITY_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setMissingActivityLevel(missingActivityLevel === level ? null : level)}
                    className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      missingActivityLevel === level
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-2 border border-border text-text-muted hover:text-text'
                    }`}
                  >
                    {activityLevelLabels[level]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {missing.includes('goal') && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-muted">{t('dailyGoals.fieldGoal')}</span>
              <div className="flex flex-wrap gap-1.5">
                {GOALS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMissingGoal(missingGoal === value ? null : value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      missingGoal === value
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-2 border border-border text-text-muted hover:text-text'
                    }`}
                  >
                    {goalLabels[value]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {missing.includes('weightKg') && (
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              {t('dailyGoals.fieldWeight')}
              <input
                type="text"
                inputMode="decimal"
                value={missingWeight}
                onChange={(e) => setMissingWeight(e.target.value)}
                placeholder={t('goals.targetWeightPlaceholder')}
                className="rounded-lg border border-border bg-bg px-3 py-2 text-sm font-mono outline-none focus:border-primary"
              />
            </label>
          )}

          <button
            type="submit"
            disabled={savingMissing}
            className="bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm disabled:opacity-60"
          >
            {savingMissing ? t('dailyGoals.saving') : t('dailyGoals.saveMissingFields')}
          </button>
          <Link to="/mehr/profil" className="text-xs text-text-muted underline hover:text-text text-center">
            {t('dailyGoals.fullProfileLink')}
          </Link>
        </form>
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
        {macroMismatch && (
          <p className="text-xs text-honey -mt-1">
            {t('dailyGoals.macroMismatch', { macroKcal: Math.round(macroDerivedKcal) })}
          </p>
        )}
        <button
          type="submit"
          className="bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm mt-1"
        >
          {onboarding ? t('onboarding.finish') : saved ? t('dailyGoals.saved') : t('dailyGoals.save')}
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
