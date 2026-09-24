import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bean,
  CalendarDays,
  HelpCircle,
  Coffee,
  FlaskConical,
  Package,
  X,
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface UsageGuideProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  { icon: Bean, titleKey: 'guide.step_bean_title', textKey: 'guide.step_bean_text', to: '/beans/new' },
  { icon: Package, titleKey: 'guide.step_batch_title', textKey: 'guide.step_batch_text', to: '/inventory/new' },
  { icon: FlaskConical, titleKey: 'guide.step_brew_title', textKey: 'guide.step_brew_text', to: '/brews/new' },
  { icon: CalendarDays, titleKey: 'guide.step_calendar_title', textKey: 'guide.step_calendar_text', to: '/calendar' },
];

export default function UsageGuide({ open, onClose }: UsageGuideProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-elevated dark:bg-espresso-900 sm:rounded-2xl"
        onMouseDown={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="usage-guide-title"
      >
        <div className="flex items-start justify-between border-b border-cream-200 px-5 py-4 dark:border-espresso-800 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coffee-100 text-coffee-700 dark:bg-coffee-900/40 dark:text-coffee-300">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 id="usage-guide-title" className="section-title truncate">{t('guide.title')}</h2>
              <p className="mt-1 text-sm text-espresso-500 dark:text-espresso-400">{t('guide.intro')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost btn-icon shrink-0"
            aria-label={t('guide.close')}
            title={t('guide.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-espresso-500 dark:text-espresso-400">
            {t('guide.flow_title')}
          </h3>
          <div className="space-y-3">
            {steps.map(({ icon: Icon, titleKey, textKey, to }) => (
              <div key={titleKey} className="flex gap-3 rounded-xl border border-cream-200 p-4 dark:border-espresso-800">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream-100 text-coffee-700 dark:bg-espresso-800 dark:text-coffee-300">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-espresso-900 dark:text-cream-100">{t(titleKey)}</h4>
                  <p className="mt-1 text-sm leading-6 text-espresso-600 dark:text-espresso-400">{t(textKey)}</p>
                  <Link
                    to={to}
                    onClick={onClose}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-coffee-600 hover:underline dark:text-coffee-400"
                  >
                    {t('setup.start')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-3 rounded-xl bg-coffee-50 p-4 dark:bg-coffee-950">
            <Coffee className="mt-0.5 h-5 w-5 shrink-0 text-coffee-600 dark:text-coffee-400" />
            <div>
              <h3 className="font-medium text-coffee-900 dark:text-coffee-200">{t('guide.status_title')}</h3>
              <p className="mt-1 text-sm leading-6 text-coffee-800 dark:text-coffee-300">{t('guide.status_text')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
