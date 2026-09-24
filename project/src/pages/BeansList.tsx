import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Coffee, MapPin, Mountain } from 'lucide-react';
import type { BeanProfile } from '../lib/types';
import { fetchBeanProfiles } from '../lib/utils';
import { getRoastLabelT } from '../lib/types';
import { useTranslation } from '../contexts/LanguageContext';

export default function BeansList() {
  const { t } = useTranslation();
  const [beans, setBeans] = useState<BeanProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBeans();
  }, []);

  async function loadBeans() {
    try {
      const data = await fetchBeanProfiles();
      setBeans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = beans.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.bean_name.toLowerCase().includes(q) ||
      b.brand.toLowerCase().includes(q) ||
      (b.origin_country?.toLowerCase().includes(q) ?? false) ||
      (b.process_method?.toLowerCase().includes(q) ?? false)
    );
  });

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
        <h1 className="page-title">{t('beans.title')}</h1>
        <Link to="/beans/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          {t('beans.add')}
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-10"
          placeholder={t('beans.search_placeholder')}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="card-body empty-state">
            <Coffee className="empty-icon" />
            <p className="empty-title">{search ? t('beans.none_found') : t('beans.none_yet')}</p>
            <p className="empty-text">
              {search
                ? t('beans.search_empty_text')
                : t('beans.empty_text')
              }
            </p>
            {!search && (
              <Link to="/beans/new" className="btn-primary mt-4">
                <Plus className="w-4 h-4" />
                {t('beans.add_first')}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(bean => (
            <Link key={bean.id} to={`/beans/${bean.id}`} className="card-hover overflow-hidden">
              {(bean.images?.[0]?.url || bean.image_url) ? (
                <div className="h-32 bg-cream-200 dark:bg-espresso-800 overflow-hidden">
                  <img src={bean.images?.[0]?.url || bean.image_url || ''} alt={bean.bean_name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-br from-coffee-200 to-coffee-400 dark:from-coffee-800 dark:to-coffee-600 flex items-center justify-center">
                  <Coffee className="w-10 h-10 text-coffee-600/40 dark:text-coffee-300/40" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-display font-semibold text-espresso-900 dark:text-cream-100 truncate">
                  {bean.bean_name}
                </h3>
                <p className="text-sm text-coffee-600 dark:text-coffee-400 font-medium">
                  {bean.brand}
                  {bean.roaster && ` / ${bean.roaster}`}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bean.origin_country && (
                    <span className="inline-flex items-center gap-1 text-xs text-espresso-500 dark:text-espresso-400">
                      <MapPin className="w-3 h-3" />
                      {bean.origin_country}
                    </span>
                  )}
                  {bean.altitude && (
                    <span className="inline-flex items-center gap-1 text-xs text-espresso-500 dark:text-espresso-400">
                      <Mountain className="w-3 h-3" />
                      {bean.altitude}
                    </span>
                  )}
                  {bean.roast_level && (
                    <span className="badge bg-coffee-100 text-coffee-700 dark:bg-coffee-900 dark:text-coffee-300">
                      {getRoastLabelT(bean.roast_level, t)}
                    </span>
                  )}
                  {bean.process_method && (
                    <span className="badge bg-sage-100 text-sage-700 dark:bg-sage-900 dark:text-sage-300">
                      {bean.process_method}
                    </span>
                  )}
                </div>
                {bean.flavor_description && (
                  <p className="text-xs text-espresso-500 dark:text-espresso-400 mt-2 line-clamp-2">
                    {bean.flavor_description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
