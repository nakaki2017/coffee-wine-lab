-- Create enums
CREATE TYPE public.roast_level AS ENUM ('light', 'medium_light', 'medium', 'medium_dark', 'dark', 'custom');
CREATE TYPE public.batch_status AS ENUM ('pending', 'resting', 'ready', 'in_use', 'finished', 'archived');
CREATE TYPE public.brew_device AS ENUM ('v60', 'origami', 'kalita', 'french_press', 'aeropress', 'espresso', 'americano', 'latte', 'cold_brew', 'other');
CREATE TYPE public.flavor_category AS ENUM ('fruity', 'nutty', 'floral', 'chocolate', 'spice', 'sweet', 'herbal', 'other');

-- Bean Profiles
CREATE TABLE public.bean_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand text NOT NULL,
  roaster text,
  bean_name text NOT NULL,
  origin_country text,
  region text,
  process_method text,
  variety text,
  altitude text,
  roast_level public.roast_level,
  roast_level_custom text,
  flavor_description text,
  recommended_resting_days integer DEFAULT 7,
  purchase_link text,
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Purchase Batches
CREATE TABLE public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bean_profile_id uuid NOT NULL REFERENCES public.bean_profiles(id) ON DELETE CASCADE,
  batch_code text,
  purchase_date date,
  roast_date date,
  received_date date,
  price numeric(10,2),
  weight_grams numeric(8,1) NOT NULL DEFAULT 0,
  remaining_grams numeric(8,1) NOT NULL DEFAULT 0,
  purchase_channel text,
  status public.batch_status NOT NULL DEFAULT 'pending',
  opened_date date,
  is_repurchase boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Recipes
CREATE TABLE public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  device public.brew_device NOT NULL,
  default_grind text,
  default_temp_c numeric(5,1),
  default_dose_grams numeric(5,1),
  default_yield_ml numeric(6,1),
  default_ratio text,
  default_time_seconds integer,
  default_pour_scheme jsonb,
  default_filter text,
  instructions text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Brew Records
CREATE TABLE public.brew_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  brew_date timestamptz DEFAULT now() NOT NULL,
  device public.brew_device NOT NULL DEFAULT 'v60',
  grind_setting text,
  water_temp_c numeric(5,1),
  dose_grams numeric(5,1) NOT NULL,
  yield_ml numeric(6,1),
  ratio text,
  total_time_seconds integer,
  pour_scheme jsonb,
  filter_type text,
  cups integer DEFAULT 1,
  rating integer CHECK (rating >= 1 AND rating <= 10),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Cupping Records
CREATE TABLE public.cupping_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brew_record_id uuid NOT NULL REFERENCES public.brew_records(id) ON DELETE CASCADE,
  aroma integer CHECK (aroma >= 1 AND aroma <= 10),
  acidity integer CHECK (acidity >= 1 AND acidity <= 10),
  sweetness integer CHECK (sweetness >= 1 AND sweetness <= 10),
  bitterness integer CHECK (bitterness >= 1 AND bitterness <= 10),
  body integer CHECK (body >= 1 AND body <= 10),
  aftertaste integer CHECK (aftertaste >= 1 AND aftertaste <= 10),
  cleanliness integer CHECK (cleanliness >= 1 AND cleanliness <= 10),
  balance integer CHECK (balance >= 1 AND balance <= 10),
  overall_score integer CHECK (overall_score >= 1 AND overall_score <= 10),
  flavor_tags text[] DEFAULT '{}',
  comparison_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Flavor Tag Definitions
CREATE TABLE public.flavor_tag_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name text NOT NULL,
  category public.flavor_category NOT NULL DEFAULT 'other'
);

