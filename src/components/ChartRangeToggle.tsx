import { useTranslation } from 'react-i18next'

export type ChartRange = 'week' | 'month'

export function ChartRangeToggle({ value, onChange }: { value: ChartRange; onChange: (range: ChartRange) => void }) {
  const { t } = useTranslation()

  return (
    <div className="inline-flex rounded-lg border border-border overflow-hidden text-xs font-medium shrink-0">
      <button
        type="button"
        onClick={() => onChange('week')}
        className={`px-2.5 py-1 transition-colors ${value === 'week' ? 'bg-primary text-on-primary' : 'bg-surface-2 text-text-muted hover:text-text'}`}
      >
        {t('verlauf.rangeWeek')}
      </button>
      <button
        type="button"
        onClick={() => onChange('month')}
        className={`px-2.5 py-1 transition-colors ${value === 'month' ? 'bg-primary text-on-primary' : 'bg-surface-2 text-text-muted hover:text-text'}`}
      >
        {t('verlauf.rangeMonth')}
      </button>
    </div>
  )
}
