import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { differenceInDays, format, addDays, parseISO } from 'date-fns';
import {
  Coffee,
  Bean,
  Package,
  Timer,
  CheckCircle2,
  Truck,
  FlaskConical,
  CalendarDays,
  Plus,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import type { Batch, BrewRecord } from '../lib/types';
import { fetchBatches, fetchBeanProfiles, fetchBrewRecords } from '../lib/utils';
import { getDeviceLabelT, getRoastLabelT } from '../lib/types';
import { useTranslation } from '../contexts/LanguageContext';

export default function Dashboard() {
  const { t } = useTranslation();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [recentBrews, setRecentBrews] = useState<BrewRecord[]>([]);
  const [beanCount, setBeanCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [batchData, brewData, beanData] = await Promise.all([
        fetchBatches(),
        fetchBrewRecords(5),
        fetchBeanProfiles(),
      ]);
      setBatches(batchData);
      setRecentBrews(brewData);
      setBeanCount(beanData.length);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const inUse = batches.filter(b => b.status === 'in_use');
  const ready = batches.filter(b => b.status === 'ready');
  const resting = batches.filter(b => b.status === 'resting');
  const pending = batches.filter(b => b.status === 'pending');

  const getRestingCountdown = (b: Batch) => {
    if (!b.roast_date || !b.bean_profile) return null;
    const readyDate = addDays(parseISO(b.roast_date), b.bean_profile.recommended_resting_days);
    const daysLeft = differenceInDays(readyDate, new Date());
    return daysLeft > 0 ? daysLeft : 0;
  };

  const getDaysSinceOpened = (b: Batch) => {
    if (!b.opened_date) return null;
    return differenceInDays(new Date(), parseISO(b.opened_date));
  };

  const getLowStockBatches = () => batches.filter(b =>
    (b.status === 'in_use' || b.status === 'ready') &&
    b.weight_grams > 0 && b.remaining_grams / b.weight_grams < 0.2
  );

  const getOldOpenBatches = () => batches.filter(b => {
    if (b.status !== 'in_use') return false;
    const days = getDaysSinceOpened(b);
    return days !== null && days > 30;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-cream-200 dark:bg-espresso-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-32 animate-pulse bg-cream-100 dark:bg-espresso-800" />
          ))}
        </div>
      </div>
    );
  }

  const lowStock = getLowStockBatches();
  const oldOpen = getOldOpenBatches();
  const hasAlerts = lowStock.length > 0 || oldOpen.length > 0;
  const hasBeans = beanCount > 0;
  const hasUsableBatch = batches.some(b => b.status === 'ready' || b.status === 'in_use');
  const hasBrews = recentBrews.length > 0;
  const batchSetupPath = hasBeans ? '/inventory/new' : '/beans/new?returnTo=%2Finventory%2Fnew';
  const quickActionPath = hasUsableBatch ? '/brews/new' : batchSetupPath;
  const quickActionLabel = hasUsableBatch
    ? t('dashboard.quick_brew')
    : hasBeans
      ? t('inventory.add_batch')
      : t('inventory.add_bean_first');

  const setupSteps = [
    { icon: Bean, title: t('setup.step_bean'), description: t('setup.step_bean_desc'), complete: hasBeans, unlocked: true, to: '/beans/new' },
    { icon: Package, title: t('setup.step_batch'), description: t('setup.step_batch_desc'), complete: batches.length > 0, unlocked: hasBeans, to: batchSetupPath },
    { icon: FlaskConical, title: t('setup.step_brew'), description: t('setup.step_brew_desc'), complete: hasBrews, unlocked: hasUsableBatch, to: '/brews/new' },
    { icon: CalendarDays, title: t('setup.step_calendar'), description: t('setup.step_calendar_desc'), complete: false, unlocked: hasBrews, to: '/calendar' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">{t('dashboard.title')}</h1>
        <Link to={quickActionPath} className="btn-primary">
          <Plus className="w-4 h-4" />
          {quickActionLabel}
        </Link>
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <div className="space-y-2">
          {lowStock.map(b => (
            <div key={b.id} className="flex items-center gap-3 bg-terracotta-50 dark:bg-terracotta-950 border border-terracotta-200 dark:border-terracotta-800 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400 shrink-0" />
              <span className="text-sm text-terracotta-800 dark:text-terracotta-300">
                {t('dashboard.low_stock', { bean: b.bean_profile?.bean_name || t('common.unknown'), grams: b.remaining_grams })}
              </span>
            </div>
          ))}
          {oldOpen.map(b => {
            const days = getDaysSinceOpened(b)!;
            return (
              <div key={b.id} className="flex items-center gap-3 bg-coffee-50 dark:bg-coffee-950 border border-coffee-200 dark:border-coffee-800 rounded-xl px-4 py-3">
                <Timer className="w-4 h-4 text-coffee-600 dark:text-coffee-400 shrink-0" />
                <span className="text-sm text-coffee-800 dark:text-coffee-300">
                  {t('dashboard.old_open', { bean: b.bean_profile?.bean_name || t('common.unknown'), days })}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {!hasBrews ? (
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">{t('setup.title')}</h2>
            <p className="mt-1 text-sm text-espresso-500 dark:text-espresso-400">{t('setup.description')}</p>
          </div>
          <div className="card-body space-y-3">
            {setupSteps.map(({ icon: Icon, title, description, complete, unlocked, to }, index) => (
              <div key={title} className={`flex gap-3 rounded-xl border p-3 ${
                complete
                  ? 'border-sage-200 bg-sage-50 dark:border-sage-800 dark:bg-sage-950/40'
                  : unlocked
                    ? 'border-cream-200 dark:border-espresso-800'
                    : 'border-cream-100 opacity-60 dark:border-espresso-800'
              }`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  complete ? 'bg-sage-100 text-sage-700 dark:bg-sage-900 dark:text-sage-300' : 'bg-cream-100 text-coffee-700 dark:bg-espresso-800 dark:text-coffee-300'
                }`}>
                  {complete ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-medium text-espresso-900 dark:text-cream-100">
                      {index + 1}. {title}
                    </h3>
                    {complete ? (
                      <span className="text-xs font-medium text-sage-700 dark:text-sage-300">{t('setup.done')}</span>
                    ) : unlocked ? (
                      <Link to={to} className="inline-flex items-center gap-1 text-xs font-medium text-coffee-600 hover:underline dark:text-coffee-400">
                        {t('setup.start')} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <span className="text-xs text-espresso-400 dark:text-espresso-500">{t('setup.locked')}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-espresso-500 dark:text-espresso-400">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-sage-200 bg-sage-50 px-4 py-3 dark:border-sage-800 dark:bg-sage-950/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-sage-600 dark:text-sage-400" />
            <div>
              <p className="font-medium text-sage-900 dark:text-sage-200">{t('setup.complete_title')}</p>
              <p className="text-sm text-sage-700 dark:text-sage-300">{t('setup.complete_text')}</p>
            </div>
          </div>
          <Link to="/calendar" className="inline-flex items-center gap-1 text-sm font-medium text-sage-800 hover:underline dark:text-sage-200">
            {t('nav.calendar')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/inventory?status=in_use" className="card-hover p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cream-200 dark:bg-cream-800 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-cream-700 dark:text-cream-300" />
            </div>
            <span className="text-sm font-medium text-espresso-600 dark:text-espresso-400">{t('dashboard.now_drinking')}</span>
          </div>
          <div className="stat-value">{inUse.length}</div>
          <div className="stat-label">{t('dashboard.active_bags')}</div>
        </Link>

        <Link to="/inventory?status=ready" className="card-hover p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-sage-200 dark:bg-sage-800 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-sage-700 dark:text-sage-300" />
            </div>
            <span className="text-sm font-medium text-espresso-600 dark:text-espresso-400">{t('dashboard.ready_to_open')}</span>
          </div>
          <div className="stat-value">{ready.length}</div>
          <div className="stat-label">{t('dashboard.ready_to_brew')}</div>
        </Link>

        <Link to="/inventory?status=resting" className="card-hover p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-coffee-200 dark:bg-coffee-800 flex items-center justify-center">
              <Timer className="w-5 h-5 text-coffee-700 dark:text-coffee-300" />
            </div>
            <span className="text-sm font-medium text-espresso-600 dark:text-espresso-400">{t('dashboard.resting')}</span>
          </div>
          <div className="stat-value">{resting.length}</div>
          <div className="stat-label">{t('dashboard.developing_flavor')}</div>
        </Link>

        <Link to="/inventory?status=pending" className="card-hover p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-sand-200 dark:bg-sand-800 flex items-center justify-center">
              <Truck className="w-5 h-5 text-sand-700 dark:text-sand-300" />
            </div>
            <span className="text-sm font-medium text-espresso-600 dark:text-espresso-400">{t('dashboard.on_the_way')}</span>
          </div>
          <div className="stat-value">{pending.length}</div>
          <div className="stat-label">{t('dashboard.incoming')}</div>
        </Link>
      </div>

      {/* Resting Batches Detail */}
      {resting.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">{t('dashboard.resting_countdown')}</h2>
          </div>
          <div className="card-body space-y-3">
            {resting.map(b => {
              const daysLeft = getRestingCountdown(b);
              return (
                <div key={b.id} className="flex items-center justify-between py-2">
                  <div>
                    <span className="font-medium text-espresso-800 dark:text-cream-200">
                      {b.bean_profile?.bean_name}
                    </span>
                    <span className="text-sm text-espresso-500 dark:text-espresso-400 ml-2">
                      {b.bean_profile?.brand}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {daysLeft !== null ? (
                      daysLeft > 0 ? (
                        <span className="text-sm text-coffee-600 dark:text-coffee-400 font-medium">
                          {t('dashboard.days_to_go', { days: daysLeft })}
                        </span>
                      ) : (
                        <span className="badge-ready">{t('dashboard.ready')}</span>
                      )
                    ) : (
                      <span className="text-sm text-espresso-400">{t('dashboard.no_roast_date')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Batches Detail */}
      {inUse.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">{t('dashboard.currently_brewing_with')}</h2>
          </div>
          <div className="card-body space-y-3">
            {inUse.map(b => (
              <div key={b.id} className="flex items-center justify-between py-2">
                <div>
                  <span className="font-medium text-espresso-800 dark:text-cream-200">
                    {b.bean_profile?.bean_name}
                  </span>
                  <span className="text-sm text-espresso-500 dark:text-espresso-400 ml-2">
                    {b.bean_profile?.brand}
                  </span>
                  {b.bean_profile?.roast_level && (
                    <span className="text-xs text-espresso-400 ml-2">
                      {getRoastLabelT(b.bean_profile.roast_level, t)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-espresso-600 dark:text-espresso-400">
                    {b.remaining_grams}g / {b.weight_grams}g
                  </span>
                  <div className="w-20 h-2 bg-cream-200 dark:bg-espresso-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-coffee-600 rounded-full transition-all"
                      style={{ width: `${Math.max(0, (b.remaining_grams / b.weight_grams) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Brews */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="section-title">{t('dashboard.recent_brews')}</h2>
          <Link to="/brews" className="text-sm text-coffee-600 dark:text-coffee-400 hover:underline flex items-center gap-1">
            {t('common.view_all')} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentBrews.length === 0 ? (
          <div className="card-body empty-state">
            <FlaskConical className="empty-icon" />
            <p className="empty-title">{t('dashboard.no_brews_yet')}</p>
            <p className="empty-text">{t('dashboard.no_brews_text')}</p>
            <Link to={quickActionPath} className="btn-primary mt-4">
              <Plus className="w-4 h-4" />
              {quickActionLabel}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-cream-200 dark:divide-espresso-800">
            {recentBrews.map(brew => (
              <Link key={brew.id} to={`/brews/${brew.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-cream-50 dark:hover:bg-espresso-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-coffee-100 dark:bg-coffee-900/40 flex items-center justify-center">
                    <FlaskConical className="w-4 h-4 text-coffee-600 dark:text-coffee-400" />
                  </div>
                  <div>
                    <span className="font-medium text-sm text-espresso-800 dark:text-cream-200">
                      {brew.batch?.bean_profile?.bean_name || t('common.unknown')}
                    </span>
                    <span className="text-xs text-espresso-500 dark:text-espresso-400 ml-2">
                      {getDeviceLabelT(brew.device, t)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {brew.rating && (
                    <span className="text-sm font-medium text-coffee-600 dark:text-coffee-400">
                      {brew.rating}/10
                    </span>
                  )}
                  <span className="text-xs text-espresso-400">
                    {format(parseISO(brew.brew_date), 'MMM d')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
