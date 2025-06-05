-- Script para implementar autenticação com nome e senha
-- AVISO: Todos os dados serão apagados!
-- Este script deve ser executado no Editor SQL do Supabase

-- Parte 1: Limpar todos os dados existentes
TRUNCATE TABLE habitos CASCADE;
TRUNCATE TABLE treinos CASCADE;
TRUNCATE TABLE refeicoes CASCADE;
TRUNCATE TABLE pesos CASCADE;
TRUNCATE TABLE peso_registros CASCADE;
TRUNCATE TABLE registro_peso CASCADE;
TRUNCATE TABLE usuarios CASCADE;

-- Parte 2: Modificar a tabela de usuários para adicionar o campo senha
DO $$
BEGIN
    -- Verificar se a coluna senha já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'senha'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN senha TEXT NOT NULL DEFAULT 'senha123';
        
        -- Remover o default depois de adicionada
        ALTER TABLE usuarios ALTER COLUMN senha DROP DEFAULT;
    END IF;
    
    -- Certificar-se de que o nome é único
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'usuarios' AND constraint_name = 'usuarios_nome_key'
    ) THEN
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_nome_key UNIQUE (nome);
    END IF;
END$$;

-- Parte 3: Criar funções para autenticação

-- Função para verificar senha (simples, sem hash por enquanto)
-- Em um ambiente de produção, usar criptografia adequada!
CREATE OR REPLACE FUNCTION autenticar_usuario(nome_usuario TEXT, senha_usuario TEXT)
RETURNS UUID AS $$
DECLARE
    usuario_id UUID;
BEGIN
    -- Buscar o ID do usuário que corresponde ao nome e senha fornecidos
    SELECT id INTO usuario_id
    FROM usuarios
    WHERE nome = nome_usuario AND senha = senha_usuario;
    
    -- Retornar o ID encontrado (ou null se não encontrado)
    RETURN usuario_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função melhorada para definir o usuário atual
CREATE OR REPLACE FUNCTION set_current_user(nome_usuario TEXT, senha_usuario TEXT)
RETURNS UUID AS $$
DECLARE
    usuario_id UUID;
BEGIN
    -- Autenticar o usuário
    SELECT autenticar_usuario(nome_usuario, senha_usuario) INTO usuario_id;
    
    -- Se o usuário for autenticado com sucesso, definir como usuário atual
    IF usuario_id IS NOT NULL THEN
        -- Definir o ID do usuário como uma variável de configuração
        PERFORM set_config('app.current_user', usuario_id::TEXT, false);
    END IF;
    
    -- Retornar o ID do usuário (ou null se a autenticação falhou)
    RETURN usuario_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se um registro pertence ao usuário atual
