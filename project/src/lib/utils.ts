import { supabase } from './supabase';
import type {
  BeanImage,
  BeanProfile,
  Batch,
  BrewRecord,
  CuppingRecord,
  DailyEntry,
  DrinkType,
  Recipe,
  RecipeImage,
  RecipeIngredient,
  RecipeStep,
  FlavorTagDef,
} from './types';
import { compressImage } from './image';

const IMAGE_URL_TTL_SECONDS = 60 * 60;

async function withImageUrl<T extends { source_type: string; storage_path: string | null; external_url: string | null }>(
  bucket: string,
  image: T,
): Promise<T & { url?: string }> {
  if (image.source_type === 'external_url') return { ...image, url: image.external_url || undefined };
  if (!image.storage_path) return image;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(image.storage_path, IMAGE_URL_TTL_SECONDS);
  if (error) {
    console.error('Unable to create image URL', error);
    return image;
  }
  return { ...image, url: data.signedUrl };
}

async function withImageUrls<T extends { source_type: string; storage_path: string | null; external_url: string | null }>(
  bucket: string,
  images: T[],
): Promise<Array<T & { url?: string }>> {
  return Promise.all(images.map(image => withImageUrl(bucket, image)));
}

async function currentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function fetchBeanProfiles(): Promise<BeanProfile[]> {
  const { data, error } = await supabase
    .from('bean_profiles')
    .select('*, images:bean_images(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return Promise.all((data || []).map(async bean => ({
    ...bean,
    images: await withImageUrls('bean-images', (bean.images || []).sort((a: BeanImage, b: BeanImage) => a.sort_order - b.sort_order)),
  })));
}

export async function fetchBeanProfile(id: string): Promise<BeanProfile | null> {
  const { data, error } = await supabase
    .from('bean_profiles')
    .select('*, images:bean_images(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    images: await withImageUrls('bean-images', (data.images || []).sort((a: BeanImage, b: BeanImage) => a.sort_order - b.sort_order)),
  };
}

export async function createBeanProfile(bean: Omit<BeanProfile, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'images'>): Promise<BeanProfile> {
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
  const { images, ...clean } = updates;
  const { data, error } = await supabase
    .from('bean_profiles')
    .update(clean)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBeanProfile(id: string): Promise<void> {
  const images = await fetchBeanImages(id);
  const { error } = await supabase.from('bean_profiles').delete().eq('id', id);
  if (error) throw error;
  const paths = images.flatMap(image => image.storage_path ? [image.storage_path] : []);
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from('bean-images').remove(paths);
    if (storageError) console.error('Unable to remove bean images', storageError);
  }
}

export async function fetchBeanImages(beanId: string): Promise<BeanImage[]> {
  const { data, error } = await supabase
    .from('bean_images')
    .select('*')
    .eq('bean_profile_id', beanId)
    .order('sort_order');
  if (error) throw error;
  return withImageUrls('bean-images', data || []);
}

