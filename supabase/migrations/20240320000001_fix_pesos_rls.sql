-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own weights" ON pesos;
DROP POLICY IF EXISTS "Users can insert their own weights" ON pesos;
DROP POLICY IF EXISTS "Users can update their own weights" ON pesos;
DROP POLICY IF EXISTS "Users can delete their own weights" ON pesos;

-- Enable RLS
ALTER TABLE pesos ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Users can view their own weights"
ON pesos FOR SELECT
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own weights"
ON pesos FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own weights"
ON pesos FOR UPDATE
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own weights"
ON pesos FOR DELETE
USING (auth.uid() = usuario_id); 