/*
  # Add calendar_private column to profiles table

  1. Changes
    - Add calendar_private boolean column with default value of false
    - This column controls whether a creator's booking calendar is publicly visible
*/

-- Add calendar_private column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calendar_private boolean DEFAULT false;