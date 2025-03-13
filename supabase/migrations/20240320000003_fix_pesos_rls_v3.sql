-- Desabilitar RLS temporariamente
ALTER TABLE pesos DISABLE ROW LEVEL SECURITY;

-- Limpar todas as políticas existentes
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON pesos;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON pesos;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON pesos;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON pesos;

-- Habilitar RLS novamente
ALTER TABLE pesos ENABLE ROW LEVEL SECURITY;

-- Criar novas políticas com permissões específicas para o usuário autenticado
CREATE POLICY "Users can view their own weights"
ON pesos FOR SELECT
TO authenticated
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own weights"
ON pesos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own weights"
ON pesos FOR UPDATE
TO authenticated
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own weights"
ON pesos FOR DELETE
TO authenticated
USING (auth.uid() = usuario_id); 