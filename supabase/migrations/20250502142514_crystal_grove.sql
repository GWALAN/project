-- Add themeConfig column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS themeconfig jsonb DEFAULT jsonb_build_object(
  'primary', '#7C3AED',
  'background', '#F3F4F6',
  'text', '#111827',
  'buttonStyle', 'rounded',
  'buttonVariant', 'solid'
);

-- Update existing rows with default theme config
UPDATE profiles
SET themeconfig = jsonb_build_object(
  'primary', '#7C3AED',
  'background', '#F3F4F6',
  'text', '#111827',
  'buttonStyle', 'rounded',
  'buttonVariant', 'solid'
)
WHERE themeconfig IS NULL;