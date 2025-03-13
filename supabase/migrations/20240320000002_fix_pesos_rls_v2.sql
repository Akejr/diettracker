-- Desabilitar RLS temporariamente
ALTER TABLE pesos DISABLE ROW LEVEL SECURITY;

-- Limpar todas as políticas existentes
DROP POLICY IF EXISTS "Users can view their own weights" ON pesos;
DROP POLICY IF EXISTS "Users can insert their own weights" ON pesos;
DROP POLICY IF EXISTS "Users can update their own weights" ON pesos;
DROP POLICY IF EXISTS "Users can delete their own weights" ON pesos;

-- Habilitar RLS novamente
ALTER TABLE pesos ENABLE ROW LEVEL SECURITY;

-- Criar novas políticas com permissões mais permissivas
CREATE POLICY "Enable read access for authenticated users"
ON pesos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON pesos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON pesos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
ON pesos FOR DELETE
TO authenticated
USING (true); 