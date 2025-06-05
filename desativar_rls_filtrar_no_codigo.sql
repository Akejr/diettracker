-- Script para desativar RLS e permitir filtragem no código
-- Execute este script no painel SQL do Supabase

-- =========================================================
-- PARTE 1: DESATIVAR RLS PARA TODAS AS TABELAS
-- =========================================================
DO $$
DECLARE
    tabela_nome text;
BEGIN
    -- Lista de tabelas principais do aplicativo
    FOR tabela_nome IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
          AND tablename IN ('usuarios', 'habitos', 'refeicoes', 'treinos', 'pesos', 'peso_registros', 'registro_peso')
    )
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', tabela_nome);
        RAISE NOTICE 'RLS desativado para a tabela: %', tabela_nome;
    END LOOP;
END;
$$;

-- =========================================================
-- PARTE 2: REMOVER TODAS AS POLÍTICAS EXISTENTES
-- =========================================================
DO $$
DECLARE
    politica_record record;
BEGIN
    FOR politica_record IN (
        SELECT 
            tablename,
            policyname
        FROM 
            pg_policies
        WHERE 
            schemaname = 'public'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 
                      politica_record.policyname, 
                      politica_record.tablename);
        RAISE NOTICE 'Política % removida da tabela %', 
                    politica_record.policyname, 
                    politica_record.tablename;
    END LOOP;
END;
$$;

-- =========================================================
-- PARTE 3: CRIAR UM ÍNDICE PARA MELHORAR A PERFORMANCE DAS CONSULTAS
-- =========================================================

-- Para a tabela habitos (se não existir já)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'habitos' 
        AND indexname = 'habitos_usuario_id_idx'
    ) THEN
        CREATE INDEX habitos_usuario_id_idx ON public.habitos(usuario_id);
        RAISE NOTICE 'Índice criado para a coluna usuario_id na tabela habitos';
    END IF;
END;
$$;

-- Para a tabela refeicoes (se não existir já)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'refeicoes' 
        AND indexname = 'refeicoes_usuario_id_idx'
    ) THEN
        CREATE INDEX refeicoes_usuario_id_idx ON public.refeicoes(usuario_id);
        RAISE NOTICE 'Índice criado para a coluna usuario_id na tabela refeicoes';
    END IF;
END;
$$;

-- Para a tabela treinos (se não existir já)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'treinos' 
        AND indexname = 'treinos_usuario_id_idx'
    ) THEN
        CREATE INDEX treinos_usuario_id_idx ON public.treinos(usuario_id);
        RAISE NOTICE 'Índice criado para a coluna usuario_id na tabela treinos';
    END IF;
END;
$$;

-- Para a tabela pesos (se não existir já)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'pesos' 
        AND indexname = 'pesos_usuario_id_idx'
    ) THEN
        CREATE INDEX pesos_usuario_id_idx ON public.pesos(usuario_id);
        RAISE NOTICE 'Índice criado para a coluna usuario_id na tabela pesos';
    END IF;
END;
$$;

-- =========================================================
-- PARTE 4: VERIFICAR O STATUS DAS TABELAS
-- =========================================================
-- Consulta corrigida para verificar o status de RLS das tabelas
SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    CASE WHEN c.relrowsecurity THEN 'RLS Ativado' ELSE 'RLS Desativado' END AS row_level_security_status
FROM
    pg_class c
JOIN
    pg_namespace n ON n.oid = c.relnamespace
WHERE
    c.relkind = 'r' -- Only tables
    AND n.nspname = 'public'
    AND c.relname IN ('usuarios', 'habitos', 'refeicoes', 'treinos', 'pesos', 'peso_registros', 'registro_peso')
ORDER BY
    c.relname; 