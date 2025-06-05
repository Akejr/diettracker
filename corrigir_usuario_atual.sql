-- Script para investigar e corrigir o problema com o usuário atual
-- Execute este script no Editor SQL do Supabase

-- Verificar o valor atual de app.current_user
DO $$
DECLARE
    v_current_user TEXT;
    v_usuario_nome TEXT;
    v_usuario_id UUID;
BEGIN
    -- Verificar se a configuração existe
    BEGIN
        SELECT current_setting('app.current_user', true) INTO v_current_user;
        
        IF v_current_user IS NULL THEN
            RAISE NOTICE 'Configuração app.current_user está definida como NULL';
        ELSE
            RAISE NOTICE 'Configuração app.current_user está definida como: %', v_current_user;
            
            -- Verificar se esse ID corresponde a algum usuário
            BEGIN
                SELECT nome INTO v_usuario_nome FROM usuarios WHERE id = v_current_user::UUID;
                IF v_usuario_nome IS NOT NULL THEN
                    RAISE NOTICE 'Corresponde ao usuário: %', v_usuario_nome;
                ELSE
                    RAISE NOTICE 'Não corresponde a nenhum usuário na tabela!';
                END IF;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao verificar usuário: %', SQLERRM;
            END;
        END IF;
    EXCEPTION WHEN undefined_object THEN
        RAISE NOTICE 'Configuração app.current_user não existe';
    END;
END $$;

-- Listar todos os usuários para referência
SELECT id, nome, senha FROM usuarios ORDER BY nome;

-- Modificar a função set_current_user para aceitar apenas o nome (útil em caso de erro de autenticação)
CREATE OR REPLACE FUNCTION set_current_user_by_name(nome_usuario TEXT)
RETURNS UUID AS $$
DECLARE
    usuario_id UUID;
BEGIN
    -- Buscar o ID do usuário com o nome fornecido
    SELECT id INTO usuario_id FROM usuarios WHERE nome = nome_usuario;
    
    -- Se encontrou o usuário, definir como atual
    IF usuario_id IS NOT NULL THEN
        PERFORM set_config('app.current_user', usuario_id::TEXT, false);
        RAISE NOTICE 'Usuário atual definido como: % (ID: %)', nome_usuario, usuario_id;
    ELSE
        RAISE NOTICE 'Usuário % não encontrado', nome_usuario;
    END IF;
    
    RETURN usuario_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exemplo de como usar a função (descomente se quiser executar)
-- SELECT set_current_user_by_name('nome_do_usuario_aqui');

-- Verificar se as outras tabelas têm dados vinculados aos IDs de usuário
DO $$
DECLARE
    usuario_rec RECORD;
    treinos_count INTEGER;
    refeicoes_count INTEGER;
    pesos_count INTEGER;
    habitos_count INTEGER;
BEGIN
    FOR usuario_rec IN SELECT id, nome FROM usuarios LOOP
        -- Contar treinos
        SELECT COUNT(*) INTO treinos_count FROM treinos WHERE usuario_id = usuario_rec.id;
        
        -- Contar refeições
        SELECT COUNT(*) INTO refeicoes_count FROM refeicoes WHERE usuario_id = usuario_rec.id;
        
        -- Contar registros de peso
        SELECT COUNT(*) INTO pesos_count FROM peso_registros WHERE usuario_id = usuario_rec.id;
        
        -- Contar hábitos
        SELECT COUNT(*) INTO habitos_count FROM habitos WHERE usuario_id = usuario_rec.id;
        
        -- Exibir resultados
        RAISE NOTICE 'Usuário: % (ID: %)', usuario_rec.nome, usuario_rec.id;
        RAISE NOTICE '  Treinos: %', treinos_count;
        RAISE NOTICE '  Refeições: %', refeicoes_count;
        RAISE NOTICE '  Registros de Peso: %', pesos_count;
        RAISE NOTICE '  Hábitos: %', habitos_count;
    END LOOP;
END $$;

-- Se necessário, criar dados de exemplo para um usuário existente
-- Descomente e modifique conforme necessário
/*
DO $$
DECLARE
    v_usuario_id UUID;
BEGIN
    -- Obter ID do usuário pelo nome (substitua 'nome_do_usuario' pelo nome real)
    SELECT id INTO v_usuario_id FROM usuarios WHERE nome = 'nome_do_usuario';
    
    IF v_usuario_id IS NULL THEN
        RAISE NOTICE 'Usuário não encontrado';
        RETURN;
    END IF;
    
    -- Inserir um treino de exemplo
    INSERT INTO treinos (usuario_id, nome, data, duracao, tipo, calorias_queimadas, descricao, completado)
    VALUES (v_usuario_id, 'Treino de Exemplo', CURRENT_DATE, 60, 'musculacao', 300, 'Treino criado para teste', true);
    
    -- Inserir uma refeição de exemplo
    INSERT INTO refeicoes (usuario_id, nome, data, hora, alimento, quantidade, calorias, proteinas, carboidratos, gorduras)
    VALUES (v_usuario_id, 'Refeição de Exemplo', CURRENT_DATE, '12:00', 'Comida de teste', 1, 500, 30, 50, 15);
    
    -- Inserir um registro de peso de exemplo
    INSERT INTO peso_registros (usuario_id, data, valor)
    VALUES (v_usuario_id, CURRENT_DATE, 75);
    
    RAISE NOTICE 'Dados de exemplo criados para o usuário com ID: %', v_usuario_id;
END $$;
*/ 