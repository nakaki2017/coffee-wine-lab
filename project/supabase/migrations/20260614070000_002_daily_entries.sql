CREATE TABLE public.daily_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  image_url text,
  note text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT daily_entries_user_date_unique UNIQUE (user_id, entry_date)
);

ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_daily_entries" ON public.daily_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_daily_entries" ON public.daily_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_daily_entries" ON public.daily_entries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_daily_entries" ON public.daily_entries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_daily_entries_user_date ON public.daily_entries(user_id, entry_date);

CREATE TRIGGER set_daily_entries_updated_at
  BEFORE UPDATE ON public.daily_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('daily-photos', 'daily-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "daily_photos_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'daily-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "daily_photos_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'daily-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "daily_photos_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'daily-photos' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'daily-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "daily_photos_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'daily-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
