/*
  # Add calendar_private column to profiles table

  1. Changes
    - Add calendar_private boolean column to profiles table
    - Set default value to true for privacy by default
*/

-- Add calendar_private column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calendar_private boolean DEFAULT true;