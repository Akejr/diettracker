import React, { useState, useEffect, useRef } from 'react';
import { supabaseApi, type Usuario } from '../lib/supabase';
import { FiCalendar } from 'react-icons/fi';
import { clearCurrentUser } from '../lib/userUtils';
import { 
  AlertCircle,
  Save,
  Edit2,
  LogOut,
  User,
  Heart,
  Ruler,
  Target,
  Scale,
  Calculator as CalcIcon,
  Info as InfoIcon,
  Upload
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import LoadingSpinner from './LoadingSpinner';
import { motion } from 'framer-motion';

// Estendendo o tipo Usuario para incluir campos adicionais necessários na interface
interface ExtendedUsuario extends Usuario {
  email?: string;
  phone?: string;
  created_at?: string;
}

// Funções auxiliares para formatação
const formatters = {
  // Formata números com separador de milhares e decimais
  formatNumber: (value: string, allowDecimals: boolean = false): string => {
    if (!value) return '';

    // Remove tudo exceto números e ponto
    let cleanValue = value.replace(/[^\d.]/g, '');

    // Garante apenas um ponto decimal
    if (allowDecimals) {
      const parts = cleanValue.split('.');
      cleanValue = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
    } else {
      cleanValue = cleanValue.split('.')[0];
    }

    // Adiciona separador de milhares
    const parts = cleanValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '');
    
    return parts.join('.');
  },

  // Remove formatação para obter apenas números
  unformat: (value: string): string => {
    return value.replace(/[^\d.]/g, '');
  },

  // Limita o valor a um máximo
  limitValue: (value: string, max: number): string => {
    const num = parseInt(value);
    if (num > max) return max.toString();
    return value;
  }
};

// Interface para configuração dos campos
interface FieldConfig {
  formatter: (value: string) => string;
  validator?: (value: string) => boolean;
  maxValue?: number;
  allowDecimals?: boolean;
}

// Configurações específicas para cada campo
const fieldConfigs: Record<string, FieldConfig> = {
  idade: {
    formatter: (value: string) => formatters.limitValue(formatters.formatNumber(value), 150),
    validator: (value: string) => parseInt(value) > 0 && parseInt(value) <= 150,
    maxValue: 150
  },
  peso: {
    formatter: (value: string) => formatters.formatNumber(value, true),
    validator: (value: string) => parseFloat(value) > 0 && parseFloat(value) <= 300,
    allowDecimals: true
  },
  altura: {
    formatter: (value: string) => formatters.limitValue(formatters.formatNumber(value), 300),
    validator: (value: string) => parseInt(value) > 0 && parseInt(value) <= 300,
    maxValue: 300
  },
  meta_calorica: {
    formatter: (value: string) => formatters.limitValue(formatters.formatNumber(value), 10000),
    validator: (value: string) => parseInt(value) > 0 && parseInt(value) <= 10000,
    maxValue: 10000
  },
  meta_proteina: {
    formatter: (value: string) => formatters.limitValue(formatters.formatNumber(value), 500),
    validator: (value: string) => parseInt(value) > 0 && parseInt(value) <= 500,
    maxValue: 500
  },
  meta_treinos: {
    formatter: (value: string) => formatters.formatNumber(value),
    validator: (value: string) => parseInt(value) >= 0,
    maxValue: 99
  }
};

// Interface para o formulário que aceita strings durante a digitação
interface FormData {
  id: string;
  nome: string;
  idade: string;
  peso: string;
  altura: string;
  sexo: string;
  nivel_atividade: string;
  objetivo: string;
  meta_calorica: string;
  meta_proteina: string;
  meta_treinos: string;
  foto_url: string;
}

