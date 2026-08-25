import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getDietTagLabels, getFreeOfLabels, getMealTypeLabels, useRecipe } from '../lib/useRecipes'
import { useMealLogs } from '../lib/useMealLogs'
import { useMealPlan } from '../lib/useMealPlan'
import { useFavorites } from '../lib/useFavorites'
import { useRecipeNote } from '../lib/useRecipeNote'
import { useAuth } from '../lib/AuthContext'
import { useWakeLock } from '../lib/useWakeLock'
import { usePremium } from '../lib/usePremium'
import { scaleIngredientLine, scaleMacro } from '../lib/recipeScaling'
import { toISODate } from '../lib/week'
import { RecipeForm } from '../components/RecipeForm'
import { PremiumModal } from '../components/PremiumModal'

export function RecipeDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { recipe, loading, updateRecipe, deleteRecipe, setShared } = useRecipe(id)
  const { addLog } = useMealLogs()
  const todayISO = toISODate(new Date())
  const { setEntry } = useMealPlan(todayISO, todayISO)
  const { favoriteIds, toggleFavorite } = useFavorites()
  const { note, saveNote } = useRecipeNote(id)
  const { user } = useAuth()
  const { active: wakeLockActive, supported: wakeLockSupported, toggle: toggleWakeLock } = useWakeLock()
  const { hasPremium } = usePremium()
  const navigate = useNavigate()
  const [logging, setLogging] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [targetServings, setTargetServings] = useState(1)
  const [servingsInput, setServingsInput] = useState('1')

  useEffect(() => {
    setNoteInput(note)
  }, [note])

  useEffect(() => {
    if (recipe) {
      setTargetServings(recipe.servings)
      setServingsInput(String(recipe.servings))
    }
  }, [recipe])

  if (loading) return <p className="text-text-muted text-sm">{t('recipeDetail.loading')}</p>
  if (!recipe) return <p className="text-text-muted text-sm">{t('recipeDetail.notFound')}</p>

  const isOwner = !!user && recipe.owner_id === user.id
  const baseServings = recipe.servings || 1
  const scaleFactor = targetServings / baseServings

  function applyServings(next: number) {
    if (!hasPremium) {
      setShowPremiumModal(true)
      return
    }
    setTargetServings(Math.max(1, Math.round(next)))
  }

  // Eingabe bleibt beim Tippen als reiner Text erhalten (auch leer, während
  // man die alte Zahl löscht) — targetServings wird nur bei einem gültigen
  // Wert aktualisiert, damit Zutaten/Nährwerte nicht zwischenzeitlich auf 1
  // zurückspringen.
  function handleServingsInputChange(value: string) {
    setServingsInput(value)
    const parsed = Number(value)
    if (value.trim() !== '' && Number.isFinite(parsed) && parsed > 0) {
      applyServings(parsed)
    }
  }

  function handleServingsInputBlur() {
    const parsed = Number(servingsInput)
    if (servingsInput.trim() === '' || !Number.isFinite(parsed) || parsed <= 0) {
      setServingsInput(String(targetServings))
    }
  }

  function handleAddToPlan() {
    if (!recipe) return
    if (!hasPremium) {
      setShowPremiumModal(true)
      return
    }
    navigate('/plan', {
      state: { multiAssignRecipeId: recipe.id, suggestedCount: Math.max(1, Math.round(scaleFactor)) },
    })
  }

  async function handleLog() {
    if (!recipe) return
    setLogging(true)
    await addLog({
      name: recipe.title,
      kcal: recipe.kcal,
      protein_g: recipe.protein_g,
      carbs_g: recipe.carbs_g,
      fat_g: recipe.fat_g,
      recipe_id: recipe.id,
    })
    // Loggen heißt: heute gegessen — also auch in den Wochenplan für heute
    // übernehmen, damit die Einkaufsliste die Zutaten mitzählt.
    await setEntry(todayISO, recipe.meal_type, recipe.id)
    setLogging(false)
    navigate('/rezepte')
  }

  function handleKochmodusToggle() {
    if (!hasPremium) {
      setShowPremiumModal(true)
      return
    }
    toggleWakeLock()
  }

  async function handleShare() {
    if (!recipe) return
    setSharing(true)
    // Das Freigeben in der Datenbank läuft bewusst im Hintergrund (kein
    // await davor): iOS Safari verwirft sonst die Nutzer-Interaktion des
    // Klicks, bevor navigator.share() aufgerufen wird, und der
    // Teilen-Dialog öffnet sich gar nicht erst — ohne jede Fehlermeldung.
    if (!recipe.is_shared) void setShared(true)

    const url = `${window.location.origin}${import.meta.env.BASE_URL}rezept-teilen/${recipe.id}`
    const shareText = t('recipeDetail.shareText', { title: recipe.title, kcal: recipe.kcal })
    // navigator.share existiert zwar auch in Desktop-Chrome (v. a. unter
    // Windows), der native Teilen-Dialog ist dort aber unzuverlässig und
    // kann hängen bleiben, ohne sich je aufzulösen. Deshalb nur auf
    // Touch-Geräten (primär per Finger bedient) verwenden — auf dem
    // Desktop landet der Link stattdessen direkt in der Zwischenablage.
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    if (isTouchDevice && navigator.share) {
      try {
        await navigator.share({ title: recipe.title, text: shareText, url })
      } catch {
        // Nutzer:in hat den Teilen-Dialog abgebrochen — kein Fehlerfall.
      }
    } else {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
    setSharing(false)
  }

  async function handleDelete() {
    if (!recipe) return
    if (!window.confirm(t('recipeDetail.confirmDelete', { title: recipe.title }))) return
    setDeleting(true)
    await deleteRecipe()
    navigate('/rezepte')
  }

  if (editing) {
    return (
      <RecipeForm
        initial={recipe}
        onCancel={() => setEditing(false)}
        onSave={async (patch) => {
          await updateRecipe(patch)
          setEditing(false)
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Link
          to="/rezepte"
          className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-muted hover:text-text"
        >
          {t('recipeDetail.backToRecipes')}
        </Link>
        {isOwner && (
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-muted hover:text-text"
          >
            {t('recipeDetail.edit')}
          </button>
        )}
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="shrink-0 bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-danger hover:bg-danger/10 disabled:opacity-60"
          >
            {deleting ? t('recipeDetail.deleting') : t('recipeDetail.delete')}
          </button>
        )}
        <button
          onClick={() => toggleFavorite(recipe.id)}
          aria-label={favoriteIds.has(recipe.id) ? t('recipeDetail.removeFavorite') : t('recipeDetail.addFavorite')}
          className={`shrink-0 bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm ${
            favoriteIds.has(recipe.id) ? 'text-danger' : 'text-text-muted hover:text-danger'
          }`}
        >
          {favoriteIds.has(recipe.id) ? '♥' : '♡'}
        </button>
        <button
          onClick={handleShare}
          disabled={sharing}
          className="shrink-0 bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-muted hover:text-text disabled:opacity-60"
        >
          {linkCopied ? t('recipeDetail.linkCopied') : sharing ? '…' : t('recipeDetail.share')}
        </button>
      </div>

      <div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="inline-block text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-1">
            {getMealTypeLabels(t)[recipe.meal_type]}
          </span>
          {recipe.diet_tags
            .filter((tag) => tag !== 'omnivore')
            .map((tag) => (
              <span key={tag} className="inline-block text-xs font-medium text-basil bg-basil/10 rounded-full px-2.5 py-1">
                {getDietTagLabels(t)[tag as keyof ReturnType<typeof getDietTagLabels>]}
              </span>
            ))}
          {recipe.free_of.map((value) => (
            <span key={value} className="inline-block text-xs font-medium text-honey bg-honey/10 rounded-full px-2.5 py-1">
              {getFreeOfLabels(t)[value as keyof ReturnType<typeof getFreeOfLabels>]}
            </span>
          ))}
        </div>
        <h1 className="font-display font-bold text-2xl">{recipe.title}</h1>
        <p className="text-text-muted mt-1">{recipe.description}</p>
        <p className="text-xs text-text-muted mt-1">{t('recipeDetail.servings', { count: recipe.servings })}</p>
      </div>

      <div className="grid grid-cols-4 gap-2 font-mono text-sm">
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="text-text-muted text-xs uppercase mb-1">kcal</div>
          {scaleMacro(recipe.kcal, scaleFactor)}
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="text-text-muted text-xs uppercase mb-1">{t('macros.protein')}</div>
          {scaleMacro(recipe.protein_g, scaleFactor)}g
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="text-text-muted text-xs uppercase mb-1">{t('macros.carbs')}</div>
          {scaleMacro(recipe.carbs_g, scaleFactor)}g
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="text-text-muted text-xs uppercase mb-1">{t('macros.fat')}</div>
          {scaleMacro(recipe.fat_g, scaleFactor)}g
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <h2 className="font-display font-semibold text-lg">
          {t('recipeDetail.scaleServings')}{!hasPremium && ' 🔒'}
        </h2>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={servingsInput}
            disabled={!hasPremium}
            onChange={(e) => handleServingsInputChange(e.target.value)}
            onBlur={handleServingsInputBlur}
            className="w-20 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm font-mono outline-none focus:border-primary disabled:opacity-60"
          />
          <span className="text-sm text-text-muted">
            {t('recipeDetail.servingsForIngredients', { count: targetServings })}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAddToPlan}
          className="bg-surface-2 border border-border rounded-xl py-2.5 text-sm font-medium hover:border-primary transition-colors"
        >
          {t('recipeDetail.addToPlan')}
        </button>
      </div>

      {wakeLockSupported && (
        <button
          type="button"
          role="switch"
          aria-checked={wakeLockActive}
          onClick={handleKochmodusToggle}
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
            wakeLockActive ? 'bg-basil/10 border-basil/30' : 'bg-surface border-border'
          }`}
        >
          <span className="flex flex-col">
            <span className="text-sm font-medium">
              {t('recipeDetail.kochmodus')}{!hasPremium && ' 🔒'}
            </span>
            <span className="text-xs text-text-muted">
              {wakeLockActive
                ? t('recipeDetail.screenOn')
                : hasPremium
                  ? t('recipeDetail.screenOnHint')
                  : t('recipeDetail.premiumFeature')}
            </span>
          </span>
          <span
            aria-hidden
            className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
              wakeLockActive ? 'bg-basil' : 'bg-border'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                wakeLockActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </span>
        </button>
      )}

      {recipe.ingredients.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-lg mb-2">{t('recipeDetail.ingredients')}</h2>
          <ul className="flex flex-col gap-1.5">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-honey shrink-0" />
                {scaleIngredientLine(ing, scaleFactor)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recipe.instructions && (
        <div>
          <h2 className="font-display font-semibold text-lg mb-2">{t('recipeDetail.instructions')}</h2>
          <p className="text-sm whitespace-pre-line">{recipe.instructions}</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <h2 className="font-display font-semibold text-lg">{t('recipeDetail.myNote')}</h2>
        <textarea
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          onBlur={async () => {
            if (noteInput === note) return
            await saveNote(noteInput)
            setNoteSaved(true)
            setTimeout(() => setNoteSaved(false), 2000)
          }}
          rows={3}
          placeholder={t('recipeDetail.notePlaceholder')}
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary resize-none"
        />
        {noteSaved && <span className="text-xs text-basil">{t('recipeDetail.noteSaved')}</span>}
      </div>

      <button
        onClick={handleLog}
        disabled={logging}
        className="bg-primary text-on-primary font-semibold rounded-xl py-3 disabled:opacity-60"
      >
        {logging ? t('recipeDetail.logging') : t('recipeDetail.logAsMeal')}
      </button>

      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}
    </div>
  )
}
