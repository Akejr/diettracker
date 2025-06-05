-- Script para corrigir o problema de login com as políticas RLS
-- Execute este script no painel SQL do Supabase

-- =========================================================
-- PARTE 1: CORRIGIR POLÍTICAS DA TABELA USUARIOS
-- =========================================================
-- Remover políticas existentes para tabela usuarios que podem estar em conflito
DROP POLICY IF EXISTS usuarios_select_policy ON public.usuarios;
DROP POLICY IF EXISTS usuarios_user_select_policy ON public.usuarios;
DROP POLICY IF EXISTS usuarios_modify_policy ON public.usuarios;
DROP POLICY IF EXISTS usuarios_user_modify_policy ON public.usuarios;
DROP POLICY IF EXISTS usuarios_insert_policy ON public.usuarios;
DROP POLICY IF EXISTS usuarios_anon_insert_policy ON public.usuarios;

-- 1. Política para permitir SELECT em TODOS os usuários (necessário para login)
-- Esta é a mudança crucial: permitir que qualquer pessoa veja todos os usuários
CREATE POLICY usuarios_select_policy ON public.usuarios
    FOR SELECT
    USING (true);  -- Permite qualquer pessoa ver todos os usuários

-- 2. Permitir INSERT para novos usuários (necessário para cadastro)
CREATE POLICY usuarios_insert_policy ON public.usuarios
    FOR INSERT
    WITH CHECK (true);  -- Permite qualquer pessoa criar usuários

-- 3. Permitir UPDATE/DELETE apenas para o próprio usuário (se estiver logado)
-- Ainda mantemos a segurança para modificações
CREATE POLICY usuarios_modify_policy ON public.usuarios
    FOR UPDATE
    USING (id IN (SELECT id FROM public.usuarios WHERE nome = current_setting('app.current_user', true)));

CREATE POLICY usuarios_delete_policy ON public.usuarios
    FOR DELETE
    USING (id IN (SELECT id FROM public.usuarios WHERE nome = current_setting('app.current_user', true)));

-- =========================================================
-- PARTE 2: AJUSTAR A FUNÇÃO SET_CURRENT_USER PARA TRATAR ERROS MELHOR
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_current_user(nome_usuario text)
RETURNS void AS $$
BEGIN
    -- Se o nome_usuario for nulo ou vazio, definimos um valor padrão para evitar erros
    IF nome_usuario IS NULL OR nome_usuario = '' THEN
        PERFORM set_config('app.current_user', 'guest', false);
    ELSE
        -- Caso contrário, definimos o nome do usuário normalmente
        PERFORM set_config('app.current_user', nome_usuario, false);
    END IF;
    
    -- Log para debug
    RAISE NOTICE 'Usuário atual definido: %', current_setting('app.current_user', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- PARTE 3: CONFIGURAR VALOR PADRÃO PARA app.current_user
-- =========================================================
-- Isso garante que mesmo sem chamar set_current_user, temos um valor válido
SELECT set_config('app.current_user', 'guest', false);

-- =========================================================
-- PARTE 4: AJUSTAR A FUNÇÃO DE VERIFICAÇÃO PARA SER MAIS ROBUSTA
-- =========================================================
CREATE OR REPLACE FUNCTION public.pertence_ao_usuario_atual(usuario_id uuid)
RETURNS boolean AS $$
DECLARE
    current_user_name text;
BEGIN
    -- Obtém o nome do usuário atual com segurança
    BEGIN
        current_user_name := current_setting('app.current_user', true);
    EXCEPTION WHEN OTHERS THEN
        -- Se não conseguir obter o valor, define um padrão
        current_user_name := 'guest';
    END;
    
    -- Casos especiais
    IF current_user_name = 'guest' OR current_user_name IS NULL THEN
        RETURN false;  -- Usuário 'guest' não possui registros
    END IF;
    
    -- Verificação normal
    RETURN EXISTS (
        SELECT 1 
        FROM public.usuarios 
        WHERE id = usuario_id 
        AND nome = current_user_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- PARTE 5: VERIFICAR AS POLÍTICAS ATUALIZADAS
-- =========================================================
SELECT 
    tablename,
    policyname,
    permissive,
    cmd,
    roles,
    CASE 
        WHEN cmd = 'SELECT' OR cmd = 'DELETE' OR cmd = 'UPDATE' THEN qual::text
        ELSE with_check::text
    END as condition
FROM 
    pg_policies
WHERE 
    schemaname = 'public'
    AND tablename = 'usuarios'
ORDER BY 
    tablename, 
    policyname; 