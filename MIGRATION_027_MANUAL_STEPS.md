# Migration 027 Manual Steps

## 1. Run SQL Migration
Execute the SQL migration in Supabase Dashboard:
```
book-circles/supabase/migrations/027_add_metadata_fields.sql
```

## 2. Create Covers Storage Bucket
In Supabase Dashboard → Storage:

1. Create a new bucket named `covers`
2. Set as **Public bucket** (allow public access to files)
3. No file size limit needed (covers will be under 1MB)
4. No allowed MIME types restriction

## 3. Set RLS Policy for Covers Bucket
Run this SQL in Supabase Dashboard:

```sql
-- Allow public read access to covers
CREATE POLICY "Public read access to covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'covers');

-- Allow authenticated users to upload covers
CREATE POLICY "Authenticated users can upload covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'covers');

-- Allow authenticated users to update covers
CREATE POLICY "Authenticated users can update covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'covers');
```

## 4. Add ISBNdb API Key to Vercel
Already done by Mathieu.

## 5. Run Backfill
After deployment, trigger the backfill manually:
```
POST /api/admin/backfill-metadata
```
Must be authenticated as beta tester.

Will process all books missing covers, prices, or metadata.
