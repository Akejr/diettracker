import React, { useState } from 'react';
import { supabaseApi } from '../lib/supabase';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { motion } from 'framer-motion';
import { setCurrentUser } from '../lib/userUtils';
import LoadingSpinner from './LoadingSpinner';
import { AlertCircle, User, Lock, LogIn, Dumbbell } from 'lucide-react';

interface LoginFormProps {
  onSuccess: () => void;
  onRegister: () => void;
}

export function LoginForm({ onSuccess, onRegister }: LoginFormProps) {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Usar a nova função de autenticação
      const { data, error } = await supabaseApi.autenticarUsuario(nome, senha);

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
      }, senha); // Passar a senha para autenticar no Supabase
      
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
    <div className="flex flex-col justify-center items-center h-full w-full">
      {/* Container centralizado */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] right-[10%] w-64 h-64 rounded-full bg-[#1E1E1E] opacity-20 blur-[80px]" />
          <div className="absolute bottom-[15%] left-[5%] w-72 h-72 rounded-full bg-[#00E676] opacity-5 blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md z-10 px-4"
        >
          {/* Logo e título */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-block mb-4"
            >
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#1A1A1A] to-[#00E676] rounded-2xl flex items-center justify-center shadow-lg">
                <Dumbbell className="w-10 h-10 text-white" strokeWidth={2} />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl font-bold text-white mb-2 tracking-tight"
            >
              minimalist<span className="text-[#00E676]">.</span>fit
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-[#B0B0B0] text-sm"
            >
              Acompanhe sua dieta e treinos de forma simples
            </motion.p>
          </div>
          
          {/* Card de login */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-[#1b1b1b80] backdrop-blur-md rounded-2xl p-6 shadow-xl border border-[#2a2a2a] relative overflow-hidden"
          >
            {/* Borda gradiente */}
            <div className="absolute inset-0 rounded-2xl p-[1px] -m-[1px] z-0 bg-gradient-to-br from-[#33333320] via-[#2a2a2a00] to-[#00E67620]" />
            
            <div className="relative z-10">
              {/* Mensagem de erro */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="mb-5"
                >
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-[#FF525220] border border-[#FF525240]">
                    <AlertCircle className="w-5 h-5 text-[#FF5252] shrink-0 mt-0.5" />
                    <p className="text-[#FF9999] text-sm">{error}</p>
                  </div>
                </motion.div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm text-[#E0E0E0] mb-1.5 block font-medium">Nome de Usuário</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-[#B0B0B0]" />
                    </div>
                    <Input
                      type="text"
                      name="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full pl-10 py-3 rounded-lg border bg-[#18181880] border-[#33333380] text-white placeholder-[#808080] focus:ring-2 focus:ring-[#00E676] focus:border-transparent outline-none transition-all"
                      required
                      placeholder="Digite seu nome"
                      autoComplete="username"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-[#E0E0E0] mb-1.5 block font-medium">Senha</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-[#B0B0B0]" />
                    </div>
                    <Input
                      type="password"
                      name="senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full pl-10 py-3 rounded-lg border bg-[#18181880] border-[#33333380] text-white placeholder-[#808080] focus:ring-2 focus:ring-[#00E676] focus:border-transparent outline-none transition-all"
                      required
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                    />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-[#1A1A1A] to-[#00E676] text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" message="" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Entrar</span>
                    </>
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-[#B0B0B0] text-sm">
                  Não tem uma conta?{' '}
                  <button
                    onClick={onRegister}
                    className="text-[#00E676] hover:text-[#50F096] transition-colors font-medium focus:outline-none focus:underline"
                  >
                    Cadastre-se
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Versão */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center mt-8"
          >
            <p className="text-[#808080] text-xs">
              v1.0.0 • Desenvolvido por Evandro Casanova
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}