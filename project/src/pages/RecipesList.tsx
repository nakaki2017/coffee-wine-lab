import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Copy, FlaskConical, ImageIcon, Plus, Search } from 'lucide-react';
import type { BrewDevice, Recipe, RecipeKind } from '../lib/types';
import { DRINK_TYPES, RECIPE_BREW_DEVICES, getDrinkTypeLabel, getRecipeDeviceLabelT, getRecipeDisplayName } from '../lib/types';
import { cloneRecipe, fetchRecipes } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from '../contexts/LanguageContext';

interface RecipeCardProps { recipe: Recipe; cloning: boolean; onClone: (recipe: Recipe) => void; }

function RecipeCard({ recipe, cloning, onClone }: RecipeCardProps) {
  const { language, t } = useTranslation();
  const cover = recipe.images?.[0]?.url;
  const displayName = getRecipeDisplayName(recipe, language);
  const secondaryName = recipe.is_default ? (language === 'zh' ? recipe.name_en : recipe.name_zh) : null;
  return (
    <article className="card overflow-hidden">
      <Link to={`/recipes/${recipe.id}`} className="block aspect-[16/10] overflow-hidden bg-cream-200 dark:bg-espresso-800">
        {cover ? <img src={cover} alt={displayName} className="h-full w-full object-cover transition-transform duration-200 hover:scale-[1.02]" /> : <span className="flex h-full items-center justify-center"><ImageIcon className="h-10 w-10 text-espresso-300 dark:text-espresso-600" /></span>}
      </Link>
      <div className="card-body space-y-3">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={`/recipes/${recipe.id}`} className="font-display font-semibold text-espresso-900 hover:text-coffee-700 dark:text-cream-100 dark:hover:text-coffee-300">{displayName}</Link>
            {secondaryName && <p className="mt-1 truncate text-xs text-espresso-400 dark:text-espresso-500">{secondaryName}</p>}
            <p className="mt-1 text-xs text-espresso-500 dark:text-espresso-400">{recipe.recipe_kind === 'drink' ? getDrinkTypeLabel(recipe.drink_type, recipe.drink_type_custom, t) : getRecipeDeviceLabelT(recipe.device || 'other', t)}</p>
          </div>
          {recipe.is_default && <span className="badge shrink-0 bg-coffee-100 text-coffee-700 dark:bg-coffee-900 dark:text-coffee-300">{t('recipes.builtin_badge')}</span>}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-espresso-600 dark:text-espresso-400">
          {recipe.recipe_kind === 'brew_method' && recipe.default_dose_grams != null && <div>{recipe.default_dose_grams}g</div>}
          {recipe.recipe_kind === 'brew_method' && recipe.default_yield_ml != null && <div>{recipe.default_yield_ml}ml</div>}
          {recipe.recipe_kind === 'brew_method' && recipe.default_ratio && <div>{recipe.default_ratio}</div>}
          {recipe.recipe_kind === 'drink' && recipe.ingredients.length > 0 && <div>{t('recipes.ingredient_count', { count: recipe.ingredients.length })}</div>}
        </div>
        <div className="flex gap-2">
          <Link to={`/recipes/${recipe.id}`} className="btn-secondary btn-sm flex-1"><BookOpen className="h-3.5 w-3.5" />{t('common.view')}</Link>
          {recipe.recipe_kind === 'brew_method' && <Link to={`/brews/new?recipe=${recipe.id}`} className="btn-primary btn-sm flex-1"><FlaskConical className="h-3.5 w-3.5" />{t('recipes.brew')}</Link>}
          {recipe.is_default && <button type="button" className="btn-secondary btn-icon" disabled={cloning} onClick={() => onClone(recipe)} title={t('common.copy')}><Copy className="h-4 w-4" /></button>}
        </div>
      </div>
    </article>
  );
}

