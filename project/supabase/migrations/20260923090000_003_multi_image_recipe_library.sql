CREATE TYPE public.recipe_kind AS ENUM ('brew_method', 'drink');

ALTER TABLE public.recipes
  ADD COLUMN recipe_kind public.recipe_kind NOT NULL DEFAULT 'brew_method',
  ADD COLUMN ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN steps jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE public.bean_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bean_profile_id uuid NOT NULL REFERENCES public.bean_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('upload', 'external_url')),
  storage_path text,
  external_url text,
  sort_order integer NOT NULL CHECK (sort_order BETWEEN 0 AND 2),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bean_images_source_check CHECK (
    (source_type = 'upload' AND storage_path IS NOT NULL AND external_url IS NULL)
    OR
    (source_type = 'external_url' AND external_url IS NOT NULL AND storage_path IS NULL)
  ),
  CONSTRAINT bean_images_order_unique
    UNIQUE (bean_profile_id, sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE public.recipe_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('upload', 'external_url')),
  storage_path text,
  external_url text,
  sort_order integer NOT NULL CHECK (sort_order BETWEEN 0 AND 4),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recipe_images_source_check CHECK (
    (source_type = 'upload' AND storage_path IS NOT NULL AND external_url IS NULL)
    OR
    (source_type = 'external_url' AND external_url IS NOT NULL AND storage_path IS NULL)
  ),
  CONSTRAINT recipe_images_order_unique
    UNIQUE (recipe_id, sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_bean_images_bean ON public.bean_images(bean_profile_id, sort_order);
CREATE INDEX idx_bean_images_user ON public.bean_images(user_id);
CREATE INDEX idx_recipe_images_recipe ON public.recipe_images(recipe_id, sort_order);
CREATE INDEX idx_recipes_kind ON public.recipes(recipe_kind);

ALTER TABLE public.bean_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_bean_images" ON public.bean_images
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_bean_images" ON public.bean_images
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.bean_profiles bean
      WHERE bean.id = bean_profile_id AND bean.user_id = auth.uid()
    )
  );

CREATE POLICY "update_own_bean_images" ON public.bean_images
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.bean_profiles bean
      WHERE bean.id = bean_profile_id AND bean.user_id = auth.uid()
    )
  );

CREATE POLICY "delete_own_bean_images" ON public.bean_images
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "select_accessible_recipe_images" ON public.recipe_images
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id
        AND (recipe.is_default = true OR recipe.user_id = auth.uid())
    )
  );

CREATE POLICY "insert_own_recipe_images" ON public.recipe_images
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id
        AND recipe.user_id = auth.uid()
        AND recipe.is_default = false
    )
  );

CREATE POLICY "update_own_recipe_images" ON public.recipe_images
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id
        AND recipe.user_id = auth.uid()
        AND recipe.is_default = false
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id
        AND recipe.user_id = auth.uid()
        AND recipe.is_default = false
    )
  );

CREATE POLICY "delete_own_recipe_images" ON public.recipe_images
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id
        AND recipe.user_id = auth.uid()
        AND recipe.is_default = false
    )
  );

DROP POLICY IF EXISTS "insert_own_recipes" ON public.recipes;
DROP POLICY IF EXISTS "update_own_recipes" ON public.recipes;
DROP POLICY IF EXISTS "select_own_recipes" ON public.recipes;
DROP POLICY IF EXISTS "delete_own_recipes" ON public.recipes;

CREATE POLICY "select_accessible_recipes" ON public.recipes
  FOR SELECT TO authenticated USING (
    (is_default = true AND user_id IS NULL)
    OR (auth.uid() = user_id AND is_default = false)
  );

CREATE POLICY "insert_own_recipes" ON public.recipes
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND is_default = false
  );

CREATE POLICY "update_own_recipes" ON public.recipes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND is_default = false)
  WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "delete_own_recipes" ON public.recipes
  FOR DELETE TO authenticated USING (
    auth.uid() = user_id AND is_default = false
  );

