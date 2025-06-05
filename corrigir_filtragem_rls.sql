-- Script para corrigir problemas de filtragem por ID de usuário
-- Execute este script no painel SQL do Supabase para garantir que todas as tabelas
-- estão corretamente protegidas por RLS e que as políticas estão aplicadas.

-- Primeiro, vamos verificar o status atual do RLS em todas as tabelas
SELECT
    c.relname AS tablename,
    CASE WHEN c.relrowsecurity THEN 'Ativado' ELSE 'Desativado' END AS rls_status
FROM
    pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE
    n.nspname = 'public' AND
    c.relkind = 'r' AND
    c.relname IN ('usuarios', 'treinos', 'refeicoes', 'habitos', 'pesos', 'peso_registros', 'registro_peso');

-- Verificar tabelas que têm registros de outros usuários misturados
-- Esta consulta identificará tabelas com múltiplos usuários
SELECT
    'treinos' AS tabela,
    COUNT(DISTINCT usuario_id) AS qtd_usuarios,
    COUNT(*) AS total_registros
FROM
    treinos
UNION ALL
SELECT
    'refeicoes' AS tabela,
    COUNT(DISTINCT usuario_id) AS qtd_usuarios,
    COUNT(*) AS total_registros
FROM
    refeicoes
UNION ALL
SELECT
    'habitos' AS tabela,
    COUNT(DISTINCT usuario_id) AS qtd_usuarios,
    COUNT(*) AS total_registros
FROM
    habitos
UNION ALL
SELECT
    'registro_peso' AS tabela,
    COUNT(DISTINCT usuario_id) AS qtd_usuarios,
    COUNT(*) AS total_registros
FROM
    registro_peso
UNION ALL
SELECT
    'pesos' AS tabela,
    COUNT(DISTINCT usuario_id) AS qtd_usuarios,
    COUNT(*) AS total_registros
FROM
    pesos
WHERE
    EXISTS (SELECT 1 FROM pesos LIMIT 1);

-- Ativar RLS em todas as tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refeicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registro_peso ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para recriar com configurações corretas
DROP POLICY IF EXISTS usuario_select ON public.usuarios;
DROP POLICY IF EXISTS usuario_insert ON public.usuarios;
DROP POLICY IF EXISTS usuario_update ON public.usuarios;
DROP POLICY IF EXISTS usuario_delete ON public.usuarios;

DROP POLICY IF EXISTS treinos_select ON public.treinos;
DROP POLICY IF EXISTS treinos_insert ON public.treinos;
DROP POLICY IF EXISTS treinos_update ON public.treinos;
DROP POLICY IF EXISTS treinos_delete ON public.treinos;

DROP POLICY IF EXISTS refeicoes_select ON public.refeicoes;
DROP POLICY IF EXISTS refeicoes_insert ON public.refeicoes;
DROP POLICY IF EXISTS refeicoes_update ON public.refeicoes;
DROP POLICY IF EXISTS refeicoes_delete ON public.refeicoes;

DROP POLICY IF EXISTS habitos_select ON public.habitos;
DROP POLICY IF EXISTS habitos_insert ON public.habitos;
DROP POLICY IF EXISTS habitos_update ON public.habitos;
DROP POLICY IF EXISTS habitos_delete ON public.habitos;

DROP POLICY IF EXISTS pesos_select ON public.pesos;
DROP POLICY IF EXISTS pesos_insert ON public.pesos;
DROP POLICY IF EXISTS pesos_update ON public.pesos;
DROP POLICY IF EXISTS pesos_delete ON public.pesos;

DROP POLICY IF EXISTS registro_peso_select ON public.registro_peso;
DROP POLICY IF EXISTS registro_peso_insert ON public.registro_peso;
DROP POLICY IF EXISTS registro_peso_update ON public.registro_peso;
DROP POLICY IF EXISTS registro_peso_delete ON public.registro_peso;

-- POLÍTICAS PARA TREINOS
-- Permitir usuários verem apenas seus próprios treinos
CREATE POLICY treinos_select ON public.treinos
    FOR SELECT USING (usuario_id = current_setting('app.current_user', true)::uuid);

-- Permitir usuários inserirem apenas treinos associados a eles mesmos
CREATE POLICY treinos_insert ON public.treinos
    FOR INSERT WITH CHECK (usuario_id = current_setting('app.current_user', true)::uuid);

-- Permitir usuários atualizarem apenas seus próprios treinos
CREATE POLICY treinos_update ON public.treinos
    FOR UPDATE USING (usuario_id = current_setting('app.current_user', true)::uuid);

-- Permitir usuários excluírem apenas seus próprios treinos
CREATE POLICY treinos_delete ON public.treinos
    FOR DELETE USING (usuario_id = current_setting('app.current_user', true)::uuid);

