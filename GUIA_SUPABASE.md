# Guia de Configuração do Supabase

## Tabelas Existentes

Com base na imagem fornecida, seu banco de dados Supabase tem as seguintes tabelas:

1. **habitos** - Para armazenar os hábitos dos usuários
2. **peso_registros** - Para armazenar registros de peso
3. **pesos** - Parece ser outra tabela para registros de peso
4. **refeicoes** - Para armazenar as refeições do usuário
5. **registro_peso** - Parece ser mais uma tabela para registros de peso
6. **treinos** - Para armazenar os treinos dos usuários
7. **usuarios** - Tabela principal de usuários

Algumas destas tabelas (indicadas com 🔒) já têm RLS ativado.

## O que o Script SQL Faz

O script `configurar_supabase_completo.sql` realiza as seguintes operações:

### 1. Configura RLS Para Todas as Tabelas

- Habilita RLS (Row Level Security) para todas as tabelas
- Verifica se cada tabela tem a coluna `usuario_id` (exceto a tabela `usuarios` que usa `id`)
- Remove políticas existentes para evitar conflitos
- Cria políticas novas que permitem que os usuários acessem apenas os próprios dados

### 2. Detecta Possíveis Duplicidades

Você tem 3 tabelas que parecem ter o mesmo propósito (peso_registros, pesos, registro_peso). O script inclui uma consulta que identifica colunas em comum entre essas tabelas, ajudando a decidir se alguma delas pode ser removida ou consolidada.

### 3. Verifica o Status das Configurações

Após as alterações, o script verifica o status do RLS e lista todas as políticas criadas para confirmar que tudo foi configurado corretamente.

### 4. Configura Acesso Anônimo (Opcional)

Adiciona uma política para permitir que usuários anônimos criem novos registros na tabela `usuarios`, o que é útil se seu aplicativo permitir cadastro sem login prévio.

## Recomendações Adicionais

1. **Consolidar Tabelas de Peso**: Considere consolidar as tabelas `peso_registros`, `pesos` e `registro_peso` em uma única tabela para simplificar o gerenciamento de dados.

2. **Verificar Estrutura de Tabelas**: Execute a consulta da Parte 2 do script para identificar possíveis redundâncias.

3. **Backup**: Antes de executar o script, faça um backup dos seus dados.

4. **Teste**: Após aplicar as configurações de RLS, teste o acesso ao aplicativo para garantir que tudo está funcionando conforme esperado.

5. **Migração de Dados**: Se você decidir consolidar tabelas, certifique-se de migrar todos os dados necessários antes de excluir tabelas redundantes.

## Como Executar o Script

1. Acesse o painel do Supabase em [https://app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Clique em "SQL Editor" no menu lateral
4. Clique em "New query"
5. Cole o conteúdo do arquivo `configurar_supabase_completo.sql`
6. Clique em "Run" para executar o script

O script é seguro para executar várias vezes, pois ele verifica a existência de políticas antes de criá-las e remove políticas antigas antes de adicionar novas. 