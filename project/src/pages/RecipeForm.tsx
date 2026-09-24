import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import ImageManager, { type ManagedImage } from '../components/ImageManager';
import type { BrewDevice, DrinkType, PourStep, RecipeImage, RecipeIngredient, RecipeKind, RecipeStep } from '../lib/types';
import { DRINK_TYPES, RECIPE_BREW_DEVICES } from '../lib/types';
import {
  createRecipe,
  deleteRecipeImage,
  fetchRecipe,
  reorderRecipeImages,
  updateRecipe,
  uploadRecipeImage,
} from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from '../contexts/LanguageContext';

interface RecipeFormState {
  name: string;
  recipe_kind: RecipeKind;
  device: BrewDevice;
  drink_type: DrinkType;
  drink_type_custom: string;
  default_grind: string;
  default_temp_c: string;
  default_dose_grams: string;
  default_yield_ml: string;
  default_ratio: string;
  default_time_seconds: string;
  default_pour_scheme: PourStep[];
  default_filter: string;
  instructions: string;
  ingredients: Array<{ name: string; amount: string; unit: string }>;
  steps: Array<{ order: number; title: string; description: string; duration_seconds: string }>;
}

const EMPTY_FORM: RecipeFormState = {
  name: '',
  recipe_kind: 'brew_method',
  device: 'v60',
  drink_type: 'americano',
  drink_type_custom: '',
  default_grind: '',
  default_temp_c: '',
  default_dose_grams: '',
  default_yield_ml: '',
  default_ratio: '',
  default_time_seconds: '',
  default_pour_scheme: [],
  default_filter: '',
  instructions: '',
  ingredients: [],
  steps: [],
};

