-- Script para corrigir todas as políticas de RLS
-- Execute este script no Editor SQL do Supabase
-- Este script vai garantir que cada usuário veja apenas seus próprios dados

-- Primeiro, vamos verificar se o RLS está ativado em todas as tabelas
SELECT 'VERIFICAÇÃO DE STATUS RLS' as "Info";
SELECT 
    tablename, 
    rowsecurity
FROM 
    pg_tables
WHERE 
    schemaname = 'public' AND
    tablename IN ('usuarios', 'treinos', 'refeicoes', 'habitos', 'peso_registros');

-- Verificar a configuração de usuário atual
SELECT 
    current_setting('app.current_user', true) as usuario_atual;

-- SOLUÇÃO:
-- Aplicar políticas padronizadas em todas as tabelas
DO $$
DECLARE
    tabelas text[] := ARRAY['treinos', 'refeicoes', 'habitos', 'peso_registros'];
    tabela text;
BEGIN
    -- Configurar RLS para a tabela de usuários
    -- Atenção especial a esta tabela, pois é usada para autenticação
    -- 1. Remover políticas existentes para a tabela usuarios
    DROP POLICY IF EXISTS usuarios_select ON public.usuarios;
    DROP POLICY IF EXISTS usuarios_insert ON public.usuarios;
    DROP POLICY IF EXISTS usuarios_update ON public.usuarios;
    DROP POLICY IF EXISTS usuarios_delete ON public.usuarios;
    
    -- 2. Ativar RLS na tabela de usuários
    ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
    
    -- 3. Criar políticas para a tabela de usuarios
    -- SELECT: qualquer um pode selecionar da tabela (necessário para login)
    CREATE POLICY usuarios_select ON public.usuarios 
        FOR SELECT USING (true);
        
    -- INSERT: qualquer um pode inserir (necessário para registro)
    CREATE POLICY usuarios_insert ON public.usuarios 
        FOR INSERT WITH CHECK (true);
        
    -- UPDATE: usuário só pode atualizar seu próprio perfil
    CREATE POLICY usuarios_update ON public.usuarios 
        FOR UPDATE USING (id::text = current_setting('app.current_user', true));
        
    -- DELETE: usuário só pode excluir seu próprio perfil
    CREATE POLICY usuarios_delete ON public.usuarios 
        FOR DELETE USING (id::text = current_setting('app.current_user', true));
    
    RAISE NOTICE 'Políticas configuradas para a tabela de usuários';
    
    -- Configurar RLS para as outras tabelas
    FOREACH tabela IN ARRAY tabelas LOOP
        -- 1. Remover políticas existentes para evitar conflitos
        EXECUTE 'DROP POLICY IF EXISTS ' || tabela || '_select ON public.' || tabela;
        EXECUTE 'DROP POLICY IF EXISTS ' || tabela || '_insert ON public.' || tabela;
        EXECUTE 'DROP POLICY IF EXISTS ' || tabela || '_update ON public.' || tabela;
        EXECUTE 'DROP POLICY IF EXISTS ' || tabela || '_delete ON public.' || tabela;
        EXECUTE 'DROP POLICY IF EXISTS ' || tabela || '_user_select_policy ON public.' || tabela;
        EXECUTE 'DROP POLICY IF EXISTS ' || tabela || '_user_modify_policy ON public.' || tabela;
        
        -- 2. Garantir que o RLS está ativado
        EXECUTE 'ALTER TABLE public.' || tabela || ' ENABLE ROW LEVEL SECURITY';
        
        -- 3. Criar políticas padronizadas
        -- SELECT: usuário só pode ver seus próprios dados
        EXECUTE 'CREATE POLICY ' || tabela || '_select ON public.' || tabela || 
            ' FOR SELECT USING (usuario_id::text = current_setting(''app.current_user'', true))';
            
        -- INSERT: usuário só pode inserir seus próprios dados
        EXECUTE 'CREATE POLICY ' || tabela || '_insert ON public.' || tabela || 
            ' FOR INSERT WITH CHECK (usuario_id::text = current_setting(''app.current_user'', true))';
            
        -- UPDATE: usuário só pode atualizar seus próprios dados
        EXECUTE 'CREATE POLICY ' || tabela || '_update ON public.' || tabela || 
            ' FOR UPDATE USING (usuario_id::text = current_setting(''app.current_user'', true))';
            
        -- DELETE: usuário só pode excluir seus próprios dados
        EXECUTE 'CREATE POLICY ' || tabela || '_delete ON public.' || tabela || 
            ' FOR DELETE USING (usuario_id::text = current_setting(''app.current_user'', true))';
            
        RAISE NOTICE 'Políticas configuradas para a tabela: %', tabela;
    END LOOP;
END $$;

-- Verificar as novas políticas
SELECT 'NOVAS POLÍTICAS APLICADAS:' as "Info";
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd, 
    qual
FROM 
    pg_policies 
WHERE 
    schemaname = 'public'
ORDER BY
    tablename, policyname;

-- Certificar-se de que o RLS está ativado em todas as tabelas
SELECT 'STATUS ATUAL DO RLS:' as "Info";
SELECT 
    tablename, 
    rowsecurity
FROM 
    pg_tables
WHERE 
    schemaname = 'public' AND
    tablename IN ('usuarios', 'treinos', 'refeicoes', 'habitos', 'peso_registros');

-- Instruções para testar:
SELECT 'INSTRUÇÕES PARA TESTAR:' as "Info";
SELECT '1. Execute: SELECT set_current_user(''joao'', ''senha123'');' as "Passo 1";
SELECT '2. Execute: SELECT * FROM habitos;' as "Passo 2";
SELECT '3. Execute: SELECT * FROM treinos;' as "Passo 3";
SELECT '4. Execute: SELECT * FROM refeicoes;' as "Passo 4";
SELECT '5. Execute: SELECT set_current_user(''maria'', ''senha123'');' as "Passo 5";
SELECT '6. Repita as consultas e confirme que cada usuário vê apenas seus dados' as "Passo 6"; 