-- Script para desativar temporariamente o RLS em todas as tabelas
-- ATENÇÃO: USE APENAS EM AMBIENTE DE DESENVOLVIMENTO!
-- Este script desativa temporariamente as políticas de segurança (RLS) para facilitar o desenvolvimento

-- DESATIVAR RLS EM TODAS AS TABELAS
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE treinos DISABLE ROW LEVEL SECURITY;
ALTER TABLE refeicoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE habitos DISABLE ROW LEVEL SECURITY;
ALTER TABLE peso_registros DISABLE ROW LEVEL SECURITY;

-- Se as tabelas existirem, desativar também
DO $$
BEGIN
    -- Verificar e desativar tabela pesos
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pesos') THEN
        EXECUTE 'ALTER TABLE pesos DISABLE ROW LEVEL SECURITY';
    END IF;
    
    -- Verificar e desativar tabela registro_peso
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'registro_peso') THEN
        EXECUTE 'ALTER TABLE registro_peso DISABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- Mostrar o status atual do RLS para as tabelas
SELECT 
    tablename, 
    rowsecurity AS "RLS Ativo"
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('usuarios', 'treinos', 'refeicoes', 'habitos', 'peso_registros', 'pesos', 'registro_peso')
ORDER BY tablename;

-- ATENÇÃO: Para reativar o RLS, execute o script reativar_rls.sql
-- Ou crie uma função para gerar o script de reativação
CREATE OR REPLACE FUNCTION gerar_script_reativacao()
RETURNS text AS $$
DECLARE
    script text;
BEGIN
    script := '-- Script para reativar o RLS
-- Execute este script quando terminar de desenvolver/debugar

-- REATIVAR RLS EM TODAS AS TABELAS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE refeicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE habitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE peso_registros ENABLE ROW LEVEL SECURITY;

-- Se as tabelas existirem, reativar também
DO $$
BEGIN
    -- Verificar e reativar tabela pesos
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = ''public'' AND tablename = ''pesos'') THEN
        EXECUTE ''ALTER TABLE pesos ENABLE ROW LEVEL SECURITY'';
    END IF;
    
    -- Verificar e reativar tabela registro_peso
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = ''public'' AND tablename = ''registro_peso'') THEN
        EXECUTE ''ALTER TABLE registro_peso ENABLE ROW LEVEL SECURITY'';
    END IF;
END $$;

-- Mostrar o status atual do RLS para as tabelas
SELECT 
    tablename, 
    rowsecurity AS "RLS Ativo"
FROM pg_tables 
WHERE schemaname = ''public''
AND tablename IN (''usuarios'', ''treinos'', ''refeicoes'', ''habitos'', ''peso_registros'', ''pesos'', ''registro_peso'')
ORDER BY tablename;';

    RETURN script;
END;
$$ LANGUAGE plpgsql;

-- Mostrar o script de reativação
SELECT gerar_script_reativacao() AS "Script para Reativar RLS";

-- Remover a função auxiliar
DROP FUNCTION gerar_script_reativacao();

-- Aviso final
SELECT 'ATENÇÃO: RLS foi desativado! Todos os dados agora estão acessíveis. USE APENAS EM DESENVOLVIMENTO!' as "Aviso Importante"; 