import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthProvider } from './lib/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'

const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })))
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })))
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
)
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
)
const SharedRecipePage = lazy(() => import('./pages/SharedRecipePage').then((m) => ({ default: m.SharedRecipePage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const RecipesPage = lazy(() => import('./pages/RecipesPage').then((m) => ({ default: m.RecipesPage })))
const RecipeNewPage = lazy(() => import('./pages/RecipeNewPage').then((m) => ({ default: m.RecipeNewPage })))
const RecipeDetailPage = lazy(() => import('./pages/RecipeDetailPage').then((m) => ({ default: m.RecipeDetailPage })))
const PlannerPage = lazy(() => import('./pages/PlannerPage').then((m) => ({ default: m.PlannerPage })))
const VerlaufPage = lazy(() => import('./pages/VerlaufPage').then((m) => ({ default: m.VerlaufPage })))
const MorePage = lazy(() => import('./pages/MorePage').then((m) => ({ default: m.MorePage })))
const ProfileEditPage = lazy(() => import('./pages/ProfileEditPage').then((m) => ({ default: m.ProfileEditPage })))
const GoalsPage = lazy(() => import('./pages/GoalsPage').then((m) => ({ default: m.GoalsPage })))
const DailyGoalsPage = lazy(() => import('./pages/DailyGoalsPage').then((m) => ({ default: m.DailyGoalsPage })))
const AuswertungPage = lazy(() => import('./pages/AuswertungPage').then((m) => ({ default: m.AuswertungPage })))
const DarstellungPage = lazy(() => import('./pages/DarstellungPage').then((m) => ({ default: m.DarstellungPage })))
const KnowledgePage = lazy(() => import('./pages/KnowledgePage').then((m) => ({ default: m.KnowledgePage })))
const KnowledgeArticlePage = lazy(() =>
  import('./pages/KnowledgeArticlePage').then((m) => ({ default: m.KnowledgeArticlePage })),
)
const InfoPage = lazy(() => import('./pages/InfoPage').then((m) => ({ default: m.InfoPage })))
const NeuInNelliciousPage = lazy(() =>
  import('./pages/NeuInNelliciousPage').then((m) => ({ default: m.NeuInNelliciousPage })),
)
const NotificationSettingsPage = lazy(() =>
  import('./pages/NotificationSettingsPage').then((m) => ({ default: m.NotificationSettingsPage })),
)

function RouteFallback() {
  const { t } = useTranslation()
  return <div className="min-h-screen flex items-center justify-center text-text-muted">{t('common.loading')}</div>
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/willkommen" element={<LandingPage />} />
            <Route path="/anmelden" element={<AuthPage />} />
            <Route path="/passwort-vergessen" element={<ForgotPasswordPage />} />
            <Route path="/passwort-neu" element={<ResetPasswordPage />} />
            <Route path="/rezept-teilen/:id" element={<SharedRecipePage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/rezepte" element={<RecipesPage />} />
                <Route path="/rezepte/neu" element={<RecipeNewPage />} />
                <Route path="/rezepte/:id" element={<RecipeDetailPage />} />
                <Route path="/plan" element={<PlannerPage />} />
                <Route path="/verlauf" element={<VerlaufPage />} />
                <Route path="/mehr" element={<MorePage />} />
                <Route path="/mehr/profil" element={<ProfileEditPage />} />
                <Route path="/mehr/ziele" element={<GoalsPage />} />
                <Route path="/mehr/tagesziele" element={<DailyGoalsPage />} />
                <Route path="/mehr/benachrichtigungen" element={<NotificationSettingsPage />} />
                <Route path="/mehr/auswertung" element={<AuswertungPage />} />
                <Route path="/mehr/darstellung" element={<DarstellungPage />} />
                <Route path="/mehr/wissen" element={<KnowledgePage />} />
                <Route path="/mehr/wissen/:id" element={<KnowledgeArticlePage />} />
                <Route path="/mehr/info" element={<InfoPage />} />
                <Route path="/mehr/neu" element={<NeuInNelliciousPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
