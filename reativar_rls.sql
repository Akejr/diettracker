-- Script simplificado para reativar o RLS em todas as tabelas
-- Execute este script quando terminar de desenvolver ou debugar

-- REATIVAR RLS EM TODAS AS TABELAS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE refeicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE habitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE peso_registros ENABLE ROW LEVEL SECURITY;

-- Verificar se existe a tabela pesos e reativar se existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pesos') THEN
        EXECUTE 'ALTER TABLE pesos ENABLE ROW LEVEL SECURITY';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'registro_peso') THEN
        EXECUTE 'ALTER TABLE registro_peso ENABLE ROW LEVEL SECURITY';
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

-- Aviso final
DO $$
BEGIN
    RAISE NOTICE 'RLS foi reativado com sucesso!';
    RAISE NOTICE 'As políticas de segurança estão em vigor novamente.';
END $$; 