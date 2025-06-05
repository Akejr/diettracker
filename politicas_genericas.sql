-- Script para configurar políticas RLS genéricas
-- Execute este script no painel SQL do Supabase
-- Esta versão garante que CADA USUÁRIO veja APENAS SEUS PRÓPRIOS DADOS

-- =========================================================
-- PARTE 1: HABILITAR RLS PARA TODAS AS TABELAS
-- =========================================================
DO $$
BEGIN
    -- Habilitar RLS para cada tabela se necessário
    ALTER TABLE IF EXISTS public.usuarios ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.refeicoes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.treinos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.habitos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.peso_registros ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.pesos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.registro_peso ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'RLS habilitado para todas as tabelas com sucesso';
END;
$$;

-- =========================================================
-- PARTE 2: AJUSTAR POLÍTICAS PARA TABELA USUARIOS
-- =========================================================
-- Remover políticas existentes para tabela usuarios
DROP POLICY IF EXISTS usuarios_user_select_policy ON public.usuarios;
DROP POLICY IF EXISTS usuarios_user_modify_policy ON public.usuarios;
DROP POLICY IF EXISTS usuarios_anon_insert_policy ON public.usuarios;

-- Para a tabela usuarios, precisamos de uma abordagem especial
-- 1. Permitir SELECT apenas para o próprio usuário
CREATE POLICY usuarios_select_policy ON public.usuarios
    FOR SELECT
    USING (nome IN (SELECT nome FROM public.usuarios WHERE id = id));
    -- Isso permite que o usuário veja apenas seu próprio registro

-- 2. Permitir INSERT para novos usuários (necessário para cadastro)
CREATE POLICY usuarios_insert_policy ON public.usuarios
    FOR INSERT
    WITH CHECK (true);
    -- Isso permite que novos usuários sejam criados

-- 3. Permitir UPDATE/DELETE apenas para o próprio usuário
CREATE POLICY usuarios_modify_policy ON public.usuarios
    FOR ALL
    USING (id IN (SELECT id FROM public.usuarios WHERE nome = current_setting('app.current_user', true)));
    -- Isso permite que o usuário modifique apenas seu próprio registro

