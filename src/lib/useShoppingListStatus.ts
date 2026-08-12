import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import type { Database } from './database.types'

type StatusRow = Database['public']['Tables']['shopping_list_status']['Row']

export interface IngredientRef {
  entryId: string
  index: number
}

function statusKey(entryId: string, index: number): string {
  return `${entryId}:${index}`
}

function mergeRows(prev: StatusRow[], updated: StatusRow[]): StatusRow[] {
  const byKey = new Map(prev.map((r) => [statusKey(r.entry_id, r.ingredient_index), r]))
  for (const row of updated) {
    byKey.set(statusKey(row.entry_id, row.ingredient_index), row)
  }
  return Array.from(byKey.values())
}

export function useShoppingListStatus(entryIds: string[]) {
  const { user } = useAuth()
  const [rows, setRows] = useState<StatusRow[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user || entryIds.length === 0) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('shopping_list_status')
      .select('*')
      .eq('user_id', user.id)
      .in('entry_id', entryIds)
    setRows(data ?? [])
    setLoading(false)
  }, [user, entryIds])

  useEffect(() => {
    reload()
  }, [reload])

  const statusMap = useMemo(() => {
    const map = new Map<string, { checked: boolean; dismissed: boolean }>()
    for (const row of rows) {
      map.set(statusKey(row.entry_id, row.ingredient_index), {
        checked: row.checked,
        dismissed: row.dismissed,
      })
    }
    return map
  }, [rows])

  function isChecked(entryId: string, index: number) {
    return statusMap.get(statusKey(entryId, index))?.checked ?? false
  }

  function isDismissed(entryId: string, index: number) {
    return statusMap.get(statusKey(entryId, index))?.dismissed ?? false
  }

  async function setChecked(refs: IngredientRef[], checked: boolean) {
    if (!user || refs.length === 0) return
    const upsertRows = refs.map((ref) => ({
      user_id: user.id,
      entry_id: ref.entryId,
      ingredient_index: ref.index,
      checked,
      dismissed: statusMap.get(statusKey(ref.entryId, ref.index))?.dismissed ?? false,
    }))
    const { data } = await supabase
      .from('shopping_list_status')
      .upsert(upsertRows, { onConflict: 'user_id,entry_id,ingredient_index' })
      .select('*')
    if (data) setRows((prev) => mergeRows(prev, data))
  }

  async function setDismissed(refs: IngredientRef[]) {
    if (!user || refs.length === 0) return
    const upsertRows = refs.map((ref) => ({
      user_id: user.id,
      entry_id: ref.entryId,
      ingredient_index: ref.index,
      dismissed: true,
      checked: statusMap.get(statusKey(ref.entryId, ref.index))?.checked ?? false,
    }))
    const { data } = await supabase
      .from('shopping_list_status')
      .upsert(upsertRows, { onConflict: 'user_id,entry_id,ingredient_index' })
      .select('*')
    if (data) setRows((prev) => mergeRows(prev, data))
  }

  return { isChecked, isDismissed, setChecked, setDismissed, loading }
}
