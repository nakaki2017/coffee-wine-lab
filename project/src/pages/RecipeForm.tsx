import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import type { BrewDevice, PourStep } from '../lib/types';
import { fetchRecipes, createRecipe, updateRecipe } from '../lib/utils';
import { BREW_DEVICES } from '../lib/types';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from '../contexts/LanguageContext';

export default function RecipeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const isEdit = !!id;
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    device: 'v60' as BrewDevice,
    default_grind: '',
    default_temp_c: '',
    default_dose_grams: '',
    default_yield_ml: '',
    default_ratio: '',
    default_time_seconds: '',
    default_pour_scheme: [] as PourStep[],
    default_filter: '',
    instructions: '',
  });

  useEffect(() => {
    if (id) {
      fetchRecipes().then(recipes => {
        const recipe = recipes.find(r => r.id === id);
        if (recipe) {
          setForm({
            name: recipe.name,
            device: recipe.device,
            default_grind: recipe.default_grind || '',
            default_temp_c: recipe.default_temp_c?.toString() || '',
            default_dose_grams: recipe.default_dose_grams?.toString() || '',
            default_yield_ml: recipe.default_yield_ml?.toString() || '',
            default_ratio: recipe.default_ratio || '',
            default_time_seconds: recipe.default_time_seconds?.toString() || '',
            default_pour_scheme: recipe.default_pour_scheme || [],
            default_filter: recipe.default_filter || '',
            instructions: recipe.instructions || '',
          });
        }
      }).catch(console.error);
    }
  }, [id]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addPourStep = () => {
    setForm(prev => ({
      ...prev,
      default_pour_scheme: [...prev.default_pour_scheme, { time: '', action: '', amount: 0 }],
    }));
  };

  const updatePourStep = (index: number, field: keyof PourStep, value: any) => {
    setForm(prev => ({
      ...prev,
      default_pour_scheme: prev.default_pour_scheme.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      ),
    }));
  };

  const removePourStep = (index: number) => {
    setForm(prev => ({
      ...prev,
      default_pour_scheme: prev.default_pour_scheme.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        device: form.device,
        default_grind: form.default_grind || null,
        default_temp_c: form.default_temp_c ? parseFloat(form.default_temp_c) : null,
        default_dose_grams: form.default_dose_grams ? parseFloat(form.default_dose_grams) : null,
        default_yield_ml: form.default_yield_ml ? parseFloat(form.default_yield_ml) : null,
        default_ratio: form.default_ratio || null,
        default_time_seconds: form.default_time_seconds ? parseInt(form.default_time_seconds) : null,
        default_pour_scheme: form.default_pour_scheme.length > 0 ? form.default_pour_scheme : null,
        default_filter: form.default_filter || null,
        instructions: form.instructions || null,
        is_default: false,
      };

      if (isEdit && id) {
        await updateRecipe(id, payload);
        addToast('success', t('toast.recipe_updated'));
      } else {
        await createRecipe(payload);
        addToast('success', t('toast.recipe_created'));
      }
      navigate('/recipes');
    } catch (err: any) {
      addToast('error', err.message || t('toast.save_failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/recipes')} className="btn-ghost btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="page-title">{isEdit ? t('recipes.edit') : t('recipes.new')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">{t('recipes.name')} *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                className="input"
                placeholder={t('recipes.placeholder_name')}
                required
              />
            </div>

            <div>
              <label className="label">{t('recipes.device')} *</label>
              <select value={form.device} onChange={e => handleChange('device', e.target.value)} className="input" required>
                {BREW_DEVICES.map(d => (
                  <option key={d.value} value={d.value}>{t(d.label)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{t('recipes.default_grind')}</label>
              <input type="text" value={form.default_grind} onChange={e => handleChange('default_grind', e.target.value)} className="input" placeholder={t('recipes.placeholder_grind')} />
            </div>

            <div>
              <label className="label">{t('recipes.default_temp')}</label>
              <input type="number" step="0.1" value={form.default_temp_c} onChange={e => handleChange('default_temp_c', e.target.value)} className="input" placeholder={t('recipes.placeholder_temp')} />
            </div>

            <div>
              <label className="label">{t('recipes.default_dose')}</label>
              <input type="number" step="0.1" value={form.default_dose_grams} onChange={e => handleChange('default_dose_grams', e.target.value)} className="input" placeholder={t('recipes.placeholder_dose')} />
            </div>

            <div>
              <label className="label">{t('recipes.default_yield')}</label>
              <input type="number" step="0.1" value={form.default_yield_ml} onChange={e => handleChange('default_yield_ml', e.target.value)} className="input" placeholder={t('recipes.placeholder_yield')} />
            </div>

            <div>
              <label className="label">{t('recipes.default_ratio')}</label>
              <input type="text" value={form.default_ratio} onChange={e => handleChange('default_ratio', e.target.value)} className="input" placeholder={t('recipes.placeholder_ratio')} />
            </div>

            <div>
              <label className="label">{t('recipes.default_time')}</label>
              <input type="number" value={form.default_time_seconds} onChange={e => handleChange('default_time_seconds', e.target.value)} className="input" placeholder={t('recipes.placeholder_time')} />
            </div>

            <div>
              <label className="label">{t('recipes.default_filter')}</label>
              <input type="text" value={form.default_filter} onChange={e => handleChange('default_filter', e.target.value)} className="input" placeholder={t('recipes.placeholder_filter')} />
            </div>
          </div>

          {/* Pour Scheme */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">{t('recipes.default_pour_scheme')}</label>
              <button type="button" onClick={addPourStep} className="btn-sm btn-secondary">{t('brews.add_step')}</button>
            </div>
            {form.default_pour_scheme.length > 0 && (
              <div className="space-y-2">
                {form.default_pour_scheme.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="text" value={step.time} onChange={e => updatePourStep(i, 'time', e.target.value)} className="input w-20" placeholder="0:00" />
                    <input type="text" value={step.action} onChange={e => updatePourStep(i, 'action', e.target.value)} className="input flex-1" placeholder={t('recipes.placeholder_action')} />
                    <input type="number" value={step.amount || ''} onChange={e => updatePourStep(i, 'amount', parseInt(e.target.value) || 0)} className="input w-20" placeholder="g" />
                    <button type="button" onClick={() => removePourStep(i)} className="btn-ghost btn-sm text-terracotta-600">{t('common.x')}</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label">{t('recipes.instructions')}</label>
            <textarea
              value={form.instructions}
              onChange={e => handleChange('instructions', e.target.value)}
              className="input min-h-[80px]"
              placeholder={t('recipes.instructions_placeholder')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-cream-200 dark:border-espresso-800">
            <button type="button" onClick={() => navigate('/recipes')} className="btn-secondary">{t('common.cancel')}</button>
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
