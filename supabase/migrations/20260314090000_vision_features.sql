-- Add Phase 2 columns to letters table
ALTER TABLE public.letters 
ADD COLUMN IF NOT EXISTS unlock_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS unlock_latitude DOUBLE PRECISION NULL,
ADD COLUMN IF NOT EXISTS unlock_longitude DOUBLE PRECISION NULL,
ADD COLUMN IF NOT EXISTS unlock_radius_meters INTEGER NULL DEFAULT 100;

COMMENT ON COLUMN public.letters.unlock_at IS 'The timestamp after which the letter can be unlocked.';
COMMENT ON COLUMN public.letters.unlock_latitude IS 'The latitude required to unlock the letter.';
COMMENT ON COLUMN public.letters.unlock_longitude IS 'The longitude required to unlock the letter.';
COMMENT ON COLUMN public.letters.unlock_radius_meters IS 'The radius in meters from the unlock location within which the letter can be decrypted.';