-- Enable RLS
ALTER TABLE public.bean_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brew_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupping_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flavor_tag_definitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bean_profiles
CREATE POLICY "select_own_beans" ON public.bean_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_beans" ON public.bean_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_beans" ON public.bean_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_beans" ON public.bean_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for batches
CREATE POLICY "select_own_batches" ON public.batches FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_batches" ON public.batches FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_batches" ON public.batches FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_batches" ON public.batches FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for recipes
CREATE POLICY "select_own_recipes" ON public.recipes FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_default = true);
CREATE POLICY "insert_own_recipes" ON public.recipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_recipes" ON public.recipes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_recipes" ON public.recipes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for brew_records
CREATE POLICY "select_own_brews" ON public.brew_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_brews" ON public.brew_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_brews" ON public.brew_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_brews" ON public.brew_records FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for cupping_records
CREATE POLICY "select_own_cuppings" ON public.cupping_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_cuppings" ON public.cupping_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_cuppings" ON public.cupping_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_cuppings" ON public.cupping_records FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for flavor_tag_definitions (read-only for all authenticated)
CREATE POLICY "select_flavor_tags" ON public.flavor_tag_definitions FOR SELECT TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_bean_profiles_user ON public.bean_profiles(user_id);
CREATE INDEX idx_batches_user ON public.batches(user_id);
CREATE INDEX idx_batches_status ON public.batches(user_id, status);
CREATE INDEX idx_batches_bean ON public.batches(bean_profile_id);
CREATE INDEX idx_brew_records_user ON public.brew_records(user_id);
CREATE INDEX idx_brew_records_batch ON public.brew_records(batch_id);
CREATE INDEX idx_cupping_records_brew ON public.cupping_records(brew_record_id);
CREATE INDEX idx_recipes_user ON public.recipes(user_id);

-- Seed flavor tags
INSERT INTO public.flavor_tag_definitions (tag_name, category) VALUES
  ('blueberry', 'fruity'), ('strawberry', 'fruity'), ('raspberry', 'fruity'), ('blackberry', 'fruity'),
  ('cherry', 'fruity'), ('grape', 'fruity'), ('citrus', 'fruity'), ('lemon', 'fruity'),
  ('lime', 'fruity'), ('orange', 'fruity'), ('tangerine', 'fruity'), ('grapefruit', 'fruity'),
  ('mango', 'fruity'), ('pineapple', 'fruity'), ('passion fruit', 'fruity'), ('peach', 'fruity'),
  ('apricot', 'fruity'), ('apple', 'fruity'), ('pear', 'fruity'), ('melon', 'fruity'),
  ('coconut', 'fruity'), ('banana', 'fruity'), ('kiwi', 'fruity'), ('plum', 'fruity'),
  ('dark chocolate', 'chocolate'), ('milk chocolate', 'chocolate'), ('cocoa', 'chocolate'), ('cacao', 'chocolate'),
  ('caramel', 'sweet'), ('honey', 'sweet'), ('brown sugar', 'sweet'), ('maple syrup', 'sweet'),
  ('molasses', 'sweet'), ('vanilla', 'sweet'), ('toffee', 'sweet'), ('butterscotch', 'sweet'),
  ('almond', 'nutty'), ('walnut', 'nutty'), ('hazelnut', 'nutty'), ('peanut', 'nutty'),
  ('cashew', 'nutty'), ('pecan', 'nutty'), ('pistachio', 'nutty'),
  ('cinnamon', 'spice'), ('nutmeg', 'spice'), ('clove', 'spice'), ('cardamom', 'spice'),
  ('ginger', 'spice'), ('black pepper', 'spice'), ('chili', 'spice'), ('anise', 'spice'),
  ('jasmine', 'floral'), ('rose', 'floral'), ('lavender', 'floral'), ('hibiscus', 'floral'),
  ('chamomile', 'floral'), ('elderflower', 'floral'), ('violet', 'floral'),
  ('mint', 'herbal'), ('tea', 'herbal'), ('tobacco', 'herbal'), ('hay', 'herbal'),
  ('leather', 'herbal'), ('earthy', 'herbal'), ('woody', 'herbal'), ('mushroom', 'herbal'),
  ('wine', 'other'), ('whiskey', 'other'), ('rum', 'other'), ('fermented', 'other');

