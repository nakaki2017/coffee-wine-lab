import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Camera, CalendarDays, ChevronLeft, ChevronRight, FlaskConical, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import type { BrewRecord, DailyEntry } from '../lib/types';
import { getDeviceLabelT } from '../lib/types';
import {
  deleteDailyEntry,
  fetchBrewRecordsByDateRange,
  fetchDailyEntries,
  uploadDailyPhoto,
  upsertDailyEntry,
} from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from '../contexts/LanguageContext';

const WEEKDAY_KEYS = ['cal.sun', 'cal.mon', 'cal.tue', 'cal.wed', 'cal.thu', 'cal.fri', 'cal.sat'];

function dateKey(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export default function Calendar() {
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [brews, setBrews] = useState<BrewRecord[]>([]);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [note, setNote] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const selectedKey = selectedDate ? dateKey(selectedDate) : '';

  useEffect(() => {
    loadMonth();
  }, [month]);

  async function loadMonth() {
    setLoading(true);
    try {
      const start = startOfMonth(month).toISOString();
      const end = addDays(endOfMonth(month), 1).toISOString();
      const [brewData, entryData] = await Promise.all([
        fetchBrewRecordsByDateRange(start, end),
        fetchDailyEntries(month),
      ]);
      setBrews(brewData);
      setEntries(entryData);
    } catch (err: any) {
      addToast('error', err.message || t('toast.load_failed'));
    } finally {
      setLoading(false);
    }
  }

  const entryMap = useMemo(() => {
    const map = new Map<string, DailyEntry>();
    entries.forEach(entry => map.set(entry.entry_date, entry));
    return map;
  }, [entries]);

  const brewMap = useMemo(() => {
    const map = new Map<string, BrewRecord[]>();
    brews.forEach(brew => {
      const key = brew.brew_date.slice(0, 10);
      map.set(key, [...(map.get(key) || []), brew]);
    });
    return map;
  }, [brews]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    const days: Date[] = [];
    let cursor = start;
    while (cursor <= end) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return days;
  }, [month]);

  const selectedEntry = selectedKey ? entryMap.get(selectedKey) || null : null;
  const selectedBrews = selectedKey ? brewMap.get(selectedKey) || [] : [];

  function openDay(date: Date) {
    const key = dateKey(date);
    const entry = entryMap.get(key);
    setSelectedDate(date);
    setNote(entry?.note || '');
    setImageUrl(entry?.image_url || '');
  }

  async function handleSave() {
    if (!selectedDate) return;
    setSaving(true);
    try {
      await upsertDailyEntry(selectedKey, {
        note: note.trim() || null,
        image_url: imageUrl.trim() || null,
      });
      addToast('success', t('toast.daily_saved'));
      await loadMonth();
    } catch (err: any) {
      addToast('error', err.message || t('toast.save_failed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedEntry || !confirm(t('confirm.delete_daily'))) return;
    try {
      await deleteDailyEntry(selectedEntry.id);
      setNote('');
      setImageUrl('');
      setSelectedDate(null);
      addToast('success', t('toast.daily_deleted'));
      await loadMonth();
    } catch (err: any) {
      addToast('error', err.message || t('toast.delete_failed'));
    }
  }

  async function handleFileUpload(file: File | undefined) {
    if (!file || !selectedDate) return;
    setUploading(true);
    try {
      const url = await uploadDailyPhoto(selectedKey, file);
      setImageUrl(url);
      addToast('success', t('toast.photo_uploaded'));
    } catch (err: any) {
      addToast('error', err.message || t('toast.save_failed'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">{t('cal.title')}</h1>
          <p className="text-sm text-espresso-500 dark:text-espresso-400 mt-1">
            {format(month, 'MMMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(startOfMonth(new Date()))} className="btn-secondary">
            <CalendarDays className="w-4 h-4" />
            {t('cal.today')}
          </button>
          <button onClick={() => setMonth(startOfMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)))} className="btn-ghost btn-icon">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setMonth(startOfMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)))} className="btn-ghost btn-icon">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-cream-200 dark:border-espresso-800 bg-cream-100/70 dark:bg-espresso-800/60">
          {WEEKDAY_KEYS.map(key => (
            <div key={key} className="px-2 py-3 text-center text-xs font-medium text-espresso-500 dark:text-espresso-400">
              {t(key)}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[120px] border-r border-b border-cream-200 dark:border-espresso-800 last:border-r-0 p-2 animate-pulse bg-cream-50 dark:bg-espresso-900" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map(day => {
              const key = dateKey(day);
              const dayBrews = brewMap.get(key) || [];
              const entry = entryMap.get(key);
              const hasPhoto = Boolean(entry?.image_url);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => openDay(day)}
                  className={`min-h-[118px] text-left p-2 border-r border-b border-cream-200 dark:border-espresso-800 hover:bg-cream-50 dark:hover:bg-espresso-800/60 transition-colors ${
                    !isSameMonth(day, month) ? 'bg-cream-50/60 dark:bg-espresso-950/60 opacity-50' :
                    dayBrews.length > 0 ? 'bg-coffee-50/70 dark:bg-coffee-950/20' :
                    hasPhoto ? 'bg-sage-50/70 dark:bg-sage-950/20' :
                    'bg-white dark:bg-espresso-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      isToday
                        ? 'w-6 h-6 rounded-full bg-coffee-600 text-white inline-flex items-center justify-center'
                        : 'text-espresso-700 dark:text-cream-300'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {hasPhoto && <Camera className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />}
                  </div>

                  {entry?.image_url && (
                    <img
                      src={entry.image_url}
                      alt=""
                      className="w-full h-12 object-cover rounded-lg mb-1 border border-white/60 dark:border-espresso-700"
                    />
                  )}

                  <div className="space-y-1">
                    {dayBrews.slice(0, 2).map(brew => (
                      <div key={brew.id} className="truncate text-[11px] text-espresso-700 dark:text-cream-300 bg-white/70 dark:bg-espresso-800/70 rounded-md px-1.5 py-1">
                        {brew.batch?.bean_profile?.bean_name || t('common.unknown')} · {getDeviceLabelT(brew.device, t)}
                      </div>
                    ))}
                    {dayBrews.length > 2 && (
                      <div className="text-[11px] text-coffee-600 dark:text-coffee-400 px-1">
                        +{dayBrews.length - 2}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedDate && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelectedDate(null)}>
          <div
            className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-espresso-900 rounded-t-2xl sm:rounded-2xl shadow-elevated border border-cream-200 dark:border-espresso-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="card-header flex items-center justify-between">
              <div>
                <h2 className="section-title">{t('cal.day_detail')}</h2>
                <p className="text-sm text-espresso-500 mt-1">{format(selectedDate, 'MMMM d, yyyy')}</p>
              </div>
              <button onClick={() => setSelectedDate(null)} className="btn-ghost btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="card-body space-y-5">
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-espresso-700 dark:text-cream-300">{t('cal.brews_for_day')}</h3>
                  <Link to={`/brews/new?date=${selectedKey}`} className="btn-sm btn-primary">
                    <Plus className="w-3 h-3" />
                    {t('cal.add_brew')}
                  </Link>
                </div>

                {selectedBrews.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-cream-300 dark:border-espresso-700 px-4 py-6 text-sm text-espresso-500 text-center">
                    {t('cal.no_brews')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedBrews.map(brew => (
                      <Link key={brew.id} to={`/brews/${brew.id}`} className="flex items-center justify-between rounded-xl border border-cream-200 dark:border-espresso-800 px-3 py-2 hover:bg-cream-50 dark:hover:bg-espresso-800">
                        <div className="flex items-center gap-2 min-w-0">
                          <FlaskConical className="w-4 h-4 text-coffee-500 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{brew.batch?.bean_profile?.bean_name || t('common.unknown')}</div>
                            <div className="text-xs text-espresso-500">{getDeviceLabelT(brew.device, t)}</div>
                          </div>
                        </div>
                        {brew.rating && <span className="text-sm text-coffee-600 dark:text-coffee-400">{brew.rating}/10</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-medium text-espresso-700 dark:text-cream-300">{t('cal.photo_label')}</h3>
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-full max-h-80 object-cover rounded-xl border border-cream-200 dark:border-espresso-800" />
                ) : (
                  <div className="rounded-xl border border-dashed border-cream-300 dark:border-espresso-700 px-4 py-8 text-sm text-espresso-500 text-center">
                    {t('cal.no_photo')}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="input"
                    placeholder={t('cal.image_url_placeholder')}
                  />
                  <label className="btn-secondary cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {uploading ? t('common.loading') : t('cal.upload_photo')}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e.target.files?.[0])} />
                  </label>
                </div>
                <p className="text-xs text-espresso-500">{t('cal.file_upload_hint')}</p>
              </section>

              <section>
                <label className="label">{t('common.notes')}</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="input min-h-[90px]"
                  placeholder={t('cal.note_placeholder')}
                />
              </section>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-3 border-t border-cream-200 dark:border-espresso-800">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!selectedEntry}
                  className="btn-danger disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('cal.delete_day')}
                </button>
                <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
                  <Save className="w-4 h-4" />
                  {saving ? t('common.saving') : t('cal.save_day')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
