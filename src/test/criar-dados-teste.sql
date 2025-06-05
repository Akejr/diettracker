-- Inserir um usuário fictício para testes
DO $$ 
DECLARE
  usuario_id uuid;
BEGIN
  INSERT INTO usuarios (
    nome,
    peso,
    altura,
    idade,
    sexo,
    nivel_atividade,
    objetivo,
    meta_calorica,
    meta_proteina
  ) VALUES (
    'João Silva',
    80.5,
    1.75,
    30,
    'masculino',
    'moderado',
    'perder',
    2200,
    160
  ) RETURNING id INTO usuario_id;

  -- Inserir refeições de exemplo
  INSERT INTO refeicoes (usuario_id, alimento, calorias, proteina, horario, data) VALUES
    (usuario_id, 'Omelete com 3 ovos', 300, 21, '07:00', CURRENT_DATE),
    (usuario_id, 'Whey Protein com banana', 220, 25, '10:00', CURRENT_DATE),
    (usuario_id, 'Frango grelhado com arroz', 450, 35, '13:00', CURRENT_DATE),
    (usuario_id, 'Iogurte com granola', 200, 10, '16:00', CURRENT_DATE),
    (usuario_id, 'Salmão com legumes', 380, 30, '19:00', CURRENT_DATE);

  -- Inserir registros de peso dos últimos 7 dias
  INSERT INTO registro_peso (usuario_id, peso, data) VALUES
    (usuario_id, 80.5, CURRENT_DATE - INTERVAL '6 days'),
    (usuario_id, 80.3, CURRENT_DATE - INTERVAL '5 days'),
    (usuario_id, 80.1, CURRENT_DATE - INTERVAL '4 days'),
    (usuario_id, 80.0, CURRENT_DATE - INTERVAL '3 days'),
    (usuario_id, 79.8, CURRENT_DATE - INTERVAL '2 days'),
    (usuario_id, 79.7, CURRENT_DATE - INTERVAL '1 day'),
    (usuario_id, 79.5, CURRENT_DATE);
END $$;