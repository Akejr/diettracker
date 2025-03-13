import React, { useState, useEffect } from 'react';
import { Flame, Apple, Dumbbell, Scale, Plus, UtensilsCrossed, Trash2, Clock, Timer } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { supabaseApi, type Usuario, type Refeicao } from '../lib/supabase';
import { dateService } from '../services/dateService';

interface DailyEntry {
  food: string;
  calories: number;
  protein: number;
  time: string;
}

interface ConfigUsuario {
  nome: string;
  peso: number;
  altura: number;
  idade: number;
  sexo: 'masculino' | 'feminino';
  nivel_atividade: string;
  objetivo: 'perder' | 'manter' | 'ganhar';
  meta_calorica: number;
  meta_proteina: number;
  meta_treinos: number;
}

interface Treino {
  id: string;
  usuario_id: string;
  descricao: string;
  duracao: number;
  calorias: number;
  data: string;
  tipo: 'musculacao' | 'cardio';
  created_at?: string;
}

const Dashboard: React.FC = () => {
  const [workoutDays, setWorkoutDays] = useState<number>(0);
  const [config, setConfig] = useState<ConfigUsuario | null>(null);
  const [profile, setProfile] = useState<Usuario | null>(null);
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [novaRefeicao, setNovaRefeicao] = useState({
    alimento: '',
    calorias: '',
    proteina: '',
    horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  });
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [isAddingWorkout, setIsAddingWorkout] = useState(false);
  const [novoTreino, setNovoTreino] = useState({
    descricao: '',
    duracao: '',
    calorias: '',
    tipo: 'musculacao' as 'musculacao' | 'cardio'
  });
  const [treinoMusculacao, setTreinoMusculacao] = useState({
    descricao: '',
    duracao: '',
    calorias: ''
  });
  const [treinoCardio, setTreinoCardio] = useState({
    descricao: '',
    duracao: '',
    calorias: ''
  });
  const [treinoDoDia, setTreinoDoDia] = useState<Treino | null>(null);
  const [treinosDaSemana, setTreinosDaSemana] = useState<Treino[]>([]);
  const [swipingTreinoId, setSwipingTreinoId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(dateService.getCurrentDate());
  const [isUpdatingWeight, setIsUpdatingWeight] = useState(false);
  const [novoPeso, setNovoPeso] = useState('');
  const [pesoAnterior, setPesoAnterior] = useState<number | null>(null);
  const [dataPeso, setDataPeso] = useState(dateService.formatDate(new Date()));

    useEffect(() => {
    // Inscreve-se para receber atualizações da data
    const unsubscribe = dateService.subscribe((date) => {
      setSelectedDate(date);
    });

    // Limpa a inscrição quando o componente é desmontado
    return () => unsubscribe();
  }, []);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    const currentDate = dateService.getCurrentDate();
    
    // Não permite selecionar datas futuras
    if (newDate > currentDate) {
      return;
    }
    
    // Não permite selecionar datas antes de 10 de março
    const minDate = new Date(2025, 2, 10); // 10 de março de 2025
    if (newDate < minDate) {
      return;
    }
    
    setSelectedDate(newDate);
  };

  // Carregar configurações e perfil
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
          console.error('Erro ao carregar perfil:', error);
          setError(error.message);
          return;
        }

        if (data) {
          setProfile(data);
          setConfig(data);
        } else {
          setError('Nenhum perfil encontrado');
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        setError('Erro ao carregar dados do perfil');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Carregar refeições do dia
  useEffect(() => {
    const carregarRefeicoes = async () => {
      if (!profile?.id) return;
      
      try {
        // Usar a data selecionada diretamente
        const dataFormatada = dateService.formatDate(selectedDate);
        
        const refeicoesDoDia = await supabaseApi.listarRefeicoesDoDia(profile.id, dataFormatada);
        setRefeicoes(refeicoesDoDia);
      } catch (error) {
        console.error('Erro ao carregar refeições:', error);
      }
    };

    carregarRefeicoes();
  }, [profile?.id, selectedDate]);

  // Carregar treinos da semana
  useEffect(() => {
    const carregarTreinosDaSemana = async () => {
      if (!profile?.id) return;
      
      try {
        const hoje = new Date();
        const inicioSemana = new Date(hoje);
        // Ajusta para o domingo anterior (0 = domingo)
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        inicioSemana.setHours(0, 0, 0, 0);

        const dataFinal = new Date(hoje);
        dataFinal.setDate(dataFinal.getDate() + 1);
        
        const { data: treinos, error } = await supabaseApi.supabase
          .from('treinos')
          .select('*')
          .eq('usuario_id', profile.id)
          .gte('data', inicioSemana.toISOString().split('T')[0])
          .lte('data', dataFinal.toISOString().split('T')[0])
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao carregar treinos:', error);
          return;
        }

        setTreinosDaSemana(treinos || []);
        
        // Atualizar contagem de treinos apenas da semana atual
        const treinosDaSemanaAtual = (treinos || []).filter(t => {
          const dataTreino = new Date(t.data);
          return dataTreino >= inicioSemana && dataTreino <= hoje;
        });
        
        setWorkoutDays(treinosDaSemanaAtual.length);
      } catch (error) {
        console.error('Erro ao carregar treinos:', error);
      }
    };

    carregarTreinosDaSemana();
  }, [profile?.id, selectedDate]);

  // Carregar peso mais recente
  useEffect(() => {
    const carregarPesoMaisRecente = async () => {
      if (!profile?.id) return;
      
      try {
        const { data: pesos, error } = await supabaseApi.supabase
          .from('pesos')
          .select('peso')
          .eq('usuario_id', profile.id)
          .order('data', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Erro ao carregar peso mais recente:', error);
          return;
        }

        if (pesos && pesos.length > 0) {
          setPesoAnterior(pesos[0].peso);
        }
      } catch (error) {
        console.error('Erro ao carregar peso mais recente:', error);
      }
    };

    carregarPesoMaisRecente();
  }, [profile?.id]);

  // Calcular porcentagem de mudança
  const calcularPorcentagemMudanca = () => {
    if (!pesoAnterior || !config?.peso) return 0;
    return ((config.peso - pesoAnterior) / pesoAnterior) * 100;
  };

  // Atualizar peso
  const handleUpdateWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !novoPeso) return;
    
    try {
      const pesoNumerico = parseFloat(novoPeso);
      if (isNaN(pesoNumerico)) {
        alert('Por favor, insira um peso válido');
        return;
      }

      // Verificar se já existe um peso registrado para este mês
      const dataPesoObj = new Date(dataPeso);
      const primeiroDiaMes = new Date(dataPesoObj.getFullYear(), dataPesoObj.getMonth(), 1);
      const ultimoDiaMes = new Date(dataPesoObj.getFullYear(), dataPesoObj.getMonth() + 1, 0);

      // Primeiro, verificar se existe um peso para este mês
      const { data: pesoExistente, error: checkError } = await supabaseApi.supabase
        .from('pesos')
        .select('*')
        .eq('usuario_id', profile.id)
        .gte('data', primeiroDiaMes.toISOString().split('T')[0])
        .lte('data', ultimoDiaMes.toISOString().split('T')[0])
        .maybeSingle();

      if (checkError) {
        console.error('Erro ao verificar peso existente:', checkError);
        throw checkError;
      }

      let result;
      if (pesoExistente) {
        // Atualizar peso existente do mês
        result = await supabaseApi.supabase
          .from('pesos')
          .update({ 
            peso: pesoNumerico,
            usuario_id: profile.id // Garantir que o usuario_id está presente
          })
          .eq('id', pesoExistente.id)
          .eq('usuario_id', profile.id) // Adicionar condição extra de segurança
          .select();
      } else {
        // Inserir novo peso para o mês
        result = await supabaseApi.supabase
          .from('pesos')
          .insert({
            usuario_id: profile.id,
            peso: pesoNumerico,
            data: dataPeso
          })
          .select();
      }

      if (result.error) {
        console.error('Erro ao salvar peso:', result.error);
        throw result.error;
      }

      // Atualizar estados apenas se for o peso atual
      if (dataPeso === dateService.formatDate(new Date())) {
        setConfig(prev => prev ? { ...prev, peso: pesoNumerico } : null);
        setProfile(prev => prev ? { ...prev, peso: pesoNumerico } : null);
      }

      // Atualizar peso anterior para cálculo da porcentagem
      setPesoAnterior(pesoNumerico);
      setNovoPeso('');
      setIsUpdatingWeight(false);
      setDataPeso(dateService.formatDate(new Date()));
    } catch (error) {
      console.error('Erro ao atualizar peso:', error);
      alert('Erro ao atualizar peso. Tente novamente.');
    }
  };

  // Adicionar nova refeição
  const handleAddRefeicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    
    try {
      // Usar a data selecionada diretamente
      const dataFormatada = dateService.formatDate(selectedDate);

      const novaRefeicaoData: Omit<Refeicao, 'id' | 'created_at'> = {
        usuario_id: profile.id,
        alimento: novaRefeicao.alimento,
        calorias: parseInt(novaRefeicao.calorias),
        proteina: parseInt(novaRefeicao.proteina),
        horario: novaRefeicao.horario,
        data: dataFormatada
      };

      const refeicaoAdicionada = await supabaseApi.adicionarRefeicao(novaRefeicaoData);
      setRefeicoes(prev => [...prev, refeicaoAdicionada]);
      
      // Limpar formulário
      setNovaRefeicao({
        alimento: '',
        calorias: '',
        proteina: '',
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
      setIsAdding(false);
    } catch (error) {
      console.error('Erro ao adicionar refeição:', error);
      alert('Erro ao adicionar refeição. Tente novamente.');
    }
  };

  // Deletar refeição
  const handleDeleteRefeicao = async (id: string) => {
    try {
      await supabaseApi.supabase
        .from('refeicoes')
        .delete()
        .eq('id', id);
      
      setRefeicoes(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Erro ao deletar refeição:', error);
      alert('Erro ao deletar refeição. Tente novamente.');
    }
  };

  // Adicionar novo treino
  const handleAddWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    
    try {
      const treinosParaSalvar = [];

      // Usar a data selecionada diretamente
      const dataFormatada = dateService.formatDate(selectedDate);

      // Verificar treino de musculação
      if (novoTreino.tipo === 'musculacao' && novoTreino.descricao && novoTreino.duracao && novoTreino.calorias) {
        treinosParaSalvar.push({
          usuario_id: profile.id,
          descricao: novoTreino.descricao,
          duracao: parseInt(novoTreino.duracao),
          calorias: parseInt(novoTreino.calorias),
          tipo: 'musculacao' as const,
          data: dataFormatada
        });
      }

      // Verificar treino de cardio
      if (novoTreino.tipo === 'cardio' && novoTreino.descricao && novoTreino.duracao && novoTreino.calorias) {
        treinosParaSalvar.push({
          usuario_id: profile.id,
          descricao: novoTreino.descricao,
          duracao: parseInt(novoTreino.duracao),
          calorias: parseInt(novoTreino.calorias),
          tipo: 'cardio' as const,
          data: dataFormatada
        });
      }

      if (treinosParaSalvar.length === 0) {
        throw new Error('Por favor, preencha os dados do treino antes de salvar');
      }

      // Salvar os treinos no banco
      const { data: treinosAdicionados, error } = await supabaseApi.supabase
        .from('treinos')
        .insert(treinosParaSalvar)
        .select();

      if (error) {
        throw error;
      }

      // Atualizar estados
      setTreinosDaSemana(prev => [...(treinosAdicionados || []), ...prev]);
      
      // Atualizar contagem de treinos apenas se for da semana atual
      const hoje = new Date();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());
      inicioSemana.setHours(0, 0, 0, 0);
      
      const dataTreino = new Date(dataFormatada);
      const dataAjustadaTreino = new Date(dataTreino.getTime() + dataTreino.getTimezoneOffset() * 60000);
      if (dataAjustadaTreino >= inicioSemana && dataAjustadaTreino <= hoje) {
        setWorkoutDays(prev => prev + treinosParaSalvar.length);
      }
      
      // Limpar formulário atual e fechar
      setIsAddingWorkout(false);
      setNovoTreino({
        descricao: '',
        duracao: '',
        calorias: '',
        tipo: 'musculacao'
      });
    } catch (error) {
      console.error('Erro ao adicionar treino:', error);
      alert('Erro ao adicionar treino. Tente novamente.');
    }
  };

  const handleDeleteTreino = async (id: string) => {
    try {
      const treino = treinosDaSemana.find(t => t.id === id);
      if (!treino) return;

      const { error } = await supabaseApi.supabase
        .from('treinos')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }

      // Atualizar estados
      setTreinosDaSemana(prev => prev.filter(t => t.id !== id));
      
      // Decrementar contador apenas se o treino deletado for da semana atual
      const hoje = new Date();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());
      inicioSemana.setHours(0, 0, 0, 0);
      
      const dataTreino = new Date(treino.data);
      const dataAjustadaTreino = new Date(dataTreino.getTime() + dataTreino.getTimezoneOffset() * 60000);
      if (dataAjustadaTreino >= inicioSemana && dataAjustadaTreino <= hoje) {
        setWorkoutDays(prev => prev - 1);
      }
    } catch (error) {
      console.error('Erro ao deletar treino:', error);
      alert('Erro ao deletar treino. Tente novamente.');
    }
  };

  const calcularTotais = () => {
    const totais = {
      calorias: 0,
      proteinas: 0
    };

    // Soma as refeições do dia atual
    refeicoes.forEach(refeicao => {
      totais.calorias += refeicao.calorias || 0;
      totais.proteinas += refeicao.proteina || 0;
    });

    return totais;
  };

  const totais = calcularTotais();
  const remainingCalories = profile ? profile.meta_calorica - totais.calorias : 0;
  const remainingProtein = profile ? profile.meta_proteina - totais.proteinas : 0;
  const caloriesProgress = profile ? (totais.calorias / profile.meta_calorica) * 100 : 0;
  const proteinProgress = profile ? (totais.proteinas / profile.meta_proteina) * 100 : 0;
  const workoutProgress = (workoutDays / (config?.meta_treinos || 5)) * 100;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!profile || !config) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Nenhum perfil encontrado</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8.5rem)] px-4">
      {/* Date Selector */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            const date = new Date(selectedDate);
            date.setDate(date.getDate() - 1);
            setSelectedDate(date);
          }}
          className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span className="text-base font-medium text-[#343030]">
          {dateService.formatDate(selectedDate)}
        </span>
        <button
          onClick={() => {
            const date = new Date(selectedDate);
            date.setDate(date.getDate() + 1);
            setSelectedDate(date);
          }}
          className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Calories Card */}
        <div className="bg-white rounded-xl p-4 border border-[#70707033]">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-[#FF6F00]" />
            <span className="text-sm font-semibold text-[#343030]">Calorias</span>
          </div>
          <div className="text-2xl font-bold text-[#343030] mb-2">{totais.calorias}</div>
          <div className="w-full h-2 bg-[#E2E2E9] rounded-full mb-1.5">
            <div 
              className="h-full bg-[#FF6F00] rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(caloriesProgress, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs font-medium text-[#B3B3B6]">
            Limite: {profile.meta_calorica} kcal
          </div>
        </div>

        {/* Protein Card */}
        <div className="bg-white rounded-xl p-4 border border-[#70707033]">
          <div className="flex items-center gap-2 mb-2">
            <Apple className="w-5 h-5 text-[#3AFF00]" />
            <span className="text-sm font-semibold text-[#343030]">Proteína</span>
          </div>
          <div className="text-2xl font-bold text-[#343030] mb-2">{totais.proteinas}g</div>
          <div className="w-full h-2 bg-[#E2E2E9] rounded-full mb-1.5">
            <div 
              className="h-full bg-[#3AFF00] rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(proteinProgress, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs font-medium text-[#B3B3B6]">
            Faltam: {remainingProtein}g
          </div>
        </div>
      </div>

      {/* Middle Cards */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        {/* Weight Card */}
        <div className="bg-white rounded-xl p-4 border border-[#70707033]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-[#181DA5]" />
              <span className="text-[15px] font-semibold text-[#343030]">Peso Atual</span>
            </div>
            <button
              onClick={() => setIsUpdatingWeight(true)}
              className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-[#343030]" />
            </button>
          </div>

          {isUpdatingWeight ? (
            <form onSubmit={handleUpdateWeight} className="mb-3">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Novo peso (kg)"
                    value={novoPeso}
                    onChange={e => setNovoPeso(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030] text-sm"
                    required
                  />
                  <input
                    type="date"
                    value={dataPeso}
                    onChange={e => setDataPeso(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030] text-sm"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#343030] text-white py-2 rounded-lg text-sm font-semibold active:bg-[#282828] transition-colors"
                  >
                    Atualizar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUpdatingWeight(false);
                      setNovoPeso('');
                      setDataPeso(dateService.formatDate(new Date()));
                    }}
                    className="flex-1 bg-[#F5F5F5] text-[#343030] py-2 rounded-lg text-sm font-semibold active:bg-[#E5E5E5] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-[#343030]">{pesoAnterior || config?.peso || 0} Kg</span>
                  <span className="text-sm text-[#B3B3B6]">Peso atual</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-lg font-semibold ${calcularPorcentagemMudanca() > 0 ? 'text-red-500' : 'text-[#00B050]'}`}>
                    {calcularPorcentagemMudanca() > 0 
                      ? `-${(pesoAnterior - (config?.peso || 0)).toFixed(1)} Kg`
                      : `+${((config?.peso || 0) - pesoAnterior).toFixed(1)} Kg`}
                  </span>
                  <span className="text-sm text-[#B3B3B6]">Variação</span>
                </div>
              </div>
              <div className="bg-[#F9FAFB] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-[#343030]">Progresso desde o início</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-[#E2E2E9] rounded-full">
                    <div 
                      className="h-full bg-[#181DA5] rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(Math.abs(calcularPorcentagemMudanca()), 100)}%` }}
                    ></div>
                  </div>
                  <span className={`text-sm font-medium ${calcularPorcentagemMudanca() > 0 ? 'text-red-500' : 'text-[#00B050]'}`}>
                    {Math.abs(calcularPorcentagemMudanca()).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-[#B3B3B6] mt-2">
                  {calcularPorcentagemMudanca() > 0 
                    ? `Você perdeu ${(pesoAnterior - (config?.peso || 0)).toFixed(1)} Kg desde o início da sua jornada! Continue assim! 💪`
                    : `Você ganhou ${((config?.peso || 0) - pesoAnterior).toFixed(1)} Kg desde o início. Mantenha o foco nos seus objetivos! 🎯`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Workout Card */}
        <div className="bg-white rounded-xl p-4 border border-[#70707033]">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <Dumbbell className="w-5 h-5 text-[#E600FF]" />
              <span className="text-[15px] font-semibold text-[#343030]">Treinos</span>
            </div>
            <button
              onClick={() => setIsAddingWorkout(true)}
              className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-[#343030]" />
            </button>
          </div>

          {isAddingWorkout ? (
            <form onSubmit={handleAddWorkout} className="mb-3">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Salvar estado atual antes de mudar
                      if (novoTreino.tipo === 'cardio') {
                        setTreinoCardio({
                          descricao: novoTreino.descricao,
                          duracao: novoTreino.duracao,
                          calorias: novoTreino.calorias
                        });
                      } else {
                        setTreinoMusculacao({
                          descricao: novoTreino.descricao,
                          duracao: novoTreino.duracao,
                          calorias: novoTreino.calorias
                        });
                      }
                      // Restaurar estado da musculação
                      setNovoTreino({
                        tipo: 'musculacao',
                        ...treinoMusculacao
                      });
                    }}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      novoTreino.tipo === 'musculacao'
                        ? 'bg-[#343030] text-white'
                        : 'bg-[#F5F5F5] text-[#343030] hover:bg-[#E5E5E5]'
                    }`}
                  >
                    <Dumbbell className="w-4 h-4" />
                    Musculação
                  </button>
                  <button
                    type="button"
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
                      novoTreino.tipo === 'cardio'
                        ? 'bg-[#343030] text-white'
                        : 'bg-[#F9FAFB] text-[#343030]'
                    }`}
                    onClick={() => {
                      if (novoTreino.tipo === 'musculacao') {
                        setTreinoMusculacao(novoTreino);
                        setNovoTreino({ ...treinoCardio, tipo: 'cardio' });
                      }
                    }}
                  >
                    <Timer className="w-4 h-4" />
                    Cardio
                  </button>
                </div>
                <input
                  type="text"
                  placeholder={novoTreino.tipo === 'musculacao' ? "Quais músculos treinou? (ex: Peito, Costas)" : "Qual exercício fez? (ex: Corrida, Bicicleta)"}
                  value={novoTreino.descricao}
                  onChange={e => setNovoTreino(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030] text-sm"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder={novoTreino.tipo === 'musculacao' ? "Tempo (minutos)" : "Duração (minutos)"}
                    value={novoTreino.duracao}
                    onChange={e => setNovoTreino(prev => ({ ...prev, duracao: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030] text-sm"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Calorias queimadas"
                    value={novoTreino.calorias}
                    onChange={e => setNovoTreino(prev => ({ ...prev, calorias: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030] text-sm"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#343030] text-white py-2 rounded-lg text-sm font-semibold active:bg-[#282828] transition-colors"
                  >
                    Registrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingWorkout(false)}
                    className="flex-1 bg-[#F5F5F5] text-[#343030] py-2 rounded-lg text-sm font-semibold active:bg-[#E5E5E5] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          ) : null}

          {treinosDaSemana.filter(t => {
            // Comparar diretamente com a data selecionada
            return t.data === dateService.formatDate(selectedDate);
          }).length > 0 ? (
            <div className="mb-4 space-y-2">
              <AnimatePresence mode="popLayout">
                {treinosDaSemana
                  .filter(treino => {
                    // Comparar diretamente com a data selecionada
                    return treino.data === dateService.formatDate(selectedDate);
                  })
                  .sort((a, b) => {
                    // Ordenar por tipo (musculação primeiro) e depois por horário de criação
                    if (a.tipo === b.tipo) {
                      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
                    }
                    return a.tipo === 'musculacao' ? -1 : 1;
                  })
                  .map((treino) => (
                    <motion.div
                      key={treino.id}
                      layout
                      initial={{ opacity: 1, x: 0 }}
                      exit={{
                        opacity: 0,
                        x: -100,
                        transition: { duration: 0.2 }
                      }}
                      className="relative"
                    >
                      <motion.div
                        className="absolute right-0 top-0 bottom-0 bg-red-500 flex items-center px-4 rounded-lg"
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: swipingTreinoId === treino.id ? 1 : 0,
                        }}
                      >
                        <Trash2 className="w-6 h-6 text-white" />
                      </motion.div>

                      <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.1}
                        onDragStart={() => setSwipingTreinoId(treino.id)}
                        onDragEnd={(event, info: PanInfo) => {
                          if (info.offset.x < -100) {
                            handleDeleteTreino(treino.id);
                          }
                          setSwipingTreinoId(null);
                        }}
                        className="p-3 bg-[#F9FAFB] rounded-lg cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {treino.tipo === 'musculacao' ? (
                            <Dumbbell className="w-4 h-4 text-[#343030]" />
                          ) : (
                            <Timer className="w-4 h-4 text-[#343030]" />
                          )}
                          <div className="text-base font-semibold text-[#343030]">
                            {treino.descricao}
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-[#343030]" />
                            <span className="text-sm text-[#343030]">{treino.duracao} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Flame className="w-4 h-4 text-[#FF6F00]" />
                            <span className="text-sm text-[#343030]">{treino.calorias} kcal</span>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="mb-4 text-center text-[#B3B3B6] text-sm">
              Nenhum treino registrado {dateService.formatDate(selectedDate) === dateService.formatDate() ? 'hoje' : 'neste dia'}
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm text-[#B3B3B6]">{workoutDays} de {config?.meta_treinos || 5} treinos</span>
            <span className="text-sm text-[#343030]">Faltam: {(config?.meta_treinos || 5) - workoutDays}</span>
          </div>
          <div className="w-full h-2 bg-[#E2E2E9] rounded-full mt-3">
            <div 
              className="h-full bg-[#E600FF] rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(workoutProgress, 100)}%` }}
            ></div>
          </div>
          </div>
      </div>

      {/* Meals Card */}
      <div className="bg-white rounded-xl p-6 border border-[#70707033] flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="w-6 h-6 text-[#343030]" />
            <span className="text-lg font-semibold text-[#343030]">
              Refeições {dateService.formatDate(selectedDate) === dateService.formatDate() ? 'de hoje' : 'do dia'}
            </span>
          </div>
          <span className="text-base text-[#B3B3B6]">
            {dateService.formatDate(selectedDate)}
          </span>
        </div>

        <div className="flex-1 flex flex-col">
          {isAdding && (
            <form onSubmit={handleAddRefeicao} className="p-4 bg-[#F9FAFB] rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Nome do alimento"
                    value={novaRefeicao.alimento}
                    onChange={e => setNovaRefeicao(prev => ({ ...prev, alimento: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-[#70707033] text-[#343030] text-base"
                    required
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Calorias"
                    value={novaRefeicao.calorias}
                    onChange={e => setNovaRefeicao(prev => ({ ...prev, calorias: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-[#70707033] text-[#343030] text-base"
                    required
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Proteína (g)"
                    value={novaRefeicao.proteina}
                    onChange={e => setNovaRefeicao(prev => ({ ...prev, proteina: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-[#70707033] text-[#343030] text-base"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="time"
                    value={novaRefeicao.horario}
                    onChange={e => setNovaRefeicao(prev => ({ ...prev, horario: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-[#70707033] text-[#343030] text-base"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#343030] text-white py-3 rounded-lg text-base font-semibold active:bg-[#282828] transition-colors"
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 bg-[#F5F5F5] text-[#343030] py-3 rounded-lg text-base font-semibold active:bg-[#E5E5E5] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {refeicoes.length > 0 ? (
            <div className="flex-1 flex flex-col divide-y divide-[#70707033]">
              <AnimatePresence mode="popLayout">
                {refeicoes.map((refeicao) => (
                  <motion.div
                    key={refeicao.id}
                    layout
                    initial={{ opacity: 1, x: 0 }}
                    exit={{
                      opacity: 0,
                      x: -100,
                      transition: { duration: 0.2 }
                    }}
                    className="relative"
                  >
                    <motion.div
                      className="absolute right-0 top-0 bottom-0 bg-red-500 flex items-center px-4 rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: swipingId === refeicao.id ? 1 : 0,
                      }}
                    >
                      <Trash2 className="w-6 h-6 text-white" />
                    </motion.div>

                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.1}
                      onDragStart={() => setSwipingId(refeicao.id)}
                      onDragEnd={(event, info: PanInfo) => {
                        if (info.offset.x < -100) {
                          handleDeleteRefeicao(refeicao.id);
                        }
                        setSwipingId(null);
                      }}
                      className="flex justify-between items-center py-4 bg-white cursor-grab active:cursor-grabbing"
                    >
                      <div>
                        <div className="text-base font-semibold text-[#343030]">{refeicao.alimento}</div>
                        <div className="text-sm text-[#B3B3B6] mt-1">{refeicao.horario}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base text-[#343030]">{refeicao.calorias} kcal</div>
                        <div className="text-sm text-[#B3B3B6] mt-1">{refeicao.proteina}g proteína</div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex-1 grid place-items-center">
              <div className="text-center text-[#B3B3B6] text-base">
                Nenhuma refeição registrada {dateService.formatDate(selectedDate) === dateService.formatDate() ? 'hoje' : 'neste dia'}
              </div>
            </div>
          )}

        <button
            onClick={() => setIsAdding(true)}
            className="w-full bg-[#343030] text-white py-4 rounded-lg mt-6 text-base font-semibold active:bg-[#282828] transition-colors"
        >
            Adicionar Refeição {dateService.formatDate(selectedDate) !== dateService.formatDate() ? 'para este dia' : ''}
        </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
