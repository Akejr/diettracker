# Instruções para Configurar o Supabase

Este documento contém instruções detalhadas para configurar corretamente seu banco de dados Supabase para o aplicativo de Controle de Dieta e Treinos.

## 1. Verificação de Tabelas

Conforme verificamos, todas as tabelas necessárias já existem no seu banco de dados:
- `usuarios` (com 1 registro)
- `refeicoes` (com 1 registro)
- `treinos` (sem registros)
- `habitos` (sem registros)
- `peso_registros` (sem registros)

## 2. Configurar Políticas de Segurança (RLS)

### Opção 1: Via Interface Gráfica

1. Acesse o painel do Supabase em [https://app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Navegue até "Table Editor" no menu lateral
4. Para cada tabela, siga as instruções abaixo:

   **Para a tabela `usuarios`**:
   - Selecione a tabela
   - Clique na aba "Authentication"
   - Ative a opção "Enable RLS"
   - Clique em "Add Policy"
   - Adicione duas políticas:
     
     **Política 1 (SELECT):**
     - Policy Name: `usuarios_user_select_policy`
     - Operation: SELECT
     - Using expression: 
     ```sql
     auth.uid()::text = id::text
     ```

     **Política 2 (Modificações - ALL):**
     - Policy Name: `usuarios_user_modify_policy`
     - Operation: ALL
     - Using expression:
     ```sql
     auth.uid()::text = id::text
     ```

   **Para as outras tabelas** (`refeicoes`, `treinos`, `habitos`, `peso_registros`):
   - Selecione a tabela
   - Clique na aba "Authentication"
   - Ative a opção "Enable RLS"
   - Clique em "Add Policy"
   - Adicione duas políticas:
     
     **Política 1 (SELECT):**
     - Policy Name: `{nome_tabela}_user_select_policy` (exemplo: `refeicoes_user_select_policy`)
     - Operation: SELECT
     - Using expression: 
     ```sql
     auth.uid()::text = usuario_id::text OR usuario_id IN (SELECT id FROM public.usuarios WHERE auth.uid()::text = id::text)
     ```

     **Política 2 (Modificações - ALL):**
     - Policy Name: `{nome_tabela}_user_modify_policy` (exemplo: `refeicoes_user_modify_policy`)
     - Operation: ALL
     - Using expression:
     ```sql
     auth.uid()::text = usuario_id::text OR usuario_id IN (SELECT id FROM public.usuarios WHERE auth.uid()::text = id::text)
     ```

### Opção 2: Via SQL

1. Acesse o painel do Supabase em [https://app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Clique em "SQL Editor" no menu lateral
4. Clique em "New query"
5. Cole o conteúdo do arquivo `configure_rls.sql` fornecido
6. Clique em "Run" para executar o script

Este script fará:
- Habilitar RLS para todas as tabelas
- Remover políticas de segurança existentes (se houver)
- Criar políticas apropriadas para cada tabela:
  - Para a tabela `usuarios`: usando a coluna `id`
  - Para as outras tabelas: usando a coluna `usuario_id`
- Verificar o status do RLS e listar as políticas criadas

## 3. Verificação de Funcionamento

Após configurar as políticas de segurança, o app deve funcionar corretamente, permitindo:
- Acesso apenas aos dados do próprio usuário
- Proteção contra acesso não autorizado

Para verificar se tudo está funcionando:
1. Faça login no aplicativo
2. Tente adicionar um novo hábito
3. Verifique se o hábito é exibido corretamente após ser adicionado
4. Tente marcar o hábito como concluído

Se todas essas ações funcionarem, a configuração está correta.

## 4. Estrutura das Tabelas

### Tabela `usuarios`
- A coluna de identificação do usuário é `id`
- Esta coluna deve corresponder ao `auth.uid()` do usuário autenticado

### Outras tabelas (`refeicoes`, `treinos`, `habitos`, `peso_registros`)
- Devem conter a coluna `usuario_id` para relacionar os registros ao usuário
- Esta coluna deve referenciar o `id` na tabela `usuarios`

## 5. Solução de Problemas

Se você encontrar problemas com a configuração do RLS:

1. Verifique a estrutura de cada tabela
   ```sql
   -- Verificar estrutura da tabela
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public' 
     AND table_name = 'nome_da_tabela'
   ORDER BY ordinal_position;
   ```

2. Confirme se o RLS está habilitado para todas as tabelas
   ```sql
   SELECT tablename, has_row_level_security
   FROM pg_tables
   WHERE schemaname = 'public';
   ```

3. Verifique as políticas criadas
   ```sql
   SELECT tablename, policyname, permissive, roles, cmd
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

Para qualquer outro problema, consulte a documentação do Supabase sobre [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security). 