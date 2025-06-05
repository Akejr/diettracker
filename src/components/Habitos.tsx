import React, { useState, useEffect } from 'react';
import { supabaseApi } from '../lib/supabase';
import { FiPlus, FiTrash2, FiChevronLeft, FiChevronRight, FiTrendingUp, FiCheck, FiCalendar } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { dateService } from '../services/dateService';
import { AlertCircle } from 'lucide-react';

interface Habito {
  id: string;
  usuario_id: string;
  nome: string;
  descricao?: string;
  frequencia: 'diario' | 'semanal';
  dias_semana?: number[]; // Para hábitos semanais (0-6, onde 0 = domingo)
  created_at: string;
  completados: string[]; // Array de datas em formato ISO
  streak: number; // Contador de dias consecutivos
  ultima_data?: string; // Última data completada
}

const Habitos: React.FC = () => {
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [novoHabito, setNovoHabito] = useState({
    nome: '',
    descricao: '',
    frequencia: 'diario' as 'diario' | 'semanal',
    dias_semana: [] as number[]
  });
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAnimation, setShowAnimation] = useState<string | null>(null);
  const [streakAnimation, setStreakAnimation] = useState<{id: string, value: number} | null>(null);

  // Função para formatar datas
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Inicializar com a data atual e inscrever-se para atualizações
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

  // Função para navegar entre datas
  const changeDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      const today = new Date();
      // Não permitir selecionar datas futuras
      if (newDate.getDate() === today.getDate() && 
          newDate.getMonth() === today.getMonth() && 
          newDate.getFullYear() === today.getFullYear()) {
        return;
      }
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  // Função para carregar os hábitos do usuário
  useEffect(() => {
    const carregarHabitos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Usar a nova API para listar hábitos
        const habitosData = await supabaseApi.listarHabitos();

        // Se houver hábitos, calcular streaks
        if (habitosData && habitosData.length > 0) {
          // Converter arrays de datas para o formato esperado pelo componente
          const habitosProcessados = habitosData.map(habito => {
            // Garantir que completados seja um array mesmo quando vier como null do banco
            const completados = habito.completados || [];
            
            // Calcular streak para cada hábito
            const streak = calcularStreak({...habito, completados});
            
            return { 
              ...habito, 
              completados, 
              streak 
            };
          });
          
          setHabitos(habitosProcessados);
        } else {
          // Criar hábitos de exemplo para novos usuários
          console.log('Criando hábitos de exemplo para novo usuário...');
          
          const habitosExemplo = [
            {
              nome: 'Beber 2L de água',
              descricao: 'Manter-se hidratado ao longo do dia',
              frequencia: 'diario'
            },
            {
              nome: 'Treinar por 30 minutos',
              descricao: 'Exercício físico diário',
              frequencia: 'diario'
            },
            {
              nome: 'Meditar',
              descricao: '10 minutos de mindfulness',
              frequencia: 'diario'
            }
          ];
          
          // Inserir hábitos de exemplo no Supabase
          try {
            const novosDados = await supabaseApi.criarHabito(habitosExemplo);
            
            if (novosDados) {
              // Usar os dados retornados pela inserção
              const habitosProcessados = novosDados.map(habito => ({
                ...habito,
                completados: habito.completados || [],
                streak: 0
              }));
              setHabitos(habitosProcessados);
            }
          } catch (erroInsercao) {
            console.error('Erro ao criar hábitos de exemplo:', erroInsercao);
            // Mostrar hábitos de exemplo localmente mesmo que falhe ao inserir no banco
            const exemplosTmp = habitosExemplo.map((h, i) => ({
              ...h,
              id: `tmp-${i}`,
              usuario_id: 'temporario',
              created_at: formatDate(new Date()),
              completados: [],
              streak: 0
            }));
            setHabitos(exemplosTmp as Habito[]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar hábitos:', error);
        setError('Ocorreu um erro ao carregar os hábitos');
      } finally {
        setLoading(false);
      }
    };

    carregarHabitos();
  }, []);

  // Calcular streak (dias consecutivos) para um hábito
  const calcularStreak = (habito: any): number => {
    if (!habito.completados || habito.completados.length === 0) {
      return 0;
    }

    // Ordenar datas completadas
    const datasCompletadas = [...habito.completados].sort();
    const ultimaData = new Date(datasCompletadas[datasCompletadas.length - 1]);
    
    // Verificar se o hábito foi completado ontem ou hoje
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    
    const formatHoje = formatDate(hoje);
    const formatOntem = formatDate(ontem);
    
    // Se não completou ontem nem hoje, streak é zero
    if (!datasCompletadas.includes(formatHoje) && !datasCompletadas.includes(formatOntem)) {
      return 0;
    }
    
    // Contar dias consecutivos
    let streak = 1;
    let diaAtual = new Date(ultimaData);
    
    while (true) {
      diaAtual.setDate(diaAtual.getDate() - 1);
      const formatDia = formatDate(diaAtual);
      
      if (datasCompletadas.includes(formatDia)) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Verificar se um hábito foi completado na data selecionada
  const isHabitoCompletado = (habito: Habito, date: Date): boolean => {
    const dataFormatada = formatDate(date);
    return habito.completados?.includes(dataFormatada) || false;
  };

  // Alternar o status de conclusão de um hábito
  const toggleHabitoStatus = async (habito: Habito) => {
    const dataFormatada = formatDate(selectedDate);
    const completados = [...(habito.completados || [])];
    
    const index = completados.indexOf(dataFormatada);
    const estaCompletado = index >= 0;
    
    // Remover ou adicionar data
    if (estaCompletado) {
      completados.splice(index, 1);
    } else {
      completados.push(dataFormatada);
      setShowAnimation(habito.id);
      setTimeout(() => setShowAnimation(null), 1000);
    }

    // Calcular novo streak
    const habitoAtualizado = {
      ...habito,
      completados,
      ultima_data: estaCompletado ? habito.ultima_data : dataFormatada
    };
    
    const novoStreak = calcularStreak(habitoAtualizado);
    
    // Verificar se o streak aumentou
    if (novoStreak > habito.streak && !estaCompletado) {
      setStreakAnimation({id: habito.id, value: novoStreak});
      setTimeout(() => setStreakAnimation(null), 2000);
    }
    
    habitoAtualizado.streak = novoStreak;

    // Atualizar o estado localmente
    const habitosAtualizados = habitos.map(h => 
      h.id === habito.id ? habitoAtualizado : h
    );
    
    setHabitos(habitosAtualizados);

    // Salvar no Supabase
    try {
      const { error } = await supabaseApi.supabase
        .from('habitos')
        .update({ 
          completados, 
          streak: novoStreak, 
          ultima_data: estaCompletado ? habito.ultima_data : dataFormatada 
        })
        .eq('id', habito.id);
        
      if (error) {
        console.error('Erro ao atualizar hábito:', error);
        // Reverter alteração local em caso de erro
        setHabitos(habitos);
        alert('Erro ao atualizar hábito. Tente novamente.');
      }
    } catch (error) {
      console.error('Exceção ao atualizar hábito:', error);
      // Reverter alteração local em caso de erro
      setHabitos(habitos);
      alert('Erro ao atualizar hábito. Tente novamente.');
    }
  };

  // Função para excluir um hábito
  const excluirHabito = async (habito: Habito) => {
    if (!confirm('Tem certeza que deseja excluir este hábito?')) {
      return;
    }
    
    try {
      const { error } = await supabaseApi.supabase
        .from('habitos')
        .delete()
        .eq('id', habito.id);
        
      if (error) {
        console.error('Erro ao excluir hábito:', error);
        alert('Erro ao excluir hábito. Tente novamente.');
        return;
      }
      
      // Atualizar estado local removendo o hábito
      setHabitos(habitos.filter(h => h.id !== habito.id));
    } catch (error) {
      console.error('Exceção ao excluir hábito:', error);
      alert('Erro ao excluir hábito. Tente novamente.');
    }
  };

  // Cor do texto com base no streak
  const getStreakTextColor = (streak: number): string => {
    if (streak === 0) return 'text-gray-500 dark:text-gray-400';
    if (streak < 3) return 'text-blue-600 dark:text-blue-400';
    if (streak < 7) return 'text-green-600 dark:text-green-400';
    if (streak < 14) return 'text-yellow-600 dark:text-yellow-400';
    if (streak < 30) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Mensagem motivacional com base no streak
  const getStreakMessage = (streak: number): string => {
    if (streak === 0) return 'Comece hoje!';
    if (streak === 1) return 'Primeiro dia!';
    if (streak < 3) return 'Continue assim!';
    if (streak < 7) return 'Você está indo bem!';
    if (streak < 14) return 'Ótimo progresso!';
    if (streak < 30) return 'Impressionante!';
    return 'Você é incrível!';
  };

  // Função para adicionar novo hábito
  const handleAddHabito = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novoHabito.nome.trim()) {
      alert('Por favor, insira um nome para o hábito.');
      return;
    }
    
    // Validar dias da semana para hábitos semanais
    if (novoHabito.frequencia === 'semanal' && novoHabito.dias_semana.length === 0) {
      alert('Por favor, selecione pelo menos um dia da semana.');
      return;
    }
    
    try {
      // Criar novo hábito no Supabase
      const novoHabitoData = {
        nome: novoHabito.nome,
        descricao: novoHabito.descricao,
        frequencia: novoHabito.frequencia,
        dias_semana: novoHabito.frequencia === 'semanal' ? novoHabito.dias_semana : [],
        completados: []
      };
      
      const resultado = await supabaseApi.criarHabito([novoHabitoData]);
      
      if (resultado && resultado.length > 0) {
        // Adicionar o novo hábito ao estado
        setHabitos([...habitos, {...resultado[0], streak: 0}]);
        
        // Limpar formulário e fechar modal
        setNovoHabito({
          nome: '',
          descricao: '',
          frequencia: 'diario',
          dias_semana: []
        });
        setIsAddingHabit(false);
      } else {
        throw new Error('Erro ao criar hábito');
      }
    } catch (error) {
      console.error('Erro ao adicionar hábito:', error);
      alert('Erro ao adicionar hábito. Tente novamente.');
    }
  };
  
  // Função para alternar dias da semana selecionados
  const toggleDiaSemana = (dia: number) => {
    const diasAtuais = [...novoHabito.dias_semana];
    const index = diasAtuais.indexOf(dia);
    
    if (index >= 0) {
      // Se o dia já está selecionado, remover
      diasAtuais.splice(index, 1);
    } else {
      // Se o dia não está selecionado, adicionar
      diasAtuais.push(dia);
    }
    
    setNovoHabito({...novoHabito, dias_semana: diasAtuais});
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-[#131313] to-[#0A0A0A] min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Carregando seus hábitos..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-b from-[#131313] to-[#0A0A0A] min-h-screen flex flex-col">
        {/* Header fixo */}
        <header className="py-4 px-4 flex items-center justify-between">
          <h1 className="text-xl font-medium text-white">Hábitos</h1>
        </header>
        
        {/* Conteúdo com mensagem de erro centralizada */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6 bg-[#1b1b1b80] rounded-xl max-w-md">
            <div className="text-red-500 mb-4 flex justify-center">
              <AlertCircle size={48} />
            </div>
            <h2 className="text-white text-xl font-medium mb-2">Erro ao carregar hábitos</h2>
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

  // Verificar se a data selecionada é hoje
  const isToday = format(new Date(), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

  return (
    <>
      {/* Cabeçalho e navegação de data */}
      <div className="mb-6 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4">
          <button 
            onClick={() => changeDate('prev')}
            className="p-2 rounded-full bg-[#1A1A1A] hover:bg-[#222222] transition-colors"
          >
            <FiChevronLeft className="w-5 h-5 text-white" />
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
            <FiChevronRight className="w-5 h-5 text-white" />
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12H15M12 9V15M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" stroke="#00E676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-[#E0E0E0] text-base font-medium">Resumo de Hábitos</div>
          </div>
        </motion.div>

        {/* Grid de cards de estatísticas */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          {/* Card de Hábitos Completados */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stat-box bg-[#1b1b1b80] rounded-xl p-3.5 flex flex-col h-full"
          >
            <div className="flex items-center gap-2 mb-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#00E676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[#B0B0B0] text-sm">Completados</span>
            </div>
            <span className="text-white text-2xl font-bold">
              {habitos.filter(h => isHabitoCompletado(h, selectedDate)).length}/{habitos.length}
            </span>
            <div className="mt-1 w-full h-1 bg-[#00E67633]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${habitos.length > 0 ? (habitos.filter(h => isHabitoCompletado(h, selectedDate)).length / habitos.length) * 100 : 0}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-[#00E676]"
              />
            </div>
            <span className="text-xs text-[#B0B0B0] mt-1">
              {habitos.length > 0 ? Math.round((habitos.filter(h => isHabitoCompletado(h, selectedDate)).length / habitos.length) * 100) : 0}% concluído
            </span>
          </motion.div>

          {/* Card de Sequência */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="stat-box bg-[#1b1b1b80] rounded-xl p-3.5 flex flex-col h-full"
          >
            <div className="flex items-center gap-2 mb-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 3L21 7V17L13 21L3 17V7L13 3Z" stroke="#3D5AFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 12L21 7M13 12V21M13 12L3 7" stroke="#3D5AFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[#B0B0B0] text-sm">Maior Sequência</span>
            </div>
            <span className="text-white text-2xl font-bold">
              {habitos.reduce((max, h) => Math.max(max, h.streak), 0)} dias
            </span>
            <div className="mt-1 w-full h-1 bg-[#3D5AFE33]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, habitos.reduce((max, h) => Math.max(max, h.streak), 0) * 10)}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-[#3D5AFE]"
              />
            </div>
            <span className="text-xs text-[#B0B0B0] mt-1">
              {getStreakMessage(habitos.reduce((max, h) => Math.max(max, h.streak), 0))}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Seção de Hábitos */}
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
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12H15M12 9V15M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" stroke="#00E676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-[#E0E0E0] text-lg font-medium">Seus Hábitos</div>
            </div>
            
            {!isAddingHabit && (
              <button
                onClick={() => setIsAddingHabit(true)}
                className="p-2 text-[#B0B0B0] hover:text-white transition-colors"
              >
                <FiPlus className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {isAddingHabit ? (
            <div className="mb-4">
              <form onSubmit={handleAddHabito} className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={novoHabito.nome}
                    onChange={(e) => setNovoHabito({...novoHabito, nome: e.target.value})}
                    placeholder="Nome do hábito"
                    className="w-full bg-[#222222] border border-[#333333] rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <textarea
                    value={novoHabito.descricao}
                    onChange={(e) => setNovoHabito({...novoHabito, descricao: e.target.value})}
                    placeholder="Descrição (opcional)"
                    className="w-full bg-[#222222] border border-[#333333] rounded-lg px-3 py-2 text-white text-sm"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNovoHabito({...novoHabito, frequencia: 'diario', dias_semana: []})}
                    className={`py-2 rounded-lg text-sm flex justify-center items-center gap-2 transition-colors ${
                      novoHabito.frequencia === 'diario'
                        ? 'bg-gradient-to-r from-[#00E676] to-green-500 text-white'
                        : 'bg-[#222222] text-[#B0B0B0] hover:bg-[#2A2A2A]'
                    }`}
                  >
                    <FiCalendar className="w-4 h-4" />
                    Diário
                  </button>
                  <button
                    type="button"
                    onClick={() => setNovoHabito({...novoHabito, frequencia: 'semanal', dias_semana: []})}
                    className={`py-2 rounded-lg text-sm flex justify-center items-center gap-2 transition-colors ${
                      novoHabito.frequencia === 'semanal'
                        ? 'bg-gradient-to-r from-[#3D5AFE] to-blue-500 text-white'
                        : 'bg-[#222222] text-[#B0B0B0] hover:bg-[#2A2A2A]'
                    }`}
                  >
                    <FiCalendar className="w-4 h-4" />
                    Semanal
                  </button>
                </div>
                
                {novoHabito.frequencia === 'semanal' && (
                  <div className="grid grid-cols-7 gap-1">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => toggleDiaSemana(index)}
                        className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          novoHabito.dias_semana.includes(index)
                            ? 'bg-[#3D5AFE] text-white'
                            : 'bg-[#222222] text-[#B0B0B0]'
                        }`}
                      >
                        {dia}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-[#00E676] to-green-500 text-white rounded-lg text-sm font-medium"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingHabit(false)}
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
                {habitos.length > 0 ? (
                  habitos.map((habito) => (
                    <div 
                      key={habito.id}
                      className="flex justify-between items-center p-3 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isHabitoCompletado(habito, selectedDate) 
                            ? 'bg-[#00E67633] text-[#00E676]' 
                            : 'bg-[#33333333] text-[#777777]'
                        }`}>
                          <FiCheck className={`w-4 h-4 ${isHabitoCompletado(habito, selectedDate) ? "text-[#00E676]" : ""}`} />
                        </div>
                        <div>
                          <p className="font-medium text-white">{habito.nome}</p>
                          {habito.descricao && <p className="text-xs text-[#B0B0B0]">{habito.descricao}</p>}
                          <div className="flex items-center mt-0.5">
                            <div className={`flex items-center ${getStreakTextColor(habito.streak)}`}>
                              <FiTrendingUp className="w-3 h-3 mr-1" />
                              <span className="text-xs">{habito.streak} dias</span>
                            </div>
                            
                            {habito.frequencia === 'semanal' && (
                              <div className="flex ml-2">
                                <span className="text-[#777777] text-xs ml-1">•</span>
                                <span className="text-[#777777] text-xs ml-1">Semanal</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleHabitoStatus(habito)}
                          className={`p-2 rounded-lg ${
                            isHabitoCompletado(habito, selectedDate) 
                              ? 'text-[#00E676] hover:bg-[#00E67622]' 
                              : 'text-[#777777] hover:bg-[#33333333]'
                          } transition-colors`}
                        >
                          <FiCheck className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => excluirHabito(habito)}
                          className="p-2 text-[#777777] hover:text-red-500 transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-[#B0B0B0]">Nenhum hábito cadastrado</p>
                    <button 
                      onClick={() => setIsAddingHabit(true)}
                      className="mt-3 flex items-center gap-2 mx-auto bg-gradient-to-r from-[#00E676] to-green-500 px-4 py-2 rounded-lg text-white text-sm font-medium"
                    >
                      <FiPlus className="w-4 h-4" />
                      <span>Adicionar Hábito</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Animação de Streak */}
      <AnimatePresence>
        {streakAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setStreakAnimation(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="text-center p-6 bg-gradient-to-b from-[#151515] to-[#0A0A0A] rounded-2xl shadow-2xl border border-indigo-500/20 max-w-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
                className="mx-auto mb-4 text-amber-500"
              >
                <FiTrendingUp className="w-16 h-16" />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-white mb-1">Sequência: {streakAnimation.value} dias!</h2>
                <p className="text-[#B0B0B0] mb-5">{getStreakMessage(streakAnimation.value)}</p>
              </motion.div>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium text-sm shadow-lg"
                onClick={() => setStreakAnimation(null)}
              >
                Continuar
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animação de Conclusão */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-[#00E67633] rounded-full p-8"
            >
              <FiCheck className="w-16 h-16 text-[#00E676]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Habitos;