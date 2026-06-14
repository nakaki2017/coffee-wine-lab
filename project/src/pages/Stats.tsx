import { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { BarChart3, DollarSign, Coffee, Package, TrendingUp } from 'lucide-react';
import type { Batch, BrewRecord } from '../lib/types';
import { fetchBatches, fetchBrewRecords } from '../lib/utils';
import { getDeviceLabelT } from '../lib/types';
import { useTranslation } from '../contexts/LanguageContext';

const CHART_COLORS = ['#d4822f', '#83421f', '#e35d3a', '#557652', '#9d8b6e', '#d4a854', '#ae351e', '#749370'];

export default function Stats() {
  const { t } = useTranslation();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [brews, setBrews] = useState<BrewRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchBatches(), fetchBrewRecords()])
      .then(([batchData, brewData]) => {
        setBatches(batchData);
        setBrews(brewData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const totalSpent = batches.reduce((sum, b) => sum + (b.price || 0), 0);
    const totalWeight = batches.reduce((sum, b) => sum + b.weight_grams, 0);
    const pricePer100g = totalWeight > 0 ? (totalSpent / totalWeight * 100) : 0;
    const totalBrews = brews.length;
    const avgRating = brews.filter(b => b.rating).length > 0
      ? brews.filter(b => b.rating).reduce((sum, b) => sum + (b.rating || 0), 0) / brews.filter(b => b.rating).length
      : 0;

    // Brand popularity
    const brandCount: Record<string, number> = {};
    batches.forEach(b => {
      if (b.bean_profile?.brand) {
        brandCount[b.bean_profile.brand] = (brandCount[b.bean_profile.brand] || 0) + 1;
      }
    });
    const brandData = Object.entries(brandCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Process method ratings
    const processRatings: Record<string, { total: number; count: number }> = {};
    brews.forEach(b => {
      const process = b.batch?.bean_profile?.process_method;
      if (process && b.rating) {
        if (!processRatings[process]) processRatings[process] = { total: 0, count: 0 };
        processRatings[process].total += b.rating;
        processRatings[process].count++;
      }
    });
    const processData = Object.entries(processRatings)
      .map(([name, { total, count }]) => ({ name, avg: Math.round(total / count * 10) / 10 }))
      .sort((a, b) => b.avg - a.avg);

    // Device usage
    const deviceCount: Record<string, number> = {};
    brews.forEach(b => {
      const label = getDeviceLabelT(b.device, t);
      deviceCount[label] = (deviceCount[label] || 0) + 1;
    });
    const deviceData = Object.entries(deviceCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Repurchase leaders
    const repurchaseCount: Record<string, number> = {};
    batches.filter(b => b.is_repurchase && b.bean_profile?.bean_name).forEach(b => {
      const key = `${b.bean_profile!.bean_name} — ${b.bean_profile!.brand}`;
      repurchaseCount[key] = (repurchaseCount[key] || 0) + 1;
    });
    const repurchaseData = Object.entries(repurchaseCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Rating distribution
    const ratingBuckets: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) ratingBuckets[i] = 0;
    brews.filter(b => b.rating).forEach(b => { if (b.rating) ratingBuckets[b.rating]++; });
    const ratingData = Object.entries(ratingBuckets).map(([rating, count]) => ({ rating: parseInt(rating), count }));

    // Brews over time (last 30)
    const brewsByDate: Record<string, number> = {};
    brews.forEach(b => {
      const date = b.brew_date.slice(0, 10);
      brewsByDate[date] = (brewsByDate[date] || 0) + 1;
    });
    const brewsTimeline = Object.entries(brewsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    // Scatter: temp vs rating
    const tempRatingData = brews
      .filter(b => b.water_temp_c && b.rating)
      .map(b => ({ temp: b.water_temp_c!, rating: b.rating! }))
      .slice(0, 50);

    return {
      totalSpent,
      totalWeight,
      pricePer100g,
      totalBrews,
      avgRating,
      brandData,
      processData,
      deviceData,
      repurchaseData,
      ratingData,
      brewsTimeline,
      tempRatingData,
    };
  }, [batches, brews]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-cream-200 dark:bg-espresso-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-24 animate-pulse bg-cream-100 dark:bg-espresso-800" />
          ))}
        </div>
      </div>
    );
  }

  const hasData = batches.length > 0 || brews.length > 0;

  return (
    <div className="space-y-6">
      <h1 className="page-title">{t('stats.title')}</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-coffee-500" />
            <span className="text-xs text-espresso-500">{t('stats.total_spent')}</span>
          </div>
          <div className="stat-value text-2xl">${stats.totalSpent.toFixed(0)}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-coffee-500" />
            <span className="text-xs text-espresso-500">{t('stats.batches')}</span>
          </div>
          <div className="stat-value text-2xl">{batches.length}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Coffee className="w-4 h-4 text-coffee-500" />
            <span className="text-xs text-espresso-500">{t('stats.avg_100g')}</span>
          </div>
          <div className="stat-value text-2xl">${stats.pricePer100g.toFixed(2)}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-coffee-500" />
            <span className="text-xs text-espresso-500">{t('stats.avg_rating')}</span>
          </div>
          <div className="stat-value text-2xl">{stats.avgRating.toFixed(1)}</div>
        </div>
      </div>

      {!hasData ? (
        <div className="card">
          <div className="card-body empty-state">
            <BarChart3 className="empty-icon" />
            <p className="empty-title">{t('stats.no_data')}</p>
            <p className="empty-text">{t('stats.empty_text')}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Brand Popularity */}
          {stats.brandData.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="section-title">{t('stats.brands')}</h2>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.brandData} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-cream-200 dark:text-espresso-700" />
                    <XAxis type="number" tick={{ fill: 'currentColor', fontSize: 12 }} className="text-espresso-500" />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} className="text-espresso-600 dark:text-espresso-400" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--tw-bg-opacity, white)',
                        border: '1px solid var(--tw-border-opacity, #f0ede6)',
                        borderRadius: '0.75rem',
                      }}
                    />
                    <Bar dataKey="count" fill="#d4822f" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Device Usage */}
          {stats.deviceData.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="section-title">{t('stats.device_usage')}</h2>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.deviceData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={2}
                      label={({ name, percent }) => percent ? `${name} ${(percent * 100).toFixed(0)}%` : name}
                      labelLine={false}
                    >
                      {stats.deviceData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Process Method Ratings */}
          {stats.processData.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="section-title">{t('stats.process_rating')}</h2>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.processData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-cream-200 dark:text-espresso-700" />
                    <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} className="text-espresso-600 dark:text-espresso-400" />
                    <YAxis domain={[0, 10]} tick={{ fill: 'currentColor', fontSize: 12 }} className="text-espresso-500" />
                    <Tooltip />
                    <Bar dataKey="avg" fill="#557652" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Rating Distribution */}
          {stats.ratingData.some(d => d.count > 0) && (
            <div className="card">
              <div className="card-header">
                <h2 className="section-title">{t('stats.rating_distribution')}</h2>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.ratingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-cream-200 dark:text-espresso-700" />
                    <XAxis dataKey="rating" tick={{ fill: 'currentColor', fontSize: 12 }} className="text-espresso-600 dark:text-espresso-400" />
                    <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} className="text-espresso-500" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#d4a854" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Brews Over Time */}
          {stats.brewsTimeline.length > 1 && (
            <div className="card">
              <div className="card-header">
                <h2 className="section-title">{t('stats.brews_over_time')}</h2>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats.brewsTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-cream-200 dark:text-espresso-700" />
                    <XAxis dataKey="date" tick={{ fill: 'currentColor', fontSize: 10 }} className="text-espresso-500" />
                    <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} className="text-espresso-500" />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#d4822f" strokeWidth={2} dot={{ fill: '#d4822f' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Temp vs Rating Scatter */}
          {stats.tempRatingData.length > 2 && (
            <div className="card">
              <div className="card-header">
                <h2 className="section-title">{t('stats.temp_vs_rating')}</h2>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-cream-200 dark:text-espresso-700" />
                    <XAxis dataKey="temp" name={`${t('brews.water_temp')} °C`} tick={{ fill: 'currentColor', fontSize: 12 }} className="text-espresso-500" />
                    <YAxis dataKey="rating" name={t('brews.rating')} domain={[0, 10]} tick={{ fill: 'currentColor', fontSize: 12 }} className="text-espresso-500" />
                    <ZAxis range={[30, 30]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={stats.tempRatingData} fill="#d4822f" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Repurchase Leaders */}
          {stats.repurchaseData.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="section-title">{t('stats.repurchased')}</h2>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.repurchaseData} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-cream-200 dark:text-espresso-700" />
                    <XAxis type="number" tick={{ fill: 'currentColor', fontSize: 12 }} className="text-espresso-500" />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'currentColor', fontSize: 11 }} className="text-espresso-600 dark:text-espresso-400" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#9d8b6e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
