# Implementação de Autenticação com Nome e Senha

Este documento fornece instruções passo a passo para implementar autenticação com nome e senha no aplicativo de controle de dieta e treinos.

## Passo 1: Executar o Script SQL

1. Acesse o **Supabase Studio** no seu projeto
2. Vá para a seção **SQL Editor**
3. Crie um novo script
4. Cole o conteúdo do arquivo `implementar_autenticacao_completa.sql`
5. Execute o script (botão "Run")

> **ATENÇÃO**: Este script irá apagar todos os dados existentes e recriar as tabelas com novos usuários de exemplo.

## Passo 2: Atualizar o Código do Front-End

Agora que o backend está configurado, precisamos atualizar o código do front-end para trabalhar com autenticação por senha.

### 2.1. Atualizar Tipo `Usuario` em `src/lib/supabase.ts`

Abra o arquivo `src/lib/supabase.ts` e atualize a interface `Usuario` para incluir o campo de senha:

```typescript
export interface Usuario {
  id?: string;
  created_at?: string;
  updated_at?: string;
  nome: string;
  senha?: string; // Novo campo para senha
  idade: number;
  peso: number;
  altura: number;
  sexo: 'masculino' | 'feminino';
  nivel_atividade: string;
  objetivo: 'perder' | 'manter' | 'ganhar';
  meta_calorica: number;
  meta_proteina: number;
  meta_treinos: number;
  foto_url?: string;
}
```

### 2.2. Adicionar Função de Autenticação em `src/lib/supabase.ts`

Adicione a função `autenticarUsuario` no arquivo `src/lib/supabase.ts`:

```typescript
export async function autenticarUsuario(nome: string, senha: string): Promise<{ data: { id: string; nome: string } | null; error: Error | null }> {
  try {
    // Chamar a função RPC do Supabase que criamos no SQL
    const { data, error } = await supabase.rpc('set_current_user', {
      nome_usuario: nome,
      senha_usuario: senha
    });
    
    if (error) {
      console.error('Erro ao autenticar usuário:', error);
      return { data: null, error };
    }
    
    // Se a autenticação falhou (função retornou null), retornar erro
    if (!data) {
      return { data: null, error: new Error('Nome de usuário ou senha incorretos') };
    }
    
    // Buscar os dados completos do usuário
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('id, nome')
      .eq('nome', nome)
      .single();
      
    if (userError) {
      console.error('Erro ao buscar dados do usuário:', userError);
      return { data: null, error: userError };
    }
    
    return { data: userData, error: null };
  } catch (error) {
    console.error('Erro durante autenticação:', error);
    return { data: null, error: error instanceof Error ? error : new Error('Erro desconhecido durante autenticação') };
  }
}
```

### 2.3. Atualizar Função `criarUsuario` em `src/lib/supabase.ts`

Atualize a função `criarUsuario` para incluir a senha:

```typescript
async criarUsuario(usuario: Omit<Usuario, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Usuario | null; error: Error | null }> {
  try {
    // Verificar se o usuário está preenchendo todos os campos obrigatórios
    if (!usuario.nome || !usuario.senha) { // Verificar senha também
      throw new Error('Nome e senha são obrigatórios');
    }

    // Verificar se o usuário já existe
    const { data: existingUser, error: checkError } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('nome', usuario.nome)
      .maybeSingle();

    if (checkError) {
      console.error('Erro ao verificar usuário existente:', checkError);
      return { data: null, error: checkError };
    }

    if (existingUser) {
      return { data: null, error: new Error('Usuário já existe com este nome. Por favor, escolha outro nome.') };
    }

    // Inserir o usuário com senha
    const { data, error } = await this.supabase
      .from('usuarios')
      .insert([
        {
          nome: usuario.nome,
          senha: usuario.senha, // Incluir a senha
          idade: usuario.idade,
          peso: usuario.peso,
          altura: usuario.altura,
          sexo: usuario.sexo,
          nivel_atividade: usuario.nivel_atividade,
          objetivo: usuario.objetivo,
          meta_calorica: usuario.meta_calorica,
          meta_proteina: usuario.meta_proteina,
          meta_treinos: usuario.meta_treinos,
          foto_url: usuario.foto_url
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return { data: null, error: error instanceof Error ? error : new Error('Erro desconhecido') };
  }
}
```

### 2.4. Atualizar Função `setCurrentUser` em `src/lib/userUtils.ts`

Atualize a função `setCurrentUser` para aceitar o parâmetro de senha:

```typescript
export async function setCurrentUser(user: CurrentUser, senha?: string): Promise<void> {
  try {
    // Salvar no localStorage
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    
    // Gerar token de sessão
    const token = generateSessionToken();
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    
    // Definir expiração (24 horas)
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    localStorage.setItem(SESSION_EXPIRY_KEY, expiry.toISOString());
    
    // Chamar a função SQL para definir o usuário atual no Supabase
    if (senha) {
      try {
        await supabaseApi.supabase.rpc('set_current_user', {
          nome_usuario: user.nome,
          senha_usuario: senha
        });
        console.log('Usuário atual definido no Supabase com senha:', user.nome);
      } catch (error) {
        console.error('Erro ao definir usuário atual no Supabase:', error);
      }
    } else {
      // Para compatibilidade com código existente
      try {
        await supabaseApi.supabase.rpc('set_current_user', {
          nome_usuario: user.nome,
          senha_usuario: '' // Senha vazia, não vai autenticar, mas mantém compatibilidade
        });
        console.log('Usuário atual definido no Supabase (sem senha):', user.nome);
      } catch (error) {
        console.error('Erro ao definir usuário atual no Supabase:', error);
      }
    }
  } catch (error) {
    console.error('Erro ao salvar usuário atual:', error);
  }
}
```

