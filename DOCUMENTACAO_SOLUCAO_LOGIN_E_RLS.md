# Documentação da Solução: Login e RLS (Row-Level Security)

Este documento explica a solução implementada para corrigir os problemas de login e acesso aos dados do sistema, usando o Row-Level Security (RLS) do Supabase.

## Problema identificado

O principal problema identificado foi o ciclo de dependências no login:

1. O usuário precisava estar autenticado para ver dados da tabela `usuarios`
2. Mas para autenticar, era necessário consultar a tabela `usuarios` para verificar se o usuário existe
3. O RLS bloqueava o acesso à tabela `usuarios` antes da autenticação

Além disso, não havia uma forma de associar o usuário logado com o RLS nativo do Supabase sem utilizar o sistema de autenticação completo do Supabase, que não foi implementado neste projeto.

## Solução implementada

A solução combina políticas RLS com funções SQL e integrações no código React:

### 1. Funções SQL no Supabase

Criamos duas funções principais:

#### `set_current_user(nome_usuario text) RETURNS void`

Esta função:
- Busca um usuário pelo nome na tabela `usuarios`
- Define o valor do parâmetro de configuração `app.current_user` como o ID do usuário encontrado
- Possui tratamento para casos onde o usuário não é encontrado
- Aceita nome vazio para limpar o usuário atual (logout)

```sql
CREATE OR REPLACE FUNCTION set_current_user(nome_usuario text)
RETURNS void AS $$
DECLARE
    usuario_id uuid;
BEGIN
    -- Definir um valor padrão (UUID null) se o nome estiver vazio
    IF nome_usuario IS NULL OR nome_usuario = '' THEN
        PERFORM set_config('app.current_user', '00000000-0000-0000-0000-000000000000'::text, false);
        RETURN;
    END IF;
    
    -- Buscar o ID do usuário pelo nome
    SELECT id INTO usuario_id FROM usuarios WHERE nome = nome_usuario;
    
    -- Se o usuário for encontrado, definir a configuração
    IF usuario_id IS NOT NULL THEN
        PERFORM set_config('app.current_user', usuario_id::text, false);
    ELSE
        PERFORM set_config('app.current_user', '00000000-0000-0000-0000-000000000000'::text, false);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `pertence_ao_usuario_atual(usuario_id uuid) RETURNS boolean`

Esta função:
- Verifica se o ID fornecido corresponde ao usuário atual
- É usada em todas as políticas RLS para filtrar dados

```sql
CREATE OR REPLACE FUNCTION pertence_ao_usuario_atual(usuario_id uuid)
RETURNS boolean AS $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Obter o ID do usuário atual da configuração
    BEGIN
        current_user_id := current_setting('app.current_user', true)::uuid;
    EXCEPTION WHEN OTHERS THEN
        RETURN false;
    END;
    
    -- Verificar se o ID do registro pertence ao usuário atual
    RETURN usuario_id = current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Políticas de Row-Level Security (RLS)

Implementamos políticas específicas para cada tabela. Para a tabela `usuarios`, usamos uma política mais permissiva para permitir o login:

```sql
-- Permitir SELECT a todos os usuários (necessário para login)
CREATE POLICY usuarios_select_policy ON usuarios
    FOR SELECT USING (true);

-- Permitir INSERT a todos (necessário para registro)
CREATE POLICY usuarios_insert_policy ON usuarios
    FOR INSERT WITH CHECK (true);

-- Restringir UPDATE apenas ao próprio usuário
CREATE POLICY usuarios_update_policy ON usuarios
    FOR UPDATE USING (pertence_ao_usuario_atual(id)) WITH CHECK (pertence_ao_usuario_atual(id));

-- Restringir DELETE apenas ao próprio usuário
CREATE POLICY usuarios_delete_policy ON usuarios
    FOR DELETE USING (pertence_ao_usuario_atual(id));
```

Para as demais tabelas (treinos, habitos, refeicoes, pesos), usamos políticas mais restritivas:

```sql
-- Política padrão para SELECT
CREATE POLICY tabela_select_policy ON nome_tabela
    FOR SELECT USING (pertence_ao_usuario_atual(usuario_id));

-- Política padrão para INSERT
CREATE POLICY tabela_insert_policy ON nome_tabela
    FOR INSERT WITH CHECK (pertence_ao_usuario_atual(usuario_id));

-- Política padrão para UPDATE
CREATE POLICY tabela_update_policy ON nome_tabela
    FOR UPDATE USING (pertence_ao_usuario_atual(usuario_id)) WITH CHECK (pertence_ao_usuario_atual(usuario_id));

-- Política padrão para DELETE
CREATE POLICY tabela_delete_policy ON nome_tabela
    FOR DELETE USING (pertence_ao_usuario_atual(usuario_id));
```

