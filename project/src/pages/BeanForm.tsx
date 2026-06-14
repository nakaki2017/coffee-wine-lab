import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import type { BeanProfile, RoastLevel } from '../lib/types';
import { fetchBeanProfile, createBeanProfile, updateBeanProfile } from '../lib/utils';
import { ROAST_LEVELS } from '../lib/types';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from '../contexts/LanguageContext';

const EMPTY_FORM: Omit<BeanProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  brand: '',
  roaster: '',
  bean_name: '',
  origin_country: '',
  region: '',
  process_method: '',
  variety: '',
  altitude: '',
  roast_level: null,
  roast_level_custom: '',
  flavor_description: '',
  recommended_resting_days: 7,
  purchase_link: '',
  image_url: '',
};

export default function BeanForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchBeanProfile(id).then(bean => {
        if (bean) {
          const { id: _, user_id: __, created_at: ___, updated_at: ____, ...rest } = bean;
          setForm({ ...EMPTY_FORM, ...rest });
        }
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit && id) {
        await updateBeanProfile(id, form);
        addToast('success', t('toast.bean_updated'));
      } else {
        await createBeanProfile(form);
        addToast('success', t('toast.bean_created'));
      }
      navigate('/beans');
    } catch (err: any) {
      addToast('error', err.message || t('toast.save_failed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-cream-200 dark:bg-espresso-800 rounded-lg" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/beans')} className="btn-ghost btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="page-title">{isEdit ? t('beans.edit') : t('beans.new')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">{t('beans.bean_name')} *</label>
              <input
                type="text"
                value={form.bean_name}
                onChange={e => handleChange('bean_name', e.target.value)}
                className="input"
                placeholder={t('beans.placeholder_name')}
                required
              />
            </div>

            <div>
              <label className="label">{t('beans.brand')} *</label>
              <input
                type="text"
                value={form.brand}
                onChange={e => handleChange('brand', e.target.value)}
                className="input"
                placeholder={t('beans.placeholder_brand')}
                required
              />
            </div>

            <div>
              <label className="label">{t('beans.roaster')}</label>
              <input
                type="text"
                value={form.roaster || ''}
                onChange={e => handleChange('roaster', e.target.value || null)}
                className="input"
                placeholder={t('beans.placeholder_roaster')}
              />
            </div>

            <div>
              <label className="label">{t('beans.origin_country')}</label>
              <input
                type="text"
                value={form.origin_country || ''}
                onChange={e => handleChange('origin_country', e.target.value || null)}
                className="input"
                placeholder={t('beans.placeholder_origin')}
              />
            </div>

            <div>
              <label className="label">{t('beans.region')}</label>
              <input
                type="text"
                value={form.region || ''}
                onChange={e => handleChange('region', e.target.value || null)}
                className="input"
                placeholder={t('beans.placeholder_region')}
              />
            </div>

            <div>
              <label className="label">{t('beans.process_method')}</label>
              <select
                value={form.process_method || ''}
                onChange={e => handleChange('process_method', e.target.value || null)}
                className="input"
              >
                <option value="">{t('beans.select')}</option>
                <option value="Washed">{t('process.washed')}</option>
                <option value="Natural">{t('process.natural')}</option>
                <option value="Honey">{t('process.honey')}</option>
                <option value="Wet-hulled">{t('process.wet_hulled')}</option>
                <option value="Anaerobic">{t('process.anaerobic')}</option>
                <option value="Carbonic Maceration">{t('process.carbonic_maceration')}</option>
                <option value="Experimental">{t('process.experimental')}</option>
              </select>
            </div>

            <div>
              <label className="label">{t('beans.variety')}</label>
              <input
                type="text"
                value={form.variety || ''}
                onChange={e => handleChange('variety', e.target.value || null)}
                className="input"
                placeholder={t('beans.placeholder_variety')}
              />
            </div>

            <div>
              <label className="label">{t('beans.altitude')}</label>
              <input
                type="text"
                value={form.altitude || ''}
                onChange={e => handleChange('altitude', e.target.value || null)}
                className="input"
                placeholder={t('beans.placeholder_altitude')}
              />
            </div>

            <div>
              <label className="label">{t('beans.roast_level')}</label>
              <select
                value={form.roast_level || ''}
                onChange={e => handleChange('roast_level', e.target.value as RoastLevel || null)}
                className="input"
              >
                <option value="">{t('beans.select')}</option>
                {ROAST_LEVELS.map(r => (
                  <option key={r.value} value={r.value}>{t(r.label)}</option>
                ))}
              </select>
            </div>

            {form.roast_level === 'custom' && (
              <div>
                <label className="label">{t('beans.custom_roast')}</label>
                <input
                  type="text"
                  value={form.roast_level_custom || ''}
                  onChange={e => handleChange('roast_level_custom', e.target.value || null)}
                  className="input"
                  placeholder={t('beans.placeholder_custom_roast')}
                />
              </div>
            )}

            <div>
              <label className="label">{t('beans.resting_days')}</label>
              <input
                type="number"
                value={form.recommended_resting_days}
                onChange={e => handleChange('recommended_resting_days', parseInt(e.target.value) || 7)}
                className="input"
                min={0}
                max={60}
              />
            </div>

            <div>
              <label className="label">{t('beans.purchase_link')}</label>
              <input
                type="url"
                value={form.purchase_link || ''}
                onChange={e => handleChange('purchase_link', e.target.value || null)}
                className="input"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="label">{t('beans.image_url')}</label>
              <input
                type="url"
                value={form.image_url || ''}
                onChange={e => handleChange('image_url', e.target.value || null)}
                className="input"
                placeholder="https://..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label">{t('beans.flavor_description')}</label>
              <textarea
                value={form.flavor_description || ''}
                onChange={e => handleChange('flavor_description', e.target.value || null)}
                className="input min-h-[80px]"
                placeholder={t('beans.placeholder_flavor')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-cream-200 dark:border-espresso-800">
            <button type="button" onClick={() => navigate('/beans')} className="btn-secondary">
              {t('common.cancel')}
            </button>
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