INSERT INTO public.bean_images (
  bean_profile_id,
  user_id,
  source_type,
  external_url,
  sort_order
)
SELECT id, user_id, 'external_url', image_url, 0
FROM public.bean_profiles
WHERE image_url IS NOT NULL
  AND btrim(image_url) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.bean_images image
    WHERE image.bean_profile_id = public.bean_profiles.id
      AND image.sort_order = 0
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('bean-images', 'bean-images', false, 1048576, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('recipe-images', 'recipe-images', false, 1048576, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "bean_images_storage_select" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'bean-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "bean_images_storage_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'bean-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM public.bean_profiles bean
      WHERE bean.id = ((storage.foldername(name))[2])::uuid
        AND bean.user_id = auth.uid()
    )
  );

CREATE POLICY "bean_images_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'bean-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM public.bean_profiles bean
      WHERE bean.id = ((storage.foldername(name))[2])::uuid
        AND bean.user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'bean-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM public.bean_profiles bean
      WHERE bean.id = ((storage.foldername(name))[2])::uuid
        AND bean.user_id = auth.uid()
    )
  );

CREATE POLICY "bean_images_storage_delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'bean-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "recipe_images_storage_select" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'recipe-images'
    AND (
      (storage.foldername(name))[1] = 'builtin'
      OR (
        (storage.foldername(name))[1] = 'user'
        AND auth.uid()::text = (storage.foldername(name))[2]
      )
    )
  );

CREATE POLICY "recipe_images_storage_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'recipe-images'
    AND (storage.foldername(name))[1] = 'user'
    AND auth.uid()::text = (storage.foldername(name))[2]
    AND EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = ((storage.foldername(name))[3])::uuid
        AND recipe.user_id = auth.uid()
        AND recipe.is_default = false
    )
  );

CREATE POLICY "recipe_images_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'recipe-images'
    AND (storage.foldername(name))[1] = 'user'
    AND auth.uid()::text = (storage.foldername(name))[2]
    AND EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = ((storage.foldername(name))[3])::uuid
        AND recipe.user_id = auth.uid()
        AND recipe.is_default = false
    )
  )
  WITH CHECK (
    bucket_id = 'recipe-images'
    AND (storage.foldername(name))[1] = 'user'
    AND auth.uid()::text = (storage.foldername(name))[2]
    AND EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = ((storage.foldername(name))[3])::uuid
        AND recipe.user_id = auth.uid()
        AND recipe.is_default = false
    )
  );

