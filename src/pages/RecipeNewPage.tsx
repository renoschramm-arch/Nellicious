import { useNavigate } from 'react-router-dom'
import { RecipeForm } from '../components/RecipeForm'
import { useRecipes } from '../lib/useRecipes'

export function RecipeNewPage() {
  const { createRecipe } = useRecipes()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display font-bold text-2xl">Neues Rezept</h1>
      <RecipeForm
        submitLabel="Rezept anlegen"
        onCancel={() => navigate('/rezepte')}
        onSave={async (values) => {
          const recipe = await createRecipe(values)
          navigate(recipe ? `/rezepte/${recipe.id}` : '/rezepte')
        }}
      />
    </div>
  )
}
