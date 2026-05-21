// ═══════════════════════════════════════════════
// src/App.jsx — Root component + Route definitions
//
// All routes are defined here.
// Protected routes use ProtectedRoute wrapper.
// Authenticated pages use MainLayout wrapper.
// ═══════════════════════════════════════════════

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import OAuthCallbackPage from './pages/OAuthCallbackPage';

import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';

import BudgetPage from './pages/BudgetPage';

import InsightsPage from './pages/InsightsPage';

import PredictionsPage from './pages/PredictionsPage';

import GroupsPage      from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';

import MyInvitesPage   from './pages/MyInvitesPage';
import PublicGroupPage from './pages/PublicGroupPage';

import { InviteProvider } from './context/InviteContext';

// Placeholder for pages we build in later phases
const PlaceholderPage = ({ title }) => (
  <div className="card">
    <h2>{title}</h2>
    <p className="text-gray-500 mt-2">Coming soon in a future phase.</p>
  </div>
);

const App = () => {
  return (
    // BrowserRouter provides routing context to the entire app
    <BrowserRouter>
      {/* AuthProvider wraps everything so auth state is global */}
      <AuthProvider>
        <InviteProvider>
        <Routes>

          {/* ─────────────────────────────────────
              PUBLIC ROUTES — no login required
              ───────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* OAuth callback — handles redirect from backend after SSO */}
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />

          {/* Public route — no auth needed, outside layout */}
          <Route path="/share/:token" element={<PublicGroupPage />} />

          {/* ─────────────────────────────────────
              PROTECTED ROUTES — login required
              All nested inside MainLayout so they
              share the sidebar and topbar
              ───────────────────────────────────── */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Default route → redirect to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Phase 8 */}
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Phase 6 */}
            <Route path="expenses" element={<ExpensesPage />} />

            {/* Phase 7 */}
            <Route path="budgets" element={<BudgetPage />} />

            {/* Phase 9 */}
            <Route path="insights" element={<InsightsPage />} />

            {/* Phase 10 — placeholder */}
            <Route path="predict" element={<PredictionsPage />} />

            {/* Phase 11 — placeholder */}
            <Route path="groups"    element={<GroupsPage />} />
            <Route path="groups/:id" element={<GroupDetailPage />} />

            {/* Inside your existing authenticated routes */}
            <Route path="invites" element={<MyInvitesPage />} />

            {/* Phase 12 — placeholder */}
            <Route path="reports" element={<PlaceholderPage title="📄 Monthly Reports" />} />
          </Route>

          {/* Catch all — redirect unknown URLs to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
        </InviteProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;