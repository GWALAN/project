-- Create new storage buckets for artifacts
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('artifact-snapshots', 'artifact-snapshots', true),
  ('artifact-vault', 'artifact-vault', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create maximally permissive policies for artifact-snapshots bucket
CREATE POLICY "artifact_snapshots_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'artifact-snapshots');

CREATE POLICY "artifact_snapshots_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'artifact-snapshots');

CREATE POLICY "artifact_snapshots_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'artifact-snapshots')
WITH CHECK (bucket_id = 'artifact-snapshots');

CREATE POLICY "artifact_snapshots_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'artifact-snapshots');

-- Create maximally permissive policies for artifact-vault bucket
CREATE POLICY "artifact_vault_select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'artifact-vault');

CREATE POLICY "artifact_vault_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'artifact-vault');

CREATE POLICY "artifact_vault_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'artifact-vault')
WITH CHECK (bucket_id = 'artifact-vault');

CREATE POLICY "artifact_vault_delete"
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
  vault_path text,
  snapshot_url text,
  blur_snapshot boolean DEFAULT false,
  is_mature boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on artifacts table
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

-- Create policies for artifacts table
CREATE POLICY "artifacts_select"
ON artifacts FOR SELECT
TO public
USING (true);

CREATE POLICY "artifacts_insert"
ON artifacts FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "artifacts_update"
ON artifacts FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "artifacts_delete"
ON artifacts FOR DELETE
TO authenticated
USING (owner_id = auth.uid());