import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, Coffee, Lock, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';

type AuthMode = 'signIn' | 'signUp' | 'forgot';

interface AuthLocationState {
  mode?: AuthMode;
  passwordReset?: boolean;
}

export default function AuthPage() {
  const { signIn, signUp, requestPasswordReset } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const locationState = location.state as AuthLocationState | null;
  const [mode, setMode] = useState<AuthMode>(
    locationState?.mode === 'forgot' ? 'forgot' : 'signIn',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword('');
    setError('');
    setResetEmailSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'forgot') {
        await requestPasswordReset(email);
        setResetEmailSent(true);
      } else if (mode === 'signUp') {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setError(mode === 'forgot' ? t('auth.reset_email_failed') : message || t('auth.failed'));
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'forgot'
    ? t('auth.forgot_password_title')
    : mode === 'signUp'
      ? t('auth.create_account')
      : t('auth.welcome_back');

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
            <h2 className="text-xl font-display font-semibold text-espresso-900 dark:text-cream-100 mb-2">
              {title}
            </h2>
            {mode === 'forgot' && !resetEmailSent && (
              <p className="text-sm text-espresso-500 dark:text-espresso-400 mb-6">
                {t('auth.forgot_password_description')}
              </p>
            )}

            {locationState?.passwordReset && mode === 'signIn' && (
              <div className="flex items-start gap-2 text-sm text-sage-700 dark:text-sage-300 bg-sage-50 dark:bg-sage-950 rounded-xl px-3 py-2 mb-4">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{t('auth.password_reset_success')}</span>
              </div>
            )}

            {resetEmailSent ? (
              <div>
                <div className="flex items-start gap-3 text-sm text-sage-700 dark:text-sage-300 bg-sage-50 dark:bg-sage-950 rounded-xl px-4 py-3">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-medium">{t('auth.reset_email_sent_title')}</p>
                    <p className="mt-1 text-sage-600 dark:text-sage-400">
                      {t('auth.reset_email_sent')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => switchMode('signIn')}
                  className="btn-secondary w-full mt-5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('auth.back_to_sign_in')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="auth-email" className="label">{t('auth.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder={t('auth.email_placeholder')}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="auth-password" className="label">{t('auth.password')}</label>
                      {mode === 'signIn' && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="mb-1 text-xs font-medium text-coffee-600 dark:text-coffee-400 hover:underline"
                        >
                          {t('auth.forgot_password')}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                      <input
                        id="auth-password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="input pl-10"
                        placeholder={t('auth.password_placeholder')}
                        autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-sm text-terracotta-600 dark:text-terracotta-400 bg-terracotta-50 dark:bg-terracotta-950 rounded-xl px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'forgot'
                        ? t('auth.send_reset_link')
                        : mode === 'signUp'
                          ? t('auth.create_account')
                          : t('auth.sign_in')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {!resetEmailSent && (
              <div className="mt-6 text-center">
                {mode === 'forgot' ? (
                  <button
                    type="button"
                    onClick={() => switchMode('signIn')}
                    className="inline-flex items-center gap-1 text-sm text-coffee-600 dark:text-coffee-400 hover:underline font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('auth.back_to_sign_in')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => switchMode(mode === 'signUp' ? 'signIn' : 'signUp')}
                    className="text-sm text-coffee-600 dark:text-coffee-400 hover:underline font-medium"
                  >
                    {mode === 'signUp'
                      ? t('auth.already_have_account')
                      : t('auth.no_account')}
                  </button>
                )}
              </div>
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