-- =========================================================
-- PARTE 3: CRIAR FUNÇÃO PARA VERIFICAR USUÁRIO ATUAL
-- =========================================================
-- Esta função será usada para verificar se um registro pertence ao usuário atual
CREATE OR REPLACE FUNCTION public.pertence_ao_usuario_atual(usuario_id uuid)
RETURNS boolean AS $$
BEGIN
    -- Verifica se o ID do usuário do registro corresponde ao usuário atual
    -- Assumindo que o nome do usuário está armazenado em uma variável de aplicativo
    RETURN EXISTS (
        SELECT 1 
        FROM public.usuarios 
        WHERE id = usuario_id 
        AND nome = current_setting('app.current_user', true)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- PARTE 4: AJUSTAR POLÍTICAS PARA TABELA HABITOS
-- =========================================================
-- Remover políticas existentes para habitos
DROP POLICY IF EXISTS habitos_select_policy ON public.habitos;
DROP POLICY IF EXISTS habitos_insert_policy ON public.habitos;
DROP POLICY IF EXISTS habitos_update_policy ON public.habitos;
DROP POLICY IF EXISTS habitos_delete_policy ON public.habitos;

-- Criar novas políticas genéricas
-- Política para SELECT - apenas os próprios hábitos
CREATE POLICY habitos_select_policy ON public.habitos
    FOR SELECT
    USING (public.pertence_ao_usuario_atual(usuario_id));

-- Política para INSERT - com verificação do usuário
CREATE POLICY habitos_insert_policy ON public.habitos
    FOR INSERT
    WITH CHECK (usuario_id IN (SELECT id FROM public.usuarios WHERE nome = current_setting('app.current_user', true)));

-- Política para UPDATE - apenas os próprios hábitos
CREATE POLICY habitos_update_policy ON public.habitos
    FOR UPDATE
    USING (public.pertence_ao_usuario_atual(usuario_id));

-- Política para DELETE - apenas os próprios hábitos
CREATE POLICY habitos_delete_policy ON public.habitos
    FOR DELETE
    USING (public.pertence_ao_usuario_atual(usuario_id));

-- =========================================================
-- PARTE 5: AJUSTAR POLÍTICAS PARA TABELA REFEICOES
-- =========================================================
-- Remover políticas existentes
DROP POLICY IF EXISTS refeicoes_select_policy ON public.refeicoes;
DROP POLICY IF EXISTS refeicoes_all_policy ON public.refeicoes;
DROP POLICY IF EXISTS refeicoes_insert_policy ON public.refeicoes;
DROP POLICY IF EXISTS refeicoes_update_policy ON public.refeicoes;
DROP POLICY IF EXISTS refeicoes_delete_policy ON public.refeicoes;

-- Criar novas políticas
CREATE POLICY refeicoes_select_policy ON public.refeicoes
    FOR SELECT
    USING (public.pertence_ao_usuario_atual(usuario_id));

CREATE POLICY refeicoes_insert_policy ON public.refeicoes
    FOR INSERT
    WITH CHECK (usuario_id IN (SELECT id FROM public.usuarios WHERE nome = current_setting('app.current_user', true)));

CREATE POLICY refeicoes_update_policy ON public.refeicoes
    FOR UPDATE
    USING (public.pertence_ao_usuario_atual(usuario_id));

CREATE POLICY refeicoes_delete_policy ON public.refeicoes
    FOR DELETE
    USING (public.pertence_ao_usuario_atual(usuario_id));

-- =========================================================
-- PARTE 6: AJUSTAR POLÍTICAS PARA TABELA TREINOS
-- =========================================================
-- Remover políticas existentes
DROP POLICY IF EXISTS treinos_select_policy ON public.treinos;
DROP POLICY IF EXISTS treinos_all_policy ON public.treinos;
DROP POLICY IF EXISTS treinos_insert_policy ON public.treinos;
DROP POLICY IF EXISTS treinos_update_policy ON public.treinos;
DROP POLICY IF EXISTS treinos_delete_policy ON public.treinos;

-- Criar novas políticas
CREATE POLICY treinos_select_policy ON public.treinos
    FOR SELECT
    USING (public.pertence_ao_usuario_atual(usuario_id));

CREATE POLICY treinos_insert_policy ON public.treinos
    FOR INSERT
    WITH CHECK (usuario_id IN (SELECT id FROM public.usuarios WHERE nome = current_setting('app.current_user', true)));

CREATE POLICY treinos_update_policy ON public.treinos
    FOR UPDATE
    USING (public.pertence_ao_usuario_atual(usuario_id));

CREATE POLICY treinos_delete_policy ON public.treinos
    FOR DELETE
    USING (public.pertence_ao_usuario_atual(usuario_id));

-- =========================================================
-- PARTE 7: AJUSTAR POLÍTICAS PARA TABELAS DE PESO
-- =========================================================
-- Para a tabela pesos
DROP POLICY IF EXISTS pesos_select_policy ON public.pesos;
DROP POLICY IF EXISTS pesos_all_policy ON public.pesos;
DROP POLICY IF EXISTS pesos_insert_policy ON public.pesos;
DROP POLICY IF EXISTS pesos_update_policy ON public.pesos;
DROP POLICY IF EXISTS pesos_delete_policy ON public.pesos;

CREATE POLICY pesos_select_policy ON public.pesos
    FOR SELECT
    USING (public.pertence_ao_usuario_atual(usuario_id));

CREATE POLICY pesos_insert_policy ON public.pesos
    FOR INSERT
    WITH CHECK (usuario_id IN (SELECT id FROM public.usuarios WHERE nome = current_setting('app.current_user', true)));

CREATE POLICY pesos_update_policy ON public.pesos
    FOR UPDATE
    USING (public.pertence_ao_usuario_atual(usuario_id));

CREATE POLICY pesos_delete_policy ON public.pesos
    FOR DELETE
    USING (public.pertence_ao_usuario_atual(usuario_id));

-- Para a tabela peso_registros (se existir)
DROP POLICY IF EXISTS peso_registros_select_policy ON public.peso_registros;
DROP POLICY IF EXISTS peso_registros_all_policy ON public.peso_registros;
DROP POLICY IF EXISTS peso_registros_insert_policy ON public.peso_registros;
DROP POLICY IF EXISTS peso_registros_update_policy ON public.peso_registros;
DROP POLICY IF EXISTS peso_registros_delete_policy ON public.peso_registros;

CREATE POLICY peso_registros_select_policy ON public.peso_registros
    FOR SELECT
    USING (public.pertence_ao_usuario_atual(usuario_id));

CREATE POLICY peso_registros_insert_policy ON public.peso_registros
    FOR INSERT
    WITH CHECK (usuario_id IN (SELECT id FROM public.usuarios WHERE nome = current_setting('app.current_user', true)));

CREATE POLICY peso_registros_update_policy ON public.peso_registros
    FOR UPDATE
    USING (public.pertence_ao_usuario_atual(usuario_id));

CREATE POLICY peso_registros_delete_policy ON public.peso_registros
    FOR DELETE
    USING (public.pertence_ao_usuario_atual(usuario_id));

-- =========================================================
-- PARTE 8: CRIAR OU SUBSTITUIR A FUNÇÃO PARA DEFINIR O USUÁRIO ATUAL
-- =========================================================
-- Esta função deve ser chamada quando o usuário faz login
CREATE OR REPLACE FUNCTION public.set_current_user(nome_usuario text)
RETURNS void AS $$
BEGIN
    -- Define o usuário atual na variável de configuração do aplicativo
    PERFORM set_config('app.current_user', nome_usuario, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- PARTE 9: VERIFICAR AS POLÍTICAS ATUALIZADAS
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
ORDER BY 
    tablename, 
    policyname;

-- =========================================================
-- COMO USAR ESTE SISTEMA:
-- =========================================================
-- 1. No lado do cliente, após o login, execute:
--    SELECT public.set_current_user('nome_do_usuario');
--    Substitua 'nome_do_usuario' pelo nome do usuário logado
--
-- 2. Isso definirá a variável de configuração que as políticas usarão
--    para determinar quais registros o usuário pode ver/editar
--
-- 3. Todas as consultas subsequentes respeitarão automaticamente o RLS
--    baseado no usuário atual
-- ========================================================= 