export default function RecipeForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [form, setForm] = useState<RecipeFormState>(() => ({
    ...EMPTY_FORM,
    recipe_kind: searchParams.get('kind') === 'drink' ? 'drink' : 'brew_method',
  }));
  const [savedImages, setSavedImages] = useState<ManagedImage[]>([]);
  const [pendingImages, setPendingImages] = useState<Array<{ id: string; file: File; url: string }>>([]);

  useEffect(() => {
    if (!id) return;
    fetchRecipe(id).then(recipe => {
      if (!recipe) return;
      if (recipe.is_default) {
        navigate(`/recipes/${recipe.id}`, { replace: true });
        return;
      }
      setForm({
        name: recipe.name,
        recipe_kind: recipe.recipe_kind,
        device: recipe.device || 'v60',
        drink_type: recipe.drink_type || 'americano',
        drink_type_custom: recipe.drink_type_custom || '',
        default_grind: recipe.default_grind || '',
        default_temp_c: recipe.default_temp_c?.toString() || '',
        default_dose_grams: recipe.default_dose_grams?.toString() || '',
        default_yield_ml: recipe.default_yield_ml?.toString() || '',
        default_ratio: recipe.default_ratio || '',
        default_time_seconds: recipe.default_time_seconds?.toString() || '',
        default_pour_scheme: recipe.default_pour_scheme || [],
        default_filter: recipe.default_filter || '',
        instructions: recipe.instructions || '',
        ingredients: recipe.ingredients.map(item => ({ ...item, amount: String(item.amount) })),
        steps: recipe.steps.map(step => ({ ...step, duration_seconds: step.duration_seconds == null ? '' : String(step.duration_seconds) })),
      });
      setSavedImages((recipe.images || []).map(image => ({ id: image.id, url: image.url || image.external_url || undefined })));
    }).catch(console.error).finally(() => setLoading(false));
  }, [id, navigate]);

  const images: ManagedImage[] = [
    ...savedImages,
    ...pendingImages.map(image => ({ id: image.id, url: image.url })),
  ];

  const handleChange = <K extends keyof RecipeFormState>(field: K, value: RecipeFormState[K]) => {
    setForm(previous => ({ ...previous, [field]: value }));
  };

  const handleAddImages = async (files: File[]) => {
    const allowed = files.slice(0, 5 - images.length);
    if (allowed.length === 0) return;
    if (isEdit && id) {
      setImageBusy(true);
      try {
        const uploaded: RecipeImage[] = [];
        for (const file of allowed) uploaded.push(await uploadRecipeImage(id, file));
        setSavedImages(previous => [...previous, ...uploaded.map(image => ({ id: image.id, url: image.url }))]);
      } catch (err: any) {
        addToast('error', err.message || t('toast.image_upload_failed'));
      } finally {
        setImageBusy(false);
      }
      return;
    }
    setPendingImages(previous => [
      ...previous,
      ...allowed.map(file => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) })),
    ]);
  };

  const handleRemoveImage = async (imageId: string) => {
    const pending = pendingImages.find(image => image.id === imageId);
    if (pending) {
      URL.revokeObjectURL(pending.url);
      setPendingImages(previous => previous.filter(image => image.id !== imageId));
      return;
    }
    if (!isEdit) return;
    setImageBusy(true);
    try {
      await deleteRecipeImage(imageId);
      setSavedImages(previous => previous.filter(image => image.id !== imageId));
    } catch (err: any) {
      addToast('error', err.message || t('toast.image_delete_failed'));
    } finally {
      setImageBusy(false);
    }
  };

  const handleReorderImages = async (imageIds: string[]) => {
    const savedIds = new Set(savedImages.map(image => image.id));
    if (!isEdit) {
      setPendingImages(previous => imageIds.map(imageId => previous.find(image => image.id === imageId)).filter(Boolean) as typeof previous);
      return;
    }
    if (!id || imageIds.some(imageId => !savedIds.has(imageId))) return;
    setImageBusy(true);
    try {
      await reorderRecipeImages(id, imageIds);
      setSavedImages(previous => imageIds.map(imageId => previous.find(image => image.id === imageId)).filter(Boolean) as ManagedImage[]);
    } catch (err: any) {
      addToast('error', err.message || t('toast.image_order_failed'));
    } finally {
      setImageBusy(false);
    }
  };

  const addIngredient = () => handleChange('ingredients', [...form.ingredients, { name: '', amount: '', unit: 'ml' }]);
  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: string) => {
    handleChange('ingredients', form.ingredients.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  };

  const addStep = () => handleChange('steps', [...form.steps, { order: form.steps.length + 1, title: '', description: '', duration_seconds: '' }]);
  const updateStep = (index: number, field: keyof RecipeStep, value: string) => {
    handleChange('steps', form.steps.map((step, stepIndex) => stepIndex === index ? { ...step, [field]: value } : step));
  };
  const removeStep = (index: number) => handleChange('steps', form.steps.filter((_, stepIndex) => stepIndex !== index).map((step, stepIndex) => ({ ...step, order: stepIndex + 1 })));

  const addPourStep = () => handleChange('default_pour_scheme', [...form.default_pour_scheme, { time: '', action: '', amount: 0 }]);
  const updatePourStep = (index: number, field: keyof PourStep, value: string | number) => {
    handleChange('default_pour_scheme', form.default_pour_scheme.map((step, stepIndex) => stepIndex === index ? { ...step, [field]: value } : step));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        recipe_kind: form.recipe_kind,
        device: form.recipe_kind === 'brew_method' ? form.device : null,
        drink_type: form.recipe_kind === 'drink' ? form.drink_type : null,
        drink_type_custom: form.recipe_kind === 'drink' && form.drink_type === 'other' ? form.drink_type_custom.trim() || null : null,
        default_grind: form.recipe_kind === 'brew_method' ? form.default_grind || null : null,
        default_temp_c: form.recipe_kind === 'brew_method' && form.default_temp_c ? Number(form.default_temp_c) : null,
        default_dose_grams: form.recipe_kind === 'brew_method' && form.default_dose_grams ? Number(form.default_dose_grams) : null,
        default_yield_ml: form.recipe_kind === 'brew_method' && form.default_yield_ml ? Number(form.default_yield_ml) : null,
        default_ratio: form.recipe_kind === 'brew_method' ? form.default_ratio || null : null,
        default_time_seconds: form.recipe_kind === 'brew_method' && form.default_time_seconds ? Number(form.default_time_seconds) : null,
        default_pour_scheme: form.recipe_kind === 'brew_method' && form.default_pour_scheme.length > 0 ? form.default_pour_scheme : null,
        default_filter: form.recipe_kind === 'brew_method' ? form.default_filter || null : null,
        instructions: form.instructions.trim() || null,
        ingredients: form.ingredients.filter(item => item.name.trim()).map(item => ({ name: item.name.trim(), amount: item.amount, unit: item.unit.trim() })),
        steps: form.steps.filter(step => step.title.trim() || step.description.trim()).map((step, index) => ({
          order: index + 1,
          title: step.title.trim(),
          description: step.description.trim(),
          duration_seconds: step.duration_seconds ? Number(step.duration_seconds) : null,
        })),
        is_default: false,
      };

      if (isEdit && id) {
        await updateRecipe(id, payload);
        addToast('success', t('toast.recipe_updated'));
        navigate(`/recipes/${id}`);
      } else {
        const created = await createRecipe(payload);
        let imageFailed = false;
        for (const pending of pendingImages) {
          try { await uploadRecipeImage(created.id, pending.file); } catch { imageFailed = true; }
        }
        addToast(imageFailed ? 'error' : 'success', imageFailed ? t('toast.recipe_created_image_failed') : t('toast.recipe_created'));
        navigate(`/recipes/${created.id}`);
      }
    } catch (err: any) {
      addToast('error', err.message || t('toast.save_failed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-8 w-64 bg-cream-200 dark:bg-espresso-800" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(isEdit && id ? `/recipes/${id}` : '/recipes')} className="btn-ghost btn-icon"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="page-title">{isEdit ? t('recipes.edit') : t('recipes.new')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-7">
          <div>
            <label className="label">{t('recipes.kind')} *</label>
            <div className="grid grid-cols-2 gap-1 bg-cream-100 p-1 dark:bg-espresso-800">
              {(['brew_method', 'drink'] as RecipeKind[]).map(item => (
                <button key={item} type="button" className={`h-10 px-3 text-sm font-medium transition-colors ${form.recipe_kind === item ? 'bg-white text-coffee-700 shadow-card dark:bg-espresso-700 dark:text-coffee-300' : 'text-espresso-500 dark:text-espresso-400'}`} onClick={() => handleChange('recipe_kind', item)}>
                  {t(`recipes.kind_${item}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">{t('recipes.name')} *</label>
              <input className="input" required value={form.name} onChange={event => handleChange('name', event.target.value)} placeholder={t('recipes.placeholder_name')} />
            </div>
            {form.recipe_kind === 'brew_method' ? (
              <>
                <div>
                  <label className="label">{t('recipes.device')} *</label>
                  <select className="input" required value={form.device} onChange={event => handleChange('device', event.target.value as BrewDevice)}>
                    {RECIPE_BREW_DEVICES.map(item => <option key={item.value} value={item.value}>{t(item.label)}</option>)}
                  </select>
                </div>
                <div><label className="label">{t('recipes.default_grind')}</label><input className="input" value={form.default_grind} onChange={event => handleChange('default_grind', event.target.value)} placeholder={t('recipes.placeholder_grind')} /></div>
                <div><label className="label">{t('recipes.default_temp')}</label><input type="number" step="0.1" className="input" value={form.default_temp_c} onChange={event => handleChange('default_temp_c', event.target.value)} /></div>
                <div><label className="label">{t('recipes.default_dose')}</label><input type="number" step="0.1" className="input" value={form.default_dose_grams} onChange={event => handleChange('default_dose_grams', event.target.value)} /></div>
                <div><label className="label">{t('recipes.default_yield')}</label><input type="number" step="0.1" className="input" value={form.default_yield_ml} onChange={event => handleChange('default_yield_ml', event.target.value)} /></div>
                <div><label className="label">{t('recipes.default_ratio')}</label><input className="input" value={form.default_ratio} onChange={event => handleChange('default_ratio', event.target.value)} /></div>
                <div><label className="label">{t('recipes.default_time')}</label><input type="number" className="input" value={form.default_time_seconds} onChange={event => handleChange('default_time_seconds', event.target.value)} /></div>
                <div><label className="label">{t('recipes.default_filter')}</label><input className="input" value={form.default_filter} onChange={event => handleChange('default_filter', event.target.value)} /></div>
              </>
            ) : (
              <>
                <div>
                  <label className="label">{t('recipes.drink_type')} *</label>
                  <select className="input" required value={form.drink_type} onChange={event => handleChange('drink_type', event.target.value as DrinkType)}>
                    {DRINK_TYPES.map(item => <option key={item.value} value={item.value}>{t(item.label)}</option>)}
                  </select>
                </div>
                {form.drink_type === 'other' && <div><label className="label">{t('recipes.drink_type_custom')} *</label><input className="input" required value={form.drink_type_custom} onChange={event => handleChange('drink_type_custom', event.target.value)} /></div>}
              </>
            )}
          </div>

          {form.recipe_kind === 'drink' && <section>
            <div className="mb-3 flex items-center justify-between gap-3"><h2 className="section-title">{t('recipes.ingredients')}</h2><button type="button" className="btn-secondary btn-sm" onClick={addIngredient}><Plus className="h-4 w-4" />{t('recipes.add_ingredient')}</button></div>
            <div className="space-y-3">
              {form.ingredients.map((ingredient, index) => (
                <div key={index} className="grid grid-cols-1 gap-2 border-b border-cream-200 pb-3 sm:grid-cols-[minmax(0,1fr)_100px_90px_40px] dark:border-espresso-800">
                  <input className="input" value={ingredient.name} onChange={event => updateIngredient(index, 'name', event.target.value)} placeholder={t('recipes.ingredient_name')} />
                  <input className="input" value={ingredient.amount} onChange={event => updateIngredient(index, 'amount', event.target.value)} placeholder={t('recipes.amount')} />
                  <input className="input" value={ingredient.unit} onChange={event => updateIngredient(index, 'unit', event.target.value)} placeholder={t('recipes.unit')} />
                  <button type="button" className="btn-ghost btn-icon text-terracotta-600" onClick={() => handleChange('ingredients', form.ingredients.filter((_, itemIndex) => itemIndex !== index))} title={t('common.delete')}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {form.ingredients.length === 0 && <p className="text-sm text-espresso-500">{t('recipes.no_ingredients')}</p>}
            </div>
          </section>}

          {form.recipe_kind === 'drink' && <section>
            <div className="mb-3 flex items-center justify-between gap-3"><h2 className="section-title">{t('recipes.steps')}</h2><button type="button" className="btn-secondary btn-sm" onClick={addStep}><Plus className="h-4 w-4" />{t('recipes.add_step')}</button></div>
            <div className="space-y-4">
              {form.steps.map((step, index) => (
                <div key={index} className="grid grid-cols-[32px_minmax(0,1fr)_40px] gap-2 border-b border-cream-200 pb-4 dark:border-espresso-800">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-coffee-600 text-sm font-semibold text-white">{index + 1}</span>
                  <div className="space-y-2">
                    <input className="input" value={step.title} onChange={event => updateStep(index, 'title', event.target.value)} placeholder={t('recipes.step_title')} />
                    <textarea className="input min-h-20" value={step.description} onChange={event => updateStep(index, 'description', event.target.value)} placeholder={t('recipes.step_description')} />
                    <input type="number" min="0" className="input max-w-48" value={step.duration_seconds} onChange={event => updateStep(index, 'duration_seconds', event.target.value)} placeholder={t('recipes.step_duration')} />
                  </div>
                  <button type="button" className="btn-ghost btn-icon text-terracotta-600" onClick={() => removeStep(index)} title={t('common.delete')}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {form.steps.length === 0 && <p className="text-sm text-espresso-500">{t('recipes.no_steps')}</p>}
            </div>
          </section>}

          {form.recipe_kind === 'brew_method' && (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3"><h2 className="section-title">{t('recipes.default_pour_scheme')}</h2><button type="button" className="btn-secondary btn-sm" onClick={addPourStep}><Plus className="h-4 w-4" />{t('brews.add_step')}</button></div>
              <div className="space-y-2">
                {form.default_pour_scheme.map((step, index) => (
                  <div key={index} className="grid grid-cols-[80px_minmax(0,1fr)_80px_40px] gap-2">
                    <input className="input" value={step.time} onChange={event => updatePourStep(index, 'time', event.target.value)} placeholder="0:00" />
                    <input className="input" value={step.action} onChange={event => updatePourStep(index, 'action', event.target.value)} placeholder={t('recipes.placeholder_action')} />
                    <input type="number" className="input" value={step.amount || ''} onChange={event => updatePourStep(index, 'amount', Number(event.target.value))} placeholder="g" />
                    <button type="button" className="btn-ghost btn-icon text-terracotta-600" onClick={() => handleChange('default_pour_scheme', form.default_pour_scheme.filter((_, itemIndex) => itemIndex !== index))} title={t('common.delete')}><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div>
            <label className="label">{t('recipes.instructions')}{form.recipe_kind === 'drink' ? ' *' : ''}</label>
            <textarea className="input min-h-28" required={form.recipe_kind === 'drink'} value={form.instructions} onChange={event => handleChange('instructions', event.target.value)} placeholder={t('recipes.instructions_placeholder')} />
          </div>

          <div className="border-t border-cream-200 pt-5 dark:border-espresso-800">
            <ImageManager images={images} maxImages={5} busy={imageBusy || saving} onAdd={handleAddImages} onRemove={handleRemoveImage} onReorder={handleReorderImages} />
          </div>

          <div className="flex justify-end gap-3 border-t border-cream-200 pt-4 dark:border-espresso-800">
            <button type="button" onClick={() => navigate(isEdit && id ? `/recipes/${id}` : '/recipes')} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" disabled={saving || imageBusy} className="btn-primary"><Save className="h-4 w-4" />{saving ? t('common.saving') : isEdit ? t('common.update') : t('common.create')}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
