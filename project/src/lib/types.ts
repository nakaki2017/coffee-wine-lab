export type RoastLevel = 'light' | 'medium_light' | 'medium' | 'medium_dark' | 'dark' | 'custom';
export type BatchStatus = 'pending' | 'resting' | 'ready' | 'in_use' | 'finished' | 'archived';
export type BrewDevice = 'v60' | 'origami' | 'kalita' | 'french_press' | 'aeropress' | 'espresso' | 'americano' | 'latte' | 'cold_brew' | 'other';
export type FlavorCategory = 'fruity' | 'nutty' | 'floral' | 'chocolate' | 'spice' | 'sweet' | 'herbal' | 'other';

export interface BeanProfile {
  id: string;
  user_id: string;
  brand: string;
  roaster: string | null;
  bean_name: string;
  origin_country: string | null;
  region: string | null;
  process_method: string | null;
  variety: string | null;
  altitude: string | null;
  roast_level: RoastLevel | null;
  roast_level_custom: string | null;
  flavor_description: string | null;
  recommended_resting_days: number;
  purchase_link: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  user_id: string;
  bean_profile_id: string;
  batch_code: string | null;
  purchase_date: string | null;
  roast_date: string | null;
  received_date: string | null;
  price: number | null;
  weight_grams: number;
  remaining_grams: number;
  purchase_channel: string | null;
  status: BatchStatus;
  opened_date: string | null;
  is_repurchase: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  bean_profile?: BeanProfile;
}

export interface Recipe {
  id: string;
  user_id: string | null;
  name: string;
  device: BrewDevice;
  default_grind: string | null;
  default_temp_c: number | null;
  default_dose_grams: number | null;
  default_yield_ml: number | null;
  default_ratio: string | null;
  default_time_seconds: number | null;
  default_pour_scheme: PourStep[] | null;
  default_filter: string | null;
  instructions: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PourStep {
  time: string;
  action: string;
  amount: number;
}

export interface BrewRecord {
  id: string;
  user_id: string;
  batch_id: string;
  recipe_id: string | null;
  brew_date: string;
  device: BrewDevice;
  grind_setting: string | null;
  water_temp_c: number | null;
  dose_grams: number;
  yield_ml: number | null;
  ratio: string | null;
  total_time_seconds: number | null;
  pour_scheme: PourStep[] | null;
  filter_type: string | null;
  cups: number;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  batch?: Batch;
  cupping?: CuppingRecord;
}

export interface CuppingRecord {
  id: string;
  user_id: string;
  brew_record_id: string;
  aroma: number | null;
  acidity: number | null;
  sweetness: number | null;
  bitterness: number | null;
  body: number | null;
  aftertaste: number | null;
  cleanliness: number | null;
  balance: number | null;
  overall_score: number | null;
  flavor_tags: string[];
  comparison_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlavorTagDef {
  id: string;
  tag_name: string;
  category: FlavorCategory;
}

export interface DailyEntry {
  id: string;
  user_id: string;
  entry_date: string;
  image_url: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type TFunction = (key: string, params?: Record<string, string | number>) => string;

export const ROAST_LEVELS: { value: RoastLevel; label: string }[] = [
  { value: 'light', label: 'roast.light' },
  { value: 'medium_light', label: 'roast.medium_light' },
  { value: 'medium', label: 'roast.medium' },
  { value: 'medium_dark', label: 'roast.medium_dark' },
  { value: 'dark', label: 'roast.dark' },
  { value: 'custom', label: 'roast.custom' },
];

export const BATCH_STATUSES: { value: BatchStatus; label: string }[] = [
  { value: 'pending', label: 'status.pending' },
  { value: 'resting', label: 'status.resting' },
  { value: 'ready', label: 'status.ready' },
  { value: 'in_use', label: 'status.in_use' },
  { value: 'finished', label: 'status.finished' },
  { value: 'archived', label: 'status.archived' },
];

export const BREW_DEVICES: { value: BrewDevice; label: string }[] = [
  { value: 'v60', label: 'device.v60' },
  { value: 'origami', label: 'device.origami' },
  { value: 'kalita', label: 'device.kalita' },
  { value: 'french_press', label: 'device.french_press' },
  { value: 'aeropress', label: 'device.aeropress' },
  { value: 'espresso', label: 'device.espresso' },
  { value: 'americano', label: 'device.americano' },
  { value: 'latte', label: 'device.latte' },
  { value: 'cold_brew', label: 'device.cold_brew' },
  { value: 'other', label: 'device.other' },
];

export const STATUS_ORDER: BatchStatus[] = ['pending', 'resting', 'ready', 'in_use', 'finished', 'archived'];

export function getNextStatus(current: BatchStatus): BatchStatus | null {
  const idx = STATUS_ORDER.indexOf(current);
  return idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
}

export function getStatusBadgeClass(status: BatchStatus): string {
  const map: Record<BatchStatus, string> = {
    pending: 'badge-pending',
    resting: 'badge-resting',
    ready: 'badge-ready',
    in_use: 'badge-in-use',
    finished: 'badge-finished',
    archived: 'badge-archived',
  };
  return map[status] || 'badge';
}

export function getDeviceLabel(device: BrewDevice): string {
  return BREW_DEVICES.find(d => d.value === device)?.label || device;
}

export function getRoastLabel(level: RoastLevel | null): string {
  if (!level) return '';
  return ROAST_LEVELS.find(r => r.value === level)?.label || level;
}

export function getStatusLabel(status: BatchStatus): string {
  return BATCH_STATUSES.find(s => s.value === status)?.label || status;
}

export function getDeviceLabelT(device: BrewDevice, t: TFunction): string {
  return t(getDeviceLabel(device));
}

export function getRoastLabelT(level: RoastLevel | null, t: TFunction): string {
  const key = getRoastLabel(level);
  return key ? t(key) : '';
}

export function getStatusLabelT(status: BatchStatus, t: TFunction): string {
  return t(getStatusLabel(status));
}
