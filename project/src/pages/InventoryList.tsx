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
      <div className="space-y-4">
        <div className="h-8 w-48 bg-cream-200 dark:bg-espresso-800 rounded-lg animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-5 h-20 animate-pulse bg-cream-100 dark:bg-espresso-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">{t('inventory.title')}</h1>
        <Link to="/inventory/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          {t('inventory.add_batch')}
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        <Link
          to="/inventory"
          className={`btn-sm whitespace-nowrap ${!statusFilter ? 'bg-coffee-600 text-white' : 'bg-cream-200 text-espresso-700 dark:bg-espresso-800 dark:text-cream-300'}`}
        >
          {t('common.all')}
        </Link>
        {STATUS_ORDER.map(status => {
          const count = batches.filter(b => b.status === status).length;
          return (
            <Link
              key={status}
              to={`/inventory?status=${status}`}
              className={`btn-sm whitespace-nowrap ${statusFilter === status ? 'bg-coffee-600 text-white' : 'bg-cream-200 text-espresso-700 dark:bg-espresso-800 dark:text-cream-300'}`}
            >
              {getStatusLabelT(status, t)} ({count})
            </Link>
          );
        })}
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
          <div className="card-body empty-state">
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
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-espresso-900 dark:text-cream-100 truncate">
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
                    <p className="text-sm text-espresso-500 dark:text-espresso-400 mt-0.5">
                      {batch.bean_profile?.brand}
                      {batch.batch_code && ` — ${batch.batch_code}`}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-espresso-500 dark:text-espresso-500">
                      {batch.purchase_date && <span>{t('inventory.bought', { date: batch.purchase_date })}</span>}
                      {batch.roast_date && <span>{t('inventory.roasted', { date: batch.roast_date })}</span>}
                      {restingInfo && <span className="text-coffee-600 dark:text-coffee-400 font-medium">{restingInfo}</span>}
                    </div>
                  </div>

                  <div className="text-right ml-4 shrink-0">
                    <div className="text-sm font-medium text-espresso-800 dark:text-cream-200">
                      {batch.remaining_grams}g / {batch.weight_grams}g
                    </div>
                    {batch.price && (
                      <div className="text-xs text-espresso-500">
                        ${batch.price.toFixed(2)}
                      </div>
                    )}
                    {remainingPct > 0 && remainingPct <= 100 && (
                      <div className="w-16 h-1.5 bg-cream-200 dark:bg-espresso-700 rounded-full overflow-hidden mt-1 ml-auto">
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
