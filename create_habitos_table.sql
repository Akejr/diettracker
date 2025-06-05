CREATE TABLE IF NOT EXISTS public.habitos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  frequencia TEXT NOT NULL CHECK (frequencia IN ('diario', 'semanal')),
  dias_semana INTEGER[] DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completados DATE[] DEFAULT '{}',
  streak INTEGER DEFAULT 0,
  ultima_data DATE DEFAULT NULL
);

-- Adicionar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS habitos_usuario_id_idx ON public.habitos(usuario_id);

-- Adicionar permissões de RLS (Row Level Security)
ALTER TABLE public.habitos ENABLE ROW LEVEL SECURITY;

-- Criar política que permite aos usuários ver apenas seus próprios hábitos
CREATE POLICY habitos_user_select_policy ON public.habitos 
  FOR SELECT USING (auth.uid()::text = usuario_id::text OR usuario_id IN 
    (SELECT id FROM public.usuarios WHERE auth.uid()::text = id::text));

-- Criar política que permite aos usuários modificar apenas seus próprios hábitos
CREATE POLICY habitos_user_modify_policy ON public.habitos 
  FOR ALL USING (auth.uid()::text = usuario_id::text OR usuario_id IN 
    (SELECT id FROM public.usuarios WHERE auth.uid()::text = id::text)); 