### 2.5. Atualizar o Componente `LoginForm.tsx`

Abra o arquivo `src/components/LoginForm.tsx` e faça as seguintes alterações:

1. Atualize os imports:
```typescript
import React, { useState } from 'react';
import { supabaseApi } from '../lib/supabase';
import { autenticarUsuario } from '../lib/supabase'; // Adicionar esta linha
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { motion } from 'framer-motion';
import { FiUser, FiLock } from 'react-icons/fi'; // Adicionar FiLock
import { setCurrentUser } from '../lib/userUtils';
```

2. Adicione o estado para a senha:
```typescript
const [password, setPassword] = useState('');
```

3. Substitua a função `handleSubmit` existente:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    // Utilizar a nova função de autenticação com senha
    const { data, error } = await autenticarUsuario(name, password);

    if (error) {
      if (error.message.includes('não encontrado') || error.message.includes('incorretos')) {
        setError('Nome de usuário ou senha incorretos. Por favor, tente novamente.');
      } else {
        setError('Ocorreu um erro ao fazer login. Por favor, tente novamente.');
      }
      console.error('Erro ao autenticar:', error);
      return;
    }

    if (!data) {
      setError('Nome de usuário ou senha incorretos. Por favor, tente novamente.');
      return;
    }

    // Usar a função aprimorada para armazenar dados do usuário com sessão
    await setCurrentUser({
      id: data.id,
      nome: data.nome
    }, password); // Passar a senha para autenticar no Supabase
    
    console.log('Usuário logado:', data);
    onSuccess();
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    setError('Ocorreu um erro durante o login. Por favor, tente novamente.');
  } finally {
    setLoading(false);
  }
};
```

4. Adicione o campo de senha no formulário, após o campo de nome:
```html
<div className="space-y-2">
  <Label htmlFor="password" className="text-sm font-medium text-[#343030] block">Senha</Label>
  <Input
    id="password"
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="w-full px-4 py-3 bg-[#F9FAFB] border-[#E2E2E9] rounded-lg focus:ring-[#343030] focus:ring-opacity-15 transition-all"
    placeholder="Digite sua senha"
    required
  />
</div>
```

### 2.6. Atualizar o Componente `UserDataForm.tsx`

Abra o arquivo `src/components/UserDataForm.tsx` e faça as seguintes alterações:

1. Atualize os imports:
```typescript
import { FiLock } from 'react-icons/fi'; // Adicionar este import
```

2. Adicione o campo senha no state:
```typescript
const [formData, setFormData] = useState({
  nome: '',
  senha: '', // Novo campo para senha
  peso: '',
  altura: '',
  idade: '',
  sexo: 'masculino',
  nivel_atividade: 'moderado',
  objetivo: 'perder',
  meta_calorica: '2000',
  meta_proteina: '150',
  meta_treinos: '5',
  foto_url: ''
});
```

3. Adicione o campo de senha no formulário, após o campo de nome:
```html
<div className="col-span-2">
  <label className="text-sm text-[#343030] mb-1.5 block">Senha</label>
  <input
    type="password"
    name="senha"
    value={formData.senha}
    onChange={handleInputChange}
    className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030]"
    required
    placeholder="Crie uma senha segura"
  />
</div>
```

4. Atualize a chamada para `criarUsuario` no `handleSubmit`:
```typescript
const { data, error } = await supabaseApi.criarUsuario({
  nome: formData.nome,
  senha: formData.senha, // Incluir a senha
  idade: Number(formData.idade),
  peso: Number(formData.peso),
  altura: Number(formData.altura),
  sexo: formData.sexo as 'masculino' | 'feminino',
  nivel_atividade: formData.nivel_atividade,
  objetivo: formData.objetivo as 'perder' | 'manter' | 'ganhar',
  meta_calorica: parseInt(formData.meta_calorica),
  meta_proteina: parseInt(formData.meta_proteina),
  meta_treinos: parseInt(formData.meta_treinos || '5'),
  foto_url: formData.foto_url
});
```

5. Atualize a chamada para `setCurrentUser` para passar a senha:
```typescript
await setCurrentUser({
  id: data.id!,
  nome: data.nome
}, formData.senha); // Passar a senha
```

## Passo 3: Testar a Autenticação

1. Reinicie o aplicativo
2. Teste o login com um dos usuários criados pelo script SQL:
   - **Nome**: joao
   - **Senha**: senha123
   
   ou
   
   - **Nome**: maria
   - **Senha**: senha456

3. Teste também a criação de um novo usuário através do formulário de cadastro

## Passo 4: Resolver Possíveis Problemas

Se você encontrar erros durante o processo, verifique:

1. Se o script SQL foi executado com sucesso
2. Se as funções no front-end foram atualizadas corretamente
3. Se há erros no console do navegador

### Solução para Erro de Autenticação

Se você encontrar erros de autenticação, pode executar este comando no SQL Editor do Supabase para verificar se as funções foram criadas corretamente:

```sql
-- Testar a função de autenticação
DO $$
DECLARE
    usuario_id uuid;
BEGIN
    SELECT set_current_user('joao', 'senha123') INTO usuario_id;
    RAISE NOTICE 'ID do usuário autenticado: %', usuario_id;
    RAISE NOTICE 'Usuário atual configurado: %', current_setting('app.current_user', true);
END $$;
``` 