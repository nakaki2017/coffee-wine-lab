import { supabase } from './supabase';
import type { BeanProfile, Batch, BrewRecord, CuppingRecord, Recipe, FlavorTagDef, DailyEntry } from './types';

export async function fetchBeanProfiles(): Promise<BeanProfile[]> {
  const { data, error } = await supabase
    .from('bean_profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchBeanProfile(id: string): Promise<BeanProfile | null> {
  const { data, error } = await supabase
    .from('bean_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createBeanProfile(bean: Omit<BeanProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<BeanProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('bean_profiles')
    .insert({ ...bean, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBeanProfile(id: string, updates: Partial<BeanProfile>): Promise<BeanProfile> {
  const { data, error } = await supabase
    .from('bean_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBeanProfile(id: string): Promise<void> {
  const { error } = await supabase.from('bean_profiles').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchBatches(): Promise<Batch[]> {
  const { data, error } = await supabase
    .from('batches')
    .select('*, bean_profile:bean_profiles(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchBatch(id: string): Promise<Batch | null> {
  const { data, error } = await supabase
    .from('batches')
    .select('*, bean_profile:bean_profiles(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createBatch(batch: Omit<Batch, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'bean_profile'>): Promise<Batch> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { bean_profile, ...rest } = batch as any;
  const { data, error } = await supabase
    .from('batches')
    .insert({ ...rest, user_id: user.id })
    .select('*, bean_profile:bean_profiles(*)')
    .single();
  if (error) throw error;
  return data;
}

export async function updateBatch(id: string, updates: Partial<Batch>): Promise<Batch> {
  const { bean_profile, ...clean } = updates as any;
  const { data, error } = await supabase
    .from('batches')
    .update(clean)
    .eq('id', id)
    .select('*, bean_profile:bean_profiles(*)')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBatch(id: string): Promise<void> {
  const { error } = await supabase.from('batches').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchBrewRecords(limit?: number): Promise<BrewRecord[]> {
  let query = supabase
    .from('brew_records')
    .select('*, batch:batches(*, bean_profile:bean_profiles(*))')
    .order('brew_date', { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchBrewRecordsByDateRange(startDate: string, endDate: string): Promise<BrewRecord[]> {
  const { data, error } = await supabase
    .from('brew_records')
    .select('*, batch:batches(*, bean_profile:bean_profiles(*))')
    .gte('brew_date', startDate)
    .lt('brew_date', endDate)
    .order('brew_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchBrewRecord(id: string): Promise<BrewRecord | null> {
  const { data, error } = await supabase
    .from('brew_records')
    .select('*, batch:batches(*, bean_profile:bean_profiles(*))')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: cupping } = await supabase
    .from('cupping_records')
    .select('*')
    .eq('brew_record_id', id)
    .maybeSingle();
  return { ...data, cupping: cupping || undefined };
}

export async function createBrewRecord(brew: Omit<BrewRecord, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'batch' | 'cupping'>): Promise<BrewRecord> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { batch, cupping, ...rest } = brew as any;
  const { data, error } = await supabase
    .from('brew_records')
    .insert({ ...rest, user_id: user.id })
    .select('*, batch:batches(*, bean_profile:bean_profiles(*))')
    .single();
  if (error) throw error;

  if (rest.dose_grams && rest.batch_id) {
    const { data: batchData } = await supabase
      .from('batches')
      .select('remaining_grams')
      .eq('id', rest.batch_id)
      .single();
    if (batchData) {
      const newRemaining = Math.max(0, batchData.remaining_grams - rest.dose_grams);
      await supabase.from('batches').update({ remaining_grams: newRemaining }).eq('id', rest.batch_id);
    }
  }
  return data;
}

export async function updateBrewRecord(id: string, updates: Partial<BrewRecord>): Promise<BrewRecord> {
  const { batch, cupping, ...clean } = updates as any;
  const { data, error } = await supabase
    .from('brew_records')
    .update(clean)
    .eq('id', id)
    .select('*, batch:batches(*, bean_profile:bean_profiles(*))')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBrewRecord(id: string): Promise<void> {
  const { error } = await supabase.from('brew_records').delete().eq('id', id);
  if (error) throw error;
}

export async function createCuppingRecord(cupping: Omit<CuppingRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<CuppingRecord> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('cupping_records')
    .insert({ ...cupping, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCuppingRecord(id: string, updates: Partial<CuppingRecord>): Promise<CuppingRecord> {
  const { data, error } = await supabase
    .from('cupping_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .or('is_default.eq.true,user_id.eq.' + (await supabase.auth.getUser()).data.user?.id)
    .order('is_default', { ascending: false })
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function createRecipe(recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Recipe> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('recipes')
    .insert({ ...recipe, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchFlavorTags(): Promise<FlavorTagDef[]> {
  const { data, error } = await supabase
    .from('flavor_tag_definitions')
    .select('*')
    .order('category, tag_name');
  if (error) throw error;
  return data || [];
}

export async function fetchDailyEntries(month: Date): Promise<DailyEntry[]> {
  const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('daily_entries')
    .select('*')
    .gte('entry_date', start)
    .lt('entry_date', end)
    .order('entry_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchDailyEntry(date: string): Promise<DailyEntry | null> {
  const { data, error } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('entry_date', date)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertDailyEntry(
  date: string,
  entry: Partial<Pick<DailyEntry, 'image_url' | 'note'>>,
): Promise<DailyEntry> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('daily_entries')
    .upsert(
      {
        entry_date: date,
        user_id: user.id,
        image_url: entry.image_url || null,
        note: entry.note || null,
      },
      { onConflict: 'user_id,entry_date' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDailyEntry(id: string): Promise<void> {
  const { error } = await supabase.from('daily_entries').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadDailyPhoto(date: string, file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const extension = file.name.split('.').pop() || 'jpg';
  const path = `${user.id}/${date}-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from('daily-photos').upload(path, file, {
    upsert: true,
    contentType: file.type || 'image/jpeg',
  });
  if (error) throw error;

  const { data } = supabase.storage.from('daily-photos').getPublicUrl(path);
  return data.publicUrl;
}
