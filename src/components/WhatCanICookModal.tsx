import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFoodSearch } from '../lib/useFoodSearch'
import { matchRecipesByIngredients, type RecipeIngredientMatch } from '../lib/matchRecipesByIngredients'
import { localizeRecipeText, type Recipe } from '../lib/useRecipes'

export function WhatCanICookModal({ recipes, onClose }: { recipes: Recipe[]; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const [haveIngredients, setHaveIngredients] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const { results, loading, error } = useFoodSearch(query)
  const [matches, setMatches] = useState<RecipeIngredientMatch[] | null>(null)

  function addIngredient(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    setHaveIngredients((prev) =>
      prev.some((i) => i.toLowerCase() === trimmed.toLowerCase()) ? prev : [...prev, trimmed],
    )
    setQuery('')
  }

  function removeIngredient(name: string) {
    setHaveIngredients((prev) => prev.filter((i) => i !== name))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-bg w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-lg">{t('whatCanICook.title')}</h2>
            <p className="text-xs text-text-muted">{t('whatCanICook.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-text-muted hover:text-text text-sm"
            aria-label={t('whatCanICook.close')}
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex flex-col gap-4">
          {!matches ? (
            <>
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addIngredient(query)
                    }
                  }}
                  placeholder={t('whatCanICook.searchPlaceholder')}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                />
                {query.trim().length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-surface border border-border rounded-xl max-h-48 overflow-y-auto shadow-lg">
                    {loading && <p className="text-xs text-text-muted px-3 py-2">{t('whatCanICook.searching')}</p>}
                    {!loading && error && (
                      <p className="text-xs text-danger px-3 py-2">{t('whatCanICook.searchFailed')}</p>
                    )}
                    {!loading && !error && results.length === 0 && (
                      <button
                        type="button"
                        onClick={() => addIngredient(query)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-surface-2"
                      >
                        {t('whatCanICook.addFreeText', { text: query.trim() })}
                      </button>
                    )}
                    {results.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => addIngredient(r.name)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-surface-2 border-b border-border last:border-none"
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {haveIngredients.length === 0 ? (
                  <p className="text-xs text-text-muted">{t('whatCanICook.noneYet')}</p>
                ) : (
                  haveIngredients.map((ing) => (
                    <span
                      key={ing}
                      className="inline-flex items-center gap-1.5 text-xs font-medium bg-surface-2 border border-border rounded-full pl-3 pr-1.5 py-1"
                    >
                      {ing}
                      <button
                        type="button"
                        onClick={() => removeIngredient(ing)}
                        aria-label={t('whatCanICook.removeAria', { name: ing })}
                        className="w-4 h-4 inline-flex items-center justify-center rounded-full text-text-muted hover:text-danger"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => setMatches(matchRecipesByIngredients(recipes, haveIngredients, i18n.language))}
                disabled={haveIngredients.length === 0}
                className="bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm disabled:opacity-60"
              >
                {t('whatCanICook.showSuggestions')}
              </button>
            </>
          ) : (
            <>
              {matches.length === 0 ? (
                <p className="text-sm text-text-muted">{t('whatCanICook.noMatches')}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {matches.map(({ recipe, matchedCount, totalCount, coverage }) => (
                    <li key={recipe.id}>
                      <Link
                        to={`/rezepte/${recipe.id}`}
                        onClick={onClose}
                        className="flex items-center justify-between gap-3 bg-surface-2 border border-border rounded-xl px-3.5 py-2.5 hover:border-primary transition-colors"
                      >
                        <span className="text-sm font-medium truncate">
                          {localizeRecipeText(recipe, i18n.language).title}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-basil bg-basil/10 rounded-full px-2 py-0.5">
                          {t('whatCanICook.coverageBadge', {
                            matched: matchedCount,
                            total: totalCount,
                            pct: Math.round(coverage * 100),
                          })}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => setMatches(null)}
                className="border border-border bg-surface-2 rounded-xl py-2.5 text-sm text-text-muted hover:text-text"
              >
                {t('whatCanICook.adjustIngredients')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
