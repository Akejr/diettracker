-- Add foto_url column to usuarios table
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS foto_url TEXT;