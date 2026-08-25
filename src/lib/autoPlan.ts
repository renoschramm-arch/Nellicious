import type { Recipe } from './useRecipes'
import type { MealSlot } from './useMealPlan'
import type { Profile } from './useProfile'
import { toISODate } from './week'

// Anteil des Tages-Kalorienziels je Mahlzeit — grobe, aber plausible
// Richtwerte zur Auswahl passender Rezepte, keine feste Vorgabe.
const SLOT_KCAL_SHARE: Record<MealSlot, number> = {
  fruehstueck: 0.25,
  mittag: 0.35,
  abend: 0.3,
  snack: 0.1,
}

export interface AutoPlanOptions {
  days: Date[]
  slots: MealSlot[]
  overwrite: boolean
}

export interface AutoPlanSlot {
  date: string
  slot: MealSlot
}

export interface AutoPlanResult {
  assignments: { date: string; slot: MealSlot; recipe: Recipe }[]
  unfilled: AutoPlanSlot[]
}

// 1 bei exaktem Treffer, sinkt mit wachsendem Abstand zum Ziel-kcal-Wert.
function fitScore(recipeKcal: number, targetKcal: number): number {
  if (targetKcal <= 0) return 1
  return 1 / (1 + Math.abs(recipeKcal - targetKcal) / targetKcal)
}

// Wählt für jeden angeforderten Tag/Slot ein passendes Rezept — gefiltert nach
// Ernährungstyp und Unverträglichkeiten des Profils, bewertet nach Nähe zum
// Kalorien-Richtwert des Slots, mit Bonus für Favoriten und Abzug für bereits
// in diesem Lauf verwendete Rezepte (Abwechslung). Unter den besten Treffern
// wird zufällig gewählt, damit nicht jede Woche identisch aussieht.
export function generateAutoPlan(
  recipes: Recipe[],
  profile: Pick<Profile, 'nutrition_type' | 'intolerances' | 'daily_kcal_goal'>,
  favoriteIds: Set<string>,
  isOccupied: (dateISO: string, slot: MealSlot) => boolean,
  options: AutoPlanOptions,
): AutoPlanResult {
  const eligible = recipes.filter((r) => {
    if (profile.nutrition_type && !r.diet_tags.includes(profile.nutrition_type)) return false
    return profile.intolerances.every((i) => r.free_of.includes(i))
  })

  const usageCount = new Map<string, number>()
  const assignments: AutoPlanResult['assignments'] = []
  const unfilled: AutoPlanSlot[] = []

  for (const day of options.days) {
    const dateISO = toISODate(day)
    for (const slot of options.slots) {
      if (!options.overwrite && isOccupied(dateISO, slot)) continue

      const candidates = eligible.filter((r) => r.meal_type === slot)
      if (candidates.length === 0) {
        unfilled.push({ date: dateISO, slot })
        continue
      }

      const target = profile.daily_kcal_goal * SLOT_KCAL_SHARE[slot]
      const scored = candidates
        .map((r) => ({
          recipe: r,
          score: fitScore(r.kcal, target) + (favoriteIds.has(r.id) ? 0.15 : 0) - (usageCount.get(r.id) ?? 0) * 0.3,
        }))
        .sort((a, b) => b.score - a.score)

      const top = scored.slice(0, Math.min(4, scored.length))
      const picked = top[Math.floor(Math.random() * top.length)].recipe

      usageCount.set(picked.id, (usageCount.get(picked.id) ?? 0) + 1)
      assignments.push({ date: dateISO, slot, recipe: picked })
    }
  }

  return { assignments, unfilled }
}
