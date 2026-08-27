import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfile } from '../lib/useProfile'
import type { OnboardingState } from '../lib/useOnboarding'
import {
  ACTIVITY_LEVELS,
  getActivityLevelLabels,
  GENDERS,
  getGenderLabels,
  INTOLERANCES,
  getIntoleranceLabels,
  getIntoleranceDescriptions,
  NUTRITION_TYPES,
  getNutritionTypeLabels,
  getNutritionTypeDescriptions,
  type ActivityLevel,
  type Gender,
  type NutritionType,
} from '../lib/useProfile'
import { TagLegend } from '../components/TagLegend'

export function ProfileEditPage() {
  const { t } = useTranslation()
  const { profile, updateProfile } = useProfile()
  const location = useLocation()
  const navigate = useNavigate()
  const onboarding = (location.state as OnboardingState | null)?.onboarding ?? false
  const onboardingNext = (location.state as OnboardingState | null)?.onboardingNext
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [gender, setGender] = useState<Gender | null>(null)
  const [nutritionType, setNutritionType] = useState<NutritionType | null>(null)
  const [intolerances, setIntolerances] = useState<string[]>([])
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null)
  const [saved, setSaved] = useState(false)

  const genderLabels = getGenderLabels(t)
  const nutritionTypeLabels = getNutritionTypeLabels(t)
  const nutritionTypeDescriptions = getNutritionTypeDescriptions(t)
  const intoleranceLabels = getIntoleranceLabels(t)
  const intoleranceDescriptions = getIntoleranceDescriptions(t)
  const activityLevelLabels = getActivityLevelLabels(t)

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name ?? '')
    setAge(profile.age != null ? String(profile.age) : '')
    setHeightCm(profile.height_cm != null ? String(profile.height_cm) : '')
    setGender(profile.gender)
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
      age: age ? Number(age) : null,
      height_cm: heightCm ? Number(heightCm) : null,
      gender,
      nutrition_type: nutritionType,
      intolerances,
      activity_level: activityLevel,
    })
    if (onboarding && onboardingNext) {
      navigate(onboardingNext, { state: { onboarding: true, onboardingNext: '/mehr/tagesziele' } })
      return
    }
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
          {t('common.back')}
        </Link>
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="font-display font-bold text-2xl">{t('profileEdit.title')}</h1>
        {onboarding && <p className="text-xs font-medium text-primary">{t('onboarding.step1')}</p>}
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-5"
      >
        <label className="flex flex-col gap-1 text-sm">
          {t('profileEdit.name')}
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t('profileEdit.namePlaceholder')}
            className="rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            {t('profileEdit.age')}
            <input
              type="number"
              min={0}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder={t('profileEdit.ageUnit')}
              className="rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('profileEdit.height')}
            <input
              type="number"
              min={0}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder={t('profileEdit.heightUnit')}
              className="rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
            />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t('profileEdit.gender')}</span>
          <div className="flex flex-wrap gap-1.5">
            {GENDERS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setGender(gender === value ? null : value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  gender === value
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-2 border border-border text-text-muted hover:text-text'
                }`}
              >
                {genderLabels[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t('profileEdit.nutritionType')}</span>
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
                {nutritionTypeLabels[type]}
              </button>
            ))}
          </div>
          <TagLegend
            items={NUTRITION_TYPES.map((type) => ({
              label: nutritionTypeLabels[type],
              description: nutritionTypeDescriptions[type],
            }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t('profileEdit.intolerances')}</span>
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
                {intoleranceLabels[value]}
              </button>
            ))}
          </div>
          <TagLegend
            items={INTOLERANCES.map((value) => ({
              label: intoleranceLabels[value],
              description: intoleranceDescriptions[value],
            }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t('profileEdit.activityLevel')}</span>
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
                {activityLevelLabels[level]}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm"
        >
          {onboarding ? t('onboarding.continue') : saved ? t('profileEdit.saved') : t('profileEdit.save')}
        </button>
      </form>
    </div>
  )
}
