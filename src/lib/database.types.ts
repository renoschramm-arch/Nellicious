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
          water_quick_amounts_ml: number[]
          target_weight_kg: number | null
          fasting_default_hours: number
          fasting_protocol_hours: number[]
          fasting_enabled: boolean
          is_premium: boolean
          subscription_source: 'stripe' | 'app_store' | 'play_store' | null
          stripe_customer_id: string | null
          premium_until: string | null
          active_goal_profile_id: string | null
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
          water_quick_amounts_ml?: number[]
          target_weight_kg?: number | null
          fasting_default_hours?: number
          fasting_protocol_hours?: number[]
          fasting_enabled?: boolean
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
          water_quick_amounts_ml: number[]
          target_weight_kg: number | null
          fasting_default_hours: number
          fasting_protocol_hours: number[]
          fasting_enabled: boolean
          active_goal_profile_id: string | null
        }>
        Relationships: []
      }
      goal_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          daily_kcal_goal: number
          daily_protein_goal: number
          daily_carbs_goal: number
          daily_fat_goal: number
          goal: 'abnehmen' | 'halten' | 'zunehmen' | 'muskelaufbau' | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          daily_kcal_goal: number
          daily_protein_goal: number
          daily_carbs_goal: number
          daily_fat_goal: number
          goal?: 'abnehmen' | 'halten' | 'zunehmen' | 'muskelaufbau' | null
        }
        Update: Partial<{
          name: string
          daily_kcal_goal: number
          daily_protein_goal: number
          daily_carbs_goal: number
          daily_fat_goal: number
          goal: 'abnehmen' | 'halten' | 'zunehmen' | 'muskelaufbau' | null
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
          title_en: string | null
          description_en: string | null
          ingredients_en: string[] | null
          instructions_en: string | null
          meal_type: 'fruehstueck' | 'mittag' | 'abend' | 'snack'
          diet_tags: string[]
          free_of: string[]
          is_shared: boolean
          servings: number
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
          title_en?: string | null
          description_en?: string | null
          ingredients_en?: string[] | null
          instructions_en?: string | null
          meal_type?: 'fruehstueck' | 'mittag' | 'abend' | 'snack'
          diet_tags?: string[]
          free_of?: string[]
          is_shared?: boolean
          servings?: number
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
          title_en: string | null
          description_en: string | null
          ingredients_en: string[] | null
          instructions_en: string | null
          meal_type: 'fruehstueck' | 'mittag' | 'abend' | 'snack'
          diet_tags: string[]
          free_of: string[]
          is_shared: boolean
          servings: number
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
      recipe_notes: {
        Row: {
          user_id: string
          recipe_id: string
          note: string
          updated_at: string
        }
        Insert: {
          user_id: string
          recipe_id: string
          note?: string
        }
        Update: Partial<{
          note: string
        }>
        Relationships: []
      }
      fasting_sessions: {
        Row: {
          id: string
          user_id: string
          started_at: string
          ended_at: string | null
          target_hours: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          started_at?: string
          ended_at?: string | null
          target_hours: number
        }
        Update: Partial<{
          started_at: string
          ended_at: string | null
          target_hours: number
        }>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      set_recipe_shared: {
        Args: { p_recipe_id: string; p_shared: boolean }
        Returns: void
      }
    }
  }
}
