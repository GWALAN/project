-- Add button_style column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS button_style text DEFAULT 'default';