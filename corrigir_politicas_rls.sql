-- Script para corrigir as políticas de RLS em todas as tabelas
-- Execute este script no Editor SQL do Supabase

-- Função auxiliar para criar políticas padrão para uma tabela
CREATE OR REPLACE FUNCTION criar_politicas_padrao(nome_tabela text) 
RETURNS void AS $$
BEGIN
    -- Remover políticas existentes
    EXECUTE 'DROP POLICY IF EXISTS ' || nome_tabela || '_select_policy ON public.' || nome_tabela;
    EXECUTE 'DROP POLICY IF EXISTS ' || nome_tabela || '_insert_policy ON public.' || nome_tabela;
    EXECUTE 'DROP POLICY IF EXISTS ' || nome_tabela || '_update_policy ON public.' || nome_tabela;
    EXECUTE 'DROP POLICY IF EXISTS ' || nome_tabela || '_delete_policy ON public.' || nome_tabela;
    
    -- Criar política para SELECT - usuário só pode ver seus próprios dados
    EXECUTE 'CREATE POLICY ' || nome_tabela || '_select_policy ON public.' || nome_tabela || 
            ' FOR SELECT USING (pertence_ao_usuario_atual(usuario_id))';
    
    -- Criar política para INSERT - usuário só pode inserir seus próprios dados
    EXECUTE 'CREATE POLICY ' || nome_tabela || '_insert_policy ON public.' || nome_tabela || 
            ' FOR INSERT WITH CHECK (pertence_ao_usuario_atual(usuario_id))';
    
    -- Criar política para UPDATE - usuário só pode atualizar seus próprios dados
    EXECUTE 'CREATE POLICY ' || nome_tabela || '_update_policy ON public.' || nome_tabela || 
            ' FOR UPDATE USING (pertence_ao_usuario_atual(usuario_id))';
    
    -- Criar política para DELETE - usuário só pode deletar seus próprios dados
    EXECUTE 'CREATE POLICY ' || nome_tabela || '_delete_policy ON public.' || nome_tabela || 
            ' FOR DELETE USING (pertence_ao_usuario_atual(usuario_id))';
    
    RAISE NOTICE 'Políticas padrão criadas para a tabela %', nome_tabela;
END;
$$ LANGUAGE plpgsql;

-- Configurar políticas para todas as tabelas
DO $$
BEGIN
    -- Aplicar políticas para cada tabela
    PERFORM criar_politicas_padrao('treinos');
    PERFORM criar_politicas_padrao('refeicoes');
    PERFORM criar_politicas_padrao('habitos');
    PERFORM criar_politicas_padrao('peso_registros');
    
    -- Verificar se existe a tabela pesos
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pesos') THEN
        PERFORM criar_politicas_padrao('pesos');
    END IF;
    
    -- Verificar se existe a tabela registro_peso
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'registro_peso') THEN
        PERFORM criar_politicas_padrao('registro_peso');
    END IF;
END $$;

-- Verificar as políticas criadas
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd, 
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Se você está tendo problemas de acesso durante o desenvolvimento, 
-- considere desativar o RLS temporariamente em alguma tabela para debug:
-- ALTER TABLE treinos DISABLE ROW LEVEL SECURITY;

-- Instruções para testar o acesso após aplicar as políticas:
SELECT '1. Tente autenticar com um usuário (set_current_user)' as "Teste de Acesso";
SELECT '2. Verifique se o usuário atual está definido (SELECT current_setting(''app.current_user'', true))' as "Teste de Acesso";
SELECT '3. Tente acessar dados de uma tabela (SELECT * FROM treinos LIMIT 5)' as "Teste de Acesso"; 