import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, BookOpen } from 'lucide-react';
import type { Batch, BrewDevice, Recipe, PourStep } from '../lib/types';
import { fetchBatches, fetchRecipes, fetchBrewRecord, createBrewRecord, updateBrewRecord } from '../lib/utils';
import { BREW_DEVICES } from '../lib/types';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from '../contexts/LanguageContext';

function defaultBrewDate(dateParam: string | null) {
  if (!dateParam) return new Date().toISOString().slice(0, 16);
  const currentTime = new Date().toTimeString().slice(0, 5);
  return `${dateParam}T${currentTime}`;
}

export default function BrewForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const [form, setForm] = useState({
    batch_id: searchParams.get('batch') || '',
    recipe_id: '',
    brew_date: defaultBrewDate(searchParams.get('date')),
    device: 'v60' as BrewDevice,
    grind_setting: '',
    water_temp_c: '',
    dose_grams: '',
    yield_ml: '',
    ratio: '',
    total_time_seconds: '',
    pour_scheme: [] as PourStep[],
    filter_type: '',
    cups: '1',
    rating: '' as string,
    notes: '',
  });

  useEffect(() => {
    Promise.all([
      fetchBatches(),
      fetchRecipes(),
    ]).then(([batchData, recipeData]) => {
      setBatches(batchData.filter(b => b.status === 'in_use' || b.status === 'ready'));
      setRecipes(recipeData);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchBrewRecord(id).then(brew => {
        if (brew) {
          setForm({
            batch_id: brew.batch_id,
            recipe_id: brew.recipe_id || '',
            brew_date: brew.brew_date.slice(0, 16),
            device: brew.device,
            grind_setting: brew.grind_setting || '',
            water_temp_c: brew.water_temp_c?.toString() || '',
            dose_grams: brew.dose_grams.toString(),
            yield_ml: brew.yield_ml?.toString() || '',
            ratio: brew.ratio || '',
            total_time_seconds: brew.total_time_seconds?.toString() || '',
            pour_scheme: brew.pour_scheme || [],
            filter_type: brew.filter_type || '',
            cups: brew.cups.toString(),
            rating: brew.rating?.toString() || '',
            notes: brew.notes || '',
          });
        }
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRecipeSelect = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    setForm(prev => ({
      ...prev,
      recipe_id: recipe.id,
      device: recipe.device,
      grind_setting: recipe.default_grind || prev.grind_setting,
      water_temp_c: recipe.default_temp_c?.toString() || prev.water_temp_c,
      dose_grams: recipe.default_dose_grams?.toString() || prev.dose_grams,
      yield_ml: recipe.default_yield_ml?.toString() || prev.yield_ml,
      ratio: recipe.default_ratio || prev.ratio,
      total_time_seconds: recipe.default_time_seconds?.toString() || prev.total_time_seconds,
      pour_scheme: recipe.default_pour_scheme || [],
      filter_type: recipe.default_filter || prev.filter_type,
    }));
  };

  const addPourStep = () => {
    setForm(prev => ({
      ...prev,
      pour_scheme: [...prev.pour_scheme, { time: '', action: '', amount: 0 }],
    }));
  };

  const updatePourStep = (index: number, field: keyof PourStep, value: any) => {
    setForm(prev => ({
      ...prev,
      pour_scheme: prev.pour_scheme.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      ),
    }));
  };

  const removePourStep = (index: number) => {
    setForm(prev => ({
      ...prev,
      pour_scheme: prev.pour_scheme.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batch_id) {
      addToast('error', t('toast.batch_required'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        batch_id: form.batch_id,
        recipe_id: form.recipe_id || null,
        brew_date: form.brew_date || new Date().toISOString(),
        device: form.device,
        grind_setting: form.grind_setting || null,
        water_temp_c: form.water_temp_c ? parseFloat(form.water_temp_c) : null,
        dose_grams: parseFloat(form.dose_grams) || 0,
        yield_ml: form.yield_ml ? parseFloat(form.yield_ml) : null,
        ratio: form.ratio || null,
        total_time_seconds: form.total_time_seconds ? parseInt(form.total_time_seconds) : null,
        pour_scheme: form.pour_scheme.length > 0 ? form.pour_scheme : null,
        filter_type: form.filter_type || null,
        cups: parseInt(form.cups) || 1,
        rating: form.rating ? parseInt(form.rating) : null,
        notes: form.notes || null,
      };

      if (isEdit && id) {
        await updateBrewRecord(id, payload);
        addToast('success', t('toast.brew_updated'));
      } else {
        await createBrewRecord(payload as any);
        addToast('success', t('toast.brew_created'));
      }
      navigate('/brews');
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
        <button onClick={() => navigate('/brews')} className="btn-ghost btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="page-title">{isEdit ? t('brews.edit') : t('brews.new')}</h1>
      </div>

      {/* Recipe Quick Select */}
      {!isEdit && recipes.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="section-title flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {t('brews.start_recipe')}
            </h2>
          </div>
          <div className="card-body">
            <div className="flex flex-wrap gap-2">
              {recipes.map(recipe => (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => handleRecipeSelect(recipe.id)}
                  className={`btn-sm ${
                    form.recipe_id === recipe.id
                      ? 'bg-coffee-600 text-white'
                      : 'bg-cream-200 text-espresso-700 dark:bg-espresso-800 dark:text-cream-300'
                  }`}
                >
                  {recipe.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-5">
          {/* Batch Selector */}
          <div>
            <label className="label">{t('brews.batch')} *</label>
            <select
              value={form.batch_id}
              onChange={e => handleChange('batch_id', e.target.value)}
              className="input"
              required
            >
              <option value="">{t('brews.select_batch')}</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.bean_profile?.bean_name} — {b.bean_profile?.brand}
                  {b.batch_code ? ` (${b.batch_code})` : ''} [{b.remaining_grams}g]
                </option>
              ))}
              {form.batch_id && !batches.find(b => b.id === form.batch_id) && (
                <option value={form.batch_id}>{t('brews.prev_batch')}</option>
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('brews.date_time')}</label>
              <input
                type="datetime-local"
                value={form.brew_date}
                onChange={e => handleChange('brew_date', e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">{t('brews.device')} *</label>
              <select value={form.device} onChange={e => handleChange('device', e.target.value)} className="input" required>
                {BREW_DEVICES.map(d => (
                  <option key={d.value} value={d.value}>{t(d.label)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{t('brews.grind_setting')}</label>
              <input type="text" value={form.grind_setting} onChange={e => handleChange('grind_setting', e.target.value)} className="input" placeholder={t('brews.placeholder_grind')} />
            </div>

            <div>
              <label className="label">{t('brews.water_temp')} (°C)</label>
              <input type="number" step="0.1" value={form.water_temp_c} onChange={e => handleChange('water_temp_c', e.target.value)} className="input" placeholder={t('brews.placeholder_temp')} />
            </div>

            <div>
              <label className="label">{t('brews.dose')} (g) *</label>
              <input type="number" step="0.1" value={form.dose_grams} onChange={e => handleChange('dose_grams', e.target.value)} className="input" placeholder={t('brews.placeholder_dose')} required />
            </div>

            <div>
              <label className="label">{t('brews.yield')} (ml)</label>
              <input type="number" step="0.1" value={form.yield_ml} onChange={e => handleChange('yield_ml', e.target.value)} className="input" placeholder={t('brews.placeholder_yield')} />
            </div>

            <div>
              <label className="label">{t('brews.ratio')}</label>
              <input type="text" value={form.ratio} onChange={e => handleChange('ratio', e.target.value)} className="input" placeholder={t('brews.placeholder_ratio')} />
            </div>

            <div>
              <label className="label">{t('brews.total_time_seconds')}</label>
              <input type="number" value={form.total_time_seconds} onChange={e => handleChange('total_time_seconds', e.target.value)} className="input" placeholder={t('brews.placeholder_time')} />
            </div>

            <div>
              <label className="label">{t('brews.filter_type')}</label>
              <input type="text" value={form.filter_type} onChange={e => handleChange('filter_type', e.target.value)} className="input" placeholder={t('brews.placeholder_filter')} />
            </div>

            <div>
              <label className="label">{t('brews.cups')}</label>
              <input type="number" value={form.cups} onChange={e => handleChange('cups', e.target.value)} className="input" min="1" />
            </div>

            <div className="sm:col-span-2">
              <label className="label">{t('brews.rating_1_10')}</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={form.rating || 5}
                  onChange={e => handleChange('rating', e.target.value)}
                  className="slider-track flex-1"
                />
                <span className="text-lg font-display font-bold text-coffee-600 dark:text-coffee-400 w-8 text-center">
                  {form.rating || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Pour Scheme */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">{t('brews.pour_scheme')}</label>
              <button type="button" onClick={addPourStep} className="btn-sm btn-secondary">
                {t('brews.add_step')}
              </button>
            </div>
            {form.pour_scheme.length > 0 && (
              <div className="space-y-2">
                {form.pour_scheme.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={step.time}
                      onChange={e => updatePourStep(i, 'time', e.target.value)}
                      className="input w-20"
                      placeholder="0:00"
                    />
                    <input
                      type="text"
                      value={step.action}
                      onChange={e => updatePourStep(i, 'action', e.target.value)}
                      className="input flex-1"
                      placeholder={t('brews.placeholder_action')}
                    />
                    <input
                      type="number"
                      value={step.amount || ''}
                      onChange={e => updatePourStep(i, 'amount', parseInt(e.target.value) || 0)}
                      className="input w-20"
                      placeholder="g"
                    />
                    <button type="button" onClick={() => removePourStep(i)} className="btn-ghost btn-sm text-terracotta-600">
                      {t('common.x')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label">{t('common.notes')}</label>
            <textarea
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
              className="input min-h-[80px]"
              placeholder={t('brews.notes_placeholder')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-cream-200 dark:border-espresso-800">
            <button type="button" onClick={() => navigate('/brews')} className="btn-secondary">{t('common.cancel')}</button>
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
