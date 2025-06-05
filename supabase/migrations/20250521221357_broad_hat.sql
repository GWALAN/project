/*
  # Create new storage buckets and artifacts table
  
  1. New Storage Buckets
    - artifact-snapshots: Public bucket for thumbnail images
    - artifact-vault: Private bucket for content files
    
  2. New Table
    - artifacts: For storing metadata about uploaded content
    
  3. Security
    - Simple RLS policies that allow authenticated users to upload
    - No complex path restrictions that cause 403 errors
*/

-- Create new storage buckets with correct privacy settings
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('artifact-snapshots', 'artifact-snapshots', true),
  ('artifact-vault', 'artifact-vault', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create simple policies for artifact-snapshots bucket (public)
CREATE POLICY "artifact_snapshots_select_new"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'artifact-snapshots');

CREATE POLICY "artifact_snapshots_insert_new"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'artifact-snapshots');

CREATE POLICY "artifact_snapshots_update_new"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'artifact-snapshots')
WITH CHECK (bucket_id = 'artifact-snapshots');

CREATE POLICY "artifact_snapshots_delete_new"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'artifact-snapshots');

-- Create simple policies for artifact-vault bucket (private)
CREATE POLICY "artifact_vault_select_new"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'artifact-vault');

CREATE POLICY "artifact_vault_insert_new"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'artifact-vault');

CREATE POLICY "artifact_vault_update_new"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'artifact-vault')
WITH CHECK (bucket_id = 'artifact-vault');

CREATE POLICY "artifact_vault_delete_new"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'artifact-vault');

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artifacts_owner_id ON artifacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_category ON artifacts(category);

-- Enable RLS on artifacts table
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

-- Create policies for artifacts table
CREATE POLICY "artifacts_select_public_new"
ON artifacts FOR SELECT
TO public
USING (true);

CREATE POLICY "artifacts_manage_own_new"
ON artifacts FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());