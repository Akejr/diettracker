-- Habilitar RLS para as tabelas principais (somente se existirem)
DO $$
BEGIN
    -- Verifica e aplica RLS para refeicoes
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'refeicoes') THEN
        ALTER TABLE public.refeicoes ENABLE ROW LEVEL SECURITY;
        
        -- Criar políticas se não existirem
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'refeicoes' AND policyname = 'refeicoes_user_select_policy') THEN
            CREATE POLICY refeicoes_user_select_policy ON public.refeicoes 
            FOR SELECT USING (auth.uid()::text = usuario_id::text OR usuario_id IN 
                (SELECT id FROM public.usuarios WHERE auth.uid()::text = id::text));
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'refeicoes' AND policyname = 'refeicoes_user_modify_policy') THEN
            CREATE POLICY refeicoes_user_modify_policy ON public.refeicoes 
            FOR ALL USING (auth.uid()::text = usuario_id::text OR usuario_id IN 
                (SELECT id FROM public.usuarios WHERE auth.uid()::text = id::text));
        END IF;
        
        -- Criar índice se não existir
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'refeicoes_usuario_id_idx') THEN
            CREATE INDEX refeicoes_usuario_id_idx ON public.refeicoes(usuario_id);
        END IF;
        
        -- Garantir que usuario_id seja NOT NULL
        BEGIN
            ALTER TABLE public.refeicoes ALTER COLUMN usuario_id SET NOT NULL;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao alterar coluna usuario_id em refeicoes: %', SQLERRM;
        END;
        
        RAISE NOTICE 'RLS configurado para tabela refeicoes';
    ELSE
        RAISE NOTICE 'A tabela refeicoes não existe, ignorando';
    END IF;

    -- Verifica e aplica RLS para treinos
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'treinos') THEN
        ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;
        
        -- Criar políticas se não existirem
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'treinos' AND policyname = 'treinos_user_select_policy') THEN
            CREATE POLICY treinos_user_select_policy ON public.treinos 
            FOR SELECT USING (auth.uid()::text = usuario_id::text OR usuario_id IN 
                (SELECT id FROM public.usuarios WHERE auth.uid()::text = id::text));
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'treinos' AND policyname = 'treinos_user_modify_policy') THEN
            CREATE POLICY treinos_user_modify_policy ON public.treinos 
            FOR ALL USING (auth.uid()::text = usuario_id::text OR usuario_id IN 
                (SELECT id FROM public.usuarios WHERE auth.uid()::text = id::text));
        END IF;
        
        -- Criar índice se não existir
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'treinos_usuario_id_idx') THEN
            CREATE INDEX treinos_usuario_id_idx ON public.treinos(usuario_id);
        END IF;
        
        -- Garantir que usuario_id seja NOT NULL
        BEGIN
            ALTER TABLE public.treinos ALTER COLUMN usuario_id SET NOT NULL;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao alterar coluna usuario_id em treinos: %', SQLERRM;
        END;
        
        RAISE NOTICE 'RLS configurado para tabela treinos';
    ELSE
        RAISE NOTICE 'A tabela treinos não existe, ignorando';
    END IF;

    -- Verifica e aplica RLS para peso_registros
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'peso_registros') THEN
        ALTER TABLE public.peso_registros ENABLE ROW LEVEL SECURITY;
        
        -- Criar políticas se não existirem
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'peso_registros' AND policyname = 'peso_user_select_policy') THEN
            CREATE POLICY peso_user_select_policy ON public.peso_registros 
            FOR SELECT USING (auth.uid()::text = usuario_id::text OR usuario_id IN 
                (SELECT id FROM public.usuarios WHERE auth.uid()::text = id::text));
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'peso_registros' AND policyname = 'peso_user_modify_policy') THEN
            CREATE POLICY peso_user_modify_policy ON public.peso_registros 
            FOR ALL USING (auth.uid()::text = usuario_id::text OR usuario_id IN 
                (SELECT id FROM public.usuarios WHERE auth.uid()::text = id::text));
        END IF;
        
        -- Criar índice se não existir
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'peso_registros_usuario_id_idx') THEN
            CREATE INDEX peso_registros_usuario_id_idx ON public.peso_registros(usuario_id);
        END IF;
        
        -- Garantir que usuario_id seja NOT NULL
        BEGIN
            ALTER TABLE public.peso_registros ALTER COLUMN usuario_id SET NOT NULL;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao alterar coluna usuario_id em peso_registros: %', SQLERRM;
        END;
        
        RAISE NOTICE 'RLS configurado para tabela peso_registros';
    ELSE
        RAISE NOTICE 'A tabela peso_registros não existe, ignorando';
    END IF;
END;
$$; 