import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { RecipesPage } from './pages/RecipesPage'
import { RecipeNewPage } from './pages/RecipeNewPage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { PlannerPage } from './pages/PlannerPage'
import { MorePage } from './pages/MorePage'
import { ProfileEditPage } from './pages/ProfileEditPage'
import { GoalsPage } from './pages/GoalsPage'
import { DailyGoalsPage } from './pages/DailyGoalsPage'

export default function App() {
  return (
    <BrowserRouter basename="/Nellicious">
      <AuthProvider>
        <Routes>
          <Route path="/anmelden" element={<AuthPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/rezepte" element={<RecipesPage />} />
              <Route path="/rezepte/neu" element={<RecipeNewPage />} />
              <Route path="/rezepte/:id" element={<RecipeDetailPage />} />
              <Route path="/plan" element={<PlannerPage />} />
              <Route path="/mehr" element={<MorePage />} />
              <Route path="/mehr/profil" element={<ProfileEditPage />} />
              <Route path="/mehr/ziele" element={<GoalsPage />} />
              <Route path="/mehr/tagesziele" element={<DailyGoalsPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