-- Seed default recipes
INSERT INTO public.recipes (user_id, name, device, default_grind, default_temp_c, default_dose_grams, default_yield_ml, default_ratio, default_time_seconds, default_pour_scheme, default_filter, instructions, is_default) VALUES
  (NULL, 'V60 Classic', 'v60', 'Medium-fine', 93.0, 15.0, 250.0, '1:16.7', 210, '[{"time":"0:00","action":"Bloom","amount":30},{"time":"0:45","action":"Pour","amount":70},{"time":"1:30","action":"Pour","amount":80},{"time":"2:15","action":"Pour","amount":70}]', 'Hario V60 paper', 'Pre-wet filter. Bloom with 2x dose weight. Pour in concentric circles. Drawdown ~3:30 total.', true),
  (NULL, 'Origami Standard', 'origami', 'Medium', 92.0, 15.0, 240.0, '1:16', 210, '[{"time":"0:00","action":"Bloom","amount":30},{"time":"0:45","action":"Pour","amount":70},{"time":"1:30","action":"Pour","amount":70},{"time":"2:15","action":"Pour","amount":70}]', 'Kalita Wave 155', 'Use Kalita 155 filter for flat-bottom extraction. Bloom, then pour in 3 equal pulses.', true),
  (NULL, 'Kalita Wave', 'kalita', 'Medium', 92.0, 15.0, 240.0, '1:16', 210, '[{"time":"0:00","action":"Bloom","amount":30},{"time":"0:45","action":"Pour","amount":70},{"time":"1:30","action":"Pour","amount":70},{"time":"2:15","action":"Pour","amount":70}]', 'Kalita Wave 155', 'Flat-bottom dripper for even extraction. Bloom, pour in 3 pulses. Keep water level consistent.', true),
  (NULL, 'French Press', 'french_press', 'Coarse', 95.0, 30.0, 500.0, '1:16.7', 300, '[{"time":"0:00","action":"Pour all water","amount":500},{"time":"4:00","action":"Break crust","amount":0},{"time":"4:30","action":"Plunge","amount":0}]', 'None', 'Add coffee, pour all water at once. Steep 4 min. Break crust, wait 30s, plunge gently.', true),
  (NULL, 'Aeropress Standard', 'aeropress', 'Medium-fine', 85.0, 15.0, 200.0, '1:13.3', 120, '[{"time":"0:00","action":"Pour","amount":200},{"time":"1:00","action":"Stir","amount":0},{"time":"1:30","action":"Press","amount":0}]', 'Aeropress paper', 'Inverted or standard. Pour water, stir at 1 min, press at 1:30 for ~30s.', true),
  (NULL, 'Espresso Double', 'espresso', 'Fine', 93.0, 18.0, 36.0, '1:2', 30, '[{"time":"0:00","action":"Start extraction","amount":0},{"time":"0:30","action":"Stop","amount":36}]', 'VST 18g basket', 'Distribute and tamp evenly. Target 25-30s extraction for 36g yield.', true),
  (NULL, 'Americano', 'americano', 'Fine', 93.0, 18.0, 36.0, '1:2', 30, '[{"time":"0:00","action":"Pull espresso","amount":36},{"time":"0:30","action":"Add hot water","amount":120}]', 'VST 18g basket', 'Pull double espresso, then add 120ml hot water for an 8oz americano.', true),
  (NULL, 'Latte', 'latte', 'Fine', 93.0, 18.0, 36.0, '1:2', 30, '[{"time":"0:00","action":"Pull espresso","amount":36},{"time":"0:30","action":"Steam milk","amount":180}]', 'VST 18g basket', 'Pull double espresso. Steam 180ml milk to 60-65C. Pour latte art.', true),
  (NULL, 'Cold Brew', 'cold_brew', 'Coarse', 4.0, 80.0, 800.0, '1:10', 43200, '[{"time":"0:00","action":"Combine grounds + water","amount":800},{"time":"12:00:00","action":"Strain","amount":0}]', 'None', 'Combine coarse grounds with cold water. Steep 12-24h in fridge. Strain through filter. Dilute to taste.', true);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_bean_profiles_updated_at BEFORE UPDATE ON public.bean_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_batches_updated_at BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_brew_records_updated_at BEFORE UPDATE ON public.brew_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_cupping_records_updated_at BEFORE UPDATE ON public.cupping_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_recipes_updated_at BEFORE UPDATE ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
