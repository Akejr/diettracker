-- Script para criar funções que buscam dados diretamente, sem filtrar por usuario_id
-- ATENÇÃO: Use apenas para depuração, não para produção

-- Função para buscar treinos recentes sem filtrar por usuario_id
CREATE OR REPLACE FUNCTION buscar_treinos_sem_filtro(limite INTEGER DEFAULT 10)
RETURNS SETOF treinos AS $$
BEGIN
    RETURN QUERY SELECT * FROM treinos ORDER BY data DESC LIMIT limite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar refeições recentes sem filtrar por usuario_id
CREATE OR REPLACE FUNCTION buscar_refeicoes_sem_filtro(limite INTEGER DEFAULT 10)
RETURNS SETOF refeicoes AS $$
BEGIN
    RETURN QUERY SELECT * FROM refeicoes ORDER BY data DESC LIMIT limite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar registros de peso sem filtrar por usuario_id
CREATE OR REPLACE FUNCTION buscar_pesos_sem_filtro(limite INTEGER DEFAULT 10)
RETURNS SETOF peso_registros AS $$
BEGIN
    RETURN QUERY SELECT * FROM peso_registros ORDER BY data DESC LIMIT limite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar hábitos sem filtrar por usuario_id
CREATE OR REPLACE FUNCTION buscar_habitos_sem_filtro(limite INTEGER DEFAULT 10)
RETURNS SETOF habitos AS $$
BEGIN
    RETURN QUERY SELECT * FROM habitos LIMIT limite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Testar funções
SELECT 'Treinos recentes sem filtro:' as "Info";
SELECT * FROM buscar_treinos_sem_filtro(5);

SELECT 'Refeições recentes sem filtro:' as "Info";
SELECT * FROM buscar_refeicoes_sem_filtro(5);

SELECT 'Registros de peso recentes sem filtro:' as "Info";
SELECT * FROM buscar_pesos_sem_filtro(5);

SELECT 'Hábitos sem filtro:' as "Info";
SELECT * FROM buscar_habitos_sem_filtro(5);

-- Se você tiver muitos dados, pode querer verificar só os IDs dos usuários
SELECT 'Lista de usuários com dados:' as "Info";
SELECT DISTINCT u.id, u.nome
FROM usuarios u
WHERE EXISTS (SELECT 1 FROM treinos t WHERE t.usuario_id = u.id)
   OR EXISTS (SELECT 1 FROM refeicoes r WHERE r.usuario_id = u.id)
   OR EXISTS (SELECT 1 FROM peso_registros p WHERE p.usuario_id = u.id)
   OR EXISTS (SELECT 1 FROM habitos h WHERE h.usuario_id = u.id); 