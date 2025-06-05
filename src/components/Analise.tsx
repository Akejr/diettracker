import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseApi } from '../lib/supabase';
import { getCurrentUserId } from '../lib/userUtils';
import LoadingSpinner from './LoadingSpinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart2, 
  Lightbulb, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';

// Tipos
type SecaoType = 'resumo' | 'dicas' | 'historico';

// Interfaces
interface DadosDiarios {
  data: string;
  calorias: number;
  proteinas: number;
  musculacao: number;
  cardio: number;
}

interface Profile {
  id: string;
  nome: string;
  meta_calorica: number;
  meta_proteina: number;
}

interface Tip {
  id: string;
  title: string;
  description: string;
  severity: 'alta' | 'media' | 'informativo';
}

interface MonthlyStats {
  daysLogged: number;
  avgCalories: number;
  avgProtein: number;
  workoutDays: number;
  cardioCount: number;
  musculacaoCount: number;
  progressPercent: number;
}

// Variantes de animação
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 260, 
      damping: 20 
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2 }
  }
};

// Importação dos componentes de seção
import ResumoSection from './analise/ResumoSection';
import DicasSection from './analise/DicasSection';
import HistoricoSection from './analise/HistoricoSection';

const Analise: React.FC = () => {
  // Estados principais
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoType>('resumo');
  const [mesAtual, setMesAtual] = useState(() => new Date());
  
  // Estados para dados
  const [profile, setProfile] = useState<Profile | null>(null);
  const [monthStats, setMonthStats] = useState<MonthlyStats>({
    daysLogged: 0,
    avgCalories: 0,
    avgProtein: 0,
    workoutDays: 0,
    cardioCount: 0,
    musculacaoCount: 0,
    progressPercent: 0
  });
  const [tips, setTips] = useState<Tip[]>([]);
  const [calendarData, setCalendarData] = useState<Map<string, DadosDiarios>>(new Map());
  
  // Função para alterar mês
  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(mesAtual);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
      
      // Não permitir navegar para o futuro além do mês atual
      const hoje = new Date();
      if (newDate > hoje) {
        return;
      }
    }
    setMesAtual(newDate);
  };

  // Função para calcular o número de dias no mês atual
  const calcularDiasNoMes = useCallback(() => {
    return new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
  }, [mesAtual]);

  // Função para verificar se um dia tem treino
  const verificarTreinoDia = useCallback((dia: number) => {
    const dataFormatada = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return Array.from(calendarData.values()).some(dados => dados.data === dataFormatada && (dados.musculacao > 0 || dados.cardio > 0));
  }, [calendarData, mesAtual]);

  // Função otimizada para carregar dados de um mês
  const carregarDadosMes = useCallback(async () => {
    try {
      setLoading(true);
      
      // Determinar o primeiro e último dia do mês
      const primeiroDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
      const ultimoDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);
      
      // Formatar datas para query
      const dataInicio = format(primeiroDia, 'yyyy-MM-dd');
      const dataFim = format(ultimoDia, 'yyyy-MM-dd');
      
      // Carregar perfil do usuário
      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }
      
      // Buscar dados do usuário (uma única vez)
      const { data: usuario, error: userError } = await supabaseApi.getUser(userId);
      if (userError) throw userError;
      if (!usuario) throw new Error('Usuário não encontrado');
      
      // Converter o usuário para o formato Profile
      const userProfile: Profile = {
        id: usuario.id || '',
        nome: usuario.nome,
        meta_calorica: usuario.meta_calorica,
        meta_proteina: usuario.meta_proteina
      };
      
      setProfile(userProfile);
      
      // Carregar dados em paralelo
      const [refeicoesResult, treinosResult] = await Promise.all([
        supabaseApi.listarRefeicoesPeriodo(dataInicio, dataFim),
        supabaseApi.listarTreinosPeriodo(dataInicio, dataFim)
      ]);
      
      // Processar refeições
      const refeicoes = refeicoesResult.data || [];
      
      // Processar treinos
      const treinos = treinosResult.data || [];
      
      // Calcular estatísticas mensais
      const dadosPorDia = new Map<string, DadosDiarios>();
      
      // Inicializar dados para cada dia do mês
      const diasNoMes = Array.from({ length: calcularDiasNoMes() }, (_, i) => i + 1);
      
      diasNoMes.forEach(dia => {
        const dataFormatada = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        dadosPorDia.set(dataFormatada, {
          data: dataFormatada,
          calorias: 0,
          proteinas: 0,
          musculacao: 0,
          cardio: 0
        });
      });
      
      // Calcular calorias e proteínas por dia
      refeicoes.forEach(refeicao => {
        const dia = refeicao.data;
        const dadosDia = dadosPorDia.get(dia);
        if (dadosDia) {
          dadosDia.calorias += refeicao.calorias;
          dadosDia.proteinas += refeicao.proteina;
          dadosPorDia.set(dia, dadosDia);
        }
      });
      
      // Calcular treinos por dia
      treinos.forEach(treino => {
        const dia = treino.data;
        const dadosDia = dadosPorDia.get(dia);
        if (dadosDia) {
          if (treino.tipo === 'musculacao') {
            dadosDia.musculacao += 1;
          } else if (treino.tipo === 'cardio') {
            dadosDia.cardio += 1;
          }
          dadosPorDia.set(dia, dadosDia);
        }
      });
      
      // Salvar dados para o calendário
      setCalendarData(dadosPorDia);
      
      // Calcular estatísticas mensais
      const diasComDados = Array.from(dadosPorDia.values()).filter(dia => 
        dia.calorias > 0 || dia.proteinas > 0 || dia.musculacao > 0 || dia.cardio > 0
      );
      
      let totalCalorias = 0;
      let totalProteinas = 0;
      let diasComTreino = 0;
      let totalCardio = 0;
      let totalMusculacao = 0;
      
      diasComDados.forEach(dia => {
        totalCalorias += dia.calorias;
        totalProteinas += dia.proteinas;
        
        if (dia.musculacao > 0 || dia.cardio > 0) {
          diasComTreino++;
        }
        
        totalCardio += dia.cardio;
        totalMusculacao += dia.musculacao;
      });
      
      // Calcular progresso em relação às metas
      const metaCaloricaTotal = usuario.meta_calorica * diasComDados.length;
      const progressoPercent = metaCaloricaTotal > 0 
        ? Math.round((totalCalorias / metaCaloricaTotal) * 100)
        : 0;
      
      const stats = {
        daysLogged: diasComDados.length,
        avgCalories: diasComDados.length > 0 ? Math.round(totalCalorias / diasComDados.length) : 0,
        avgProtein: diasComDados.length > 0 ? Math.round(totalProteinas / diasComDados.length) : 0,
        workoutDays: diasComTreino,
        cardioCount: totalCardio,
        musculacaoCount: totalMusculacao,
        progressPercent: progressoPercent > 100 ? 100 : progressoPercent
      };
      
      setMonthStats(stats);
      
      // Criar dicas personalizadas com base nos dados
      const novasDicas = gerarDicas(usuario, stats, dadosPorDia);
      setTips(novasDicas);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [mesAtual]);

  // Função para gerar dicas personalizadas
  const gerarDicas = (usuario: any, stats: MonthlyStats, dadosPorDia: Map<string, DadosDiarios>): Tip[] => {
    const novasDicas: Tip[] = [];
    
    // Verificar consumo de proteína
    const proteinPercent = usuario.meta_proteina > 0 
      ? (stats.avgProtein / usuario.meta_proteina) * 100 
      : 0;
    
    if (proteinPercent < 50) {
      novasDicas.push({
        id: 'proteina-baixa-prioridade',
        title: 'Consumo de proteína muito baixo',
        description: 'Seu consumo médio de proteína está abaixo de 50% da meta. Aumentar o consumo de proteínas é essencial para recuperação muscular, manutenção da massa magra e saciedade.',
        severity: 'alta'
      });
    } else if (proteinPercent >= 50 && proteinPercent < 70) {
      novasDicas.push({
        id: 'proteina-media',
        title: 'Consumo de proteína abaixo da meta',
        description: 'Seu consumo médio de proteína está entre 50% e 70% da meta. Considere adicionar mais fontes proteicas como carnes magras, ovos, laticínios ou suplementos.',
        severity: 'media'
      });
    } else if (proteinPercent >= 70) {
      novasDicas.push({
        id: 'proteina-boa',
        title: 'Bom consumo de proteína',
        description: 'Seu consumo médio de proteína está acima de 70% da meta. Está indo bem, mas aumentar um pouco mais pode trazer benefícios adicionais para composição corporal e recuperação.',
        severity: 'informativo'
      });
    }
    
    // Verificar proteína em finais de semana
    const diasFimDeSemana = Array.from(dadosPorDia.entries())
      .filter(([dataStr]) => {
        const data = new Date(dataStr);
        return data.getDay() === 0 || data.getDay() === 6;
      })
      .map(([_, dados]) => dados);
    
    const fimDeSemanaComBaixaProteina = diasFimDeSemana.filter(dia => {
      return dia.proteinas < usuario.meta_proteina * 0.6;
    });
    
    if (fimDeSemanaComBaixaProteina.length >= 3 && diasFimDeSemana.length >= 4) {
      novasDicas.push({
        id: 'proteina-fim-de-semana',
        title: 'Proteína baixa nos finais de semana',
        description: 'Você tem consumido pouca proteína nos finais de semana. Manter a consistência todos os dias é importante para seus objetivos de composição corporal.',
        severity: 'media'
      });
    }
    
    // Verificar cardio
    if (stats.cardioCount < 5) {
      novasDicas.push({
        id: 'cardio-baixo',
        title: 'Frequência de cardio muito baixa',
        description: 'Você fez menos de 5 treinos cardiovasculares neste mês. O cardio é essencial para saúde cardiovascular, queima calórica e condicionamento geral.',
        severity: 'alta'
      });
    } else if (stats.cardioCount >= 5 && stats.cardioCount < 10) {
      novasDicas.push({
        id: 'cardio-medio',
        title: 'Frequência de cardio moderada',
        description: 'Você fez entre 5 e 10 treinos cardiovasculares neste mês. Está no caminho certo, mas aumentar a frequência traria mais benefícios para sua saúde e condicionamento.',
        severity: 'media'
      });
    } else if (stats.cardioCount >= 10 && stats.cardioCount < 25) {
      novasDicas.push({
        id: 'cardio-bom',
        title: 'Boa frequência de cardio',
        description: 'Você fez entre 10 e 25 treinos cardiovasculares neste mês. Excelente trabalho! Manter essa frequência já traz ótimos benefícios para sua saúde.',
        severity: 'informativo'
      });
    }
    
    // Verificar musculação
    const totalDiasNoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
    const semanas = totalDiasNoMes / 7;
    const mediaMusculacaoPorSemana = stats.musculacaoCount / semanas;
    
    if (mediaMusculacaoPorSemana < 3) {
      novasDicas.push({
        id: 'musculacao-baixa',
        title: 'Frequência de musculação baixa',
        description: 'Você fez menos de 3 treinos de musculação por semana em média. Aumentar para pelo menos 3-4 treinos semanais é recomendado para ganhos de força e hipertrofia.',
        severity: 'alta'
      });
    } else if (mediaMusculacaoPorSemana === 4) {
      novasDicas.push({
        id: 'musculacao-boa',
        title: 'Boa frequência de musculação',
        description: 'Você fez em média 4 treinos de musculação por semana. Está muito bom! Adicionar mais um dia poderia trazer benefícios adicionais se seu objetivo for hipertrofia.',
        severity: 'informativo'
      });
    } else if (mediaMusculacaoPorSemana > 5) {
      novasDicas.push({
        id: 'musculacao-excessiva',
        title: 'Frequência alta de musculação',
        description: 'Você treinou musculação mais de 5 vezes por semana em média. Lembre-se que o descanso é essencial para recuperação muscular e prevenção de lesões.',
        severity: 'media'
      });
    }
    
    // Verificar calorias
    const caloriesPercent = usuario.meta_calorica > 0 
      ? (stats.avgCalories / usuario.meta_calorica) * 100 
      : 0;
    
    if (caloriesPercent > 100) {
      novasDicas.push({
        id: 'calorias-excesso',
        title: 'Consumo calórico acima da meta',
        description: 'Seu consumo médio de calorias está acima da meta. Se seu objetivo é perda de peso, considere ajustar sua alimentação para criar um déficit calórico.',
        severity: 'alta'
      });
    } else if (caloriesPercent >= 80 && caloriesPercent <= 100) {
      novasDicas.push({
        id: 'calorias-bom',
        title: 'Bom controle calórico',
        description: 'Seu consumo médio de calorias está entre 80% e 100% da meta. Você está no caminho certo para seus objetivos!',
        severity: 'informativo'
      });
    }
    
    // Verificar padrões de treino (dias da semana faltantes)
    const diasDaSemana = [0, 1, 2, 3, 4, 5, 6]; // 0 = domingo, 1 = segunda, etc.
    const treinosPorDiaDaSemana = diasDaSemana.map(dia => {
      return Array.from(dadosPorDia.entries())
        .filter(([dataStr]) => {
          const data = new Date(dataStr);
          return data.getDay() === dia;
        })
        .filter(([_, dados]) => dados.musculacao > 0 || dados.cardio > 0)
        .length;
    });
    
    const diasComMenosTreinos = diasDaSemana
      .filter(dia => {
        // Verificar se este dia da semana apareceu pelo menos 3 vezes no mês
        const diasDesteNome = Array.from(dadosPorDia.entries())
          .filter(([dataStr]) => new Date(dataStr).getDay() === dia)
          .length;
        
        return diasDesteNome >= 3 && treinosPorDiaDaSemana[dia] === 0;
      })
      .map(dia => {
        const nomesDias = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
        return nomesDias[dia];
      });
    
    if (diasComMenosTreinos.length > 0) {
      novasDicas.push({
        id: 'padrao-treino',
        title: 'Padrão de treinos inconsistente',
        description: `Você tende a não treinar às ${diasComMenosTreinos.join(', ')}. Estabelecer uma rotina consistente pode ajudar a manter o hábito de exercícios.`,
        severity: 'media'
      });
    }
    
    return novasDicas;
  };

  // Efeito para carregar dados quando o mês muda
  useEffect(() => {
    carregarDadosMes();
  }, [carregarDadosMes]);

  // Renderização condicional para estados de loading e erro
  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Carregando dados para análise..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
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
    );
  }

  return (
    <>
      {/* Cabeçalho e navegação de mês */}
      <div className="mb-4 mt-2">
        {/* Navegação entre abas */}
        <div className="bg-[#1b1b1b80] rounded-xl p-1.5 flex items-center justify-between mb-4">
          <button
            onClick={() => setSecaoAtiva('resumo')}
            className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors ${
              secaoAtiva === 'resumo'
                ? 'bg-gradient-to-r from-[#3D5AFE] to-[#5677FF] text-white font-medium'
                : 'text-[#B0B0B0] hover:bg-[#1A1A1A]'
            }`}
          >
            <BarChart2 size={16} />
            Resumo
          </button>
          <button
            onClick={() => setSecaoAtiva('dicas')}
            className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors ${
              secaoAtiva === 'dicas'
                ? 'bg-gradient-to-r from-[#3D5AFE] to-[#5677FF] text-white font-medium'
                : 'text-[#B0B0B0] hover:bg-[#1A1A1A]'
            }`}
          >
            <Lightbulb size={16} />
            Dicas
          </button>
          <button
            onClick={() => setSecaoAtiva('historico')}
            className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors ${
              secaoAtiva === 'historico'
                ? 'bg-gradient-to-r from-[#3D5AFE] to-[#5677FF] text-white font-medium'
                : 'text-[#B0B0B0] hover:bg-[#1A1A1A]'
            }`}
          >
            <CalendarIcon size={16} />
            Histórico
          </button>
        </div>
        
        {/* Seletor de mês */}
        <div className="bg-[#1b1b1b80] rounded-xl p-3 flex justify-between items-center">
          <button 
            onClick={() => changeMonth('prev')}
            className="p-2 rounded-full bg-[#1A1A1A] hover:bg-[#222222] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-medium text-white">
              {format(mesAtual, 'MMMM yyyy', { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase())}
            </h2>
          </div>
          
          <button 
            onClick={() => changeMonth('next')}
            className="p-2 rounded-full bg-[#1A1A1A] hover:bg-[#222222] transition-colors"
            disabled={
              mesAtual.getMonth() === new Date().getMonth() && 
              mesAtual.getFullYear() === new Date().getFullYear()
            }
            style={{ 
              opacity: mesAtual.getMonth() === new Date().getMonth() && 
              mesAtual.getFullYear() === new Date().getFullYear() ? 0.5 : 1 
            }}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
      
      {/* Conteúdo da seção ativa */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="bg-[#1b1b1b80] rounded-xl flex justify-center items-center py-20">
            <LoadingSpinner message="Carregando dados para análise..." />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {secaoAtiva === 'resumo' && (
              <motion.div
                key="resumo"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={cardVariants}
              >
                <ResumoSection 
                  estatisticas={monthStats}
                  usuario={profile}
                  mesAtual={mesAtual.getMonth()}
                  anoAtual={mesAtual.getFullYear()}
                />
              </motion.div>
            )}
            
            {secaoAtiva === 'dicas' && (
              <motion.div
                key="dicas"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={cardVariants}
              >
                <DicasSection tips={tips} />
              </motion.div>
            )}
            
            {secaoAtiva === 'historico' && (
              <motion.div
                key="historico"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={cardVariants}
              >
                <HistoricoSection 
                  dadosDiarios={Array.from(calendarData.values()).map((dado, index) => ({
                    dia: index + 1,
                    calorias: dado.calorias,
                    proteinas: dado.proteinas,
                    treino: verificarTreinoDia(index + 1),
                    metaCalorias: profile?.meta_calorica || 2000,
                    metaProteinas: profile?.meta_proteina || 120
                  }))}
                  mes={mesAtual.getMonth()}
                  ano={mesAtual.getFullYear()}
                  diasNoMes={calcularDiasNoMes()}
                  onDiaClick={(dia) => console.log(`Dia ${dia} selecionado`)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </>
  );
};

export default Analise;