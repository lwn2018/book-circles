-- Goodreads CSV Storage - CTO Spec Implementation

-- Add columns to profiles for tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goodreads_csv_path TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goodreads_imported_isbns TEXT[] DEFAULT '{}';

-- Create storage bucket (already done via INSERT)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('goodreads-imports', 'goodreads-imports', false)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies for goodreads-imports bucket
CREATE POLICY "goodreads_upload" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'goodreads-imports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "goodreads_read" ON storage.objects FOR SELECT
USING (bucket_id = 'goodreads-imports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "goodreads_update" ON storage.objects FOR UPDATE
USING (bucket_id = 'goodreads-imports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "goodreads_delete" ON storage.objects FOR DELETE
USING (bucket_id = 'goodreads-imports' AND auth.uid()::text = (storage.foldername(name))[1]);