export default function RecipesList() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const kind: RecipeKind = searchParams.get('kind') === 'drink' ? 'drink' : 'brew_method';
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [device, setDevice] = useState<'all' | BrewDevice>('all');
  const [drinkType, setDrinkType] = useState('all');
  const [cloningId, setCloningId] = useState<string | null>(null);

  const loadRecipes = async () => { try { setRecipes(await fetchRecipes()); } catch (err) { console.error(err); } finally { setLoading(false); } };
  useEffect(() => { void loadRecipes(); }, []);

  const filtered = useMemo(() => recipes.filter(recipe => {
    if (recipe.recipe_kind !== kind) return false;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [recipe.name, recipe.name_zh, recipe.name_en].filter(Boolean).some(value => value!.toLowerCase().includes(query));
    return matchesSearch && (kind === 'drink' || device === 'all' || recipe.device === device) && (kind === 'brew_method' || drinkType === 'all' || recipe.drink_type === drinkType);
  }), [recipes, kind, search, device, drinkType]);

  const handleKindChange = (nextKind: RecipeKind) => { setSearchParams({ kind: nextKind }); setSearch(''); setDevice('all'); setDrinkType('all'); };
  const handleClone = async (recipe: Recipe) => {
    setCloningId(recipe.id);
    try { await cloneRecipe(recipe, `${getRecipeDisplayName(recipe, 'zh')} (${t('recipes.clone_suffix')})`); addToast('success', t('toast.recipe_cloned')); await loadRecipes(); }
    catch (err: any) { addToast('error', err.message || t('toast.recipe_clone_failed')); }
    finally { setCloningId(null); }
  };
  const defaults = filtered.filter(recipe => recipe.is_default);
  const customs = filtered.filter(recipe => !recipe.is_default);
  if (loading) return <div className="space-y-4"><div className="h-8 w-48 animate-pulse bg-cream-200 dark:bg-espresso-800" />{[0, 1, 2].map(item => <div key={item} className="card h-28 animate-pulse bg-cream-100 dark:bg-espresso-800" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h1 className="page-title">{t('recipes.library_title')}</h1><Link to={`/recipes/new?kind=${kind}`} className="btn-primary w-full sm:w-auto"><Plus className="h-4 w-4" />{kind === 'drink' ? t('recipes.new_drink') : t('recipes.new_brew_method')}</Link></div>
      <div className="grid grid-cols-2 gap-1 bg-cream-100 p-1 dark:bg-espresso-800">{(['brew_method', 'drink'] as RecipeKind[]).map(item => <button key={item} type="button" onClick={() => handleKindChange(item)} className={`h-10 px-3 text-sm font-medium transition-colors ${kind === item ? 'bg-white text-coffee-700 shadow-card dark:bg-espresso-700 dark:text-coffee-300' : 'text-espresso-500 dark:text-espresso-400'}`}>{t(`recipes.kind_${item}`)}</button>)}</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_200px]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso-400" /><input className="input pl-10" value={search} onChange={event => setSearch(event.target.value)} placeholder={t('recipes.search_placeholder')} /></div>{kind === 'brew_method' ? <select className="input" value={device} onChange={event => setDevice(event.target.value as 'all' | BrewDevice)}><option value="all">{t('recipes.device_all')}</option>{RECIPE_BREW_DEVICES.map(item => <option key={item.value} value={item.value}>{t(item.label)}</option>)}</select> : <select className="input" value={drinkType} onChange={event => setDrinkType(event.target.value)}><option value="all">{t('recipes.drink_type_all')}</option>{DRINK_TYPES.map(item => <option key={item.value} value={item.value}>{t(item.label)}</option>)}</select>}</div>
      {defaults.length > 0 && <section><h2 className="section-title mb-3">{t('recipes.built_in')}</h2><div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{defaults.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} cloning={cloningId === recipe.id} onClone={handleClone} />)}</div></section>}
      {customs.length > 0 && <section><h2 className="section-title mb-3">{t('recipes.my')}</h2><div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{customs.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} cloning={false} onClone={handleClone} />)}</div></section>}
      {filtered.length === 0 && <div className="card"><div className="card-body empty-state"><BookOpen className="empty-icon" /><p className="empty-title">{t('recipes.none_found')}</p><p className="empty-text">{t('recipes.search_empty')}</p></div></div>}
    </div>
  );
}
