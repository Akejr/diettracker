-- Script para inserir dados de exemplo para um usuário específico
-- Execute este script no Editor SQL do Supabase

-- Parâmetros: substitua 'nome_do_usuario' pelo nome real do usuário
DO $$
DECLARE
    v_usuario_id UUID;
    v_usuario_nome TEXT := 'nome_do_usuario'; -- SUBSTITUA AQUI pelo nome do usuário
    v_data_atual DATE := CURRENT_DATE;
    v_data_anterior DATE;
BEGIN
    -- Obter ID do usuário pelo nome
    SELECT id INTO v_usuario_id FROM usuarios WHERE nome = v_usuario_nome;
    
    IF v_usuario_id IS NULL THEN
        RAISE NOTICE 'Usuário "%" não encontrado', v_usuario_nome;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Inserindo dados para o usuário: % (ID: %)', v_usuario_nome, v_usuario_id;
    
    -- Limpar dados existentes (opcional - remova ou comente essas linhas se quiser manter os dados existentes)
    DELETE FROM treinos WHERE usuario_id = v_usuario_id;
    DELETE FROM refeicoes WHERE usuario_id = v_usuario_id;
    DELETE FROM peso_registros WHERE usuario_id = v_usuario_id;
    DELETE FROM habitos WHERE usuario_id = v_usuario_id;
    RAISE NOTICE 'Dados existentes removidos para o usuário';
    
    -- Inserir treinos para os últimos 7 dias
    FOR i IN 0..6 LOOP
        v_data_anterior := v_data_atual - i;
        
        -- Treino de musculação nos dias pares
        IF MOD(i, 2) = 0 THEN
            INSERT INTO treinos (usuario_id, nome, data, duracao, tipo, calorias_queimadas, descricao, completado)
            VALUES (
                v_usuario_id, 
                'Treino de Musculação ' || i, 
                v_data_anterior, 
                60, 
                'musculacao', 
                300 + (i * 10), 
                'Treino de força - dia ' || i, 
                true
            );
            RAISE NOTICE 'Inserido treino de musculação para %', v_data_anterior;
        -- Treino de cardio nos dias ímpares
        ELSE
            INSERT INTO treinos (usuario_id, nome, data, duracao, tipo, calorias_queimadas, descricao, completado)
            VALUES (
                v_usuario_id, 
                'Treino de Cardio ' || i, 
                v_data_anterior, 
                45, 
                'cardio', 
                250 + (i * 8), 
                'Treino cardiovascular - dia ' || i, 
                true
            );
            RAISE NOTICE 'Inserido treino de cardio para %', v_data_anterior;
        END IF;
        
        -- Inserir 3 refeições por dia
        -- Café da manhã
        INSERT INTO refeicoes (usuario_id, nome, data, hora, alimento, quantidade, calorias, proteinas, carboidratos, gorduras)
        VALUES (
            v_usuario_id,
            'Café da manhã',
            v_data_anterior,
            '08:00',
            'Granola com iogurte',
            1,
            350,
            15,
            40,
            10
        );
        
        -- Almoço
        INSERT INTO refeicoes (usuario_id, nome, data, hora, alimento, quantidade, calorias, proteinas, carboidratos, gorduras)
        VALUES (
            v_usuario_id,
            'Almoço',
            v_data_anterior,
            '12:30',
            'Frango com arroz e salada',
            1,
            600,
            40,
            45,
            15
        );
        
        -- Jantar
        INSERT INTO refeicoes (usuario_id, nome, data, hora, alimento, quantidade, calorias, proteinas, carboidratos, gorduras)
        VALUES (
            v_usuario_id,
            'Jantar',
            v_data_anterior,
            '19:00',
            'Salmão com batata doce',
            1,
            550,
            35,
            30,
            20
        );
        
        RAISE NOTICE 'Inseridas 3 refeições para %', v_data_anterior;
    END LOOP;
    
    -- Inserir registros de peso para os últimos 10 dias
    FOR i IN 0..9 LOOP
        v_data_anterior := v_data_atual - i;
        
        -- Simular uma pequena variação no peso
        INSERT INTO peso_registros (usuario_id, data, valor)
        VALUES (
            v_usuario_id,
            v_data_anterior,
            75 - (i * 0.1) -- 75kg diminuindo 100g por dia
        );
        
        RAISE NOTICE 'Inserido registro de peso para %', v_data_anterior;
    END LOOP;
    
    -- Inserir alguns hábitos
    INSERT INTO habitos (usuario_id, nome, tipo, meta_diaria, unidade)
    VALUES 
        (v_usuario_id, 'Beber água', 'saude', 2, 'litros'),
        (v_usuario_id, 'Meditar', 'bem_estar', 15, 'minutos'),
        (v_usuario_id, 'Caminhar', 'exercicio', 6000, 'passos'),
        (v_usuario_id, 'Ler', 'lazer', 20, 'minutos');
    
    RAISE NOTICE 'Inseridos 4 hábitos para o usuário';
    
    RAISE NOTICE 'Dados de exemplo inseridos com sucesso!';
END $$;

-- Para verificar os dados inseridos
SELECT 'Usuários disponíveis:' as "Info";
SELECT id, nome FROM usuarios;

-- Use o nome de usuário que você acabou de popular com dados
SELECT 'Para ver os dados, execute:' as "Info";
SELECT 'SELECT * FROM treinos WHERE usuario_id = (SELECT id FROM usuarios WHERE nome = ''nome_do_usuario'');' as "Comando"; 