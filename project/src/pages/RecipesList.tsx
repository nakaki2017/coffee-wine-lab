import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, FlaskConical, Copy } from 'lucide-react';
import type { Recipe, BrewDevice } from '../lib/types';
import { fetchRecipes, createRecipe } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import { getDeviceLabelT } from '../lib/types';
import { useTranslation } from '../contexts/LanguageContext';

const DEVICE_ICONS: Record<BrewDevice, string> = {
  v60: 'V60',
  origami: 'ORI',
  kalita: 'KAL',
  french_press: 'FP',
  aeropress: 'AP',
  espresso: 'ESP',
  americano: 'AME',
  latte: 'LAT',
  cold_brew: 'CB',
  other: 'OTH',
};

export default function RecipesList() {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    try {
      const data = await fetchRecipes();
      setRecipes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleClone = async (recipe: Recipe) => {
    try {
      await createRecipe({
        name: `${recipe.name} (Copy)`,
        device: recipe.device,
        default_grind: recipe.default_grind,
        default_temp_c: recipe.default_temp_c,
        default_dose_grams: recipe.default_dose_grams,
        default_yield_ml: recipe.default_yield_ml,
        default_ratio: recipe.default_ratio,
        default_time_seconds: recipe.default_time_seconds,
        default_pour_scheme: recipe.default_pour_scheme,
        default_filter: recipe.default_filter,
        instructions: recipe.instructions,
        is_default: false,
      });
      addToast('success', t('toast.recipe_cloned'));
      loadRecipes();
    } catch (err: any) {
      addToast('error', err.message || t('toast.recipe_clone_failed'));
    }
  };

  const defaults = recipes.filter(r => r.is_default);
  const customs = recipes.filter(r => !r.is_default);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-cream-200 dark:bg-espresso-800 rounded-lg animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-5 h-24 animate-pulse bg-cream-100 dark:bg-espresso-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">{t('recipes.title')}</h1>
        <Link to="/recipes/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          {t('recipes.new')}
        </Link>
      </div>

      {/* Default Recipes */}
      {defaults.length > 0 && (
        <div>
          <h2 className="section-title mb-3">{t('recipes.built_in')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {defaults.map(recipe => (
              <div key={recipe.id} className="card hover:shadow-card-hover transition-shadow">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-coffee-100 dark:bg-coffee-900/40 flex items-center justify-center">
                      <span className="text-xs font-bold text-coffee-600 dark:text-coffee-400">
                        {DEVICE_ICONS[recipe.device]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-espresso-900 dark:text-cream-100">{recipe.name}</h3>
                      <span className="text-xs text-espresso-500">{getDeviceLabelT(recipe.device, t)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-espresso-600 dark:text-espresso-400">
                    {recipe.default_dose_grams && (
                      <div>{t('recipes.default_dose')}: {recipe.default_dose_grams}g</div>
                    )}
                    {recipe.default_yield_ml && (
                      <div>{t('recipes.default_yield')}: {recipe.default_yield_ml}ml</div>
                    )}
                    {recipe.default_ratio && (
                      <div>{t('recipes.default_ratio')}: {recipe.default_ratio}</div>
                    )}
                    {recipe.default_temp_c && (
                      <div>{t('recipes.default_temp')}: {recipe.default_temp_c}°C</div>
                    )}
                    {recipe.default_grind && (
                      <div>{t('recipes.default_grind')}: {recipe.default_grind}</div>
                    )}
                    {recipe.default_time_seconds && (
                      <div>{t('recipes.default_time')}: {recipe.default_time_seconds >= 60 ? `${Math.floor(recipe.default_time_seconds / 60)}m${recipe.default_time_seconds % 60 ? `${recipe.default_time_seconds % 60}s` : ''}` : `${recipe.default_time_seconds}s`}</div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Link
                      to={`/brews/new?recipe=${recipe.id}`}
                      className="btn-sm btn-primary flex-1"
                    >
                      <FlaskConical className="w-3 h-3" />
                      {t('recipes.brew')}
                    </Link>
                    <button onClick={() => handleClone(recipe)} className="btn-sm btn-secondary">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Recipes */}
      {customs.length > 0 && (
        <div>
          <h2 className="section-title mb-3">{t('recipes.my')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customs.map(recipe => (
              <div key={recipe.id} className="card-hover">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-sage-100 dark:bg-sage-900/40 flex items-center justify-center">
                      <span className="text-xs font-bold text-sage-600 dark:text-sage-400">
                        {DEVICE_ICONS[recipe.device]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-espresso-900 dark:text-cream-100">{recipe.name}</h3>
                      <span className="text-xs text-espresso-500">{getDeviceLabelT(recipe.device, t)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-espresso-600 dark:text-espresso-400">
                    {recipe.default_dose_grams && <div>{t('recipes.default_dose')}: {recipe.default_dose_grams}g</div>}
                    {recipe.default_yield_ml && <div>{t('recipes.default_yield')}: {recipe.default_yield_ml}ml</div>}
                    {recipe.default_ratio && <div>{t('recipes.default_ratio')}: {recipe.default_ratio}</div>}
                    {recipe.default_temp_c && <div>{t('recipes.default_temp')}: {recipe.default_temp_c}°C</div>}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Link to={`/brews/new?recipe=${recipe.id}`} className="btn-sm btn-primary flex-1">
                      <FlaskConical className="w-3 h-3" />
                      {t('recipes.brew')}
                    </Link>
                    <Link to={`/recipes/${recipe.id}/edit`} className="btn-sm btn-secondary">
                      {t('common.edit')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recipes.length === 0 && (
        <div className="card">
          <div className="card-body empty-state">
            <BookOpen className="empty-icon" />
            <p className="empty-title">{t('recipes.none_yet')}</p>
            <p className="empty-text">{t('recipes.empty_text')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
