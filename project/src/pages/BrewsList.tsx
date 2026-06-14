import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FlaskConical, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { BrewRecord, BrewDevice } from '../lib/types';
import { fetchBrewRecords } from '../lib/utils';
import { BREW_DEVICES, getDeviceLabelT } from '../lib/types';
import { useTranslation } from '../contexts/LanguageContext';

export default function BrewsList() {
  const { t } = useTranslation();
  const [brews, setBrews] = useState<BrewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<BrewDevice | ''>('');

  useEffect(() => {
    loadBrews();
  }, []);

  async function loadBrews() {
    try {
      const data = await fetchBrewRecords();
      setBrews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = brews.filter(b => {
    if (deviceFilter && b.device !== deviceFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.batch?.bean_profile?.bean_name?.toLowerCase().includes(q) ||
      b.batch?.bean_profile?.brand?.toLowerCase().includes(q) ||
      b.notes?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-cream-200 dark:bg-espresso-800 rounded-lg animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-5 h-20 animate-pulse bg-cream-100 dark:bg-espresso-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">{t('brews.title')}</h1>
        <Link to="/brews/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          {t('brews.new')}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
            placeholder={t('brews.search_placeholder')}
          />
        </div>
        <select
          value={deviceFilter}
          onChange={e => setDeviceFilter(e.target.value as BrewDevice | '')}
          className="input w-auto"
        >
          <option value="">{t('brews.all_devices')}</option>
          {BREW_DEVICES.map(device => (
            <option key={device.value} value={device.value}>{t(device.label)}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="card-body empty-state">
            <FlaskConical className="empty-icon" />
            <p className="empty-title">{search || deviceFilter ? t('brews.none_found') : t('brews.none_yet')}</p>
            <p className="empty-text">
              {search || deviceFilter
                ? t('brews.empty_filter')
                : t('brews.empty_text')
              }
            </p>
            {!search && !deviceFilter && (
              <Link to="/brews/new" className="btn-primary mt-4">
                <Plus className="w-4 h-4" />
                {t('brews.record_first')}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(brew => (
            <Link key={brew.id} to={`/brews/${brew.id}`} className="card-hover p-4 block">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-coffee-100 dark:bg-coffee-900/40 flex items-center justify-center shrink-0 mt-0.5">
                    <FlaskConical className="w-5 h-5 text-coffee-600 dark:text-coffee-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-espresso-900 dark:text-cream-100">
                      {brew.batch?.bean_profile?.bean_name || t('common.unknown')}
                    </h3>
                    <p className="text-sm text-espresso-500 dark:text-espresso-400">
                      {brew.batch?.bean_profile?.brand} — {getDeviceLabelT(brew.device, t)}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-espresso-500">
                      <span>{t('brews.dose_short', { grams: brew.dose_grams })}</span>
                      {brew.yield_ml && <span>{t('brews.yield_short', { ml: brew.yield_ml })}</span>}
                      {brew.grind_setting && <span>{t('brews.grind')}: {brew.grind_setting}</span>}
                      {brew.water_temp_c && <span>{brew.water_temp_c}°C</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  {brew.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-coffee-500 fill-coffee-500" />
                      <span className="font-medium text-coffee-600 dark:text-coffee-400">{brew.rating}</span>
                    </div>
                  )}
                  <span className="text-xs text-espresso-400">
                    {format(parseISO(brew.brew_date), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
