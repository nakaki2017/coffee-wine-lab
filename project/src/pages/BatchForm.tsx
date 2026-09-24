import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import type { BeanProfile, BatchStatus } from '../lib/types';
import { fetchBeanProfiles, fetchBatch, createBatch, updateBatch } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import { BATCH_STATUSES } from '../lib/types';
import { useTranslation } from '../contexts/LanguageContext';

export default function BatchForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [beansLoading, setBeansLoading] = useState(true);
  const [beansLoadError, setBeansLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [beans, setBeans] = useState<BeanProfile[]>([]);
  const [beanSearch, setBeanSearch] = useState('');

  const [form, setForm] = useState({
    bean_profile_id: searchParams.get('bean') || '',
    batch_code: '',
    purchase_date: new Date().toISOString().slice(0, 10),
    roast_date: '',
    received_date: '',
    price: '' as string,
    weight_grams: '' as string,
    remaining_grams: '' as string,
    purchase_channel: '',
    status: 'pending' as BatchStatus,
    opened_date: '',
    is_repurchase: false,
    notes: '',
  });

  useEffect(() => {
    loadBeans();
  }, []);

  async function loadBeans() {
    setBeansLoading(true);
    setBeansLoadError(false);
    try {
      setBeans(await fetchBeanProfiles());
    } catch (err) {
      console.error(err);
      setBeansLoadError(true);
    } finally {
      setBeansLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchBatch(id).then(batch => {
        if (batch) {
          setForm({
            bean_profile_id: batch.bean_profile_id,
            batch_code: batch.batch_code || '',
            purchase_date: batch.purchase_date || '',
            roast_date: batch.roast_date || '',
            received_date: batch.received_date || '',
            price: batch.price?.toString() || '',
            weight_grams: batch.weight_grams.toString(),
            remaining_grams: batch.remaining_grams.toString(),
            purchase_channel: batch.purchase_channel || '',
            status: batch.status,
            opened_date: batch.opened_date || '',
            is_repurchase: batch.is_repurchase,
            notes: batch.notes || '',
          });
        }
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bean_profile_id) {
      addToast('error', t('toast.batch_select_required'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        bean_profile_id: form.bean_profile_id,
        batch_code: form.batch_code || null,
        purchase_date: form.purchase_date || null,
        roast_date: form.roast_date || null,
        received_date: form.received_date || null,
        price: form.price ? parseFloat(form.price) : null,
        weight_grams: parseFloat(form.weight_grams) || 0,
        remaining_grams: form.remaining_grams ? parseFloat(form.remaining_grams) : parseFloat(form.weight_grams) || 0,
        purchase_channel: form.purchase_channel || null,
        status: form.status,
        opened_date: form.opened_date || null,
        is_repurchase: form.is_repurchase,
        notes: form.notes || null,
      };

      if (isEdit && id) {
        await updateBatch(id, payload);
        addToast('success', t('toast.batch_updated'));
      } else {
        await createBatch(payload as any);
        addToast('success', t('toast.batch_created'));
      }
      navigate('/inventory');
    } catch (err: any) {
      addToast('error', err.message || t('toast.save_failed'));
    } finally {
      setSaving(false);
    }
  };

  const filteredBeans = beans.filter(b => {
    if (!beanSearch) return true;
    const q = beanSearch.toLowerCase();
    return b.bean_name.toLowerCase().includes(q) || b.brand.toLowerCase().includes(q);
  });

  const selectedBean = beans.find(b => b.id === form.bean_profile_id);

  if (loading || beansLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-cream-200 dark:bg-espresso-800 rounded-lg" /></div>;
  }

  if (!isEdit && beans.length === 0) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/inventory')} className="btn-ghost btn-icon" aria-label={t('inventory.back_to_inventory')}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="page-title">{t('inventory.new')}</h1>
        </div>

        <div className="card">
          <div className="card-body empty-state py-12">
            <div className="w-14 h-14 rounded-2xl bg-coffee-100 dark:bg-coffee-900/40 flex items-center justify-center mb-4">
              <Save className="w-7 h-7 text-coffee-600 dark:text-coffee-400" />
            </div>
            <p className="empty-title">
              {beansLoadError ? t('inventory.beans_load_failed_title') : t('inventory.no_bean_profiles_title')}
            </p>
            <p className="empty-text">
              {beansLoadError ? t('inventory.beans_load_failed_text') : t('inventory.no_bean_profiles_text')}
            </p>
            {beansLoadError ? (
              <button type="button" onClick={loadBeans} className="btn-primary mt-4">
                {t('common.retry')}
              </button>
            ) : (
              <Link to="/beans/new?returnTo=%2Finventory%2Fnew" className="btn-primary mt-4">
                {t('inventory.create_bean_first')}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/inventory')} className="btn-ghost btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="page-title">{isEdit ? t('inventory.edit') : t('inventory.new')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-5">
          {/* Bean Selector */}
          <div>
            <label className="label">{t('inventory.bean_profile')} *</label>
            {selectedBean ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-cream-300 dark:border-espresso-700 bg-cream-50 dark:bg-espresso-800">
                <span className="text-sm font-medium">
                  {selectedBean.bean_name} — {selectedBean.brand}
                </span>
                <button type="button" onClick={() => handleChange('bean_profile_id', '')} className="text-xs text-terracotta-600 hover:underline">
                  {t('common.change')}
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={beanSearch}
                  onChange={e => setBeanSearch(e.target.value)}
                  className="input"
                  placeholder={t('inventory.search_beans')}
                />
                {beanSearch && filteredBeans.length > 0 && (
                  <div className="mt-1 border border-cream-200 dark:border-espresso-700 rounded-xl max-h-48 overflow-y-auto bg-white dark:bg-espresso-900 shadow-card">
                    {filteredBeans.map(bean => (
                      <button
                        key={bean.id}
                        type="button"
                        onClick={() => { handleChange('bean_profile_id', bean.id); setBeanSearch(''); }}
                        className="w-full text-left px-3 py-2 hover:bg-cream-50 dark:hover:bg-espresso-800 text-sm border-b border-cream-100 dark:border-espresso-800 last:border-0"
                      >
                        <span className="font-medium">{bean.bean_name}</span>
                        <span className="text-espresso-500 ml-2">— {bean.brand}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('inventory.batch_code')}</label>
              <input type="text" value={form.batch_code} onChange={e => handleChange('batch_code', e.target.value)} className="input" placeholder={t('inventory.placeholder_batch_code')} />
            </div>

            <div>
              <label className="label">{t('inventory.status')}</label>
              <select value={form.status} onChange={e => handleChange('status', e.target.value)} className="input">
                {BATCH_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>{t(status.label)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{t('inventory.purchase_date')}</label>
              <input type="date" value={form.purchase_date} onChange={e => handleChange('purchase_date', e.target.value)} className="input" />
            </div>

            <div>
              <label className="label">{t('inventory.roast_date')}</label>
              <input type="date" value={form.roast_date} onChange={e => handleChange('roast_date', e.target.value)} className="input" />
            </div>

            <div>
              <label className="label">{t('inventory.received_date')}</label>
              <input type="date" value={form.received_date} onChange={e => handleChange('received_date', e.target.value)} className="input" />
            </div>

            <div>
              <label className="label">{t('inventory.opened_date')}</label>
              <input type="date" value={form.opened_date} onChange={e => handleChange('opened_date', e.target.value)} className="input" />
            </div>

            <div>
              <label className="label">{t('inventory.price')}</label>
              <input type="number" step="0.01" value={form.price} onChange={e => handleChange('price', e.target.value)} className="input" placeholder="0.00" />
            </div>

            <div>
              <label className="label">{t('inventory.weight')} *</label>
              <input type="number" value={form.weight_grams} onChange={e => handleChange('weight_grams', e.target.value)} className="input" placeholder={t('inventory.placeholder_weight')} required />
            </div>

            <div>
              <label className="label">{t('inventory.remaining')}</label>
              <input type="number" value={form.remaining_grams} onChange={e => handleChange('remaining_grams', e.target.value)} className="input" placeholder={t('inventory.placeholder_remaining')} />
            </div>

            <div>
              <label className="label">{t('inventory.purchase_channel')}</label>
              <input type="text" value={form.purchase_channel} onChange={e => handleChange('purchase_channel', e.target.value)} className="input" placeholder={t('inventory.placeholder_channel')} />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_repurchase}
                  onChange={e => handleChange('is_repurchase', e.target.checked)}
                  className="w-4 h-4 rounded border-cream-300 text-coffee-600 focus:ring-coffee-500"
                />
                <span className="text-sm font-medium text-espresso-700 dark:text-cream-300">{t('inventory.is_repurchase')}</span>
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="label">{t('common.notes')}</label>
              <textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} className="input min-h-[60px]" placeholder={t('inventory.placeholder_notes')} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-cream-200 dark:border-espresso-800">
            <button type="button" onClick={() => navigate('/inventory')} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save className="w-4 h-4" />
              {saving ? t('common.saving') : isEdit ? t('common.update') : t('common.create')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
