// Alterações necessárias no front-end para suportar autenticação com nome e senha

// 1. Atualizações no lib/supabase.ts
/**
 * Adicione esta função para autenticar usuários usando nome e senha
 */
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

// 2. Atualizações no lib/userUtils.ts
/**
 * Atualize a função setCurrentUser para trabalhar com a nova função de autenticação
 */
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

// 3. Atualização no componente LoginForm.tsx
/**
 * Modifique o LoginForm para incluir campo de senha
 */
import React, { useState } from 'react';
import { supabaseApi, autenticarUsuario } from '../lib/supabase';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { motion } from 'framer-motion';
import { FiUser, FiLock } from 'react-icons/fi';
import { setCurrentUser } from '../lib/userUtils';

interface LoginFormProps {
  onSuccess: () => void;
  onRegister: () => void;
}

export function LoginForm({ onSuccess, onRegister }: LoginFormProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] max-w-md mx-auto px-5 py-12">
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Título minimalista */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold text-center bg-gradient-to-r from-[#343030] to-[#454545] inline-block text-transparent bg-clip-text mb-10"
        >
          Controle de dieta
        </motion.h1>

        {/* Card Principal - ainda mais clean */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full bg-white rounded-xl border border-[#EAECF0] shadow-sm overflow-hidden"
        >
          <div className="p-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-5"
              >
                <p className="text-red-500 text-sm text-center p-3 rounded-lg bg-red-50 border border-red-100">{error}</p>
              </motion.div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-[#343030] block">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F9FAFB] border-[#E2E2E9] rounded-lg focus:ring-[#343030] focus:ring-opacity-15 transition-all"
                  placeholder="Digite seu nome"
                  required
                  autoFocus
                />
              </div>

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

              <Button 
                type="submit" 
                className="w-full bg-[#343030] text-white font-medium py-3 px-4 rounded-lg hover:bg-[#454545] transition-all" 
                disabled={loading}
              >
                {loading ? 'Verificando...' : 'Entrar'}
              </Button>
            </form>
          </div>
        </motion.div>

        {/* Botão de Cadastro */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="mt-4 w-full"
        >
          <button 
            type="button" 
            onClick={onRegister}
            className="w-full text-[#343030] font-medium py-3 text-sm hover:underline transition-all" 
          >
            Não tem cadastro? Registre-se
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// 4. Atualização no componente UserDataForm.tsx
/**
 * Modifique o UserDataForm para incluir campo de senha no cadastro
 */
// Adicione no começo do arquivo, após os imports existentes:
import { FiLock } from 'react-icons/fi';

// Adicione o campo senha no state:
const [formData, setFormData] = useState({
  nome: '',
  senha: '', // Novo campo
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

// Adicione o campo de senha no formulário:
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

// Atualize a chamada para criarUsuario para incluir a senha:
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

// E atualize a chamada para setCurrentUser para passar a senha:
await setCurrentUser({
  id: data.id!,
  nome: data.nome
}, formData.senha); // Passar a senha 