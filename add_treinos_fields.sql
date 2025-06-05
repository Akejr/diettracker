-- Adicionar campos faltantes na tabela treinos
ALTER TABLE treinos
ADD COLUMN descricao TEXT NOT NULL DEFAULT '',
ADD COLUMN calorias INTEGER NOT NULL DEFAULT 0;
