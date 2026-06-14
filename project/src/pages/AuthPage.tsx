import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Coffee, Mail, Lock, ArrowRight } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || t('auth.failed'));
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
            <h2 className="text-xl font-display font-semibold text-espresso-900 dark:text-cream-100 mb-6">
              {isSignUp ? t('auth.create_account') : t('auth.welcome_back')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder={t('auth.email_placeholder')}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">{t('auth.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input pl-10"
                    placeholder={t('auth.password_placeholder')}
                    required
                    minLength={6}
                  />
                </div>
              </div>

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
                    {isSignUp ? t('auth.create_account') : t('auth.sign_in')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="text-sm text-coffee-600 dark:text-coffee-400 hover:underline font-medium"
              >
                {isSignUp
                  ? t('auth.already_have_account')
                  : t('auth.no_account')
                }
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-espresso-400 dark:text-espresso-600 mt-6">
          {t('app.tagline')}
        </p>
      </div>
    </div>
  );
}