export async function uploadBeanImage(beanId: string, file: File): Promise<BeanImage> {
  const [userId, images, blob] = await Promise.all([
    currentUserId(),
    fetchBeanImages(beanId),
    compressImage(file),
  ]);
  if (images.length >= 3) throw new Error('A bean can have at most 3 images');

  const path = `${userId}/${beanId}/${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage.from('bean-images').upload(path, blob, {
    contentType: 'image/webp',
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('bean_images')
    .insert({
      bean_profile_id: beanId,
      user_id: userId,
      source_type: 'upload',
      storage_path: path,
      external_url: null,
      sort_order: images.length,
    })
    .select()
    .single();
  if (error) {
    await supabase.storage.from('bean-images').remove([path]);
    throw error;
  }
  return withImageUrl('bean-images', data);
}

export async function deleteBeanImage(imageId: string): Promise<void> {
  const { data: image, error: fetchError } = await supabase
    .from('bean_images')
    .select('*')
    .eq('id', imageId)
    .single();
  if (fetchError) throw fetchError;

  const { error } = await supabase.from('bean_images').delete().eq('id', imageId);
  if (error) throw error;
  if (image.storage_path) {
    const { error: storageError } = await supabase.storage.from('bean-images').remove([image.storage_path]);
    if (storageError) console.error('Unable to remove bean image object', storageError);
  }
  const remaining = await fetchBeanImages(image.bean_profile_id);
  if (remaining.length > 0) await reorderBeanImages(image.bean_profile_id, remaining.map(item => item.id));
}

export async function reorderBeanImages(beanId: string, imageIds: string[]): Promise<void> {
  const { error } = await supabase.rpc('reorder_bean_images', {
    p_bean_id: beanId,
    p_image_ids: imageIds,
  });
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
    .select('*, images:recipe_images(*)')
    .order('is_default', { ascending: false })
    .order('name');
  if (error) throw error;
  return Promise.all((data || []).map(async recipe => normalizeRecipe(recipe, await withImageUrls('recipe-images', (recipe.images || []).sort((a: RecipeImage, b: RecipeImage) => a.sort_order - b.sort_order)))));
}

export async function fetchRecipe(id: string): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, images:recipe_images(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return normalizeRecipe(data, await withImageUrls('recipe-images', (data.images || []).sort((a: RecipeImage, b: RecipeImage) => a.sort_order - b.sort_order)));
}

type RecipeWriteInput = Partial<Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'images'>> & Pick<Recipe, 'name'>;

function normalizeRecipe(recipe: any, images?: RecipeImage[]): Recipe {
  return {
    ...recipe,
    name_zh: recipe.name_zh ?? null,
    name_en: recipe.name_en ?? null,
    device: recipe.device ?? null,
    drink_type: (recipe.drink_type as DrinkType | null) ?? null,
    drink_type_custom: recipe.drink_type_custom ?? null,
    recipe_kind: recipe.recipe_kind || 'brew_method',
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || [],
    images,
  } as Recipe;
}

function normalizeRecipeWrite(recipe: RecipeWriteInput) {
  const recipeKind = recipe.recipe_kind || 'brew_method';
  const isDrink = recipeKind === 'drink';
  const drinkType = isDrink ? recipe.drink_type || 'other' : null;
  return {
    name: recipe.name.trim(),
    name_zh: recipe.name_zh || null,
    name_en: recipe.name_en || null,
    recipe_kind: recipeKind,
    device: isDrink ? null : recipe.device || 'v60',
    drink_type: drinkType,
    drink_type_custom: drinkType === 'other' ? recipe.drink_type_custom || null : null,
    default_grind: isDrink ? null : recipe.default_grind || null,
    default_temp_c: isDrink ? null : recipe.default_temp_c ?? null,
    default_dose_grams: isDrink ? null : recipe.default_dose_grams ?? null,
    default_yield_ml: isDrink ? null : recipe.default_yield_ml ?? null,
    default_ratio: isDrink ? null : recipe.default_ratio || null,
    default_time_seconds: isDrink ? null : recipe.default_time_seconds ?? null,
    default_pour_scheme: isDrink ? null : recipe.default_pour_scheme || null,
    default_filter: isDrink ? null : recipe.default_filter || null,
    instructions: recipe.instructions || null,
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || [],
    is_default: false,
  };
}

export async function createRecipe(recipe: RecipeWriteInput): Promise<Recipe> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      ...normalizeRecipeWrite(recipe),
      user_id: user.id,
    })
    .select()
    .single();
  if (error) throw error;
  return normalizeRecipe(data);
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe> {
  const { images, is_default, user_id, ...clean } = updates;
  const normalized = normalizeRecipeWrite(clean as RecipeWriteInput);
  const { data, error } = await supabase
    .from('recipes')
    .update(normalized)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return normalizeRecipe(data);
}

export async function deleteRecipe(id: string): Promise<void> {
  const images = await fetchRecipeImages(id);
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
  const paths = images.flatMap(image => image.storage_path ? [image.storage_path] : []);
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from('recipe-images').remove(paths);
    if (storageError) console.error('Unable to remove recipe images', storageError);
  }
}

export async function fetchRecipeImages(recipeId: string): Promise<RecipeImage[]> {
  const { data, error } = await supabase
    .from('recipe_images')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('sort_order');
  if (error) throw error;
  return withImageUrls('recipe-images', data || []);
}

export async function uploadRecipeImage(recipeId: string, file: File): Promise<RecipeImage> {
  const [userId, images, blob] = await Promise.all([
    currentUserId(),
    fetchRecipeImages(recipeId),
    compressImage(file),
  ]);
  if (images.length >= 5) throw new Error('A recipe can have at most 5 images');

  const path = `user/${userId}/${recipeId}/${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage.from('recipe-images').upload(path, blob, {
    contentType: 'image/webp',
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('recipe_images')
    .insert({
      recipe_id: recipeId,
      source_type: 'upload',
      storage_path: path,
      external_url: null,
      sort_order: images.length,
    })
    .select()
    .single();
  if (error) {
    await supabase.storage.from('recipe-images').remove([path]);
    throw error;
  }
  return withImageUrl('recipe-images', data);
}

export async function deleteRecipeImage(imageId: string): Promise<void> {
  const { data: image, error: fetchError } = await supabase
    .from('recipe_images')
    .select('*')
    .eq('id', imageId)
    .single();
  if (fetchError) throw fetchError;

  const { error } = await supabase.from('recipe_images').delete().eq('id', imageId);
  if (error) throw error;
  if (image.storage_path) {
    const { error: storageError } = await supabase.storage.from('recipe-images').remove([image.storage_path]);
    if (storageError) console.error('Unable to remove recipe image object', storageError);
  }
  const remaining = await fetchRecipeImages(image.recipe_id);
  if (remaining.length > 0) await reorderRecipeImages(image.recipe_id, remaining.map(item => item.id));
}

export async function reorderRecipeImages(recipeId: string, imageIds: string[]): Promise<void> {
  const { error } = await supabase.rpc('reorder_recipe_images', {
    p_recipe_id: recipeId,
    p_image_ids: imageIds,
  });
  if (error) throw error;
}

async function recipeImageBlob(image: RecipeImage): Promise<Blob> {
  if (image.storage_path) {
    const { data, error } = await supabase.storage.from('recipe-images').download(image.storage_path);
    if (error) throw error;
    return data;
  }
  if (!image.external_url) throw new Error('Recipe image is unavailable');
  const response = await fetch(image.external_url);
  if (!response.ok) throw new Error('Unable to copy recipe image');
  return response.blob();
}

export async function cloneRecipe(recipe: Recipe, name = `${recipe.name} (Copy)`): Promise<Recipe> {
  const created = await createRecipe({
    name,
    name_zh: null,
    name_en: null,
    device: recipe.device,
    drink_type: recipe.drink_type,
    drink_type_custom: recipe.drink_type_custom,
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
    recipe_kind: recipe.recipe_kind,
    ingredients: recipe.ingredients as RecipeIngredient[],
    steps: recipe.steps as RecipeStep[],
  });

  try {
    for (const image of recipe.images || []) {
      const blob = await recipeImageBlob(image);
      await uploadRecipeImage(created.id, new File([blob], 'recipe-image.webp', { type: blob.type || 'image/webp' }));
    }
  } catch (error) {
    await deleteRecipe(created.id);
    throw error;
  }
  return created;
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
