import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Edit3, FlaskConical, Trash2 } from 'lucide-react';
import ImageGallery from '../components/ImageGallery';
import type { Recipe } from '../lib/types';
import { getDrinkTypeLabel, getRecipeDeviceLabelT, getRecipeDisplayName } from '../lib/types';
import { cloneRecipe, deleteRecipe, fetchRecipe } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from '../contexts/LanguageContext';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useTranslation();
  const { addToast } = useToast();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchRecipe(id).then(setRecipe).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleClone = async () => {
    if (!recipe) return;
    setWorking(true);
    try {
      const created = await cloneRecipe(recipe, `${getRecipeDisplayName(recipe, 'zh')} (${t('recipes.clone_suffix')})`);
      addToast('success', t('toast.recipe_cloned'));
      navigate(`/recipes/${created.id}`);
    } catch (err: any) {
      addToast('error', err.message || t('toast.recipe_clone_failed'));
    } finally {
      setWorking(false);
    }
  };

  const handleDelete = async () => {
    if (!recipe || recipe.is_default || !confirm(t('confirm.delete_recipe'))) return;
    setWorking(true);
    try {
      await deleteRecipe(recipe.id);
      addToast('success', t('toast.recipe_deleted'));
      navigate('/recipes');
    } catch (err: any) {
      addToast('error', err.message || t('toast.delete_failed'));
      setWorking(false);
    }
  };

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-8 w-64 bg-cream-200 dark:bg-espresso-800" /><div className="h-72 bg-cream-100 dark:bg-espresso-800" /></div>;
  if (!recipe) return <div className="empty-state"><FlaskConical className="empty-icon" /><p className="empty-title">{t('recipes.not_found')}</p></div>;

  const parameters = [
    [t('recipes.device'), recipe.device ? getRecipeDeviceLabelT(recipe.device, t) : null],
    [t('recipes.default_grind'), recipe.default_grind],
    [t('recipes.default_temp'), recipe.default_temp_c != null ? `${recipe.default_temp_c}°C` : null],
    [t('recipes.default_dose'), recipe.default_dose_grams != null ? `${recipe.default_dose_grams}g` : null],
    [t('recipes.default_yield'), recipe.default_yield_ml != null ? `${recipe.default_yield_ml}ml` : null],
    [t('recipes.default_ratio'), recipe.default_ratio],
    [t('recipes.default_time'), recipe.default_time_seconds != null ? `${recipe.default_time_seconds}s` : null],
    [t('recipes.default_filter'), recipe.default_filter],
  ].filter(([, value]) => value && recipe.recipe_kind === 'brew_method');
  const displayName = getRecipeDisplayName(recipe, language);
  const secondaryName = recipe.is_default ? (language === 'zh' ? recipe.name_en : recipe.name_zh) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => navigate('/recipes')} className="btn-ghost btn-icon"><ArrowLeft className="h-5 w-5" /></button>
          <div className="min-w-0">
            <h1 className="page-title break-words">{displayName}</h1>
            {secondaryName && <p className="mt-1 text-sm text-espresso-500 dark:text-espresso-400">{secondaryName}</p>}
            <div className="mt-1 flex gap-2">
              <span className={recipe.recipe_kind === 'drink' ? 'badge bg-terracotta-100 text-terracotta-700 dark:bg-terracotta-900 dark:text-terracotta-300' : 'badge bg-sage-100 text-sage-700 dark:bg-sage-900 dark:text-sage-300'}>{t(`recipes.kind_${recipe.recipe_kind}`)}</span>
              {recipe.is_default && <span className="badge bg-coffee-100 text-coffee-700 dark:bg-coffee-900 dark:text-coffee-300">{t('recipes.builtin_badge')}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {recipe.recipe_kind === 'brew_method' && <Link to={`/brews/new?recipe=${recipe.id}`} className="btn-primary"><FlaskConical className="h-4 w-4" />{t('recipes.brew')}</Link>}
          {recipe.is_default ? (
            <button type="button" className="btn-secondary" disabled={working} onClick={handleClone}><Copy className="h-4 w-4" />{t('common.copy')}</button>
          ) : (
            <>
              <Link to={`/recipes/${recipe.id}/edit`} className="btn-secondary"><Edit3 className="h-4 w-4" />{t('common.edit')}</Link>
              <button type="button" className="btn-danger btn-icon" disabled={working} onClick={handleDelete} title={t('common.delete')}><Trash2 className="h-4 w-4" /></button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div className="space-y-6">
          <div className="card overflow-hidden"><ImageGallery images={recipe.images || []} alt={displayName} /></div>

          {recipe.recipe_kind === 'drink' && recipe.drink_type && <p className="text-sm text-espresso-600 dark:text-espresso-400">{t('recipes.drink_type')}: {getDrinkTypeLabel(recipe.drink_type, recipe.drink_type_custom, t)}</p>}

          {recipe.ingredients.length > 0 && (
            <section>
              <h2 className="section-title mb-3">{t('recipes.ingredients')}</h2>
              <div className="divide-y divide-cream-200 border-y border-cream-200 dark:divide-espresso-800 dark:border-espresso-800">
                {recipe.ingredients.map((ingredient, index) => (
                  <div key={`${ingredient.name}-${index}`} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span className="font-medium text-espresso-800 dark:text-cream-200">{ingredient.name}</span>
                    <span className="text-espresso-500 dark:text-espresso-400">{ingredient.amount} {ingredient.unit}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {recipe.steps.length > 0 && (
            <section>
              <h2 className="section-title mb-3">{t('recipes.steps')}</h2>
              <ol className="space-y-4">
                {[...recipe.steps].sort((a, b) => a.order - b.order).map(step => (
                  <li key={step.order} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coffee-600 text-sm font-semibold text-white">{step.order}</span>
                    <div className="min-w-0 pt-0.5">
                      <h3 className="font-medium text-espresso-900 dark:text-cream-100">{step.title}</h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-espresso-600 dark:text-espresso-400">{step.description}</p>
                      {step.duration_seconds != null && <p className="mt-1 text-xs text-espresso-500">{t('recipes.duration_seconds', { seconds: step.duration_seconds })}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {recipe.instructions && (
            <section>
              <h2 className="section-title mb-3">{t('recipes.instructions')}</h2>
              <p className="whitespace-pre-wrap text-sm leading-6 text-espresso-700 dark:text-cream-300">{recipe.instructions}</p>
            </section>
          )}
        </div>

        {recipe.recipe_kind === 'brew_method' && <aside>
          <h2 className="section-title mb-3">{t('recipes.parameters')}</h2>
          <dl className="divide-y divide-cream-200 border-y border-cream-200 dark:divide-espresso-800 dark:border-espresso-800">
            {parameters.map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 py-3 text-sm">
                <dt className="text-espresso-500 dark:text-espresso-400">{label}</dt>
                <dd className="text-right font-medium text-espresso-800 dark:text-cream-200">{value}</dd>
              </div>
            ))}
          </dl>
        </aside>}
      </div>
    </div>
  );
}
