-- Migration 025: Create Storage Buckets
-- Create buckets for avatars and Goodreads imports

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatars bucket
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Create imports bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('imports', 'imports', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for imports bucket
CREATE POLICY "Users can upload their own imports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'imports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own imports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'imports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Service role can access all imports for processing
CREATE POLICY "Service role can access imports"
ON storage.objects FOR ALL
USING (bucket_id = 'imports');