### 3. Integrações no código React

#### Modificações na função `setCurrentUser`

Atualizamos a função para chamar o RPC do Supabase após armazenar o usuário localmente:

```typescript
export async function setCurrentUser(user: CurrentUser): Promise<void> {
  try {
    // Salvar no localStorage
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    
    // Gerar token de sessão e definir expiração (24 horas)
    // ... código existente ...
    
    // Chamar a função SQL para definir o usuário atual no Supabase
    try {
      await supabaseApi.supabase.rpc('set_current_user', {
        nome_usuario: user.nome
      });
      console.log('Usuário atual definido no Supabase:', user.nome);
    } catch (error) {
      console.error('Erro ao definir usuário atual no Supabase:', error);
    }
  } catch (error) {
    console.error('Erro ao salvar usuário atual:', error);
  }
}
```

#### Inicialização do usuário no App.tsx

Adicionamos código para chamar a função `set_current_user` quando o aplicativo é carregado e um usuário já está logado:

```typescript
useEffect(() => {
  const initializeUser = async () => {
    const userIsLoggedIn = isUserLoggedIn();
    setHasUserData(userIsLoggedIn);

    // Se o usuário estiver logado, chamar a função set_current_user do Supabase
    if (userIsLoggedIn) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        try {
          await supabase.rpc('set_current_user', {
            nome_usuario: currentUser.nome
          });
          console.log('Usuário restaurado no Supabase:', currentUser.nome);
        } catch (error) {
          console.error('Erro ao restaurar usuário no Supabase:', error);
        }
      }
    }
  };

  initializeUser();
}, []);
```

#### Logout

Também atualizamos a função de logout para limpar o usuário no Supabase:

```typescript
const handleLogout = async () => {
  try {
    // Limpar a referência do usuário atual no Supabase antes de fazer logout
    await supabase.rpc('set_current_user', {
      nome_usuario: ''
    });
  } catch (error) {
    console.error('Erro ao limpar usuário no Supabase:', error);
  } finally {
    clearCurrentUser();
    setHasUserData(false);
    setActiveView('dashboard');
  }
};
```

## Como funciona

1. **Login**: Quando um usuário faz login, o sistema:
   - Verifica se o usuário existe na tabela `usuarios` (permitido por políticas permissivas)
   - Armazena as informações do usuário no localStorage
   - Chama a função `set_current_user` para definir o usuário atual no Supabase

2. **Acesso aos dados**: Quando o usuário acessa dados:
   - As políticas RLS verificam se o registro pertence ao usuário atual
   - A função `pertence_ao_usuario_atual` compara o ID do registro com o ID armazenado em `app.current_user`
   - Apenas os dados pertencentes ao usuário são retornados

3. **Logout**: Quando o usuário faz logout:
   - A função `set_current_user` é chamada com um nome vazio
   - As informações do usuário são removidas do localStorage
   - O usuário é redirecionado para a tela de login

## Benefícios da Solução

1. **Segurança em duas camadas**:
   - Frontend: Filtragem por usuário_id em cada consulta
   - Backend: RLS impede acesso a dados de outros usuários mesmo se o frontend não filtrar

2. **Login funcional**:
   - Políticas permissivas apenas onde necessário (tabela usuarios)
   - Restrições rigorosas para dados sensíveis

3. **Simplicidade**:
   - Não requer autenticação completa do Supabase
   - Funciona com o sistema de login por nome existente

## Verificação da Configuração

Para verificar se tudo está configurado corretamente, execute o script `verificar_configuracao_rls.sql` no Editor SQL do Supabase. Este script verifica:

- Se as funções `set_current_user` e `pertence_ao_usuario_atual` existem
- Se o RLS está ativo para todas as tabelas principais
- Se todas as políticas de segurança estão configuradas corretamente
- Testa a função `set_current_user` com um usuário existente

## Próximos Passos

1. **Implementar autenticação mais robusta**:
   - Adicionar senhas para aumentar a segurança
   - Considerar usar o sistema de autenticação nativo do Supabase

2. **Melhorar a gestão de sessões**:
   - Implementar tokens de refresh
   - Adicionar validação de sessão no servidor

3. **Monitoramento**:
   - Adicionar logs para tentativas de acesso não autorizado
   - Implementar alertas para possíveis violações de segurança 