CREATE OR REPLACE FUNCTION pertence_ao_usuario_atual(usuario_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Obter o ID do usuário atual das variáveis de configuração
    BEGIN
        SELECT current_setting('app.current_user', true)::UUID INTO current_user_id;
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
    END;
    
    -- Verificar se o registro pertence ao usuário atual
    RETURN usuario_id = current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que a variável de configuração para o usuário atual existe
DO $$
BEGIN
    -- Verificar se a configuração já existe
    BEGIN
        PERFORM current_setting('app.current_user');
    EXCEPTION WHEN undefined_object THEN
        -- A configuração não existe, criar com um valor padrão (UUID nulo)
        PERFORM set_config('app.current_user', '00000000-0000-0000-0000-000000000000', false);
    END;
END $$;

-- Parte 4: Configurar RLS em todas as tabelas

-- Ativar RLS em todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE habitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE refeicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesos ENABLE ROW LEVEL SECURITY;
ALTER TABLE peso_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE registro_peso ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS usuarios_select_policy ON usuarios;
DROP POLICY IF EXISTS usuarios_insert_policy ON usuarios;
DROP POLICY IF EXISTS usuarios_update_policy ON usuarios;
DROP POLICY IF EXISTS usuarios_delete_policy ON usuarios;

-- Políticas para a tabela usuarios
-- Permitir SELECT para seu próprio registro + políticas especiais para autenticação
CREATE POLICY usuarios_select_policy ON usuarios
    FOR SELECT USING (
        id = current_setting('app.current_user', true)::uuid  -- Próprio usuário
        OR current_setting('app.current_user', true) = '00000000-0000-0000-0000-000000000000'  -- Autenticação
    );

-- Permitir INSERT sem restrição (para registro de novos usuários)
CREATE POLICY usuarios_insert_policy ON usuarios
    FOR INSERT WITH CHECK (true);

-- Permitir UPDATE apenas do próprio registro
CREATE POLICY usuarios_update_policy ON usuarios
    FOR UPDATE USING (id = current_setting('app.current_user', true)::uuid)
    WITH CHECK (id = current_setting('app.current_user', true)::uuid);

-- Permitir DELETE apenas do próprio registro
CREATE POLICY usuarios_delete_policy ON usuarios
    FOR DELETE USING (id = current_setting('app.current_user', true)::uuid);

-- Políticas para as demais tabelas (treinos, habitos, refeicoes, pesos, etc.)
-- A função abaixo cria políticas padrão para qualquer tabela que tenha campo usuario_id
CREATE OR REPLACE FUNCTION criar_politicas_padrao(nome_tabela text) 
RETURNS void AS $$
BEGIN
    -- Remover políticas existentes
    EXECUTE format('DROP POLICY IF EXISTS %1$s_select_policy ON %1$s', nome_tabela);
    EXECUTE format('DROP POLICY IF EXISTS %1$s_insert_policy ON %1$s', nome_tabela);
    EXECUTE format('DROP POLICY IF EXISTS %1$s_update_policy ON %1$s', nome_tabela);
    EXECUTE format('DROP POLICY IF EXISTS %1$s_delete_policy ON %1$s', nome_tabela);
    
    -- Criar política para SELECT
    EXECUTE format('CREATE POLICY %1$s_select_policy ON %1$s 
                   FOR SELECT USING (pertence_ao_usuario_atual(usuario_id))', nome_tabela);
    
    -- Criar política para INSERT
    EXECUTE format('CREATE POLICY %1$s_insert_policy ON %1$s 
                   FOR INSERT WITH CHECK (pertence_ao_usuario_atual(usuario_id))', nome_tabela);
    
    -- Criar política para UPDATE
    EXECUTE format('CREATE POLICY %1$s_update_policy ON %1$s 
                   FOR UPDATE USING (pertence_ao_usuario_atual(usuario_id)) 
                   WITH CHECK (pertence_ao_usuario_atual(usuario_id))', nome_tabela);
    
    -- Criar política para DELETE
    EXECUTE format('CREATE POLICY %1$s_delete_policy ON %1$s 
                   FOR DELETE USING (pertence_ao_usuario_atual(usuario_id))', nome_tabela);
END;
$$ LANGUAGE plpgsql;

-- Aplicar políticas para todas as tabelas principais
SELECT criar_politicas_padrao('treinos');
SELECT criar_politicas_padrao('habitos');
SELECT criar_politicas_padrao('refeicoes');
SELECT criar_politicas_padrao('pesos');
SELECT criar_politicas_padrao('peso_registros');
SELECT criar_politicas_padrao('registro_peso');

-- Parte 5: Criar usuários de exemplo com dados completos

DO $$
DECLARE
    v_joao_id UUID;
    v_maria_id UUID;
BEGIN
    -- Usuário 1: João - Inserir primeiro
    INSERT INTO usuarios (nome, senha, idade, peso, altura, sexo, nivel_atividade, objetivo, meta_calorica, meta_proteina, meta_treinos)
    VALUES (
        'joao', -- nome 
        'senha123', -- senha
        35, -- idade 
        78.5, -- peso 
        1.75, -- altura 
        'masculino', -- sexo 
        'moderado', -- nivel_atividade 
        'perder', -- objetivo 
        2200, -- meta_calorica 
        150, -- meta_proteina 
        4 -- meta_treinos
    );
    
    -- Obter o ID do João
    SELECT id INTO v_joao_id FROM usuarios WHERE nome = 'joao';
    
    -- Usuário 2: Maria - Inserir primeiro
    INSERT INTO usuarios (nome, senha, idade, peso, altura, sexo, nivel_atividade, objetivo, meta_calorica, meta_proteina, meta_treinos)
    VALUES (
        'maria', -- nome 
        'senha456', -- senha 
        28, -- idade 
        62.0, -- peso 
        1.68, -- altura 
        'feminino', -- sexo 
        'intenso', -- nivel_atividade 
        'ganhar', -- objetivo 
        1800, -- meta_calorica 
        120, -- meta_proteina 
        5 -- meta_treinos
    );
    
    -- Obter o ID da Maria
    SELECT id INTO v_maria_id FROM usuarios WHERE nome = 'maria';
    
    -- Adicionar dados para o João
    -- Adicionar treinos para o João
    DECLARE
        v_data date := CURRENT_DATE - INTERVAL '7 days';
    BEGIN
        FOR i IN 0..6 LOOP
            -- Treino de musculação
            IF i % 2 = 0 THEN
                INSERT INTO treinos (usuario_id, data, tipo, duracao, descricao, calorias) 
                VALUES (v_joao_id, v_data + i, 'musculacao', 60, 'Treino de força - dia ' || i, 450);
            END IF;
            
            -- Treino de cardio
            IF i % 3 = 0 THEN
                INSERT INTO treinos (usuario_id, data, tipo, duracao, descricao, calorias) 
                VALUES (v_joao_id, v_data + i, 'cardio', 30, 'Corrida - dia ' || i, 300);
            END IF;
            
            -- Refeições
            -- Café da manhã
            INSERT INTO refeicoes (usuario_id, data, horario, alimento, calorias, proteina) 
            VALUES (v_joao_id, v_data + i, '08:00', 'Ovos com pão integral', 350, 20);
            
            -- Almoço
            INSERT INTO refeicoes (usuario_id, data, horario, alimento, calorias, proteina) 
            VALUES (v_joao_id, v_data + i, '12:30', 'Frango com salada e arroz', 580, 40);
            
            -- Jantar
            INSERT INTO refeicoes (usuario_id, data, horario, alimento, calorias, proteina) 
            VALUES (v_joao_id, v_data + i, '19:30', 'Peixe com legumes', 480, 35);
            
            -- Registros de peso
            IF i % 2 = 0 THEN
                INSERT INTO peso_registros (usuario_id, data, peso) 
                VALUES (v_joao_id, v_data + i, 78.5 - (i * 0.1));
            END IF;
        END LOOP;
    END;
    
    -- Adicionar hábitos para o João
    INSERT INTO habitos (usuario_id, nome, descricao, frequencia, dias_semana) 
    VALUES (v_joao_id, 'Beber água', 'Beber 2L de água por dia', 'diario', NULL);
    
    INSERT INTO habitos (usuario_id, nome, descricao, frequencia, dias_semana) 
    VALUES (v_joao_id, 'Meditação', '10 minutos pela manhã', 'diario', NULL);
    
    INSERT INTO habitos (usuario_id, nome, descricao, frequencia, dias_semana) 
    VALUES (v_joao_id, 'Alongamento', '15 minutos antes de dormir', 'semanal', ARRAY[1,3,5]);
    
    -- Adicionar dados para a Maria
    -- Adicionar treinos para a Maria
    DECLARE
        v_data date := CURRENT_DATE - INTERVAL '7 days';
    BEGIN
        FOR i IN 0..6 LOOP
            -- Treino de musculação
            IF i % 3 = 0 THEN
                INSERT INTO treinos (usuario_id, data, tipo, duracao, descricao, calorias) 
                VALUES (v_maria_id, v_data + i, 'musculacao', 45, 'Treino de HIIT - dia ' || i, 380);
            END IF;
            
            -- Treino de cardio
            IF i % 2 = 0 THEN
                INSERT INTO treinos (usuario_id, data, tipo, duracao, descricao, calorias) 
                VALUES (v_maria_id, v_data + i, 'cardio', 40, 'Ciclismo - dia ' || i, 350);
            END IF;
            
            -- Refeições
            -- Café da manhã
            INSERT INTO refeicoes (usuario_id, data, horario, alimento, calorias, proteina) 
            VALUES (v_maria_id, v_data + i, '07:00', 'Smoothie proteico', 280, 25);
            
            -- Almoço
            INSERT INTO refeicoes (usuario_id, data, horario, alimento, calorias, proteina) 
            VALUES (v_maria_id, v_data + i, '13:00', 'Salada com quinoa e frango', 450, 35);
            
            -- Jantar
            INSERT INTO refeicoes (usuario_id, data, horario, alimento, calorias, proteina) 
            VALUES (v_maria_id, v_data + i, '20:00', 'Omelete com legumes', 320, 28);
            
            -- Registros de peso
            IF i % 2 = 0 THEN
                INSERT INTO peso_registros (usuario_id, data, peso) 
                VALUES (v_maria_id, v_data + i, 62.0 + (i * 0.08));
            END IF;
        END LOOP;
    END;
    
    -- Adicionar hábitos para a Maria
    INSERT INTO habitos (usuario_id, nome, descricao, frequencia, dias_semana) 
    VALUES (v_maria_id, 'Yoga', '20 minutos pela manhã', 'diario', NULL);
    
    INSERT INTO habitos (usuario_id, nome, descricao, frequencia, dias_semana) 
    VALUES (v_maria_id, 'Ler', '30 minutos antes de dormir', 'diario', NULL);
    
    INSERT INTO habitos (usuario_id, nome, descricao, frequencia, dias_semana) 
    VALUES (v_maria_id, 'Pilates', '1 hora', 'semanal', ARRAY[2,4,6]);
    
    -- Informar IDs criados para referência
    RAISE NOTICE 'ID do João: %', v_joao_id;
    RAISE NOTICE 'ID da Maria: %', v_maria_id;
END $$;

-- Parte 6: Verificar as configurações

-- Verificar se o RLS está ativo em todas as tabelas
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usuarios', 'treinos', 'habitos', 'refeicoes', 'pesos', 'peso_registros')
ORDER BY tablename;

-- Verificar as políticas configuradas
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Testar a função de autenticação com o João
DO $$
DECLARE
    usuario_id UUID;
BEGIN
    SELECT set_current_user('joao', 'senha123') INTO usuario_id;
    RAISE NOTICE 'ID do João autenticado: %', usuario_id;
    RAISE NOTICE 'Usuário atual configurado: %', current_setting('app.current_user', true);
END $$;

-- Conferir se conseguimos ver os dados do João
SELECT 'Visualizando dados do João:' as info;
SELECT id, nome FROM usuarios WHERE nome = 'joao';
SELECT count(*) as total_treinos_joao FROM treinos WHERE usuario_id = (SELECT id FROM usuarios WHERE nome = 'joao');
SELECT count(*) as total_refeicoes_joao FROM refeicoes WHERE usuario_id = (SELECT id FROM usuarios WHERE nome = 'joao');

-- Testar a função de autenticação com a Maria
DO $$
DECLARE
    usuario_id UUID;
BEGIN
    SELECT set_current_user('maria', 'senha456') INTO usuario_id;
    RAISE NOTICE 'ID da Maria autenticada: %', usuario_id;
    RAISE NOTICE 'Usuário atual configurado: %', current_setting('app.current_user', true);
END $$;

-- Conferir se conseguimos ver os dados da Maria
SELECT 'Visualizando dados da Maria:' as info;
SELECT id, nome FROM usuarios WHERE nome = 'maria';
SELECT count(*) as total_treinos_maria FROM treinos WHERE usuario_id = (SELECT id FROM usuarios WHERE nome = 'maria');
SELECT count(*) as total_refeicoes_maria FROM refeicoes WHERE usuario_id = (SELECT id FROM usuarios WHERE nome = 'maria');

-- Resumo final
SELECT 'Autenticação com nome e senha e RLS configurados com sucesso!' as status;
SELECT 'Usuários de exemplo criados: joao (senha123) e maria (senha456)' as usuarios_criados; 