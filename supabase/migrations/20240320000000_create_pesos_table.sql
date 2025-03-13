-- Create pesos table
CREATE TABLE IF NOT EXISTS pesos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    peso DECIMAL(5,2) NOT NULL,
    data DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(usuario_id, data)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pesos_usuario_data ON pesos(usuario_id, data);

-- Add RLS policies
ALTER TABLE pesos ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own weights
CREATE POLICY "Users can view their own weights"
    ON pesos FOR SELECT
    USING (auth.uid() = usuario_id);

-- Policy to allow users to insert their own weights
CREATE POLICY "Users can insert their own weights"
    ON pesos FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

-- Policy to allow users to update their own weights
CREATE POLICY "Users can update their own weights"
    ON pesos FOR UPDATE
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

-- Policy to allow users to delete their own weights
CREATE POLICY "Users can delete their own weights"
    ON pesos FOR DELETE
    USING (auth.uid() = usuario_id); 