CREATE POLICY "recipe_images_storage_delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'recipe-images'
    AND (storage.foldername(name))[1] = 'user'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE OR REPLACE FUNCTION public.reorder_bean_images(
  p_bean_id uuid,
  p_image_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  expected_count integer;
BEGIN
  IF coalesce(array_length(p_image_ids, 1), 0) > 3 THEN
    RAISE EXCEPTION 'A bean can have at most 3 images';
  END IF;

  SELECT count(*) INTO expected_count
  FROM public.bean_images
  WHERE bean_profile_id = p_bean_id AND user_id = auth.uid();

  IF expected_count <> coalesce(array_length(p_image_ids, 1), 0)
     OR expected_count <> (SELECT count(DISTINCT value) FROM unnest(p_image_ids) AS ids(value))
     OR EXISTS (
       SELECT 1 FROM unnest(p_image_ids) AS image_id
       WHERE NOT EXISTS (
         SELECT 1 FROM public.bean_images image
         WHERE image.id = image_id
           AND image.bean_profile_id = p_bean_id
           AND image.user_id = auth.uid()
       )
     ) THEN
    RAISE EXCEPTION 'Invalid bean image order';
  END IF;

  SET CONSTRAINTS bean_images_order_unique DEFERRED;

  UPDATE public.bean_images image
  SET sort_order = ordered.position - 1
  FROM unnest(p_image_ids) WITH ORDINALITY AS ordered(id, position)
  WHERE image.id = ordered.id AND image.bean_profile_id = p_bean_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reorder_recipe_images(
  p_recipe_id uuid,
  p_image_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  expected_count integer;
BEGIN
  IF coalesce(array_length(p_image_ids, 1), 0) > 5 THEN
    RAISE EXCEPTION 'A recipe can have at most 5 images';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes recipe
    WHERE recipe.id = p_recipe_id
      AND recipe.user_id = auth.uid()
      AND recipe.is_default = false
  ) THEN
    RAISE EXCEPTION 'Recipe is not editable';
  END IF;

  SELECT count(*) INTO expected_count
  FROM public.recipe_images
  WHERE recipe_id = p_recipe_id;

  IF expected_count <> coalesce(array_length(p_image_ids, 1), 0)
     OR expected_count <> (SELECT count(DISTINCT value) FROM unnest(p_image_ids) AS ids(value))
     OR EXISTS (
       SELECT 1 FROM unnest(p_image_ids) AS image_id
       WHERE NOT EXISTS (
         SELECT 1 FROM public.recipe_images image
         WHERE image.id = image_id AND image.recipe_id = p_recipe_id
       )
     ) THEN
    RAISE EXCEPTION 'Invalid recipe image order';
  END IF;

  SET CONSTRAINTS recipe_images_order_unique DEFERRED;

  UPDATE public.recipe_images image
  SET sort_order = ordered.position - 1
  FROM unnest(p_image_ids) WITH ORDINALITY AS ordered(id, position)
  WHERE image.id = ordered.id AND image.recipe_id = p_recipe_id;
END;
$$;

UPDATE public.recipes
SET
  name = CASE WHEN name = 'Americano' THEN 'Classic Americano' ELSE name END,
  recipe_kind = CASE
    WHEN device IN ('americano', 'latte') THEN 'drink'::public.recipe_kind
    ELSE 'brew_method'::public.recipe_kind
  END,
  ingredients = CASE device
    WHEN 'espresso' THEN '[{"name":"Coffee beans","amount":18,"unit":"g"},{"name":"Water","amount":36,"unit":"g"}]'::jsonb
    WHEN 'americano' THEN '[{"name":"Espresso","amount":36,"unit":"g"},{"name":"Hot water","amount":120,"unit":"ml"}]'::jsonb
    WHEN 'latte' THEN '[{"name":"Espresso","amount":36,"unit":"g"},{"name":"Milk","amount":180,"unit":"ml"}]'::jsonb
    ELSE jsonb_build_array(
      jsonb_build_object('name', 'Coffee beans', 'amount', default_dose_grams, 'unit', 'g'),
      jsonb_build_object('name', 'Water', 'amount', default_yield_ml, 'unit', 'ml')
    )
  END,
  steps = CASE device
    WHEN 'americano' THEN '[{"order":1,"title":"Pull espresso","description":"Extract a double espresso.","duration_seconds":30},{"order":2,"title":"Add water","description":"Add hot water and serve.","duration_seconds":15}]'::jsonb
    WHEN 'latte' THEN '[{"order":1,"title":"Pull espresso","description":"Extract a double espresso.","duration_seconds":30},{"order":2,"title":"Steam milk","description":"Steam milk to 60-65C.","duration_seconds":45},{"order":3,"title":"Pour","description":"Pour the milk and finish the latte.","duration_seconds":20}]'::jsonb
    ELSE coalesce(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'order', pour.position,
            'title', coalesce(pour.step ->> 'action', 'Step'),
            'description', CASE
              WHEN coalesce((pour.step ->> 'amount')::numeric, 0) > 0
                THEN concat('At ', pour.step ->> 'time', ', add ', pour.step ->> 'amount', ' ml water.')
              ELSE concat('At ', pour.step ->> 'time', '.')
            END,
            'duration_seconds', NULL
          )
          ORDER BY pour.position
        )
        FROM jsonb_array_elements(coalesce(default_pour_scheme, '[]'::jsonb))
          WITH ORDINALITY AS pour(step, position)
      ),
      '[]'::jsonb
    )
  END
WHERE is_default = true;

