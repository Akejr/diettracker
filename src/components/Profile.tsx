import React, { useState, useEffect, useCallback } from 'react';
import { User2, Scale, Ruler, Calendar, Target, Dumbbell, ChevronRight, Edit2, Flame, Apple, Activity } from 'lucide-react';
import { supabaseApi, type Usuario } from '../lib/supabase';

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
  nome: string;
  idade: string;
  peso: string;
  altura: string;
  sexo: 'masculino' | 'feminino';
  nivel_atividade: string;
  objetivo: 'perder' | 'manter' | 'ganhar';
  meta_calorica: string;
  meta_proteina: string;
  meta_treinos: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<Usuario | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    idade: '',
    peso: '',
    altura: '',
    sexo: 'masculino',
    nivel_atividade: 'moderado',
    objetivo: 'perder',
    meta_calorica: '',
    meta_proteina: '',
    meta_treinos: ''
  });

  // Estado para controlar erros de validação
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Função para validar um campo específico
  const validateField = useCallback((name: string, value: string): string => {
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
  }, []);

  // Função melhorada para lidar com mudanças nos inputs
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Se for um campo com configuração especial
    if (fieldConfigs[name]) {
      const config = fieldConfigs[name];
      const formattedValue = config.formatter(value);
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));

      // Valida o campo após a formatação
      const error = validateField(name, formattedValue);
      setFieldErrors(prev => ({
        ...prev,
        [name]: error
      }));
    } else {
      // Para campos não numéricos, mantém o comportamento original
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }, [validateField]);

  // Função para preparar dados para envio
  const prepareDataForSubmission = useCallback(() => {
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
  }, [formData]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data, error } = await supabaseApi.supabase
          .from('usuarios')
          .select('*')
          .limit(1)
          .single();

        if (error) {
          console.error('Erro ao carregar do Supabase:', error);
          return;
        }

        if (data) {
          setProfile(data);
          setFormData({
            nome: data.nome || '',
            idade: String(data.idade || ''),
            peso: String(data.peso || ''),
            altura: String(data.altura || ''),
            sexo: data.sexo || 'masculino',
            nivel_atividade: data.nivel_atividade || 'moderado',
            objetivo: data.objetivo || 'perder',
            meta_calorica: String(data.meta_calorica || ''),
            meta_proteina: String(data.meta_proteina || ''),
            meta_treinos: String(data.meta_treinos || '')
          });
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
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
      setFieldErrors(errors);
      alert('Por favor, corrija os erros antes de salvar.');
      return;
    }

    try {
      const preparedData = prepareDataForSubmission();
      const userData: Omit<Usuario, 'id' | 'created_at' | 'updated_at'> = {
        nome: preparedData.nome,
        idade: preparedData.idade,
        peso: preparedData.peso,
        altura: preparedData.altura,
        sexo: preparedData.sexo as 'masculino' | 'feminino',
        nivel_atividade: preparedData.nivel_atividade,
        objetivo: preparedData.objetivo as 'perder' | 'manter' | 'ganhar',
        meta_calorica: preparedData.meta_calorica,
        meta_proteina: preparedData.meta_proteina,
        meta_treinos: preparedData.meta_treinos
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

  const ProfileForm = () => (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="bg-white rounded-xl p-4 border border-[#70707033]">
        <h2 className="text-lg font-semibold text-[#343030] mb-4">Dados Pessoais</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm text-[#343030] mb-1.5 block">Nome</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030]"
              required
            />
          </div>
          <div>
            <label className="text-sm text-[#343030] mb-1.5 block">Idade</label>
            <input
              type="text"
              inputMode="numeric"
              name="idade"
              value={formData.idade}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 rounded-lg border ${
                fieldErrors.idade ? 'border-red-500' : 'border-[#70707033]'
              } text-[#343030]`}
              required
            />
            {fieldErrors.idade && (
              <span className="text-xs text-red-500 mt-1">{fieldErrors.idade}</span>
            )}
          </div>
          <div>
            <label className="text-sm text-[#343030] mb-1.5 block">Peso (kg)</label>
            <input
              type="text"
              inputMode="decimal"
              name="peso"
              value={formData.peso}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030]"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="text-sm text-[#343030] mb-1.5 block">Altura (cm)</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="altura"
              value={formData.altura}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030]"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="text-sm text-[#343030] mb-1.5 block">Sexo</label>
            <select
              name="sexo"
              value={formData.sexo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030]"
              required
            >
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-sm text-[#343030] mb-1.5 block">Nível de Atividade</label>
            <select
              name="nivel_atividade"
              value={formData.nivel_atividade}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030]"
              required
            >
              <option value="sedentario">Sedentário</option>
              <option value="leve">Leve</option>
              <option value="moderado">Moderado</option>
              <option value="intenso">Intenso</option>
              <option value="muito_intenso">Muito Intenso</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-sm text-[#343030] mb-1.5 block">Objetivo</label>
            <select
              name="objetivo"
              value={formData.objetivo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030]"
              required
            >
              <option value="perder">Perder Peso</option>
              <option value="manter">Manter Peso</option>
              <option value="ganhar">Ganhar Peso</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-[#70707033]">
        <h2 className="text-lg font-semibold text-[#343030] mb-4">Metas Diárias</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm text-[#343030] mb-1.5 block">Meta de Calorias (kcal)</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="meta_calorica"
              value={formData.meta_calorica}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030]"
              required
            />
          </div>
          <div>
            <label className="text-sm text-[#343030] mb-1.5 block">Meta de Proteína (g)</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="meta_proteina"
              value={formData.meta_proteina}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030]"
              required
            />
          </div>
          <div>
            <label className="text-sm text-[#343030] mb-1.5 block">Treinos Semanais</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="meta_treinos"
              value={formData.meta_treinos}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030]"
              required
            />
          </div>
        </div>
      </div>

      <button 
        type="submit"
        className="w-full bg-[#343030] text-white py-3 rounded-lg mt-2 text-sm font-semibold active:bg-[#282828] transition-colors"
      >
        {isEditing ? 'Salvar Alterações' : 'Criar Perfil'}
      </button>
    </form>
  );

  const ProfileView = () => (
    <div className="flex flex-col gap-4">
      {/* Header com foto de perfil */}
      <div className="bg-white rounded-xl p-6 border border-[#70707033] text-center">
        <div className="w-24 h-24 bg-[#F9FAFB] rounded-full mx-auto mb-4 flex items-center justify-center">
          <User2 className="w-12 h-12 text-[#343030]" />
        </div>
        <h2 className="text-2xl font-bold text-[#343030] mb-1">{profile?.nome}</h2>
        <p className="text-sm text-[#B3B3B6]">Membro desde {new Date(profile?.created_at || '').toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Card de Dados Pessoais */}
      <div className="bg-white rounded-xl p-4 border border-[#70707033]">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <User2 className="w-5 h-5 text-[#343030]" />
            <h2 className="text-lg font-semibold text-[#343030]">Dados Pessoais</h2>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors"
          >
            <Edit2 className="w-5 h-5 text-[#343030]" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#343030]" />
              <span className="text-sm text-[#343030]">Idade</span>
            </div>
            <span className="text-sm font-medium text-[#343030]">{profile?.idade} anos</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#343030]" />
              <span className="text-sm text-[#343030]">Peso</span>
            </div>
            <span className="text-sm font-medium text-[#343030]">{profile?.peso} kg</span>
          </div>

          <div className="col-span-2 flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg">
            <div className="flex items-center gap-2">
              <Ruler className="w-5 h-5 text-[#343030]" />
              <span className="text-sm text-[#343030]">Altura</span>
            </div>
            <span className="text-sm font-medium text-[#343030]">{profile?.altura} cm</span>
          </div>

          <div className="col-span-2 flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg">
            <div className="flex items-center gap-2">
              <User2 className="w-5 h-5 text-[#343030]" />
              <span className="text-sm text-[#343030]">Sexo</span>
            </div>
            <span className="text-sm font-medium text-[#343030] capitalize">{profile?.sexo}</span>
          </div>

          <div className="col-span-2 flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#343030]" />
              <span className="text-sm text-[#343030]">Nível de Atividade</span>
            </div>
            <span className="text-sm font-medium text-[#343030] capitalize">{profile?.nivel_atividade}</span>
          </div>

          <div className="col-span-2 flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#343030]" />
              <span className="text-sm text-[#343030]">Objetivo</span>
            </div>
            <span className="text-sm font-medium text-[#343030] capitalize">{profile?.objetivo}</span>
          </div>
        </div>
      </div>

      {/* Card de Metas */}
      <div className="bg-white rounded-xl p-4 border border-[#70707033]">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#343030]" />
          <h2 className="text-lg font-semibold text-[#343030]">Metas Diárias</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#FF6F00]" />
              <span className="text-sm text-[#343030]">Calorias</span>
            </div>
            <span className="text-sm font-medium text-[#343030]">{profile?.meta_calorica} kcal</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg">
            <div className="flex items-center gap-2">
              <Apple className="w-5 h-5 text-[#3AFF00]" />
              <span className="text-sm text-[#343030]">Proteína</span>
            </div>
            <span className="text-sm font-medium text-[#343030]">{profile?.meta_proteina}g</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-[#E600FF]" />
              <span className="text-sm text-[#343030]">Treinos Semanais</span>
            </div>
            <span className="text-sm font-medium text-[#343030]">{profile?.meta_treinos}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      {isEditing ? <ProfileForm /> : <ProfileView />}
    </div>
  );
};

export default Profile; 