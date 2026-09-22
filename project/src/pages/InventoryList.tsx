import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Package } from 'lucide-react';
import { differenceInDays, addDays, parseISO } from 'date-fns';
import type { Batch, BatchStatus } from '../lib/types';
import { fetchBatches } from '../lib/utils';
import { getStatusLabelT, getStatusBadgeClass, STATUS_ORDER } from '../lib/types';
import { useTranslation } from '../contexts/LanguageContext';

export default function InventoryList() {
  const { t } = useTranslation();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') as BatchStatus | null;

  useEffect(() => {
    loadBatches();
  }, []);

  async function loadBatches() {
    try {
      const data = await fetchBatches();
      setBatches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = batches.filter(b => {
    if (statusFilter && b.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.bean_profile?.bean_name?.toLowerCase().includes(q) ||
      b.bean_profile?.brand?.toLowerCase().includes(q) ||
      b.batch_code?.toLowerCase().includes(q) ||
      b.purchase_channel?.toLowerCase().includes(q)
    );
  });

  const getRestingInfo = (b: Batch) => {
    if (b.status !== 'resting' || !b.roast_date || !b.bean_profile) return null;
    const readyDate = addDays(parseISO(b.roast_date), b.bean_profile.recommended_resting_days);
    const daysLeft = differenceInDays(readyDate, new Date());
    return daysLeft > 0 ? t('inventory.days_left', { days: daysLeft }) : t('dashboard.ready');
  };

  if (loading) {
    return (
      <div className="space-y-4 pb-4 sm:pb-0">
        <div className="h-8 w-40 sm:w-48 bg-cream-200 dark:bg-espresso-800 rounded-lg animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-4 sm:p-5 h-24 sm:h-20 animate-pulse bg-cream-100 dark:bg-espresso-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-4 sm:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="page-title">{t('inventory.title')}</h1>
        <Link to="/inventory/new" className="btn-primary w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          {t('inventory.add_batch')}
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="-mx-4 max-w-[calc(100%+2rem)] overflow-x-auto scrollbar-hide sm:mx-0 sm:max-w-full">
        <div className="flex min-w-max gap-2 px-4 pb-1 sm:px-0 sm:pb-2">
          <Link
            to="/inventory"
            className={`btn-sm inline-flex h-9 items-center whitespace-nowrap ${!statusFilter ? 'bg-coffee-600 text-white' : 'bg-cream-200 text-espresso-700 dark:bg-espresso-800 dark:text-cream-300'}`}
          >
            {t('common.all')}
          </Link>
          {STATUS_ORDER.map(status => {
            const count = batches.filter(b => b.status === status).length;
            return (
              <Link
                key={status}
                to={`/inventory?status=${status}`}
                className={`btn-sm inline-flex h-9 items-center whitespace-nowrap ${statusFilter === status ? 'bg-coffee-600 text-white' : 'bg-cream-200 text-espresso-700 dark:bg-espresso-800 dark:text-cream-300'}`}
              >
                {getStatusLabelT(status, t)} ({count})
              </Link>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-10"
          placeholder={t('inventory.search_placeholder')}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="card-body flex flex-col items-center justify-center py-10 text-center sm:py-16">
            <Package className="empty-icon" />
            <p className="empty-title">{search || statusFilter ? t('inventory.none_found') : t('inventory.none_yet')}</p>
            <p className="empty-text">
              {search || statusFilter
                ? t('inventory.empty_filter')
                : t('inventory.empty_text')
              }
            </p>
            {!search && !statusFilter && (
              <Link to="/inventory/new" className="btn-primary mt-4">
                <Plus className="w-4 h-4" />
                {t('inventory.add_first_batch')}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(batch => {
            const restingInfo = getRestingInfo(batch);
            const remainingPct = batch.weight_grams > 0
              ? Math.round((batch.remaining_grams / batch.weight_grams) * 100)
              : 0;

            return (
              <Link key={batch.id} to={`/inventory/${batch.id}`} className="card-hover p-4 block">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                      <h3 className="min-w-0 w-full truncate font-medium text-espresso-900 dark:text-cream-100 sm:w-auto sm:flex-1">
                        {batch.bean_profile?.bean_name || t('common.unknown')}
                      </h3>
                      <span className={getStatusBadgeClass(batch.status)}>
                        {getStatusLabelT(batch.status, t)}
                      </span>
                      {batch.is_repurchase && (
                        <span className="badge bg-cream-200 text-cream-800 dark:bg-cream-800 dark:text-cream-200">
                          {t('inventory.repurchase')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 break-words text-sm text-espresso-500 dark:text-espresso-400 sm:truncate">
                      {batch.bean_profile?.brand}
                      {batch.batch_code && ` — ${batch.batch_code}`}
                    </p>
                    <div className="mt-3 flex flex-col gap-1 text-xs text-espresso-500 dark:text-espresso-500 sm:mt-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
                      {batch.purchase_date && <span className="min-w-0 break-words">{t('inventory.bought', { date: batch.purchase_date })}</span>}
                      {batch.roast_date && <span className="min-w-0 break-words">{t('inventory.roasted', { date: batch.roast_date })}</span>}
                      {restingInfo && <span className="min-w-0 break-words font-medium text-coffee-600 dark:text-coffee-400">{restingInfo}</span>}
                    </div>
                  </div>

                  <div className="w-full border-t border-cream-100 pt-3 dark:border-espresso-800 sm:ml-4 sm:w-auto sm:shrink-0 sm:border-0 sm:pt-0 sm:text-right">
                    <div className="flex items-center justify-between gap-3 sm:block">
                      <div className="text-sm font-medium text-espresso-800 dark:text-cream-200">
                        {batch.remaining_grams}g / {batch.weight_grams}g
                      </div>
                      {batch.price && (
                        <div className="text-xs text-espresso-500">
                          ${batch.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                    {remainingPct > 0 && remainingPct <= 100 && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cream-200 dark:bg-espresso-700 sm:ml-auto sm:mt-1 sm:w-16">
                        <div
                          className={`h-full rounded-full transition-all ${
                            remainingPct > 50 ? 'bg-sage-500' :
                            remainingPct > 20 ? 'bg-coffee-500' :
                            'bg-terracotta-500'
                          }`}
                          style={{ width: `${remainingPct}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