INSERT INTO public.recipes (
  user_id,
  name,
  device,
  default_temp_c,
  default_dose_grams,
  default_yield_ml,
  default_ratio,
  default_time_seconds,
  instructions,
  is_default,
  recipe_kind,
  ingredients,
  steps
)
SELECT * FROM (VALUES
  (
    NULL::uuid,
    'Iced Americano',
    'americano'::public.brew_device,
    93.0::numeric,
    18.0::numeric,
    220.0::numeric,
    '1:2'::text,
    45,
    'Pull espresso over ice, then add chilled water.'::text,
    true,
    'drink'::public.recipe_kind,
    '[{"name":"Espresso","amount":36,"unit":"g"},{"name":"Chilled water","amount":120,"unit":"ml"},{"name":"Ice","amount":100,"unit":"g"}]'::jsonb,
    '[{"order":1,"title":"Prepare ice","description":"Fill the glass with ice.","duration_seconds":10},{"order":2,"title":"Pull espresso","description":"Extract a double espresso over the ice.","duration_seconds":30},{"order":3,"title":"Add water","description":"Add chilled water and stir.","duration_seconds":10}]'::jsonb
  ),
  (
    NULL::uuid,
    'Dirty Latte',
    'latte'::public.brew_device,
    93.0::numeric,
    18.0::numeric,
    180.0::numeric,
    '1:2'::text,
    45,
    'Layer fresh espresso over cold milk for a marbled drink.'::text,
    true,
    'drink'::public.recipe_kind,
    '[{"name":"Espresso","amount":36,"unit":"g"},{"name":"Cold milk","amount":150,"unit":"ml"},{"name":"Ice","amount":60,"unit":"g"}]'::jsonb,
    '[{"order":1,"title":"Prepare milk","description":"Add cold milk and ice to the glass.","duration_seconds":10},{"order":2,"title":"Pull espresso","description":"Extract a double espresso.","duration_seconds":30},{"order":3,"title":"Layer","description":"Slowly pour espresso over the milk.","duration_seconds":10}]'::jsonb
  ),
  (
    NULL::uuid,
    'Citrus Americano',
    'americano'::public.brew_device,
    93.0::numeric,
    18.0::numeric,
    250.0::numeric,
    '1:2'::text,
    60,
    'A bright iced americano balanced with tonic and fresh citrus.'::text,
    true,
    'drink'::public.recipe_kind,
    '[{"name":"Espresso","amount":36,"unit":"g"},{"name":"Tonic water","amount":120,"unit":"ml"},{"name":"Orange juice","amount":30,"unit":"ml"},{"name":"Ice","amount":100,"unit":"g"}]'::jsonb,
    '[{"order":1,"title":"Build the base","description":"Add ice, tonic water, and orange juice.","duration_seconds":15},{"order":2,"title":"Pull espresso","description":"Extract a double espresso.","duration_seconds":30},{"order":3,"title":"Finish","description":"Pour espresso over the base and stir gently.","duration_seconds":10}]'::jsonb
  )
) AS seed(
  user_id,
  name,
  device,
  default_temp_c,
  default_dose_grams,
  default_yield_ml,
  default_ratio,
  default_time_seconds,
  instructions,
  is_default,
  recipe_kind,
  ingredients,
  steps
)
WHERE NOT EXISTS (
  SELECT 1 FROM public.recipes existing
  WHERE existing.is_default = true AND existing.name = seed.name
);

INSERT INTO public.recipe_images (recipe_id, source_type, external_url, sort_order)
SELECT
  recipe.id,
  'external_url',
  CASE recipe.device
    WHEN 'v60' THEN 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?fm=jpg&fit=crop&w=1200&q=82'
    WHEN 'origami' THEN 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?fm=jpg&fit=crop&w=1200&q=82'
    WHEN 'kalita' THEN 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?fm=jpg&fit=crop&w=1200&q=82'
    WHEN 'french_press' THEN 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?fm=jpg&fit=crop&w=1200&q=82'
    WHEN 'aeropress' THEN 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?fm=jpg&fit=crop&w=1200&q=82'
    WHEN 'espresso' THEN 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?fm=jpg&fit=crop&w=1200&q=82'
    WHEN 'latte' THEN 'https://images.unsplash.com/photo-1561047029-3000c68339ca?fm=jpg&fit=crop&w=1200&q=82'
    WHEN 'cold_brew' THEN 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?fm=jpg&fit=crop&w=1200&q=82'
    ELSE 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?fm=jpg&fit=crop&w=1200&q=82'
  END,
  0
FROM public.recipes recipe
WHERE recipe.is_default = true
  AND NOT EXISTS (
    SELECT 1 FROM public.recipe_images image WHERE image.recipe_id = recipe.id
  );
