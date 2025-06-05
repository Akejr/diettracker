-- Criar tabela de registro de peso se não existir
CREATE TABLE IF NOT EXISTS public.peso_registros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  peso NUMERIC(5,2) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS peso_registros_usuario_id_idx ON public.peso_registros(usuario_id);
CREATE INDEX IF NOT EXISTS peso_registros_data_idx ON public.peso_registros(data);

-- Adicionar restrição de unicidade para evitar múltiplos registros na mesma data
ALTER TABLE public.peso_registros ADD CONSTRAINT peso_registros_usuario_data_unique UNIQUE (usuario_id, data);

-- Comentário para documentação da tabela
COMMENT ON TABLE public.peso_registros IS 'Registros diários de peso dos usuários'; 