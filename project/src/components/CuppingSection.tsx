import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Plus, Save, X } from 'lucide-react';
import type { CuppingRecord, FlavorTagDef } from '../lib/types';
import { createCuppingRecord, updateCuppingRecord, fetchFlavorTags } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from '../contexts/LanguageContext';

interface Props {
  brewRecordId: string;
  cupping?: CuppingRecord;
  onSaved: () => void;
  beanFlavor?: string | null;
}

const CUPPING_ATTRIBUTES = [
  { key: 'aroma', labelKey: 'cupping.aroma' },
  { key: 'acidity', labelKey: 'cupping.acidity' },
  { key: 'sweetness', labelKey: 'cupping.sweetness' },
  { key: 'bitterness', labelKey: 'cupping.bitterness' },
  { key: 'body', labelKey: 'cupping.body' },
  { key: 'aftertaste', labelKey: 'cupping.aftertaste' },
  { key: 'cleanliness', labelKey: 'cupping.cleanliness' },
  { key: 'balance', labelKey: 'cupping.balance' },
] as const;

export default function CuppingSection({ brewRecordId, cupping, onSaved, beanFlavor }: Props) {
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flavorDefs, setFlavorDefs] = useState<FlavorTagDef[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState({
    aroma: 5,
    acidity: 5,
    sweetness: 5,
    bitterness: 5,
    body: 5,
    aftertaste: 5,
    cleanliness: 5,
    balance: 5,
    overall_score: 5,
    flavor_tags: [] as string[],
    comparison_notes: '',
  });

  useEffect(() => {
    if (cupping) {
      setForm({
        aroma: cupping.aroma || 5,
        acidity: cupping.acidity || 5,
        sweetness: cupping.sweetness || 5,
        bitterness: cupping.bitterness || 5,
        body: cupping.body || 5,
        aftertaste: cupping.aftertaste || 5,
        cleanliness: cupping.cleanliness || 5,
        balance: cupping.balance || 5,
        overall_score: cupping.overall_score || 5,
        flavor_tags: cupping.flavor_tags || [],
        comparison_notes: cupping.comparison_notes || '',
      });
    }
  }, [cupping]);

  useEffect(() => {
    fetchFlavorTags().then(setFlavorDefs).catch(console.error);
  }, []);

  const radarData = CUPPING_ATTRIBUTES.map(attr => ({
    attribute: t(attr.labelKey),
    score: form[attr.key] || 0,
  }));

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = (tag: string) => {
    if (tag && !form.flavor_tags.includes(tag)) {
      setForm(prev => ({ ...prev, flavor_tags: [...prev.flavor_tags, tag] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setForm(prev => ({ ...prev, flavor_tags: prev.flavor_tags.filter(t => t !== tag) }));
  };

  const filteredTagDefs = flavorDefs.filter(d =>
    d.tag_name.toLowerCase().includes(tagInput.toLowerCase()) &&
    !form.flavor_tags.includes(d.tag_name)
  ).slice(0, 8);

  const beanFlavorTags = beanFlavor
    ? beanFlavor.split(/[,;]/).map(t => t.trim()).filter(Boolean)
    : [];

  const matchedTags = form.flavor_tags.filter(t =>
    beanFlavorTags.some(bt => bt.toLowerCase() === t.toLowerCase())
  );
  const newTags = form.flavor_tags.filter(t =>
    !beanFlavorTags.some(bt => bt.toLowerCase() === t.toLowerCase())
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      if (cupping) {
        await updateCuppingRecord(cupping.id, form);
        addToast('success', t('toast.cupping_updated'));
      } else {
        await createCuppingRecord({ ...form, brew_record_id: brewRecordId });
        addToast('success', t('toast.cupping_created'));
      }
      setEditing(false);
      onSaved();
    } catch (err: any) {
      addToast('error', err.message || t('toast.cupping_save_failed'));
    } finally {
      setSaving(false);
    }
  };

  if (!cupping && !editing) {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <p className="text-espresso-500 mb-3">{t('cupping.none')}</p>
          <button onClick={() => setEditing(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            {t('cupping.add')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="section-title">{t('cupping.title')}</h2>
        {!editing && cupping && (
          <button onClick={() => setEditing(true)} className="btn-sm btn-secondary">
            <Plus className="w-3 h-3" />
            {t('common.edit')}
          </button>
        )}
      </div>
      <div className="card-body space-y-5">
        {/* Radar Chart */}
        <div className="flex justify-center">
          <ResponsiveContainer width={300} height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="currentColor" className="text-cream-300 dark:text-espresso-700" />
              <PolarAngleAxis
                dataKey="attribute"
                tick={{ fill: 'currentColor', fontSize: 12 }}
                className="text-espresso-600 dark:text-espresso-400"
              />
              <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
              <Radar
                dataKey="score"
                stroke="#d4822f"
                fill="#d4822f"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Attribute Sliders */}
        <div className="space-y-3">
          {CUPPING_ATTRIBUTES.map(attr => (
            <div key={attr.key} className="flex items-center gap-3">
              <span className="text-sm text-espresso-600 dark:text-espresso-400 w-24 shrink-0">
                {t(attr.labelKey)}
              </span>
              {editing ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={form[attr.key]}
                    onChange={e => handleChange(attr.key, parseInt(e.target.value))}
                    className="slider-track flex-1"
                  />
                  <span className="text-sm font-medium text-coffee-600 dark:text-coffee-400 w-6 text-center">
                    {form[attr.key]}
                  </span>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-cream-200 dark:bg-espresso-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-coffee-500 rounded-full"
                      style={{ width: `${((form[attr.key] || 0) / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-espresso-700 dark:text-cream-300 w-6 text-right">
                    {form[attr.key]}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Overall Score */}
          <div className="flex items-center gap-3 pt-3 border-t border-cream-200 dark:border-espresso-800">
            <span className="text-sm font-medium text-espresso-800 dark:text-cream-200 w-24 shrink-0">
              {t('cupping.overall')}
            </span>
            {editing ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={form.overall_score}
                  onChange={e => handleChange('overall_score', parseInt(e.target.value))}
                  className="slider-track flex-1"
                />
                <span className="text-lg font-display font-bold text-coffee-600 dark:text-coffee-400 w-8 text-center">
                  {form.overall_score}
                </span>
              </div>
            ) : (
              <span className="text-2xl font-display font-bold text-coffee-600 dark:text-coffee-400">
                {form.overall_score}/10
              </span>
            )}
          </div>
        </div>

        {/* Flavor Tags */}
        <div className="pt-4 border-t border-cream-200 dark:border-espresso-800">
          <h3 className="text-sm font-medium text-espresso-600 dark:text-espresso-400 mb-2">{t('cupping.flavor_tags')}</h3>

          {editing && (
            <div className="mb-3">
              <div className="relative">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  className="input"
                  placeholder={t('cupping.tags_placeholder')}
                />
              </div>
              {tagInput && filteredTagDefs.length > 0 && (
                <div className="mt-1 border border-cream-200 dark:border-espresso-700 rounded-xl max-h-32 overflow-y-auto bg-white dark:bg-espresso-900 shadow-card">
                  {filteredTagDefs.map(def => (
                    <button
                      key={def.id}
                      type="button"
                      onClick={() => handleAddTag(def.tag_name)}
                      className="w-full text-left px-3 py-1.5 hover:bg-cream-50 dark:hover:bg-espresso-800 text-sm border-b border-cream-100 dark:border-espresso-800 last:border-0"
                    >
                      <span>{def.tag_name}</span>
                      <span className="text-xs text-espresso-400 ml-2">{def.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {form.flavor_tags.map(tag => (
              <span
                key={tag}
                className={`badge ${
                  matchedTags.includes(tag) ? 'bg-sage-100 text-sage-700 dark:bg-sage-900 dark:text-sage-300' :
                  'bg-coffee-100 text-coffee-700 dark:bg-coffee-900 dark:text-coffee-300'
                } flex items-center gap-1`}
              >
                {tag}
                {editing && (
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-terracotta-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>

          {/* Flavor Comparison */}
          {beanFlavor && form.flavor_tags.length > 0 && (
            <div className="mt-3 p-3 bg-cream-50 dark:bg-espresso-800 rounded-xl text-sm space-y-2">
              <div>
                <span className="text-espresso-500">{t('cupping.official_flavors')}</span>
                <span className="text-espresso-700 dark:text-cream-300">{beanFlavorTags.join(', ')}</span>
              </div>
              {matchedTags.length > 0 && (
                <div>
                  <span className="text-sage-600 dark:text-sage-400">{t('cupping.matched')}</span>
                  <span className="font-medium text-sage-700 dark:text-sage-300">{matchedTags.join(', ')}</span>
                </div>
              )}
              {newTags.length > 0 && (
                <div>
                  <span className="text-coffee-600 dark:text-coffee-400">{t('cupping.additional')}</span>
                  <span className="font-medium text-coffee-700 dark:text-coffee-300">{newTags.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comparison Notes */}
        {editing ? (
          <div>
            <label className="label">{t('cupping.comparison_notes')}</label>
            <textarea
              value={form.comparison_notes}
              onChange={e => handleChange('comparison_notes', e.target.value)}
              className="input min-h-[60px]"
              placeholder={t('cupping.comparison_placeholder')}
            />
          </div>
        ) : form.comparison_notes ? (
          <div className="pt-4 border-t border-cream-200 dark:border-espresso-800">
            <h3 className="text-sm font-medium text-espresso-600 dark:text-espresso-400 mb-2">{t('cupping.comparison_notes')}</h3>
            <p className="text-sm text-espresso-700 dark:text-cream-300">{form.comparison_notes}</p>
          </div>
        ) : null}

        {editing && (
          <div className="flex justify-end gap-3 pt-4 border-t border-cream-200 dark:border-espresso-800">
            <button onClick={() => { setEditing(false); if (cupping) onSaved(); }} className="btn-secondary">
              {t('common.cancel')}
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              <Save className="w-4 h-4" />
              {saving ? t('common.saving') : t('cupping.save')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
