import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  FlaskConical,
  Star,
  Thermometer,
  Scale,
  Timer,
  Coffee,
  Droplets,
  Target,
} from 'lucide-react';
import type { BrewRecord } from '../lib/types';
import { fetchBrewRecord, deleteBrewRecord } from '../lib/utils';
import { getDeviceLabelT, getRoastLabelT } from '../lib/types';
import { useToast } from '../contexts/ToastContext';
import CuppingSection from '../components/CuppingSection';
import { useTranslation } from '../contexts/LanguageContext';

export default function BrewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [brew, setBrew] = useState<BrewRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchBrewRecord(id)
      .then(setBrew)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!brew || !confirm(t('confirm.delete_brew'))) return;
    try {
      await deleteBrewRecord(brew.id);
      addToast('success', t('toast.brew_deleted'));
      navigate('/brews');
    } catch (err: any) {
      addToast('error', err.message || t('toast.delete_failed'));
    }
  };

  const onCuppingSaved = () => {
    if (id) fetchBrewRecord(id).then(setBrew).catch(console.error);
  };

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-cream-200 dark:bg-espresso-800 rounded-lg" /></div>;
  }

  if (!brew) {
    return (
      <div className="empty-state">
        <FlaskConical className="empty-icon" />
        <p className="empty-title">{t('brews.not_found')}</p>
      </div>
    );
  }

  const bean = brew.batch?.bean_profile;
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/brews')} className="btn-ghost btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-title">
              {bean?.bean_name || t('brews.record')}
            </h1>
            <p className="text-sm text-espresso-500">
              {bean?.brand} — {getDeviceLabelT(brew.device, t)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/brews/${id}/edit`} className="btn-secondary">
            <Edit3 className="w-4 h-4" />
            {t('common.edit')}
          </Link>
          <button onClick={handleDelete} className="btn-danger btn-icon" title={t('common.delete')}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Brew Parameters */}
          <div className="card">
            <div className="card-header">
              <h2 className="section-title">{t('brews.parameters')}</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-espresso-400" />
                  <div>
                    <div className="text-xs text-espresso-500">{t('brews.device')}</div>
                    <div className="text-sm font-medium">{getDeviceLabelT(brew.device, t)}</div>
                  </div>
                </div>

                {brew.grind_setting && (
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-espresso-400" />
                    <div>
                      <div className="text-xs text-espresso-500">{t('brews.grind')}</div>
                      <div className="text-sm font-medium">{brew.grind_setting}</div>
                    </div>
                  </div>
                )}

                {brew.water_temp_c && (
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-espresso-400" />
                    <div>
                      <div className="text-xs text-espresso-500">{t('brews.water_temp')}</div>
                      <div className="text-sm font-medium">{brew.water_temp_c}°C</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-espresso-400" />
                  <div>
                    <div className="text-xs text-espresso-500">{t('brews.dose')}</div>
                    <div className="text-sm font-medium">{brew.dose_grams}g</div>
                  </div>
                </div>

                {brew.yield_ml && (
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-espresso-400" />
                    <div>
                      <div className="text-xs text-espresso-500">{t('brews.yield')}</div>
                      <div className="text-sm font-medium">{brew.yield_ml}ml</div>
                    </div>
                  </div>
                )}

                {brew.ratio && (
                  <div>
                    <div className="text-xs text-espresso-500">{t('brews.ratio')}</div>
                    <div className="text-sm font-medium">{brew.ratio}</div>
                  </div>
                )}

                {brew.total_time_seconds && (
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-espresso-400" />
                    <div>
                      <div className="text-xs text-espresso-500">{t('brews.time')}</div>
                      <div className="text-sm font-medium">{formatTime(brew.total_time_seconds)}</div>
                    </div>
                  </div>
                )}

                {brew.filter_type && (
                  <div>
                    <div className="text-xs text-espresso-500">{t('brews.filter')}</div>
                    <div className="text-sm font-medium">{brew.filter_type}</div>
                  </div>
                )}

                <div>
                  <div className="text-xs text-espresso-500">{t('brews.cups')}</div>
                  <div className="text-sm font-medium">{brew.cups}</div>
                </div>
              </div>

              {/* Pour Scheme */}
              {brew.pour_scheme && brew.pour_scheme.length > 0 && (
                <div className="mt-4 pt-4 border-t border-cream-200 dark:border-espresso-800">
                  <h3 className="text-sm font-medium text-espresso-600 dark:text-espresso-400 mb-2">{t('brews.pour_scheme')}</h3>
                  <div className="space-y-1">
                    {brew.pour_scheme.map((step, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="font-mono text-espresso-500 w-12">{step.time}</span>
                        <span className="text-espresso-700 dark:text-cream-300">{step.action}</span>
                        {step.amount > 0 && (
                          <span className="text-espresso-500">{step.amount}g</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {brew.notes && (
                <div className="mt-4 pt-4 border-t border-cream-200 dark:border-espresso-800">
                  <h3 className="text-sm font-medium text-espresso-600 dark:text-espresso-400 mb-2">{t('common.notes')}</h3>
                  <p className="text-sm text-espresso-700 dark:text-cream-300 whitespace-pre-wrap">{brew.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Cupping Section */}
          <CuppingSection brewRecordId={brew.id} cupping={brew.cupping} onSaved={onCuppingSaved} beanFlavor={bean?.flavor_description} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="section-title mb-3">{t('brews.rating')}</h3>
            {brew.rating ? (
              <div className="flex items-center gap-2">
                <Star className="w-8 h-8 text-coffee-500 fill-coffee-500" />
                <span className="text-4xl font-display font-bold text-coffee-600 dark:text-coffee-400">
                  {brew.rating}
                </span>
                <span className="text-lg text-espresso-400">/10</span>
              </div>
            ) : (
              <p className="text-espresso-500 text-sm">{t('brews.not_rated')}</p>
            )}
          </div>

          <div className="card p-5">
            <h3 className="section-title mb-3">{t('brews.bean_info')}</h3>
            {bean ? (
              <div>
                <Link to={`/beans/${bean.id}`} className="text-sm text-coffee-600 dark:text-coffee-400 hover:underline font-medium">
                  {bean.bean_name}
                </Link>
                <p className="text-sm text-espresso-500 mt-1">{bean.brand}</p>
                <div className="text-xs text-espresso-500 mt-2 space-y-1">
                  {bean.roast_level && <div>{t('brews.roast')}: {getRoastLabelT(bean.roast_level, t)}</div>}
                  {bean.process_method && <div>{t('brews.process')}: {bean.process_method}</div>}
                  {bean.origin_country && <div>{t('brews.origin')}: {bean.origin_country}</div>}
                </div>
              </div>
            ) : (
              <p className="text-sm text-espresso-500">{t('brews.bean_info_unavailable')}</p>
            )}
          </div>

          <div className="card p-5">
            <h3 className="section-title mb-3">{t('brews.batch')}</h3>
            {brew.batch ? (
              <Link to={`/inventory/${brew.batch_id}`} className="text-sm text-coffee-600 dark:text-coffee-400 hover:underline">
                {brew.batch.batch_code || t('brews.batch_from', { date: brew.batch.roast_date || t('inventory.unknown_date') })}
              </Link>
            ) : (
              <p className="text-sm text-espresso-500">{t('brews.batch_info_unavailable')}</p>
            )}
            <p className="text-xs text-espresso-400 mt-2">
              {format(parseISO(brew.brew_date), 'MMMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
