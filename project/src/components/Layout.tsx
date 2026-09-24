import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useTranslation } from '../contexts/LanguageContext';
import {
  Coffee,
  LayoutDashboard,
  Bean,
  Package,
  FlaskConical,
  BookOpen,
  CalendarDays,
  BarChart3,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Languages,
  Menu,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import UsageGuide from './UsageGuide';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/beans', icon: Bean, labelKey: 'nav.beans' },
  { to: '/inventory', icon: Package, labelKey: 'nav.inventory' },
  { to: '/brews', icon: FlaskConical, labelKey: 'nav.brews' },
  { to: '/recipes', icon: BookOpen, labelKey: 'nav.recipes' },
  { to: '/calendar', icon: CalendarDays, labelKey: 'nav.calendar' },
  { to: '/stats', icon: BarChart3, labelKey: 'nav.stats' },
];

export default function Layout() {
  const { user, signOut } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const { language, toggleLanguage, t } = useTranslation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const bottomNavItems = useMemo(
    () => NAV_ITEMS.filter(item => item.to !== '/stats').slice(0, 6),
    [],
  );

  useEffect(() => {
    document.title = t('app.brand');
  }, [t]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white dark:bg-espresso-900 border-r border-cream-200 dark:border-espresso-800 fixed inset-y-0 z-30">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-cream-200 dark:border-espresso-800">
          <div className="w-9 h-9 rounded-xl bg-coffee-600 flex items-center justify-center">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold text-espresso-900 dark:text-cream-100">
            {t('app.brand')}
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}
            >
              <item.icon className="w-5 h-5" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-cream-200 dark:border-espresso-800 space-y-2">
          <button onClick={toggle} className="sidebar-link-inactive w-full">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isDark ? t('nav.light_mode') : t('nav.dark_mode')}
          </button>
          <button onClick={toggleLanguage} className="sidebar-link-inactive w-full">
            <Languages className="w-5 h-5" />
            {language === 'zh' ? t('nav.switch_to_en') : t('nav.switch_to_zh')}
          </button>
          <button
            onClick={() => setHelpOpen(true)}
            className="sidebar-link-inactive w-full"
            aria-label={t('guide.open')}
          >
            <HelpCircle className="w-5 h-5" />
            {t('guide.open')}
          </button>
          <div className="px-3 py-2 text-xs text-espresso-500 dark:text-espresso-500 truncate">
            {user?.email}
          </div>
          <button onClick={handleSignOut} className="sidebar-link-inactive w-full text-terracotta-600 dark:text-terracotta-400">
            <LogOut className="w-5 h-5" />
            {t('nav.sign_out')}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 w-full max-w-full bg-white dark:bg-espresso-900 border-b border-cream-200 dark:border-espresso-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-coffee-600 flex items-center justify-center">
              <Coffee className="w-4 h-4 text-white" />
            </div>
            <span className="truncate font-display text-lg font-bold">{t('app.brand')}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={toggle} className="btn-ghost btn-icon">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleLanguage}
              className="btn-ghost btn-icon"
              aria-label={language === 'zh' ? t('nav.switch_to_en') : t('nav.switch_to_zh')}
            >
              <Languages className="w-5 h-5" />
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="btn-ghost btn-icon">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/30" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute top-14 left-0 right-0 bg-white dark:bg-espresso-900 border-b border-cream-200 dark:border-espresso-800 py-2 px-3 space-y-1"
            onClick={e => e.stopPropagation()}
          >
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}
              >
                <item.icon className="w-5 h-5" />
                {t(item.labelKey)}
              </NavLink>
            ))}
            <button
              onClick={() => { setMobileOpen(false); setHelpOpen(true); }}
              className="sidebar-link-inactive w-full"
            >
              <HelpCircle className="w-5 h-5" />
              {t('guide.open')}
            </button>
            <button onClick={handleSignOut} className="sidebar-link-inactive w-full text-terracotta-600 dark:text-terracotta-400">
              <LogOut className="w-5 h-5" />
              {t('nav.sign_out')}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 w-full max-w-full overflow-hidden bg-white dark:bg-espresso-900 border-t border-cream-200 dark:border-espresso-800">
        <div className="grid grid-cols-6 py-2">
          {bottomNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center gap-0.5 px-1 py-1 text-xs font-medium transition-colors ${
                  isActive ? 'text-coffee-600 dark:text-coffee-400' : 'text-espresso-500 dark:text-espresso-500'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate">{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 lg:ml-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
        <div className="min-w-0 max-w-6xl mx-auto overflow-x-hidden px-4 sm:px-6 py-6">
          <Outlet />
        </div>
      </main>
      <UsageGuide open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
