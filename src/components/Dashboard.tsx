import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { supabaseApi, supabase } from '../lib/supabase';
import { getCurrentUserId } from '../lib/userUtils';
import LoadingSpinner from './LoadingSpinner';
import {
  Plus,
  ChevronLeft, 
  ChevronRight,
  Share2,
  Calendar,
  Clock,
  Dumbbell,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Trash2,
  ListTodo,
  Flame,
  Dna,
  Scale,
  Utensils
} from 'lucide-react';
import ShareModal from './ShareModal';
import { dateService } from '../services/dateService';

interface Usuario {
  id: string;
  nome: string;
  peso: number;
  peso_atual?: number;
  diferenca_peso?: string;
  peso_anterior: number | null;
  peso_inicial: number;
  data_peso: string;
  meta_calorica: number;
  meta_proteina: number;
  meta_treinos: number;
  created_at?: string;
  updated_at?: string;
}

interface Treino {
  id: string;
  usuario_id: string;
  data: string;
  tipo: 'musculacao' | 'cardio';
  duracao: number;
  descricao: string;
  calorias: number;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<Usuario | null>(null);
  const [refeicoes, setRefeicoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showAddMealForm, setShowAddMealForm] = useState(false);
  const [newFood, setNewFood] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newCalories, setNewCalories] = useState('');
  const [newProtein, setNewProtein] = useState('');
  const [showAddWorkoutForm, setShowAddWorkoutForm] = useState(false);
  const [workoutType, setWorkoutType] = useState<'musculacao' | 'cardio'>('musculacao');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutCalories, setWorkoutCalories] = useState('');
  const [treinosDaSemana, setTreinosDaSemana] = useState<Treino[]>([]);
  const [totalTreinosSemana, setTotalTreinosSemana] = useState<number>(0);
  const [isUpdatingWeight, setIsUpdatingWeight] = useState(false);
  const [totais, setTotais] = useState({ totalCalorias: 0, totalProteina: 0 });

  useEffect(() => {
    const totalCalorias = refeicoes.reduce((acc, refeicao) => acc + Number(refeicao.calorias), 0);
    const totalProteina = refeicoes.reduce((acc, refeicao) => acc + Number(refeicao.proteina), 0);
    setTotais({ totalCalorias, totalProteina });
  }, [refeicoes]);

  useEffect(() => {
    // Sempre inicializar com a data atual quando o componente montar
    setSelectedDate(new Date());
    
    // Inscreve-se para receber atualizações da data
    const unsubscribe = dateService.subscribe(() => {
      setSelectedDate(new Date());
    });

    // Limpa a inscrição quando o componente é desmontado
    return () => unsubscribe();
  }, []);

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setNewWeight(value);
    }
  };

  // Função separada para carregar o perfil
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = await getCurrentUserId();
      
      if (!userId) {
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }
      
      // 1. Carregar perfil do usuário
      const { data: profileData, error: profileError } = await supabaseApi.obterPerfil(userId);
      
      if (profileError) {
        console.error('Erro ao carregar perfil:', profileError);
        setError('Erro ao carregar perfil');
        setLoading(false);
        return;
      }
      
      if (!profileData) {
        setError('Perfil não encontrado');
        setLoading(false);
        return;
      }
      
      // 2. Obter o último peso registrado usando a nova função
      const { data: ultimoRegistroPeso } = await supabaseApi.obterUltimoPesoRegistrado(userId);
      
      // 3. Atualizar o perfil com o último peso registrado
      if (ultimoRegistroPeso) {
        console.log('Atualizando perfil com o último peso:', ultimoRegistroPeso.peso);
        const pesoInicial = profileData.peso_inicial || profileData.peso;
        const diferenca = ultimoRegistroPeso.peso - pesoInicial;
        const diferencaFormatada = diferenca > 0 ? `+${diferenca.toFixed(1)}` : diferenca.toFixed(1);
        
        setProfile({
          ...profileData,
          id: profileData.id || userId,
          peso_atual: ultimoRegistroPeso.peso,
          data_peso: ultimoRegistroPeso.data,
          diferenca_peso: diferencaFormatada
        } as Usuario);
      } else {
        console.log('Nenhum registro de peso encontrado, usando peso do perfil');
        // Se não tiver registro de peso, usar o peso do perfil como atual
        setProfile({
          ...profileData,
          id: profileData.id || userId
        } as Usuario);
      }
      
      // 4. Carregar refeições do dia selecionado
      const { data: refeicoesDoDia } = await supabaseApi.listarRefeicoesDoDia(
        format(selectedDate, 'yyyy-MM-dd'),
        userId
      );
      setRefeicoes(refeicoesDoDia || []);
      
      // 5. Carregar treinos do dia selecionado
      const dataFormatada = format(selectedDate, 'yyyy-MM-dd');
      console.log('Carregando treinos para a data:', dataFormatada);
      const { data: treinosDoDia } = await supabaseApi.listarTreinosDoDia(dataFormatada, userId);
      setTreinosDaSemana(treinosDoDia || []);
      
      // 6. Carregar treinos da semana para estatísticas
      const { data: treinosDaSemana } = await supabaseApi.listarTreinosDaSemana(userId);
      setTotalTreinosSemana(treinosDaSemana?.length || 0);
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados');
      setLoading(false);
    }
  };

  // Carregar configurações e perfil apenas uma vez na montagem
  useEffect(() => {
    loadProfile();
  }, []); // Removido selectedDate da dependência para evitar recarregamentos

  // Carregar dados específicos quando a data mudar
  useEffect(() => {
    if (!profile) return; // Só carrega se já tiver o perfil
    
    const carregarDadosDaData = async () => {
      try {
        const dataFormatada = format(selectedDate, 'yyyy-MM-dd');
        const userId = getCurrentUserId();
        if (!userId) return;

        // Carregar refeições do dia selecionado
        const { data: refeicoesDoDia } = await supabaseApi.listarRefeicoesDoDia(dataFormatada);
        setRefeicoes(refeicoesDoDia || []);

        // Carregar treinos do dia selecionado
        const { data: treinosDoDia } = await supabaseApi.listarTreinosDoDia(dataFormatada, userId);
        setTreinosDaSemana(treinosDoDia || []);
      } catch (error) {
        console.error('Erro ao carregar dados da data:', error);
      }
    };

    carregarDadosDaData();
  }, [selectedDate, profile?.id]); // Só recarrega quando a data ou perfil mudam

  const handleAddRefeicao = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newFood || !newTime || !newCalories || !newProtein) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Usuário não autenticado');

      const dados = {
        usuario_id: userId,
        alimento: newFood,
        calorias: parseFloat(newCalories),
        proteina: parseFloat(newProtein),
        horario: newTime,
        data: format(selectedDate, 'yyyy-MM-dd')
      };

      // Adicionar refeição ao Supabase
      const novaRefeicao = await supabaseApi.adicionarRefeicao(dados);
      
      if (novaRefeicao) {
        // Limpar o formulário
        setNewFood('');
        setNewTime('');
        setNewCalories('');
        setNewProtein('');
        setShowAddMealForm(false);
        
        // Atualizar estados
        setRefeicoes(prev => [...prev, novaRefeicao]);
      }
    } catch (error) {
      console.error('Erro ao adicionar refeição:', error);
      alert('Erro ao adicionar refeição. Tente novamente.');
    }
  };

  // Deletar refeição
  const handleDeleteRefeicao = async (id: string) => {
    try {
      await supabaseApi.removerRefeicao(id);
      setRefeicoes(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Erro ao deletar refeição:', error);
      alert('Erro ao deletar refeição. Tente novamente.');
    }
  };

  // Adicionar novo treino
  const handleAddWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Usar a data selecionada diretamente
      const dataFormatada = format(selectedDate, 'yyyy-MM-dd');

      // Verificar se todos os campos necessários estão preenchidos
      if (workoutType && workoutDescription && workoutDuration && workoutCalories) {
        const treinoData = {
          usuario_id: getCurrentUserId() || '',
          descricao: workoutDescription,
          duracao: parseInt(workoutDuration),
          calorias: parseInt(workoutCalories),
          tipo: workoutType as 'musculacao' | 'cardio',
          data: dataFormatada
        };
        
        // Usar a API segura para adicionar treino
        const { data: treinoAdicionado } = await supabaseApi.adicionarTreino(treinoData);
        
        if (treinoAdicionado) {
          // Limpar o formulário
          setWorkoutType('musculacao');
          setWorkoutDuration('');
          setWorkoutDescription('');
          setWorkoutCalories('');
          setShowAddWorkoutForm(false);
          
          // Atualizar estados
          setTreinosDaSemana(prev => [treinoAdicionado, ...prev]);
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar treino:', error);
    }
  };

  const handleDeleteTreino = async (id: string) => {
    try {
      const treino = treinosDaSemana.find(t => t.id === id);
      if (!treino) return;

      // Remover treino usando a API mock
      // No modo demo, apenas remove do estado local
      setTreinosDaSemana(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Erro ao deletar treino:', error);
      alert('Erro ao deletar treino. Tente novamente.');
    }
  };

  const handleUpdateWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWeight || isNaN(Number(newWeight))) {
      alert('Por favor, insira um peso válido');
      return;
    }

    try {
      setIsUpdatingWeight(true);
      const pesoAtualizado = parseFloat(newWeight);
      const userId = getCurrentUserId();
      if (!userId) throw new Error('Usuário não autenticado');

      // Registrar o novo peso usando a API mock
      const dataAtual = format(new Date(), 'yyyy-MM-dd');
      await supabaseApi.registrarPeso({
        usuario_id: userId,
        peso: pesoAtualizado,
        data: dataAtual
      });

      // Atualizar a UI com o novo peso
      if (profile) {
        const pesoInicial = profile.peso_inicial || profile.peso;
        const diferenca = pesoAtualizado - pesoInicial;
        const diferencaFormatada = diferenca > 0 ? `+${diferenca.toFixed(1)}` : diferenca.toFixed(1);
        
        setProfile(prev => {
          if (!prev) return null;
          return {
            ...prev,
            peso_atual: pesoAtualizado,
            data_peso: dataAtual,
            diferenca_peso: diferencaFormatada
          } as Usuario;
        });
      }
      
      setNewWeight('');
      setShowWeightForm(false);
      
    } catch (error) {
      console.error('Erro ao atualizar peso:', error);
      alert('Erro ao atualizar peso. Tente novamente.');
    } finally {
      setIsUpdatingWeight(false);
    }
  };

  // Se o nome da data atual for igual ao nome da data selecionada
  const isToday = format(new Date(), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

  // Função para navegar entre datas
  const changeDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-[#131313] to-[#0A0A0A] min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Carregando seu dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-b from-[#131313] to-[#0A0A0A] min-h-screen flex flex-col">
        {/* Header fixo */}
        <header className="py-4 px-4 flex items-center justify-between">
          <h1 className="text-xl font-medium text-white">Dashboard</h1>
        </header>
        
        {/* Conteúdo com mensagem de erro centralizada */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6 bg-[#1b1b1b80] rounded-xl max-w-md">
            <div className="text-red-500 mb-4 flex justify-center">
              <AlertCircle size={48} />
            </div>
            <h2 className="text-white text-xl font-medium mb-2">Erro ao carregar dados</h2>
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

  if (!profile) {
    return (
      <div className="text-gray-300 mb-4">Nenhum perfil encontrado</div>
    );
  }

  const progressCalories = totais.totalCalorias > 0 
    ? Math.min(100, Math.round((totais.totalCalorias / profile.meta_calorica) * 100)) 
    : 0;
  
  const progressProtein = totais.totalProteina > 0 
    ? Math.min(100, Math.round((totais.totalProteina / profile.meta_proteina) * 100)) 
    : 0;

  return (
    <>
      {/* Cabeçalho e navegação de data */}
      <div className="mb-6 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4">
          <button 
            onClick={() => changeDate('prev')}
            className="p-2 rounded-full bg-[#1A1A1A] hover:bg-[#222222] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold">
              {isToday ? 'Hoje' : format(selectedDate, 'dd/MM/yyyy')}
            </h2>
            <p className="text-sm text-[#B0B0B0]">
              {format(selectedDate, 'EEEE', { locale: pt })}
            </p>
          </div>
          
          <button 
            onClick={() => changeDate('next')}
            className="p-2 rounded-full bg-[#1A1A1A] hover:bg-[#222222] transition-colors"
            disabled={isToday}
            style={{ opacity: isToday ? 0.5 : 1 }}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 py-2 px-4 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-sm font-medium shadow-lg"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartilhar Progresso</span>
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="flex flex-col gap-3 mb-5">
        {/* Card de Resumo */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <div className="stat-box bg-[#1b1b1b80] rounded-xl p-3 flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center">
              <ListTodo className="w-5 h-5 text-[#E0E0E0]" />
            </div>
            <div className="text-[#E0E0E0] text-base font-medium">Resumo do Dia</div>
          </div>
        </motion.div>

        {/* Grid de cards de estatísticas */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          {/* Card de Calorias */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stat-box bg-[#1b1b1b80] rounded-xl p-3.5 flex flex-col h-full"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 flex items-center justify-center">
                <Flame className="w-5 h-5 text-[#FF5252]" />
              </div>
              <span className="text-[#B0B0B0] text-sm">Calorias</span>
            </div>
            <span className="text-white text-2xl font-bold">{totais.totalCalorias}</span>
            <div className="mt-1 w-full h-1 bg-[#FF525233]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressCalories}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-[#FF5252]"
              />
            </div>
            <span className="text-xs text-[#B0B0B0] mt-1">{progressCalories}% do limite</span>
          </motion.div>

          {/* Card de Proteínas */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="stat-box bg-[#1b1b1b80] rounded-xl p-3.5 flex flex-col h-full"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 flex items-center justify-center">
                <Dna className="w-5 h-5 text-[#3D5AFE]" />
              </div>
              <span className="text-[#B0B0B0] text-sm">Proteínas</span>
            </div>
            <span className="text-white text-2xl font-bold">{totais.totalProteina}g</span>
            <div className="mt-1 w-full h-1 bg-[#3D5AFE33]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressProtein}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-[#3D5AFE]"
              />
            </div>
            <span className="text-xs text-[#B0B0B0] mt-1">{progressProtein}% da meta</span>
          </motion.div>
        </div>

        {/* Card de Peso */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="stat-box bg-[#1b1b1b80] rounded-xl p-4 flex flex-col"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 flex items-center justify-center">
                <Scale className="w-5 h-5 text-[#FFC107]" />
              </div>
              <div className="text-[#E0E0E0] text-base font-medium">Peso Atual</div>
            </div>
            
            {!showWeightForm && (
              <button
                onClick={() => setShowWeightForm(true)}
                className="p-2 text-[#B0B0B0] hover:text-white transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          {showWeightForm ? (
            <form onSubmit={handleUpdateWeight} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newWeight}
                  onChange={handleWeightChange}
                  placeholder="Peso em kg"
                  className="flex-1 bg-[#222222] border border-[#333333] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#FFC107] focus:ring-opacity-50 focus:border-transparent outline-none"
                  required
                  step="0.1"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-gradient-to-r from-[#FFC107] to-amber-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center min-w-[80px]"
                  disabled={isUpdatingWeight}
                >
                  {isUpdatingWeight ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Salvar'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWeightForm(false)}
                  className="px-3 py-2 bg-[#2a2a2a] text-[#E0E0E0] rounded-lg text-sm hover:bg-[#333333] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col">
              {/* Peso atual */}
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-3xl font-bold text-white">{profile?.peso_atual || profile?.peso || 'N/A'} kg</p>
                  <p className="text-xs text-[#B0B0B0] mt-1">Atualizado: {profile?.data_peso && format(new Date(profile.data_peso), 'dd/MM/yyyy')}</p>
                </div>
                
                {/* Diferença de peso */}
                {profile?.diferenca_peso && (
                  <div className={`flex flex-col items-end`}>
                    <div className={`flex items-center px-3 py-1 rounded-lg ${
                      profile.diferenca_peso.startsWith('+') 
                        ? 'bg-red-900/30 text-red-400' 
                        : profile.diferenca_peso.startsWith('-') 
                          ? 'bg-green-900/30 text-green-400' 
                          : 'bg-gray-800/30 text-gray-400'
                    }`}>
                      <span className="text-lg font-bold">{profile.diferenca_peso} kg</span>
                      {profile.diferenca_peso.startsWith('+') ? (
                        <ArrowUp className="w-4 h-4 ml-1" />
                      ) : profile.diferenca_peso.startsWith('-') ? (
                        <ArrowDown className="w-4 h-4 ml-1" />
                      ) : null}
                    </div>
                    <p className="text-xs text-[#B0B0B0] mt-1 text-right">Desde o início</p>
                  </div>
                )}
              </div>
              
              {/* Barra de progresso */}
              {profile?.diferenca_peso && (
                <div className="w-full h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden mt-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${Math.min(Math.abs(parseFloat(profile.diferenca_peso) / (profile.peso_inicial * 0.2) * 100), 100)}%` 
                    }}
                    transition={{ duration: 1 }}
                    className={`h-full ${
                      profile.diferenca_peso.startsWith('+') 
                        ? 'bg-red-500' 
                        : profile.diferenca_peso.startsWith('-') 
                          ? 'bg-green-500' 
                          : 'bg-gray-500'
                    }`}
                  />
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Seção de Treinos */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-4"
      >
        <div className="stat-box bg-[#1b1b1b80] rounded-xl p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-[#00E676]" />
              </div>
              <div className="text-[#E0E0E0] text-lg font-medium">Treinos</div>
            </div>
            
            {!showAddWorkoutForm && (
              <button
                onClick={() => setShowAddWorkoutForm(true)}
                className="p-2 text-[#B0B0B0] hover:text-white transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {showAddWorkoutForm ? (
            <div className="mb-4">
              <form onSubmit={handleAddWorkout} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={workoutType}
                    onChange={(e) => setWorkoutType(e.target.value as 'musculacao' | 'cardio')}
                    className="w-full bg-[#222222] border border-[#333333] rounded-lg px-3 py-2 text-white text-sm"
                    required
                  >
                    <option value="">Tipo de Treino</option>
                    <option value="musculacao">Musculação</option>
                    <option value="cardio">Cardio</option>
                  </select>
                  <input
                    type="number"
                    value={workoutDuration}
                    onChange={(e) => setWorkoutDuration(e.target.value)}
                    placeholder="Duração (min)"
                    className="w-full bg-[#222222] border border-[#333333] rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={workoutDescription}
                    onChange={(e) => setWorkoutDescription(e.target.value)}
                    placeholder="Descrição (ex: Treino de pernas)"
                    className="w-full bg-[#222222] border border-[#333333] rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={workoutCalories}
                    onChange={(e) => setWorkoutCalories(e.target.value)}
                    placeholder="Calorias gastas (kcal)"
                    className="w-full bg-[#222222] border border-[#333333] rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-[#00E676] to-green-500 text-white rounded-lg text-sm font-medium"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddWorkoutForm(false)}
                    className="px-4 py-2 bg-[#222222] text-white rounded-lg text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-3">
                {treinosDaSemana.length > 0 ? (
                  treinosDaSemana.map((treino) => (
                    <div 
                      key={treino.id}
                      className="flex justify-between items-center p-3 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          treino.tipo === 'musculacao' ? 'bg-[#00E67633] text-[#00E676]' : 'bg-[#3D5AFE33] text-[#3D5AFE]'
                        }`}>
                          {treino.tipo === 'musculacao' ? <Dumbbell className="w-4 h-4" /> : <Clock />}
                        </div>
                        <div className="text-white">
                          <p className="font-medium">{treino.descricao}</p>
                          <p className="text-xs text-[#B0B0B0]">{treino.duracao} min • {treino.calorias} kcal</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteTreino(treino.id)}
                        className="text-[#B0B0B0] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-[#B0B0B0]">Nenhum treino registrado hoje</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between text-sm mt-2">
                <p className="text-[#B0B0B0]">
                  {totalTreinosSemana}/{profile?.meta_treinos || 7} esta semana
                </p>
                <p className="text-[#B0B0B0]">
                  {Math.min(100, Math.round((totalTreinosSemana / (profile?.meta_treinos || 7)) * 100))}%
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Seção de Refeições */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-4"
      >
        <div className="stat-box bg-[#1b1b1b80] rounded-xl p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 flex items-center justify-center">
                <Utensils className="w-5 h-5 text-[#FF5B52]" />
              </div>
              <div className="text-[#E0E0E0] text-lg font-medium">Refeições</div>
            </div>
            
            {!showAddMealForm && (
              <button
                onClick={() => setShowAddMealForm(true)}
                className="p-2 text-[#B0B0B0] hover:text-white transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {showAddMealForm ? (
            <div className="mb-4">
              <form onSubmit={handleAddRefeicao} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newFood}
                    onChange={(e) => setNewFood(e.target.value)}
                    placeholder="Alimento"
                    className="bg-[#222222] border border-[#333333] rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="Horário"
                    className="bg-[#222222] border border-[#333333] rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={newCalories}
                    onChange={(e) => setNewCalories(e.target.value)}
                    placeholder="Calorias (kcal)"
                    className="bg-[#222222] border border-[#333333] rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                  <input
                    type="number"
                    value={newProtein}
                    onChange={(e) => setNewProtein(e.target.value)}
                    placeholder="Proteínas (g)"
                    className="bg-[#222222] border border-[#333333] rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-[#FF5B52] to-red-500 text-white rounded-lg text-sm font-medium"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddMealForm(false)}
                    className="px-4 py-2 bg-[#222222] text-white rounded-lg text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-3">
                {refeicoes.length > 0 ? (
                  refeicoes.map((refeicao) => (
                    <div 
                      key={refeicao.id}
                      className="flex justify-between items-center p-3 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-white">
                          <p className="font-medium">{refeicao.alimento}</p>
                          <p className="text-xs text-[#B0B0B0]">{refeicao.horario}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-right mr-3">
                          <div className="text-white text-sm">
                            <span className="font-medium">{refeicao.calorias}</span> kcal
                          </div>
                          <div className="text-[#3D5AFE] text-xs">
                            <span className="font-medium">{refeicao.proteina}</span>g proteína
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteRefeicao(refeicao.id)}
                          className="text-[#B0B0B0] hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-[#B0B0B0]">Nenhuma refeição registrada hoje</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between text-sm mt-3">
                <p className="text-[#B0B0B0] flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5" />
                  <span>{refeicoes.length} refeições</span>
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-[#FF5252]" />
                    <span className="text-white font-medium">{totais.totalCalorias}</span>
                    <span className="text-xs text-[#B0B0B0]">/{profile?.meta_calorica} kcal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Dna className="w-3.5 h-3.5 text-[#3D5AFE]" />
                    <span className="text-[#3D5AFE] font-medium">{totais.totalProteina}</span>
                    <span className="text-xs text-[#B0B0B0]">/{profile?.meta_proteina}g</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
};

export default Dashboard;