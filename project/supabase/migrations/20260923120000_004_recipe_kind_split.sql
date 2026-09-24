CREATE TYPE public.drink_type AS ENUM (
  'americano',
  'iced_americano',
  'latte',
  'dirty_latte',
  'mocha',
  'cold_brew',
  'citrus_americano',
  'other'
);

ALTER TABLE public.recipes
  ALTER COLUMN device DROP NOT NULL,
  ADD COLUMN name_zh text,
  ADD COLUMN name_en text,
  ADD COLUMN drink_type public.drink_type,
  ADD COLUMN drink_type_custom text;

-- Convert the built-in drink records created by the previous recipe migration.
UPDATE public.recipes
SET
  drink_type = CASE name
    WHEN 'Classic Americano' THEN 'americano'::public.drink_type
    WHEN 'Americano' THEN 'americano'::public.drink_type
    WHEN 'Iced Americano' THEN 'iced_americano'::public.drink_type
    WHEN 'Latte' THEN 'latte'::public.drink_type
    WHEN 'Dirty Latte' THEN 'dirty_latte'::public.drink_type
    WHEN 'Citrus Americano' THEN 'citrus_americano'::public.drink_type
    ELSE drink_type
  END
WHERE is_default = true AND recipe_kind = 'drink';

UPDATE public.recipes
SET
  device = NULL,
  default_grind = NULL,
  default_temp_c = NULL,
  default_dose_grams = NULL,
  default_yield_ml = NULL,
  default_ratio = NULL,
  default_time_seconds = NULL,
  default_pour_scheme = NULL,
  default_filter = NULL
WHERE recipe_kind = 'drink';

UPDATE public.recipes
SET
  name_zh = CASE name
    WHEN 'V60 Classic' THEN 'V60 经典'
    WHEN 'Origami Standard' THEN 'Origami 标准'
    WHEN 'Kalita Wave' THEN 'Kalita Wave'
    WHEN 'French Press' THEN '法压壶'
    WHEN 'Aeropress Standard' THEN '爱乐压标准'
    WHEN 'Espresso Double' THEN '双份浓缩'
    WHEN 'Classic Americano' THEN '经典美式'
    WHEN 'Iced Americano' THEN '冰美式'
    WHEN 'Latte' THEN '拿铁'
    WHEN 'Dirty Latte' THEN '脏拿铁'
    WHEN 'Citrus Americano' THEN '柑橘美式'
    WHEN 'Cold Brew' THEN '冷萃浸泡法'
    ELSE name
  END,
  name_en = name
WHERE is_default = true;

UPDATE public.recipes
SET drink_type = NULL,
    drink_type_custom = NULL
WHERE recipe_kind = 'brew_method';

ALTER TABLE public.recipes
  ADD CONSTRAINT recipes_kind_fields_check CHECK (
    (
      recipe_kind = 'brew_method'
      AND device IS NOT NULL
      AND drink_type IS NULL
      AND drink_type_custom IS NULL
    )
    OR
    (
      recipe_kind = 'drink'
      AND device IS NULL
      AND drink_type IS NOT NULL
      AND (drink_type <> 'other' OR nullif(btrim(drink_type_custom), '') IS NOT NULL)
      AND default_grind IS NULL
      AND default_temp_c IS NULL
      AND default_dose_grams IS NULL
      AND default_yield_ml IS NULL
      AND default_ratio IS NULL
      AND default_time_seconds IS NULL
      AND default_pour_scheme IS NULL
      AND default_filter IS NULL
    )
  );

INSERT INTO public.recipes (
  user_id,
  name,
  name_zh,
  name_en,
  device,
  drink_type,
  drink_type_custom,
  instructions,
  is_default,
  recipe_kind,
  ingredients,
  steps
)
SELECT
  NULL,
  'Cold Brew Drink',
  '冷萃咖啡',
  'Cold Brew Drink',
  NULL,
  'cold_brew'::public.drink_type,
  NULL,
  'Steep coffee with cold water, strain, and serve over ice.'::text,
  true,
  'drink'::public.recipe_kind,
  '[{"name":"Cold brew concentrate","amount":120,"unit":"ml"},{"name":"Ice","amount":100,"unit":"g"}]'::jsonb,
  '[{"order":1,"title":"Prepare ice","description":"Fill the glass with ice.","duration_seconds":10},{"order":2,"title":"Add cold brew","description":"Pour chilled cold brew concentrate over the ice.","duration_seconds":10}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.recipes existing
  WHERE existing.is_default = true AND existing.name = 'Cold Brew Drink'
);

INSERT INTO public.recipe_images (recipe_id, source_type, external_url, sort_order)
SELECT
  recipe.id,
  'external_url',
  'https://images.unsplash.com/photo-1517701604599-bb29b565090c?fm=jpg&fit=crop&w=1200&q=82',
  0
FROM public.recipes recipe
WHERE recipe.is_default = true
  AND recipe.name = 'Cold Brew Drink'
  AND NOT EXISTS (
    SELECT 1 FROM public.recipe_images image WHERE image.recipe_id = recipe.id
  );
