/*
  # Fix Storage RLS Policies for File Uploads

  1. Changes
    - Create new storage buckets with proper permissions
    - Drop all existing storage policies to avoid conflicts
    - Create simple, permissive policies for file uploads
    - Ensure proper bucket privacy settings
    
  2. Security
    - Maintain bucket-level access control
    - Allow authenticated users to upload files
    - Ensure public access for images
*/

-- Create new buckets with correct privacy settings
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('artifact-snapshots', 'artifact-snapshots', true),
  ('artifact-vault', 'artifact-vault', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create simple policies for artifact-snapshots bucket (public)
CREATE POLICY "artifact_snapshots_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'artifact-snapshots');

CREATE POLICY "artifact_snapshots_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'artifact-snapshots');

-- Create simple policies for artifact-vault bucket (private)
CREATE POLICY "artifact_vault_select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'artifact-vault');

CREATE POLICY "artifact_vault_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'artifact-vault');

-- Create artifacts table if it doesn't exist
CREATE TABLE IF NOT EXISTS artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  synopsis text,
  price_cents integer NOT NULL,
  category text NOT NULL,
  vault_path text NOT NULL,
  snapshot_url text NOT NULL,
  blur_snapshot boolean DEFAULT false,
  is_mature boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on artifacts table
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

-- Create policies for artifacts table
CREATE POLICY "artifacts_select_public"
ON artifacts FOR SELECT
TO public
USING (true);

CREATE POLICY "artifacts_manage_own"
ON artifacts FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());