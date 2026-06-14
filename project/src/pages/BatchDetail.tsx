import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { differenceInDays, addDays, parseISO, format } from 'date-fns';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Package,
  ArrowRight,
  FlaskConical,
  Copy,
  Calendar,
  DollarSign,
} from 'lucide-react';
import type { Batch, BrewRecord } from '../lib/types';
import { fetchBatch, fetchBrewRecords, updateBatch, deleteBatch, createBatch } from '../lib/utils';
import { getStatusLabelT, getStatusBadgeClass, getNextStatus, getDeviceLabelT, getRoastLabelT, STATUS_ORDER } from '../lib/types';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from '../contexts/LanguageContext';

export default function BatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [brews, setBrews] = useState<BrewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchBatch(id),
      fetchBrewRecords(),
    ]).then(([batchData, brewData]) => {
      setBatch(batchData);
      setBrews(brewData.filter(b => b.batch_id === id));
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleAdvance = async () => {
    if (!batch) return;
    const next = getNextStatus(batch.status);
    if (!next) return;

    setAdvancing(true);
    try {
      const updates: any = { status: next };
      if (next === 'in_use' && !batch.opened_date) {
        updates.opened_date = new Date().toISOString().slice(0, 10);
      }
      const updated = await updateBatch(batch.id, updates);
      setBatch(updated);
      addToast('success', t('toast.status_changed', { status: getStatusLabelT(next, t) }));
    } catch (err: any) {
      addToast('error', err.message || t('toast.update_status_failed'));
    } finally {
      setAdvancing(false);
    }
  };

  const handleRepurchase = async () => {
    if (!batch) return;
    try {
      await createBatch({
        bean_profile_id: batch.bean_profile_id,
        batch_code: null,
        purchase_date: new Date().toISOString().slice(0, 10),
        roast_date: null,
        received_date: null,
        price: batch.price,
        weight_grams: batch.weight_grams,
        remaining_grams: batch.weight_grams,
        purchase_channel: batch.purchase_channel,
        status: 'pending',
        opened_date: null,
        is_repurchase: true,
        notes: t('inventory.repurchase_note', { batch: batch.batch_code || id || '' }),
      } as any);
      addToast('success', t('toast.repurchase_created'));
      navigate('/inventory');
    } catch (err: any) {
      addToast('error', err.message || t('toast.repurchase_failed'));
    }
  };

  const handleDelete = async () => {
    if (!batch) return;
    if (!confirm(t('confirm.delete_batch'))) return;
    try {
      await deleteBatch(batch.id);
      addToast('success', t('toast.batch_deleted'));
      navigate('/inventory');
    } catch (err: any) {
      addToast('error', err.message || t('toast.delete_failed'));
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-cream-200 dark:bg-espresso-800 rounded-lg" /></div>;
  }

  if (!batch) {
    return (
      <div className="empty-state">
        <Package className="empty-icon" />
        <p className="empty-title">{t('inventory.batch_not_found')}</p>
      </div>
    );
  }

  const nextStatus = getNextStatus(batch.status);
  const bean = batch.bean_profile;
  const remainingPct = batch.weight_grams > 0
    ? Math.round((batch.remaining_grams / batch.weight_grams) * 100)
    : 0;

  const readyDate = batch.roast_date && bean
    ? addDays(parseISO(batch.roast_date), bean.recommended_resting_days)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/inventory')} className="btn-ghost btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-title">
              {bean?.bean_name || t('inventory.batch_fallback')}
            </h1>
            <p className="text-sm text-espresso-500 dark:text-espresso-400">
              {bean?.brand} {batch.batch_code && `— ${batch.batch_code}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/inventory/${id}/edit`} className="btn-secondary">
            <Edit3 className="w-4 h-4" />
            {t('common.edit')}
          </Link>
          <button onClick={handleDelete} className="btn-danger btn-icon" title={t('common.delete')}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <span className={getStatusBadgeClass(batch.status)}>
                  {getStatusLabelT(batch.status, t)}
                </span>
                {batch.is_repurchase && (
                  <span className="badge bg-cream-200 text-cream-800 dark:bg-cream-800 dark:text-cream-200">
                    {t('inventory.repurchase')}
                  </span>
                )}
              </div>

              {/* Status Timeline */}
              <div className="flex items-center gap-1 mb-6">
                {STATUS_ORDER.map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                        batch.status === s
                          ? 'bg-coffee-600 text-white'
                        : i < STATUS_ORDER.indexOf(batch.status)
                          ? 'bg-sage-500 text-white'
                          : 'bg-cream-200 dark:bg-espresso-700 text-espresso-400'
                      }`}
                    >
                      {i + 1}
                    </div>
                    {i < STATUS_ORDER.length - 1 && (
                      <div className={`w-6 h-0.5 ${
                        i < STATUS_ORDER.indexOf(batch.status)
                          ? 'bg-sage-500'
                          : 'bg-cream-200 dark:bg-espresso-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {batch.purchase_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-espresso-400" />
                    <span className="text-espresso-500">{t('inventory.purchased')}:</span>
                    <span>{batch.purchase_date}</span>
                  </div>
                )}
                {batch.roast_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-espresso-400" />
                    <span className="text-espresso-500">{t('inventory.roasted', { date: '' }).trim()}:</span>
                    <span>{batch.roast_date}</span>
                  </div>
                )}
                {batch.received_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-espresso-400" />
                    <span className="text-espresso-500">{t('inventory.received')}:</span>
                    <span>{batch.received_date}</span>
                  </div>
                )}
                {batch.opened_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-espresso-400" />
                    <span className="text-espresso-500">{t('inventory.opened')}:</span>
                    <span>{batch.opened_date}</span>
                  </div>
                )}
                {batch.price && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-espresso-400" />
                    <span className="text-espresso-500">{t('inventory.price')}:</span>
                    <span>${batch.price.toFixed(2)}</span>
                  </div>
                )}
                {batch.purchase_channel && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-espresso-400" />
                    <span className="text-espresso-500">{t('inventory.channel')}:</span>
                    <span>{batch.purchase_channel}</span>
                  </div>
                )}
              </div>

              {/* Resting info */}
              {batch.status === 'resting' && readyDate && (
                <div className="mt-4 p-3 bg-coffee-50 dark:bg-coffee-950 rounded-xl border border-coffee-200 dark:border-coffee-800">
                  <span className="text-sm text-coffee-700 dark:text-coffee-300">
                    {t('inventory.ready_on', { date: format(readyDate, 'MMM d, yyyy') })}
                    {differenceInDays(readyDate, new Date()) > 0
                      ? ` ${t('inventory.days_from_now', { days: differenceInDays(readyDate, new Date()) })}`
                      : ` ${t('inventory.ready_now')}`
                    }
                  </span>
                </div>
              )}

              {batch.notes && (
                <div className="mt-4 pt-4 border-t border-cream-200 dark:border-espresso-800">
                  <p className="text-sm text-espresso-600 dark:text-espresso-400">{batch.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Brew Records */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="section-title">{t('inventory.brew_records')} ({brews.length})</h2>
              <Link to={`/brews/new?batch=${id}`} className="btn-sm btn-primary">
                <FlaskConical className="w-3 h-3" />
                {t('brews.new')}
              </Link>
            </div>
            {brews.length === 0 ? (
              <div className="card-body text-center py-6 text-sm text-espresso-500">
                {t('inventory.no_brew_records')}
              </div>
            ) : (
              <div className="divide-y divide-cream-200 dark:divide-espresso-800">
                {brews.map(brew => (
                  <Link key={brew.id} to={`/brews/${brew.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-cream-50 dark:hover:bg-espresso-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <FlaskConical className="w-4 h-4 text-coffee-500" />
                      <div>
                        <span className="font-medium text-sm">{getDeviceLabelT(brew.device, t)}</span>
                        <span className="text-xs text-espresso-500 ml-2">
                          {brew.dose_grams}g / {brew.yield_ml || '?'}ml
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {brew.rating && (
                        <span className="text-sm font-medium text-coffee-600 dark:text-coffee-400">{brew.rating}/10</span>
                      )}
                      <span className="text-xs text-espresso-400">{format(parseISO(brew.brew_date), 'MMM d')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="section-title mb-4">{t('inventory.remaining_title')}</h3>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-display font-bold text-espresso-900 dark:text-cream-100">
                {batch.remaining_grams}
              </span>
              <span className="text-lg text-espresso-500 mb-1">/ {batch.weight_grams}g</span>
            </div>
            <div className="w-full h-3 bg-cream-200 dark:bg-espresso-700 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all ${
                  remainingPct > 50 ? 'bg-sage-500' :
                  remainingPct > 20 ? 'bg-coffee-500' :
                  'bg-terracotta-500'
                }`}
                style={{ width: `${remainingPct}%` }}
              />
            </div>
            <p className="text-sm text-espresso-500">{t('inventory.remaining_pct', { pct: remainingPct })}</p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {nextStatus && (
              <button onClick={handleAdvance} disabled={advancing} className="btn-primary w-full">
                <ArrowRight className="w-4 h-4" />
                {advancing ? t('common.updating') : t('inventory.mark_as', { status: getStatusLabelT(nextStatus, t) })}
              </button>
            )}
            <button onClick={handleRepurchase} className="btn-secondary w-full">
              <Copy className="w-4 h-4" />
              {t('inventory.buy_again')}
            </button>
            <Link to={`/brews/new?batch=${id}`} className="btn-secondary w-full">
              <FlaskConical className="w-4 h-4" />
              {t('inventory.brew_with_this')}
            </Link>
          </div>

          {bean && (
            <div className="card p-5">
              <h3 className="section-title mb-3">{t('inventory.bean_info')}</h3>
              <Link to={`/beans/${bean.id}`} className="text-sm text-coffee-600 dark:text-coffee-400 hover:underline">
                {bean.bean_name} — {bean.brand}
              </Link>
              <div className="mt-2 text-xs text-espresso-500 space-y-1">
                {bean.roast_level && <div>{t('brews.roast')}: {getRoastLabelT(bean.roast_level, t)}</div>}
                {bean.process_method && <div>{t('brews.process')}: {bean.process_method}</div>}
                <div>{t('beans.rest_days', { days: bean.recommended_resting_days })}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