interface ProfileProps {
  onLogout?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onLogout }) => {
  const [profile, setProfile] = useState<ExtendedUsuario | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    id: '',
    nome: '',
    idade: '',
    peso: '',
    altura: '',
    sexo: 'masculino',
    nivel_atividade: 'moderado',
    objetivo: 'perder',
    meta_calorica: '',
    meta_proteina: '',
    meta_treinos: '',
    foto_url: ''
  });

  // Função para validar um campo específico
  const validateField = (name: string, value: string): string => {
    const config = fieldConfigs[name];
    if (!config) return '';

    const unformattedValue = formatters.unformat(value);
    
    if (!unformattedValue) {
      return 'Campo obrigatório';
    }

    if (config.validator && !config.validator(unformattedValue)) {
      return `Valor inválido para ${name}`;
    }

    return '';
  };

  // Função melhorada para lidar com mudanças nos inputs
  const handleInputChange = (name: string, value: string): void => {
    if (Object.keys(fieldConfigs).includes(name)) {
      // Para campos numéricos, aplica formatação
      const config = fieldConfigs[name];
      let formattedValue = value;
      
      // Se o campo tiver uma função de formatação, aplica-a
      if (config.formatter) {
        formattedValue = config.formatter(value);
      }
      
      // Atualiza o estado do formulário
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));

      // Valida o campo após a formatação
      validateField(name, formattedValue);
    } else {
      // Para campos não numéricos, mantém o comportamento original
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Função para preparar dados para envio
  const prepareDataForSubmission = () => {
    const preparedData: Record<string, any> = {};
    
    Object.entries(formData).forEach(([key, value]) => {
      if (fieldConfigs[key]) {
        // Remove formatação e converte para número
        const numericValue = parseFloat(formatters.unformat(value));
        preparedData[key] = isNaN(numericValue) ? 0 : numericValue;
      } else {
        preparedData[key] = value;
      }
    });

    return preparedData;
  };

  // Função para formatar data
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Data não disponível';
    
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: pt });
    } catch (e) {
      return 'Data inválida';
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabaseApi.supabase
          .from('usuarios')
          .select('*')
          .limit(1)
          .single();

        if (error) {
          setError('Erro ao carregar perfil: ' + error.message);
          console.error('Erro ao carregar do Supabase:', error);
          return;
        }

        if (data) {
          setProfile(data);
          setFormData({
            id: data.id || '',
            nome: data.nome || '',
            idade: String(data.idade || ''),
            peso: String(data.peso || ''),
            altura: String(data.altura || ''),
            sexo: data.sexo || 'masculino',
            nivel_atividade: data.nivel_atividade || 'moderado',
            objetivo: data.objetivo || 'perder',
            meta_calorica: String(data.meta_calorica || ''),
            meta_proteina: String(data.meta_proteina || ''),
            meta_treinos: String(data.meta_treinos || ''),
            foto_url: data.foto_url || ''
          });
        }
      } catch (error) {
        setError('Erro ao carregar perfil');
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valida todos os campos antes de enviar
    const errors: Record<string, string> = {};
    Object.keys(fieldConfigs).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName as keyof FormData]);
      if (error) errors[fieldName] = error;
    });

    if (Object.keys(errors).length > 0) {
      alert('Por favor, corrija os erros antes de salvar.');
      return;
    }

    try {
      const preparedData = prepareDataForSubmission();
      const userData: Omit<ExtendedUsuario, 'id' | 'created_at' | 'updated_at'> = {
        nome: preparedData.nome,
        idade: preparedData.idade,
        peso: preparedData.peso,
        altura: preparedData.altura,
        sexo: preparedData.sexo as 'masculino' | 'feminino',
        nivel_atividade: preparedData.nivel_atividade,
        objetivo: preparedData.objetivo as 'perder' | 'manter' | 'ganhar',
        meta_calorica: preparedData.meta_calorica,
        meta_proteina: preparedData.meta_proteina,
        meta_treinos: preparedData.meta_treinos,
        foto_url: preparedData.foto_url,
        peso_anterior: preparedData.peso_anterior || preparedData.peso,
        peso_inicial: preparedData.peso_inicial || preparedData.peso,
        data_peso: preparedData.data_peso || new Date().toISOString()
      };

      let result;
      if (profile?.id) {
        result = await supabaseApi.atualizarUsuario(profile.id, userData);
      } else {
        result = await supabaseApi.criarUsuario(userData);
      }

      if (result.error) {
        throw result.error;
      }

      setProfile(result.data);
      setIsEditing(false);
      alert('Perfil salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar as alterações. Por favor, tente novamente.');
    }
  };

  // Função para realizar logout
  const handleLogout = async () => {
    try {
      // Limpar dados do usuário no localStorage
      clearCurrentUser();
      
      // Chamar a função de logout passada como prop, se existir
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
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

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Carregando seu perfil..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black min-h-screen flex flex-col">
        {/* Header fixo */}
        <header className="py-4 px-4 flex items-center justify-between">
          <h1 className="text-xl font-medium text-white">Perfil</h1>
        </header>
        
        {/* Conteúdo com mensagem de erro centralizada */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6 bg-[#1b1b1b80] rounded-xl max-w-md">
            <div className="text-red-500 mb-4 flex justify-center">
              <AlertCircle size={48} />
            </div>
            <h2 className="text-white text-xl font-medium mb-2">Erro ao carregar perfil</h2>
            <p className="text-[#B0B0B0] mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-[#3D5AFE] text-white px-4 py-2 rounded-lg hover:bg-[#5677FF] transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-white mb-2">Perfil</h1>
        <p className="text-[#B0B0B0]">Gerencie suas informações</p>
      </div>
      
      {/* Perfil usuário */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="bg-[#1b1b1b80] rounded-xl p-5 shadow-xl relative overflow-hidden backdrop-blur-sm border border-[#2a2a2a]">
          {/* Decorative gradient */}
          <div 
            className="absolute top-0 right-0 w-full h-full opacity-5 z-0 pointer-events-none"
            style={{ 
              background: 'linear-gradient(135deg, rgba(61, 90, 254, 0.2), rgba(0, 230, 118, 0.2))',
            }}
          />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div 
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg overflow-hidden ${isEditing ? 'cursor-pointer' : ''}`}
                  onClick={isEditing ? () => fileInputRef.current?.click() : undefined}
                >
                  {formData.foto_url ? (
                    <img 
                      src={formData.foto_url} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#3D5AFE] to-[#00E676] flex items-center justify-center">
                      {profile?.nome ? profile.nome.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className="absolute inset-0 w-full h-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-white text-sm font-medium">
                      {uploading ? 'Enviando...' : (
                        <div className="flex flex-col items-center">
                          <Upload size={16} className="mb-1" />
                          <span className="text-xs">Foto</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading || !isEditing}
                  className="hidden"
                />
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-white">{profile?.nome || 'Usuário'}</h2>
                  <p className="text-[#B0B0B0]">{profile?.email || 'Sem email'}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#22222280] rounded-lg">
                <div className="flex items-center">
                  <div className="bg-indigo-500/20 text-indigo-400 p-2 rounded-lg mr-3">
                    <FiCalendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[#B0B0B0] text-sm">Membro desde</p>
                    <p className="text-white">{formatDate(profile?.created_at || '')}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-[#22222280] rounded-lg">
                <div className="flex items-center">
                  <div className="bg-green-500/20 text-green-400 p-2 rounded-lg mr-3">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[#B0B0B0] text-sm">Telefone</p>
                    <p className="text-white">{profile?.phone || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Informações físicas */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6"
      >
        <div className="bg-[#1b1b1b80] rounded-xl p-5 shadow-xl relative overflow-hidden backdrop-blur-sm border border-[#2a2a2a]">
          {/* Decorative gradient */}
          <div 
            className="absolute top-0 right-0 w-full h-full opacity-5 z-0 pointer-events-none"
            style={{ 
              background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.2), rgba(61, 90, 254, 0.2))',
            }}
          />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Informações Físicas</h2>
              <button 
                onClick={() => setIsEditing(true)} 
                className={`p-2 rounded-lg transition-colors ${isEditing ? 'bg-[#3D5AFE] text-white' : 'bg-[#22222280] text-indigo-400 hover:bg-[#2A2A2A]'}`}
              >
                {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#22222280] rounded-lg">
                <div className="flex items-center mb-1">
                  <Scale className="w-4 h-4 text-indigo-400 mr-2" />
                  <p className="text-[#E0E0E0] text-sm">Peso</p>
                </div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.peso} 
                    onChange={(e) => handleInputChange('peso', e.target.value)}
                    className="w-full bg-[#2A2A2A] text-white border border-[#333333] rounded-lg px-3 py-2 mt-1 text-sm focus:ring-2 focus:ring-[#3D5AFE] focus:ring-opacity-50 focus:border-transparent outline-none transition-all"
                  />
                ) : (
                  <p className="text-lg font-semibold text-white">{profile?.peso || 'N/A'} kg</p>
                )}
              </div>
              
              <div className="p-3 bg-[#22222280] rounded-lg">
                <div className="flex items-center mb-1">
                  <Ruler className="w-4 h-4 text-blue-400 mr-2" />
                  <p className="text-[#E0E0E0] text-sm">Altura</p>
                </div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.altura} 
                    onChange={(e) => handleInputChange('altura', e.target.value)}
                    className="w-full bg-[#2A2A2A] text-white border border-[#333333] rounded-lg px-3 py-2 mt-1 text-sm focus:ring-2 focus:ring-[#3D5AFE] focus:ring-opacity-50 focus:border-transparent outline-none transition-all"
                  />
                ) : (
                  <p className="text-lg font-semibold text-white">{profile?.altura || 'N/A'} cm</p>
                )}
              </div>
              
              <div className="p-3 bg-[#22222280] rounded-lg">
                <div className="flex items-center mb-1">
                  <Heart className="w-4 h-4 text-red-400 mr-2" />
                  <p className="text-[#E0E0E0] text-sm">Idade</p>
                </div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.idade} 
                    onChange={(e) => handleInputChange('idade', e.target.value)}
                    className="w-full bg-[#2A2A2A] text-white border border-[#333333] rounded-lg px-3 py-2 mt-1 text-sm focus:ring-2 focus:ring-[#3D5AFE] focus:ring-opacity-50 focus:border-transparent outline-none transition-all"
                  />
                ) : (
                  <p className="text-lg font-semibold text-white">{profile?.idade || 'N/A'} anos</p>
                )}
              </div>
              
              <div className="p-3 bg-[#22222280] rounded-lg">
                <div className="flex items-center mb-1">
                  <Heart className="w-4 h-4 text-purple-400 mr-2" />
                  <p className="text-[#E0E0E0] text-sm">Sexo</p>
                </div>
                {isEditing ? (
                  <select 
                    value={formData.sexo} 
                    onChange={(e) => setFormData({...formData, sexo: e.target.value})}
                    className="w-full bg-[#2A2A2A] text-white border border-[#333333] rounded-lg px-3 py-2 mt-1 text-sm focus:ring-2 focus:ring-[#3D5AFE] focus:ring-opacity-50 focus:border-transparent outline-none transition-all"
                  >
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                  </select>
                ) : (
                  <p className="text-lg font-semibold text-white capitalize">{profile?.sexo || 'N/A'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Metas */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-6"
      >
        <div className="bg-[#1b1b1b80] rounded-xl p-5 shadow-xl relative overflow-hidden backdrop-blur-sm border border-[#2a2a2a]">
          {/* Decorative gradient */}
          <div 
            className="absolute top-0 right-0 w-full h-full opacity-5 z-0 pointer-events-none"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(61, 90, 254, 0.2))',
            }}
          />
          
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <Target className="w-5 h-5 text-amber-400 mr-2" />
              <h2 className="text-lg font-semibold text-white">Metas</h2>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-[#22222280] rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CalcIcon className="w-4 h-4 text-amber-400 mr-2" />
                    <p className="text-[#E0E0E0] text-sm">Meta Calórica</p>
                  </div>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={formData.meta_calorica} 
                      onChange={(e) => handleInputChange('meta_calorica', e.target.value)}
                      className="w-28 bg-[#2A2A2A] text-white border border-[#333333] rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-[#3D5AFE] focus:ring-opacity-50 focus:border-transparent outline-none transition-all"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-white">{profile?.meta_calorica || 'N/A'} kcal</p>
                  )}
                </div>
              </div>
              
              <div className="p-3 bg-[#22222280] rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                      <path d="M6.5 3C3.87 3 2 6 2 6L8 14C8 14 8 11 10.5 9.5M14.5 21H21V18C21 16 19.42 14 17.24 14C16.84 14 16.45 14.05 16.08 14.15M8.53473 8.90001C7.42459 8.90001 6.52423 9.80001 6.52423 10.9C6.52423 12 7.42459 12.9 8.52459 12.9C9.62459 12.9 10.5251 12.9 10.5251 10.9C10.5352 9.80001 9.63473 8.90001 8.53473 8.90001ZM16.5352 18C16.5352 19.66 15.1634 21 13.5149 21C11.8634 21 10.4946 19.66 10.4946 18C10.4946 16.34 11.8663 15 13.5149 15C15.1634 15 16.5352 16.34 16.5352 18Z" stroke="#3D5AFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p className="text-[#E0E0E0] text-sm">Meta Proteína</p>
                  </div>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={formData.meta_proteina} 
                      onChange={(e) => handleInputChange('meta_proteina', e.target.value)}
                      className="w-28 bg-[#2A2A2A] text-white border border-[#333333] rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-[#3D5AFE] focus:ring-opacity-50 focus:border-transparent outline-none transition-all"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-white">{profile?.meta_proteina || 'N/A'} g</p>
                  )}
                </div>
              </div>
              
              <div className="p-3 bg-[#22222280] rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                      <path d="M4 20H8M8 20V16M8 20H12M12 20H16M16 20H20M20 14V20M20 9V4M4 14V20M20 4H15M20 4L15 9M4 4H9M4 4L9 9M12 7V13" stroke="#00E676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p className="text-[#E0E0E0] text-sm">Meta Treinos</p>
                  </div>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={formData.meta_treinos} 
                      onChange={(e) => handleInputChange('meta_treinos', e.target.value)}
                      className="w-28 bg-[#2A2A2A] text-white border border-[#333333] rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-[#3D5AFE] focus:ring-opacity-50 focus:border-transparent outline-none transition-all"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-white">{profile?.meta_treinos || 'N/A'} por semana</p>
                  )}
                </div>
              </div>
              
              <div className="p-3 bg-[#22222280] rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <InfoIcon className="w-4 h-4 text-cyan-400 mr-2" />
                    <p className="text-[#E0E0E0] text-sm">Objetivo</p>
                  </div>
                  {isEditing ? (
                    <select 
                      value={formData.objetivo} 
                      onChange={(e) => setFormData({...formData, objetivo: e.target.value})}
                      className="w-28 bg-[#2A2A2A] text-white border border-[#333333] rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-[#3D5AFE] focus:ring-opacity-50 focus:border-transparent outline-none transition-all"
                    >
                      <option value="perder">Perder</option>
                      <option value="manter">Manter</option>
                      <option value="ganhar">Ganhar</option>
                    </select>
                  ) : (
                    <p className="text-lg font-semibold text-white capitalize">{profile?.objetivo || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>
            
            {isEditing && (
              <div className="mt-4 flex justify-end gap-2">
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-lg text-sm hover:bg-[#333333] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSubmit} 
                  className="px-4 py-2 bg-gradient-to-r from-[#3D5AFE] to-[#4E6AFF] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Salvar
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Botão de Logout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <button 
          onClick={handleLogout} 
          className="w-full py-3 bg-[#1b1b1b80] hover:bg-[#1b1b1b] text-[#E0E0E0] rounded-xl transition-colors flex items-center justify-center gap-2 backdrop-blur-sm border border-[#2a2a2a]"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair da conta</span>
        </button>
      </motion.div>
    </>
  );
};

export default Profile;