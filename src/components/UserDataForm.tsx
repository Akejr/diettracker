import React, { useState, useEffect, useRef } from 'react';
import { supabaseApi } from '../lib/supabase';
import { motion } from 'framer-motion';
import { setCurrentUser } from '../lib/userUtils';
import LoadingSpinner from './LoadingSpinner';
import { format } from 'date-fns';
import { AlertCircle, User, Lock, Save, ArrowLeft, Activity, Target, Dumbbell, Weight, Ruler, Heart, Upload } from 'lucide-react';

interface UserDataFormProps {
  onSuccess: () => void;
}

export function UserDataForm({ onSuccess }: UserDataFormProps) {
  const [formData, setFormData] = useState({
    nome: '',
    senha: '',
    idade: '',
    peso: '',
    altura: '',
    sexo: 'masculino' as 'masculino' | 'feminino',
    nivel_atividade: 'sedentario',
    objetivo: 'perder' as 'perder' | 'manter' | 'ganhar',
    meta_calorica: '',
    meta_proteina: '',
    meta_treinos: '',
    foto_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollPosition = useRef(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPosition = window.scrollY;
      const isScrollingDown = currentScrollPosition > lastScrollPosition.current;
      
      // Mostrar/esconder cabeçalho baseado na direção do scroll
      if (currentScrollPosition > 50) {
        setIsHeaderVisible(!isScrollingDown);
      } else {
        setIsHeaderVisible(true);
      }
      
      lastScrollPosition.current = currentScrollPosition;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabaseApi.criarUsuario({
        nome: formData.nome,
        senha: formData.senha,
        idade: Number(formData.idade),
        peso: Number(formData.peso),
        altura: Number(formData.altura),
        sexo: formData.sexo as 'masculino' | 'feminino',
        nivel_atividade: formData.nivel_atividade,
        objetivo: formData.objetivo as 'perder' | 'manter' | 'ganhar',
        meta_calorica: parseInt(formData.meta_calorica),
        meta_proteina: parseInt(formData.meta_proteina),
        meta_treinos: parseInt(formData.meta_treinos || '5'),
        foto_url: formData.foto_url,
        // Adicionando propriedades obrigatórias faltantes
        peso_anterior: null,
        peso_inicial: Number(formData.peso),
        data_peso: format(new Date(), 'yyyy-MM-dd')
      });

      if (error) {
        setError('Erro ao criar usuário. Por favor, tente novamente.');
        console.error('Erro ao criar usuário:', error);
        return;
      }

      if (data) {
        console.log('Usuário criado com sucesso:', data);
        
        // Usar a função aprimorada para armazenar dados do usuário com sessão
        await setCurrentUser({
          id: data.id!,
          nome: data.nome
        }, formData.senha);
        
        onSuccess();
      }
    } catch (err) {
      setError('Ocorreu um erro ao processar sua solicitação.');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  // Função para lidar com o upload de imagem
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      // Verificar se o arquivo é uma imagem
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione um arquivo de imagem válido.');
        return;
      }

      // Verificar tamanho do arquivo (limite de 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 2MB.');
        return;
      }

      // Converter para base64 para armazenar temporariamente
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const base64 = e.target.result.toString();
          setFormData(prev => ({ ...prev, foto_url: base64 }));
        }
      };
      reader.readAsDataURL(file);
      
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      setError('Erro ao processar imagem. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Cabeçalho */}
      <div 
        className={`fixed top-0 left-0 right-0 z-10 bg-[#1A1A1A]/80 backdrop-blur-md border-b border-[#333333] transition-transform duration-300 ${
          isHeaderVisible ? 'transform-none' : 'transform -translate-y-full'
        }`}
      >
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={onSuccess} 
            className="p-2 rounded-lg bg-[#18181880] text-[#B0B0B0] hover:bg-[#2A2A2A] hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-center text-white">
            Cadastro
          </h1>
          <div className="w-8"></div> {/* Espaçador para centralizar o título */}
        </div>
      </div>

      <div className="flex-1 pt-16 pb-6 px-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-5 max-w-md mx-auto"
        >
          {/* Elementos decorativos */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[10%] right-[10%] w-64 h-64 rounded-full bg-[#1E1E1E] opacity-20 blur-[80px]" />
            <div className="absolute bottom-[15%] left-[5%] w-72 h-72 rounded-full bg-[#00E676] opacity-5 blur-[100px]" />
          </div>

          {/* Logo e título */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-4 mt-2"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              minimalist<span className="text-[#00E676]">.</span>fit
            </h2>
            <p className="text-[#B0B0B0] text-sm">
              Preencha seus dados para começar
            </p>
          </motion.div>

          {/* Foto de perfil */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex justify-center mb-2"
          >
            <div 
              className="relative rounded-full overflow-hidden border-2 border-[#33333380] bg-[#18181880] flex items-center justify-center shadow-md cursor-pointer" 
              style={{ width: 100, height: 100 }}
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.foto_url ? (
                <img 
                  src={formData.foto_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-1/2 h-1/2 text-[#808080]" />
              )}
              
              <div className="absolute inset-0 w-full h-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-white text-sm font-medium">
                {uploading ? 'Enviando...' : (
                  <div className="flex flex-col items-center">
                    <Upload size={20} className="mb-1" />
                    <span>Foto</span>
                  </div>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="mb-2"
            >
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[#FF525220] border border-[#FF525240]">
                <AlertCircle className="w-5 h-5 text-[#FF5252] shrink-0 mt-0.5" />
                <p className="text-[#FF9999] text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
            {/* Card de Dados Pessoais */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-[#1b1b1b80] backdrop-blur-md rounded-2xl p-6 shadow-xl relative overflow-hidden border border-[#2a2a2a]"
            >
              {/* Borda gradiente */}
              <div className="absolute inset-0 rounded-2xl p-[1px] -m-[1px] z-0 bg-gradient-to-br from-[#33333320] via-[#2a2a2a00] to-[#00E67620]" />
              
              <div className="relative z-10">
                <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#00E676]" />
                  <span>Dados Pessoais</span>
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm text-[#E0E0E0] mb-1.5 block font-medium">Nome</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-5 h-5 text-[#B0B0B0]" />
                      </div>
                      <input
                        type="text"
                        name="nome"
                        value={formData.nome}
                        onChange={handleInputChange}
                        className="w-full pl-10 py-3 rounded-lg border bg-[#18181880] border-[#33333380] text-white placeholder-[#808080] focus:ring-2 focus:ring-[#00E676] focus:border-transparent outline-none transition-all"
                        required
                        placeholder="Digite seu nome"
                      />
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-sm text-[#E0E0E0] mb-1.5 block font-medium">Senha</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-[#B0B0B0]" />
                      </div>
                      <input
                        type="password"
                        name="senha"
                        value={formData.senha}
                        onChange={handleInputChange}
                        className="w-full pl-10 py-3 rounded-lg border bg-[#18181880] border-[#33333380] text-white placeholder-[#808080] focus:ring-2 focus:ring-[#00E676] focus:border-transparent outline-none transition-all"
                        required
                        placeholder="Digite sua senha"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#E0E0E0] mb-1.5 block font-medium">Idade</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="idade"
                        value={formData.idade}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border bg-[#18181880] border-[#33333380] text-white placeholder-[#808080] focus:ring-2 focus:ring-[#00E676] focus:border-transparent outline-none transition-all"
                        required
                        placeholder="Idade"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#E0E0E0] mb-1.5 block font-medium">Sexo</label>
                    <div className="relative">
                      <select
                        name="sexo"
                        value={formData.sexo}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border bg-[#18181880] border-[#33333380] text-white placeholder-[#808080] focus:ring-2 focus:ring-[#00E676] focus:border-transparent outline-none transition-all appearance-none"
                        required
                      >
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Heart className="w-4 h-4 text-[#B0B0B0]" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#E0E0E0] mb-1.5 block font-medium">Peso (kg)</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="peso"
                        value={formData.peso}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border bg-[#18181880] border-[#33333380] text-white placeholder-[#808080] focus:ring-2 focus:ring-[#00E676] focus:border-transparent outline-none transition-all"
                        required
                        placeholder="Peso em kg"
                        step="0.1"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Weight className="w-4 h-4 text-[#B0B0B0]" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#E0E0E0] mb-1.5 block font-medium">Altura (cm)</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="altura"
                        value={formData.altura}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border bg-[#18181880] border-[#33333380] text-white placeholder-[#808080] focus:ring-2 focus:ring-[#00E676] focus:border-transparent outline-none transition-all"
                        required
                        placeholder="Altura em cm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Ruler className="w-4 h-4 text-[#B0B0B0]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card de Metas */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-[#1b1b1b80] backdrop-blur-md rounded-2xl p-6 shadow-xl relative overflow-hidden border border-[#2a2a2a]"
            >
              {/* Borda gradiente */}
              <div className="absolute inset-0 rounded-2xl p-[1px] -m-[1px] z-0 bg-gradient-to-br from-[#33333320] via-[#2a2a2a00] to-[#00E67620]" />
              
              <div className="relative z-10">
                <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#00E676]" />
                  <span>Metas e Preferências</span>
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#E0E0E0] mb-1.5 block font-medium">Nível de Atividade</label>
                    <div className="relative">
                      <select
                        name="nivel_atividade"
                        value={formData.nivel_atividade}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border bg-[#18181880] border-[#33333380] text-white placeholder-[#808080] focus:ring-2 focus:ring-[#00E676] focus:border-transparent outline-none transition-all appearance-none"
                        required
                      >
                        <option value="sedentario">Sedentário</option>
                        <option value="leve">Levemente ativo</option>
                        <option value="moderado">Moderadamente ativo</option>
                        <option value="intenso">Intenso</option>
                        <option value="muito_intenso">Muito ativo</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Activity className="w-4 h-4 text-[#B0B0B0]" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#E0E0E0] mb-1.5 block font-medium">Objetivo</label>
                    <div className="relative">
                      <select
                        name="objetivo"
                        value={formData.objetivo}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border bg-[#18181880] border-[#33333380] text-white placeholder-[#808080] focus:ring-2 focus:ring-[#00E676] focus:border-transparent outline-none transition-all appearance-none"
                        required
                      >
                        <option value="perder">Perder peso</option>
                        <option value="manter">Manter peso</option>
                        <option value="ganhar">Ganhar peso</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Target className="w-4 h-4 text-[#B0B0B0]" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#E0E0E0] mb-1.5 block font-medium">Meta Calórica (kcal)</label>
                    <input
                      type="number"
                      name="meta_calorica"
                      value={formData.meta_calorica}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border bg-[#18181880] border-[#33333380] text-white placeholder-[#808080] focus:ring-2 focus:ring-[#00E676] focus:border-transparent outline-none transition-all"
                      required
                      placeholder="Meta diária"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#E0E0E0] mb-1.5 block font-medium">Meta Proteína (g)</label>
                    <input
                      type="number"
                      name="meta_proteina"
                      value={formData.meta_proteina}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border bg-[#18181880] border-[#33333380] text-white placeholder-[#808080] focus:ring-2 focus:ring-[#00E676] focus:border-transparent outline-none transition-all"
                      required
                      placeholder="Meta diária"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#E0E0E0] mb-1.5 block font-medium">Meta Treinos (semana)</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="meta_treinos"
                        value={formData.meta_treinos}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border bg-[#18181880] border-[#33333380] text-white placeholder-[#808080] focus:ring-2 focus:ring-[#00E676] focus:border-transparent outline-none transition-all"
                        required
                        placeholder="Treinos por semana"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Dumbbell className="w-4 h-4 text-[#B0B0B0]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Botões de ação */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="mt-2"
            >
              <button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-[#1A1A1A] to-[#00E676] text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" message="" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Salvar e Continuar</span>
                  </>
                )}
              </button>
            </motion.div>
            
            {/* Versão */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-center mt-6 mb-2"
            >
              <p className="text-[#808080] text-xs">
                v1.0.0 • Desenvolvido por Evandro Casanova
              </p>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}