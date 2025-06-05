-- Script para corrigir o problema de compartilhamento de hábitos entre usuários
-- Execute este script no Editor SQL do Supabase

-- Primeiro, vamos verificar se há compartilhamento indevido
SELECT 'DIAGNÓSTICO DE COMPARTILHAMENTO DE DADOS' as "Info";

-- Verificar dados compartilhados na tabela habitos
SELECT 
    h.id,
    h.nome,
    u.nome as nome_usuario,
    h.usuario_id
FROM 
    habitos h
JOIN 
    usuarios u ON h.usuario_id = u.id
ORDER BY 
    h.nome, u.nome;

-- Verificar se as políticas RLS estão configuradas corretamente
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd, 
    qual,
    with_check
FROM 
    pg_policies 
WHERE 
    tablename = 'habitos';

-- Verificar status atual do RLS
SELECT 
    tablename, 
    rowsecurity
FROM 
    pg_tables
WHERE 
    tablename = 'habitos';

-- Verificar a configuração de usuário atual
SELECT 
    current_setting('app.current_user', true) as usuario_atual;

-- Verificar a função que configura o usuário atual
SELECT 
    pg_get_functiondef('public.set_current_user'::regproc) as funcao_set_current_user;

-- Verificar a função que determina se um registro pertence ao usuário atual
SELECT 
    pg_get_functiondef('public.pertence_ao_usuario_atual'::regproc) as funcao_pertence_ao_usuario;

-- SOLUÇÃO:
-- 1. Reconfigurando a política de RLS para habitos
DO $$
BEGIN
    -- Remover políticas existentes para evitar conflitos
    DROP POLICY IF EXISTS habitos_select ON public.habitos;
    DROP POLICY IF EXISTS habitos_insert ON public.habitos;
    DROP POLICY IF EXISTS habitos_update ON public.habitos;
    DROP POLICY IF EXISTS habitos_delete ON public.habitos;
    DROP POLICY IF EXISTS habitos_user_select_policy ON public.habitos;
    DROP POLICY IF EXISTS habitos_user_modify_policy ON public.habitos;
    
    RAISE NOTICE 'Políticas anteriores removidas';
    
    -- Garantir que o RLS está ativado
    ALTER TABLE public.habitos ENABLE ROW LEVEL SECURITY;
    
    -- Criar políticas robustas
    -- Política para SELECT: usuário só pode ver seus próprios hábitos
    CREATE POLICY habitos_select ON public.habitos 
        FOR SELECT 
        USING (usuario_id::text = current_setting('app.current_user', true));
        
    -- Política para INSERT: usuário só pode inserir seus próprios hábitos
    CREATE POLICY habitos_insert ON public.habitos 
        FOR INSERT 
        WITH CHECK (usuario_id::text = current_setting('app.current_user', true));
        
    -- Política para UPDATE: usuário só pode atualizar seus próprios hábitos
    CREATE POLICY habitos_update ON public.habitos 
        FOR UPDATE 
        USING (usuario_id::text = current_setting('app.current_user', true));
        
    -- Política para DELETE: usuário só pode excluir seus próprios hábitos
    CREATE POLICY habitos_delete ON public.habitos 
        FOR DELETE 
        USING (usuario_id::text = current_setting('app.current_user', true));
        
    RAISE NOTICE 'Novas políticas criadas com sucesso';
END $$;

-- Verificar as novas políticas
SELECT 'NOVAS POLÍTICAS APLICADAS:' as "Info";
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd, 
    qual,
    with_check
FROM 
    pg_policies 
WHERE 
    tablename = 'habitos';

-- TESTE: Verificar se o problema foi resolvido
-- Tente fazer login com o usuário "joao" e "maria" e verificar se cada um vê apenas seus próprios hábitos

-- Para testar manualmente no Supabase:
-- 1. Execute: SELECT set_current_user('joao', 'senha123');
-- 2. Execute: SELECT * FROM habitos;
-- 3. Execute: SELECT set_current_user('maria', 'senha123');
-- 4. Execute: SELECT * FROM habitos;

-- Cada usuário deve ver apenas seus próprios hábitos 