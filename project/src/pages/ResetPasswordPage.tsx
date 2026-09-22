import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Coffee, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';

export default function ResetPasswordPage() {
  const { session, loading: authLoading, completePasswordRecovery } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('auth.password_too_short'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwords_do_not_match'));
      return;
    }

    setLoading(true);
    try {
      await completePasswordRecovery(password);
      navigate('/auth', { replace: true, state: { passwordReset: true } });
    } catch {
      setError(t('auth.password_reset_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-espresso-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-coffee-600 flex items-center justify-center mx-auto mb-4 shadow-elevated">
            <Coffee className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-espresso-900 dark:text-cream-100">
            {t('app.brand')}
          </h1>
          <p className="text-espresso-600 dark:text-espresso-400 mt-2">
            {t('app.subtitle')}
          </p>
        </div>

        <div className="card">
          <div className="card-body">
            {authLoading ? (
              <div className="flex items-center justify-center min-h-48">
                <div className="w-8 h-8 border-2 border-coffee-300 border-t-coffee-600 rounded-full animate-spin" />
              </div>
            ) : !session ? (
              <div className="text-center py-3">
                <AlertCircle className="w-10 h-10 text-terracotta-500 mx-auto mb-3" />
                <h2 className="text-xl font-display font-semibold text-espresso-900 dark:text-cream-100">
                  {t('auth.recovery_link_invalid')}
                </h2>
                <p className="text-sm text-espresso-500 dark:text-espresso-400 mt-2 mb-6">
                  {t('auth.recovery_link_invalid_description')}
                </p>
                <Link
                  to="/auth"
                  state={{ mode: 'forgot' }}
                  className="btn-primary w-full"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('auth.request_new_link')}
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-display font-semibold text-espresso-900 dark:text-cream-100">
                  {t('auth.reset_password_title')}
                </h2>
                <p className="text-sm text-espresso-500 dark:text-espresso-400 mt-2 mb-6">
                  {t('auth.reset_password_description')}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="new-password" className="label">{t('auth.new_password')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="input pl-10 pr-10"
                        placeholder={t('auth.new_password_placeholder')}
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(current => !current)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-espresso-400 hover:text-espresso-700 dark:hover:text-cream-200"
                        aria-label={showPassword ? t('auth.hide_password') : t('auth.show_password')}
                        title={showPassword ? t('auth.hide_password') : t('auth.show_password')}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="label">{t('auth.confirm_password')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                      <input
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="input pl-10 pr-10"
                        placeholder={t('auth.confirm_password_placeholder')}
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-terracotta-600 dark:text-terracotta-400 bg-terracotta-50 dark:bg-terracotta-950 rounded-xl px-3 py-2">
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {t('auth.reset_password')}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-espresso-400 dark:text-espresso-600 mt-6">
          {t('app.tagline')}
        </p>
      </div>
    </div>
  );
}