-- POLÍTICAS PARA REFEIÇÕES
-- Permitir usuários verem apenas suas próprias refeições
CREATE POLICY refeicoes_select ON public.refeicoes
    FOR SELECT USING (usuario_id = current_setting('app.current_user', true)::uuid);

-- Permitir usuários inserirem apenas refeições associadas a eles mesmos
CREATE POLICY refeicoes_insert ON public.refeicoes
    FOR INSERT WITH CHECK (usuario_id = current_setting('app.current_user', true)::uuid);

-- Permitir usuários atualizarem apenas suas próprias refeições
CREATE POLICY refeicoes_update ON public.refeicoes
    FOR UPDATE USING (usuario_id = current_setting('app.current_user', true)::uuid);

-- Permitir usuários excluírem apenas suas próprias refeições
CREATE POLICY refeicoes_delete ON public.refeicoes
    FOR DELETE USING (usuario_id = current_setting('app.current_user', true)::uuid);

-- POLÍTICAS PARA HÁBITOS
-- Permitir usuários verem apenas seus próprios hábitos
CREATE POLICY habitos_select ON public.habitos
    FOR SELECT USING (usuario_id = current_setting('app.current_user', true)::uuid);

-- Permitir usuários inserirem apenas hábitos associados a eles mesmos
CREATE POLICY habitos_insert ON public.habitos
    FOR INSERT WITH CHECK (usuario_id = current_setting('app.current_user', true)::uuid);

-- Permitir usuários atualizarem apenas seus próprios hábitos
CREATE POLICY habitos_update ON public.habitos
    FOR UPDATE USING (usuario_id = current_setting('app.current_user', true)::uuid);

-- Permitir usuários excluírem apenas seus próprios hábitos
CREATE POLICY habitos_delete ON public.habitos
    FOR DELETE USING (usuario_id = current_setting('app.current_user', true)::uuid);

-- POLÍTICAS PARA PESOS
-- Permitir usuários verem apenas seus próprios registros de peso
CREATE POLICY pesos_select ON public.pesos
    FOR SELECT USING (usuario_id = current_setting('app.current_user', true)::uuid);

-- Permitir usuários inserirem apenas registros de peso associados a eles mesmos
CREATE POLICY pesos_insert ON public.pesos
    FOR INSERT WITH CHECK (usuario_id = current_setting('app.current_user', true)::uuid);

-- Permitir usuários atualizarem apenas seus próprios registros de peso
CREATE POLICY pesos_update ON public.pesos
    FOR UPDATE USING (usuario_id = current_setting('app.current_user', true)::uuid);

-- Permitir usuários excluírem apenas seus próprios registros de peso
CREATE POLICY pesos_delete ON public.pesos
    FOR DELETE USING (usuario_id = current_setting('app.current_user', true)::uuid);

-- POLÍTICAS PARA REGISTRO DE PESO
-- Permitir usuários verem apenas seus próprios registros de peso
CREATE POLICY registro_peso_select ON public.registro_peso
    FOR SELECT USING (usuario_id = current_setting('app.current_user', true)::uuid);

-- Permitir usuários inserirem apenas registros de peso associados a eles mesmos
CREATE POLICY registro_peso_insert ON public.registro_peso
    FOR INSERT WITH CHECK (usuario_id = current_setting('app.current_user', true)::uuid);

-- Permitir usuários atualizarem apenas seus próprios registros de peso
CREATE POLICY registro_peso_update ON public.registro_peso
    FOR UPDATE USING (usuario_id = current_setting('app.current_user', true)::uuid);

-- Permitir usuários excluírem apenas seus próprios registros de peso
CREATE POLICY registro_peso_delete ON public.registro_peso
    FOR DELETE USING (usuario_id = current_setting('app.current_user', true)::uuid);

-- POLÍTICAS PARA USUÁRIOS
-- Política especial para tabela de usuários - permitir que usuários vejam seus próprios dados
CREATE POLICY usuario_select ON public.usuarios
    FOR SELECT USING (id = current_setting('app.current_user', true)::uuid);

-- Permitir qualquer inserção (para cadastro)
CREATE POLICY usuario_insert ON public.usuarios
    FOR INSERT WITH CHECK (true);

-- Permitir atualização apenas do próprio perfil
CREATE POLICY usuario_update ON public.usuarios
    FOR UPDATE USING (id = current_setting('app.current_user', true)::uuid);

-- Ninguém pode excluir usuários (proteção adicional)
CREATE POLICY usuario_delete ON public.usuarios
    FOR DELETE USING (false);

-- Verificar status das políticas após aplicação
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    schemaname = 'public'
ORDER BY
    tablename, cmd; 