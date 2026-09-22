import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Dashboard from './pages/Dashboard';
import BeansList from './pages/BeansList';
import BeanForm from './pages/BeanForm';
import BeanDetail from './pages/BeanDetail';
import InventoryList from './pages/InventoryList';
import BatchForm from './pages/BatchForm';
import BatchDetail from './pages/BatchDetail';
import BrewsList from './pages/BrewsList';
import BrewForm from './pages/BrewForm';
import BrewDetail from './pages/BrewDetail';
import RecipesList from './pages/RecipesList';
import RecipeForm from './pages/RecipeForm';
import Stats from './pages/Stats';
import Calendar from './pages/Calendar';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-espresso-950">
        <div className="w-8 h-8 border-2 border-coffee-300 border-t-coffee-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-espresso-950">
        <div className="w-8 h-8 border-2 border-coffee-300 border-t-coffee-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        element={
          <AuthGuard>
            <Layout />
          </AuthGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="beans" element={<BeansList />} />
        <Route path="beans/new" element={<BeanForm />} />
        <Route path="beans/:id" element={<BeanDetail />} />
        <Route path="beans/:id/edit" element={<BeanForm />} />
        <Route path="inventory" element={<InventoryList />} />
        <Route path="inventory/new" element={<BatchForm />} />
        <Route path="inventory/:id" element={<BatchDetail />} />
        <Route path="inventory/:id/edit" element={<BatchForm />} />
        <Route path="brews" element={<BrewsList />} />
        <Route path="brews/new" element={<BrewForm />} />
        <Route path="brews/:id" element={<BrewDetail />} />
        <Route path="brews/:id/edit" element={<BrewForm />} />
        <Route path="recipes" element={<RecipesList />} />
        <Route path="recipes/new" element={<RecipeForm />} />
        <Route path="recipes/:id/edit" element={<RecipeForm />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="stats" element={<Stats />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DarkModeProvider>
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </DarkModeProvider>
    </BrowserRouter>
  );
}
