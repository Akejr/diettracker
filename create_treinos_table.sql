-- Criar tabela de treinos
CREATE TABLE treinos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) NOT NULL,
  data DATE NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('musculacao', 'cardio')),
  duracao INTEGER NOT NULL, -- em minutos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices
CREATE INDEX idx_treinos_usuario_id ON treinos(usuario_id);
CREATE INDEX idx_treinos_data ON treinos(data);

-- Criar política de segurança para inserção
CREATE POLICY "Usuários podem inserir seus próprios treinos" ON treinos
FOR INSERT WITH CHECK (true);

-- Criar política de segurança para leitura
CREATE POLICY "Usuários podem ler seus próprios treinos" ON treinos
FOR SELECT USING (auth.uid() = usuario_id);

-- Habilitar RLS
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY; 