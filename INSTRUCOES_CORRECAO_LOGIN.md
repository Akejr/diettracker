# Instruções para Corrigir o Problema de Login

Este documento fornece instruções passo a passo para corrigir os problemas de login após a ativação do Row-Level Security (RLS) no Supabase.

## Problema

Após ativar o RLS (Row-Level Security), você está enfrentando um ciclo de dependência:
1. O RLS bloqueia o acesso à tabela `usuarios` para usuários não autenticados
2. Para autenticar um usuário, é necessário consultar a tabela `usuarios`
3. Mas o RLS impede essa consulta, impedindo o login

## Solução

A solução implementada utiliza:
1. Funções SQL personalizadas
2. Políticas de RLS ajustadas
3. Integração no código React

### Passo 1: Executar o script SQL no Supabase

1. Abra o **Supabase Studio** no seu projeto
2. Vá para a seção **SQL Editor**
3. Crie um novo script
4. Cole o conteúdo do arquivo `corrigir_acesso_login.sql`
5. Execute o script (botão "Run")

Este script:
- Cria/atualiza a função `set_current_user`
- Cria/atualiza a função `pertence_ao_usuario_atual`
- Configura políticas de RLS apropriadas para todas as tabelas

### Passo 2: Verificar a configuração do RLS

Para verificar se a configuração foi aplicada corretamente:

1. Abra o **Supabase Studio** no seu projeto
2. Vá para a seção **SQL Editor**
3. Crie um novo script
4. Cole o conteúdo do arquivo `verificar_configuracao_rls.sql`
5. Execute o script (botão "Run")

Isso irá mostrar:
- O valor atual da configuração `app.current_user`
- As definições das funções `set_current_user` e `pertence_ao_usuario_atual`
- O status do RLS em todas as tabelas
- Todas as políticas de segurança configuradas

### Passo 3: Reiniciar o aplicativo

As alterações no código já foram feitas:
1. A função `setCurrentUser` no arquivo `userUtils.ts` foi atualizada para chamar `set_current_user` do Supabase
2. O `App.tsx` foi atualizado para restaurar o usuário atual no Supabase ao iniciar
3. O `handleLogout` foi atualizado para limpar o usuário atual no Supabase

Reinicie seu aplicativo para que estas mudanças possam ser aplicadas.

## Solução alternativa (Temporária para desenvolvimento)

Se você continuar enfrentando problemas ou precisar de uma solução rápida para desenvolvimento, você pode desativar temporariamente o RLS:

1. Abra o **Supabase Studio** no seu projeto
2. Vá para a seção **SQL Editor**
3. Crie um novo script
4. Cole o conteúdo do arquivo `desativar_rls_temporario.sql`
5. Execute o script (botão "Run")

**IMPORTANTE**: Esta solução alternativa deve ser usada apenas em ambiente de desenvolvimento, pois desativa todas as restrições de segurança.

## Como testar se está funcionando

Após aplicar a solução:

1. **Logout**:
   - Faça logout se estiver logado
   - Verifique se você é redirecionado para a tela de login

2. **Login**:
   - Tente fazer login com um usuário existente
   - Verifique se consegue acessar os dados

3. **Registrar novo usuário**:
   - Tente se registrar como um novo usuário
   - Verifique se o cadastro é bem-sucedido e se consegue acessar os dados

4. **Acesso a dados**:
   - Verifique se consegue ver seus próprios treinos, hábitos, etc.
   - Verifique se consegue adicionar novos dados

## Documentação detalhada

Para entender completamente a solução implementada, consulte o arquivo `DOCUMENTACAO_SOLUCAO_LOGIN_E_RLS.md` que explica:

- A arquitetura completa da solução
- Como as funções SQL e políticas de RLS funcionam juntas
- Como o código React se integra com o Supabase
- Considerações de segurança
- Próximos passos para melhorias 