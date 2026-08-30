import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getDietTagLabels, getFreeOfLabels, getMealTypeLabels, localizeRecipeText, useRecipe } from '../lib/useRecipes'
import { useAuth } from '../lib/AuthContext'

export function SharedRecipePage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { recipe, loading } = useRecipe(id)
  const { session } = useAuth()
  const localized = recipe ? localizeRecipeText(recipe, i18n.language) : null

  // Angemeldete Nutzer:innen sehen lieber die volle Rezeptseite mit allen
  // Aktionen (loggen, Notiz, Kochmodus …) statt der öffentlichen Vorschau.
  if (session && id) return <Navigate to={`/rezepte/${id}`} replace />

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Link to="/willkommen" className="font-display font-bold text-lg sm:text-xl shrink-0">
            Nelli<span className="text-primary">cious</span>
          </Link>
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/anmelden" className="text-xs sm:text-sm text-text-muted hover:text-text whitespace-nowrap">
              {t('sharedRecipe.signIn')}
            </Link>
            <Link
              to="/anmelden?mode=signup"
              className="bg-primary text-on-primary font-semibold text-xs sm:text-sm rounded-full px-4 sm:px-5 py-2.5 hover:bg-primary-hover transition-colors whitespace-nowrap"
            >
              {t('sharedRecipe.startFree')}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">
        {loading && <p className="text-text-muted text-sm">{t('sharedRecipe.loading')}</p>}

        {!loading && !recipe && (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <p className="text-text-muted">{t('sharedRecipe.notFound')}</p>
            <Link
              to="/willkommen"
              className="text-primary font-semibold hover:underline"
            >
              {t('sharedRecipe.toApp')}
            </Link>
          </div>
        )}

        {!loading && recipe && (
          <>
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className="inline-block text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-1">
                  {getMealTypeLabels(t)[recipe.meal_type]}
                </span>
                {recipe.diet_tags
                  .filter((tag) => tag !== 'omnivore')
                  .map((tag) => (
                    <span
                      key={tag}
                      className="inline-block text-xs font-medium text-basil bg-basil/10 rounded-full px-2.5 py-1"
                    >
                      {getDietTagLabels(t)[tag as keyof ReturnType<typeof getDietTagLabels>]}
                    </span>
                  ))}
                {recipe.free_of.map((value) => (
                  <span
                    key={value}
                    className="inline-block text-xs font-medium text-honey bg-honey/10 rounded-full px-2.5 py-1"
                  >
                    {getFreeOfLabels(t)[value as keyof ReturnType<typeof getFreeOfLabels>]}
                  </span>
                ))}
              </div>
              <h1 className="font-display font-bold text-2xl">{localized!.title}</h1>
              <p className="text-text-muted mt-1">{localized!.description}</p>
            </div>

            <div className="grid grid-cols-4 gap-2 font-mono text-sm">
              <div className="bg-surface border border-border rounded-xl p-3 text-center">
                <div className="text-text-muted text-xs uppercase mb-1 break-words">kcal</div>
                {recipe.kcal}
              </div>
              <div className="bg-surface border border-border rounded-xl p-3 text-center">
                <div className="text-text-muted text-xs uppercase mb-1 break-words">{t('macros.protein')}</div>
                {recipe.protein_g}g
              </div>
              <div className="bg-surface border border-border rounded-xl p-3 text-center">
                <div className="text-text-muted text-xs uppercase mb-1 break-words">{t('macros.carbs')}</div>
                {recipe.carbs_g}g
              </div>
              <div className="bg-surface border border-border rounded-xl p-3 text-center">
                <div className="text-text-muted text-xs uppercase mb-1 break-words">{t('macros.fat')}</div>
                {recipe.fat_g}g
              </div>
            </div>

            {localized!.ingredients.length > 0 && (
              <div>
                <h2 className="font-display font-semibold text-lg mb-2">{t('sharedRecipe.ingredients')}</h2>
                <ul className="flex flex-col gap-1.5">
                  {localized!.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-honey shrink-0" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {localized!.instructions && (
              <div>
                <h2 className="font-display font-semibold text-lg mb-2">{t('sharedRecipe.instructions')}</h2>
                <p className="text-sm whitespace-pre-line">{localized!.instructions}</p>
              </div>
            )}

            <div className="bg-text text-bg rounded-[28px] px-6 py-10 text-center flex flex-col items-center gap-4 mt-4">
              <h2 className="font-display font-semibold text-xl">{t('sharedRecipe.ctaTitle', { count: 262 })}</h2>
              <p className="text-bg/70 text-sm max-w-xs">{t('sharedRecipe.ctaSubtitle')}</p>
              <Link
                to="/anmelden?mode=signup"
                className="bg-primary text-on-primary font-semibold rounded-full px-7 py-3 hover:bg-primary-hover transition-colors"
              >
                {t('sharedRecipe.startFree')}
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
