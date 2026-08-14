import type { ActivityLevel, Gender, Goal } from './useProfile'

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sitzend: 1.2,
  leicht_aktiv: 1.375,
  maessig_aktiv: 1.55,
  sehr_aktiv: 1.725,
  extrem_aktiv: 1.9,
}

const GOAL_KCAL_ADJUSTMENT: Record<Goal, number> = {
  abnehmen: -500,
  halten: 0,
  zunehmen: 300,
  muskelaufbau: 250,
}

const PROTEIN_FACTOR_PER_KG: Record<Goal, number> = {
  abnehmen: 2.0,
  muskelaufbau: 2.0,
  halten: 1.6,
  zunehmen: 1.6,
}

export type CalorieInputs = {
  gender: Gender
  age: number
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
  goal: Goal
}

export type CalorieTargets = {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
}

// Mifflin-St-Jeor-Formel. Für "divers" gibt es keine etablierte dritte
// Variante, daher der Mittelwert der beiden Offsets als neutraler Kompromiss.
function calculateBmr({ gender, age, heightCm, weightKg }: Pick<CalorieInputs, 'gender' | 'age' | 'heightCm' | 'weightKg'>): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  if (gender === 'maennlich') return base + 5
  if (gender === 'weiblich') return base - 161
  return base + (5 + -161) / 2
}

export function calculateTargets(inputs: CalorieInputs): CalorieTargets {
  const bmr = calculateBmr(inputs)
  const tdee = bmr * ACTIVITY_MULTIPLIERS[inputs.activityLevel]
  const kcal = Math.round((tdee + GOAL_KCAL_ADJUSTMENT[inputs.goal]) / 10) * 10
  const proteinG = Math.round(inputs.weightKg * PROTEIN_FACTOR_PER_KG[inputs.goal])
  const fatG = Math.round((kcal * 0.3) / 9)
  const carbsG = Math.max(0, Math.round((kcal - proteinG * 4 - fatG * 9) / 4))
  return { kcal, proteinG, carbsG, fatG }
}
