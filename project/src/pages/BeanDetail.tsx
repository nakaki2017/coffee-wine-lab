import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  MapPin,
  Mountain,
  Clock,
  ExternalLink,
  Coffee,
  Package,
  FlaskConical,
} from 'lucide-react';
import type { BeanProfile, Batch } from '../lib/types';
import { fetchBeanProfile, fetchBatches, deleteBeanProfile } from '../lib/utils';
import { getRoastLabelT, getStatusLabelT, getStatusBadgeClass } from '../lib/types';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from '../contexts/LanguageContext';

export default function BeanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [bean, setBean] = useState<BeanProfile | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchBeanProfile(id),
      fetchBatches(),
    ]).then(([beanData, batchData]) => {
      setBean(beanData);
      setBatches(batchData.filter(b => b.bean_profile_id === id));
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!bean || batches.some(b => b.status !== 'finished' && b.status !== 'archived')) {
      addToast('error', t('toast.bean_delete_blocked'));
      return;
    }
    if (!confirm(t('confirm.delete_bean'))) return;
    try {
      await deleteBeanProfile(bean.id);
      addToast('success', t('toast.bean_deleted'));
      navigate('/beans');
    } catch (err: any) {
      addToast('error', err.message || t('toast.delete_failed'));
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-cream-200 dark:bg-espresso-800 rounded-lg" /></div>;
  }

  if (!bean) {
    return (
      <div className="empty-state">
        <Coffee className="empty-icon" />
        <p className="empty-title">{t('beans.not_found')}</p>
      </div>
    );
  }

  const totalSpent = batches.reduce((sum, b) => sum + (b.price || 0), 0);
  const totalWeight = batches.reduce((sum, b) => sum + b.weight_grams, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/beans')} className="btn-ghost btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="page-title">{bean.bean_name}</h1>
        </div>
        <div className="flex gap-2">
          <Link to={`/beans/${id}/edit`} className="btn-secondary">
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
            {bean.image_url && (
              <div className="h-48 bg-cream-200 dark:bg-espresso-800 overflow-hidden rounded-t-2xl">
                <img src={bean.image_url} alt={bean.bean_name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="card-body space-y-4">
              <div>
                <h2 className="text-xl font-display font-bold text-espresso-900 dark:text-cream-100">
                  {bean.brand}
                </h2>
                {bean.roaster && (
                  <p className="text-sm text-coffee-600 dark:text-coffee-400">
                    {t('beans.roasted_by', { roaster: bean.roaster })}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {bean.origin_country && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-espresso-400" />
                    <span>{bean.origin_country}{bean.region ? `, ${bean.region}` : ''}</span>
                  </div>
                )}
                {bean.altitude && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mountain className="w-4 h-4 text-espresso-400" />
                    <span>{bean.altitude}</span>
                  </div>
                )}
                {bean.process_method && (
                  <div className="flex items-center gap-2 text-sm">
                    <FlaskConical className="w-4 h-4 text-espresso-400" />
                    <span>{bean.process_method}</span>
                  </div>
                )}
                {bean.roast_level && (
                  <div className="flex items-center gap-2 text-sm">
                    <Coffee className="w-4 h-4 text-espresso-400" />
                    <span>{getRoastLabelT(bean.roast_level, t)}</span>
                  </div>
                )}
                {bean.variety && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-espresso-400" />
                    <span>{bean.variety}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-espresso-400" />
                  <span>{t('beans.rest_days', { days: bean.recommended_resting_days })}</span>
                </div>
              </div>

              {bean.flavor_description && (
                <div className="pt-3 border-t border-cream-200 dark:border-espresso-800">
                  <h3 className="text-sm font-medium text-espresso-600 dark:text-espresso-400 mb-2">{t('beans.flavor_profile')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {bean.flavor_description.split(/[,;]/).map((tag, i) => (
                      <span key={i} className="badge bg-coffee-100 text-coffee-700 dark:bg-coffee-900 dark:text-coffee-300">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {bean.purchase_link && (
                <a
                  href={bean.purchase_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-coffee-600 dark:text-coffee-400 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t('beans.purchase_link')}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="section-title mb-4">{t('beans.purchase_summary')}</h3>
            <div className="space-y-3">
              <div>
                <div className="stat-value">{batches.length}</div>
                <div className="stat-label">{t('beans.total_batches')}</div>
              </div>
              <div>
                <div className="stat-value">{totalSpent > 0 ? `$${totalSpent.toFixed(0)}` : '-'}</div>
                <div className="stat-label">{t('beans.total_spent')}</div>
              </div>
              <div>
                <div className="stat-value">{totalWeight > 0 ? `${totalWeight}g` : '-'}</div>
                <div className="stat-label">{t('beans.total_purchased')}</div>
              </div>
              {totalSpent > 0 && totalWeight > 0 && (
                <div>
                  <div className="stat-value">${(totalSpent / totalWeight * 100).toFixed(2)}</div>
                  <div className="stat-label">{t('beans.per_100g')}</div>
                </div>
              )}
            </div>
          </div>

          <Link to={`/inventory/new?bean=${id}`} className="btn-primary w-full">
            <Package className="w-4 h-4" />
            {t('beans.add_batch')}
          </Link>
        </div>
      </div>

      {/* Batches */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="section-title">{t('beans.batches')}</h2>
        </div>
        {batches.length === 0 ? (
          <div className="card-body text-center py-8 text-espresso-500">
            {t('beans.no_batches')}{' '}
            <Link to={`/inventory/new?bean=${id}`} className="text-coffee-600 dark:text-coffee-400 hover:underline">
              {t('beans.add_first_batch')}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-cream-200 dark:divide-espresso-800">
            {batches.map(batch => (
              <Link key={batch.id} to={`/inventory/${batch.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-cream-50 dark:hover:bg-espresso-800/50 transition-colors">
                <div>
                  <span className="font-medium text-sm text-espresso-800 dark:text-cream-200">
                    {batch.batch_code || `${t('inventory.batch_fallback')} ${batch.created_at.slice(0, 10)}`}
                  </span>
                  <span className="text-xs text-espresso-500 ml-2">
                    {batch.purchase_date && `${t('inventory.purchased')} ${batch.purchase_date}`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-espresso-600 dark:text-espresso-400">
                    {batch.remaining_grams}g / {batch.weight_grams}g
                  </span>
                  <span className={getStatusBadgeClass(batch.status)}>
                    {getStatusLabelT(batch.status, t)}
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
