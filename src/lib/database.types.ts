export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          daily_kcal_goal: number
          daily_protein_goal: number
          daily_carbs_goal: number
          daily_fat_goal: number
          nutrition_type: 'omnivore' | 'vegetarisch' | 'vegan' | 'pescetarisch' | 'keto' | 'low_carb' | null
          intolerances: string[]
          activity_level: 'sitzend' | 'leicht_aktiv' | 'maessig_aktiv' | 'sehr_aktiv' | 'extrem_aktiv' | null
          goal: 'abnehmen' | 'halten' | 'zunehmen' | 'muskelaufbau' | null
          goal_note: string
          age: number | null
          height_cm: number | null
          gender: 'maennlich' | 'weiblich' | null
          daily_water_goal_ml: number
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          daily_kcal_goal?: number
          daily_protein_goal?: number
          daily_carbs_goal?: number
          daily_fat_goal?: number
          nutrition_type?: 'omnivore' | 'vegetarisch' | 'vegan' | 'pescetarisch' | 'keto' | 'low_carb' | null
          intolerances?: string[]
          activity_level?: 'sitzend' | 'leicht_aktiv' | 'maessig_aktiv' | 'sehr_aktiv' | 'extrem_aktiv' | null
          goal?: 'abnehmen' | 'halten' | 'zunehmen' | 'muskelaufbau' | null
          goal_note?: string
          age?: number | null
          height_cm?: number | null
          gender?: 'maennlich' | 'weiblich' | null
          daily_water_goal_ml?: number
        }
        Update: Partial<{
          display_name: string | null
          daily_kcal_goal: number
          daily_protein_goal: number
          daily_carbs_goal: number
          daily_fat_goal: number
          nutrition_type: 'omnivore' | 'vegetarisch' | 'vegan' | 'pescetarisch' | 'keto' | 'low_carb' | null
          intolerances: string[]
          activity_level: 'sitzend' | 'leicht_aktiv' | 'maessig_aktiv' | 'sehr_aktiv' | 'extrem_aktiv' | null
          goal: 'abnehmen' | 'halten' | 'zunehmen' | 'muskelaufbau' | null
          goal_note: string
          age: number | null
          height_cm: number | null
          gender: 'maennlich' | 'weiblich' | null
          daily_water_goal_ml: number
        }>
        Relationships: []
      }
      recipes: {
        Row: {
          id: string
          owner_id: string | null
          title: string
          description: string
          kcal: number
          protein_g: number
          carbs_g: number
          fat_g: number
          ingredients: string[]
          instructions: string
          meal_type: 'fruehstueck' | 'mittag' | 'abend' | 'snack'
          diet_tags: string[]
          free_of: string[]
          created_at: string
        }
        Insert: {
          id?: string
          owner_id?: string | null
          title: string
          description?: string
          kcal: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          ingredients?: string[]
          instructions?: string
          meal_type?: 'fruehstueck' | 'mittag' | 'abend' | 'snack'
          diet_tags?: string[]
          free_of?: string[]
        }
        Update: Partial<{
          title: string
          description: string
          kcal: number
          protein_g: number
          carbs_g: number
          fat_g: number
          ingredients: string[]
          instructions: string
          meal_type: 'fruehstueck' | 'mittag' | 'abend' | 'snack'
          diet_tags: string[]
          free_of: string[]
        }>
        Relationships: []
      }
      meal_logs: {
        Row: {
          id: string
          user_id: string
          recipe_id: string | null
          name: string
          kcal: number
          protein_g: number
          carbs_g: number
          fat_g: number
          logged_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id?: string | null
          name: string
          kcal: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          logged_at?: string
        }
        Update: Partial<{
          name: string
          kcal: number
          protein_g: number
          carbs_g: number
          fat_g: number
        }>
        Relationships: []
      }
      meal_plan_entries: {
        Row: {
          id: string
          user_id: string
          plan_date: string
          meal_slot: 'fruehstueck' | 'mittag' | 'abend' | 'snack'
          recipe_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_date: string
          meal_slot: 'fruehstueck' | 'mittag' | 'abend' | 'snack'
          recipe_id: string
        }
        Update: Partial<{
          plan_date: string
          meal_slot: 'fruehstueck' | 'mittag' | 'abend' | 'snack'
          recipe_id: string
        }>
        Relationships: []
      }
      shopping_list_status: {
        Row: {
          id: string
          user_id: string
          entry_id: string
          ingredient_index: number
          checked: boolean
          dismissed: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entry_id: string
          ingredient_index: number
          checked?: boolean
          dismissed?: boolean
        }
        Update: Partial<{
          checked: boolean
          dismissed: boolean
        }>
        Relationships: []
      }
      weight_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          weight_kg: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          weight_kg: number
        }
        Update: Partial<{
          log_date: string
          weight_kg: number
        }>
        Relationships: []
      }
      water_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          amount_ml: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          amount_ml?: number
        }
        Update: Partial<{
          log_date: string
          amount_ml: number
        }>
        Relationships: []
      }
      recipe_favorites: {
        Row: {
          user_id: string
          recipe_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          recipe_id: string
        }
        Update: Partial<Record<string, never>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
