import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { toBlob } from 'html-to-image';
import { saveAs } from 'file-saver';
import { supabase } from '../lib/supabase';
import { getCurrentUserId } from '../lib/userUtils';
import {
  Share2,
  Download,
  ListTodo,
  Flame,
  Dna,
  Scale,
  Utensils,
  Clock,
  Dumbbell
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

enum PeriodType {
  Day = 'dia',
  Week = 'semana',
  Month = 'mês',
}

enum CardType {
  Overall = 'overall',
  Meal = 'meal',
  Workout = 'workout',
  Weight = 'weight',
}

interface ShareStats {
  nome: string;
  foto_url?: string;
  peso: number;
  calorias: number;
  proteinas: number;
  periodo: PeriodType;
  treinos: number;
  refeicoes?: number;
  caloriaConsumidas?: number;
  tempoTreino?: number;
  musculacao?: number;
  cardio?: number;
  pesoInicial?: number;
  pesoPerda?: number;
  percentual?: number;
  meta_calorica?: number;
  meta_proteina?: number;
  meta_treinos?: number;
}

const fraseMotivacionais = [
  "Cada treino é uma vitória contra seus limites",
  "Sua única competição é com quem você era ontem",
  "Dor temporária, orgulho permanente",
  "Pequenos progressos todos os dias levam a grandes resultados",
  "O corpo consegue quase tudo. É a mente que precisamos convencer",
  "Sua saúde é um investimento, não uma despesa",
  "Disciplina é escolher entre o que você quer agora e o que você quer mais",
  "Não pare quando estiver cansado. Pare quando estiver pronto",
  "Consistência supera intensidade",
  "A mudança não vem sem desafio",
];

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>(PeriodType.Day);
  const [selectedCardType, setSelectedCardType] = useState<CardType>(CardType.Overall);
  const [stats, setStats] = useState<ShareStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fraseMotivacional, setFraseMotivacional] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Não precisamos mais fixar o body completamente, apenas impedir o scroll
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Evitar deslocamento da página

      const randomIndex = Math.floor(Math.random() * fraseMotivacionais.length);
      setFraseMotivacional(fraseMotivacionais[randomIndex]);

      if (selectedCardType === CardType.Meal && selectedPeriod !== PeriodType.Day) {
        setSelectedPeriod(PeriodType.Day);
      }

      fetchStats(selectedPeriod, selectedCardType);
      
      return () => {
        // Restaurar scroll quando fechar o modal
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      };
    }
  }, [isOpen, selectedPeriod, selectedCardType]);

  useEffect(() => {
    if (isOpen && !loading && stats && cardRef.current) {
      // Forçar repaint do DOM quando as estatísticas são carregadas
      console.log('Forçando repaint do card para garantir renderização correta');
      setTimeout(() => {
        if (cardRef.current) {
          // Forçar um repaint para garantir que o elemento está renderizado
          cardRef.current.style.display = 'none';
          void cardRef.current.offsetHeight; // Acesso à propriedade para forçar layout recalculation
          cardRef.current.style.display = 'block';
          
          // Certifique-se de que a referência tem dimensões válidas
          if (cardRef.current && cardRef.current.offsetWidth > 0 && cardRef.current.offsetHeight > 0) {
            console.log('Card renderizado com sucesso. Dimensões:', 
                cardRef.current.offsetWidth, 'x', cardRef.current.offsetHeight);
          } else if (cardRef.current) {
            console.warn('Card pode não estar visível. Dimensões:', 
                cardRef.current.offsetWidth, 'x', cardRef.current.offsetHeight);
          }
        }
      }, 100);
    }
  }, [isOpen, loading, stats]);

  // Garantir que o card esteja visível antes de tentar capturar
  useEffect(() => {
    if (stats && cardRef.current) {
      // Quando as estatísticas são carregadas, marcar o card como visível
      setCardVisible(true);
    } else {
      setCardVisible(false);
    }
  }, [stats]);

  const fetchStats = async (period: PeriodType, cardType: CardType) => {
    setLoading(true);
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.error('Usuário não autenticado');
        setLoading(false);
        return;
      }

      if (cardType === CardType.Meal && period !== PeriodType.Day) {
        setSelectedPeriod(PeriodType.Day);
        period = PeriodType.Day;
      }

      // Buscar dados do perfil do usuário
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        throw userError;
      }

      if (!userData) {
        throw new Error('Usuário não encontrado');
      }

      // Calcular datas para o período selecionado
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let startDate = new Date(today);
      let endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      
      if (period === PeriodType.Week) {
        startDate.setDate(today.getDate() - 6);
      } else if (period === PeriodType.Month) {
        startDate.setDate(today.getDate() - 29);
      }
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Inicializar objeto de estatísticas com dados do perfil
      let statsData: ShareStats = {
        nome: userData.nome,
        foto_url: userData.foto_url || "",
        peso: userData.peso || 0,
        calorias: 0,
        proteinas: 0,
        treinos: 0,
        periodo: period,
        meta_calorica: userData.meta_calorica || 2300,
        meta_proteina: userData.meta_proteina || 120,
        meta_treinos: userData.meta_treinos || (period === PeriodType.Day ? 1 : period === PeriodType.Week ? 5 : 20),
      };

      // Buscar dados específicos dependendo do tipo de card
      if (cardType === CardType.Overall || cardType === CardType.Workout) {
        // Buscar treinos do período
        const { data: treinosData, error: treinosError } = await supabase
          .from('treinos')
          .select('*')
          .eq('usuario_id', userId)
          .gte('data', startDateStr)
          .lte('data', endDateStr);

        if (treinosError) {
          throw treinosError;
        }

        // Calcular estatísticas de treinos
        let totalCalorias = 0;
        let totalTempoTreino = 0;
        let treinosMusculacao = 0;
        let treinosCardio = 0;

        treinosData?.forEach(treino => {
          totalCalorias += treino.calorias || 0;
          totalTempoTreino += treino.duracao || 0;
          
          if (treino.tipo === 'musculacao') {
            treinosMusculacao++;
          } else if (treino.tipo === 'cardio') {
            treinosCardio++;
          }
        });

        statsData.calorias = totalCalorias;
        statsData.tempoTreino = totalTempoTreino;
        statsData.musculacao = treinosMusculacao;
        statsData.cardio = treinosCardio;
        statsData.treinos = (treinosData || []).length;
      }

      if (cardType === CardType.Overall || cardType === CardType.Meal) {
        // Buscar refeições do período
        const { data: refeicoesData, error: refeicoesError } = await supabase
          .from('refeicoes')
          .select('*')
          .eq('usuario_id', userId)
          .gte('data', startDateStr)
          .lte('data', endDateStr);

        if (refeicoesError) {
          throw refeicoesError;
        }

        // Calcular estatísticas de refeições
        let totalProteinas = 0;
        let totalCaloriasConsumidas = 0;

        refeicoesData?.forEach(refeicao => {
          totalProteinas += refeicao.proteina || 0;
          totalCaloriasConsumidas += refeicao.calorias || 0;
        });

        statsData.proteinas = totalProteinas;
        statsData.caloriaConsumidas = totalCaloriasConsumidas;
        statsData.refeicoes = (refeicoesData || []).length;
      }

      if (cardType === CardType.Weight) {
        // Buscar registros de peso para calcular evolução
        const { data: pesosData, error: pesosError } = await supabase
          .from('peso_registros')
          .select('*')
          .eq('usuario_id', userId)
          .order('data', { ascending: true });

        if (pesosError) {
          throw pesosError;
        }

        if (pesosData && pesosData.length > 0) {
          const pesoInicial = pesosData[0].peso;
          const pesoAtual = pesosData[pesosData.length - 1].peso;
          const pesoPerdido = Math.max(0, pesoInicial - pesoAtual);
          
          // Supondo que a meta seja perder 10% do peso inicial
          const meta = pesoInicial * 0.1;
          const percentualMeta = Math.min(100, Math.round((pesoPerdido / meta) * 100));

          statsData.peso = pesoAtual;
          statsData.pesoInicial = pesoInicial;
          statsData.pesoPerda = pesoPerdido;
          statsData.percentual = percentualMeta;
        } else {
          // Se não houver registros de peso, usar o peso do perfil
          statsData.peso = userData.peso || 0;
          statsData.pesoInicial = userData.peso || 0;
          statsData.pesoPerda = 0;
          statsData.percentual = 0;
        }
      }

      setStats(statsData);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para capturar o card como imagem
  const captureCard = async (): Promise<Blob> => {
    if (!cardRef.current) {
      throw new Error('Referência do card não encontrada');
    }
    
    console.log('Iniciando captura do card...');
    
    // Verificar se o card está realmente visível
    if (!cardVisible) {
      throw new Error('O card não está visível para captura');
    }
    
    // Verificar se o card tem dimensões válidas
    const rect = cardRef.current.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 50) {
      throw new Error(`Dimensões do card inválidas: ${rect.width}x${rect.height}`);
    }
    
    // Encontrar e esconder temporariamente elementos de loading
    const loadingElements = document.querySelectorAll('.loading-overlay');
    loadingElements.forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });
    
    return new Promise<Blob>((resolve, reject) => {
      setTimeout(() => {
        try {
          toBlob(cardRef.current!, {
            quality: 1,
            pixelRatio: 3,
            cacheBust: true,
            backgroundColor: '#0F0F0F'
          })
            .then(blob => {
              // Restaurar elementos de loading
              loadingElements.forEach((el) => {
                (el as HTMLElement).style.display = '';
              });
              
              if (!blob) {
                reject(new Error('Falha ao gerar blob da imagem'));
                return;
              }
              
              // Verificar se o blob tem tamanho válido
              if (blob.size < 1000) {
                reject(new Error(`Imagem gerada muito pequena: ${blob.size} bytes`));
                return;
              }
              
              resolve(blob);
            })
            .catch(err => {
              // Restaurar elementos de loading em caso de erro
              loadingElements.forEach((el) => {
                (el as HTMLElement).style.display = '';
              });
              
              reject(err);
            });
        } catch (err) {
          // Restaurar elementos de loading em caso de erro
          loadingElements.forEach((el) => {
            (el as HTMLElement).style.display = '';
          });
          
          reject(err);
        }
      }, 500);
    });
  };

  const handleShare = async () => {
    if (!cardRef.current || !cardVisible) {
      console.error('Referência do card não encontrada ou card não visível');
      alert('Não foi possível compartilhar: o card não está pronto para captura. Tente novamente em alguns segundos.');
      return;
    }

    try {
      // Primeiro, garantir que não estamos no estado de loading
      if (isLoading) {
        setIsLoading(false);
        // Aguardar um momento para garantir que a UI atualizou
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Agora definir loading para true para mostrar feedback ao usuário
      setIsLoading(true);
      
      // Capturar o card como imagem
      console.log('Iniciando processo de compartilhamento...');
      const blob = await captureCard();
      
      // Verificar se o blob tem tamanho válido
      if (blob.size < 1000) {
        throw new Error(`Imagem gerada muito pequena: ${blob.size} bytes`);
      }
      
      // Criar arquivo para compartilhamento
      const file = new File([blob], 'progresso.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Meu progresso fitness',
            text: 'Veja meu progresso no minimalist.fit',
            files: [file],
          });
          console.log('Compartilhamento concluído com sucesso');
        } catch (err) {
          console.error('Erro ao compartilhar via API Share:', err);
          // Fallback para download se o compartilhamento falhar
          saveAs(blob, 'progresso.png');
        }
      } else {
        console.log('API Share não disponível ou não suporta compartilhamento de arquivos, usando fallback para download');
        saveAs(blob, 'progresso.png');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Erro detalhado ao gerar/compartilhar imagem:', error);
      let mensagemErro = 'Não foi possível gerar a imagem para compartilhamento.';
      
      if (error.message) {
        mensagemErro += ` Detalhes: ${error.message}`;
      }
      
      alert(mensagemErro + '\n\nTente novamente ou use uma captura de tela manual.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current || !cardVisible) {
      console.error('Referência do card não encontrada ou card não visível');
      alert('Não foi possível fazer o download: o card não está pronto para captura. Tente novamente em alguns segundos.');
      return;
    }

    try {
      // Primeiro, garantir que não estamos no estado de loading
      if (isLoading) {
        setIsLoading(false);
        // Aguardar um momento para garantir que a UI atualizou
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Agora definir loading para true para mostrar feedback ao usuário
      setIsLoading(true);
      
      // Capturar o card como imagem
      console.log('Iniciando processo de download...');
      const blob = await captureCard();
      
      // Verificar se o blob tem tamanho válido
      if (blob.size < 1000) {
        throw new Error(`Imagem gerada muito pequena: ${blob.size} bytes`);
      }
      
      // Fazer download da imagem
      saveAs(blob, 'progresso.png');
      console.log('Download da imagem iniciado');
    } catch (err) {
      const error = err as Error;
      console.error('Erro detalhado ao gerar imagem para download:', error);
      let mensagemErro = 'Não foi possível gerar a imagem para download.';
      
      if (error.message) {
        mensagemErro += ` Detalhes: ${error.message}`;
      }
      
      alert(mensagemErro + '\n\nTente novamente ou use uma captura de tela manual.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeLabelForPeriod = (periodo: PeriodType) => {
    return periodo === PeriodType.Day ? 'Hoje' :
           periodo === PeriodType.Week ? 'Esta semana' :
           'Este mês';
  };

  const cardContent = useMemo<JSX.Element | null>(() => {
    if (!stats) return null;

    const renderBasicCard = () => (
      <div
        ref={cardRef}
        className="rounded-lg overflow-hidden relative"
        style={{
          width: '300px',
          height: 'auto',
          backgroundColor: '#0F0F0F',
          borderRadius: '20px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          border: '1px solid #222',
          padding: '16px',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
          color: '#fff',
          willChange: 'transform',
          transform: 'translateZ(0)',
          opacity: 1,
          filter: 'none',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          display: 'block',
          position: 'relative',
          minHeight: '200px',
          visibility: 'visible',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at top right, rgba(74, 47, 189, 0.1), transparent 350px), radial-gradient(circle at bottom left, rgba(0, 230, 118, 0.05), transparent 300px)',
          zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            marginBottom: '20px',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <h2 style={{
              fontSize: '22px',
              fontWeight: 700,
              marginBottom: '4px',
              background: 'linear-gradient(90deg, #fff, #ccc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
            }}>
              {stats.nome}
            </h2>
            {selectedCardType !== CardType.Weight && (
              <p style={{
                fontSize: '14px',
                color: '#aaa',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 2V6M8 2V6M3 10H21M8 14H10M14 14H16M8 18H10M14 18H16" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {getTimeLabelForPeriod(stats.periodo)}
              </p>
            )}
          </div>

          {selectedCardType === CardType.Overall && renderOverallStats()}
          {selectedCardType === CardType.Meal && renderMealStats()}
          {selectedCardType === CardType.Workout && renderWorkoutStats()}
          {selectedCardType === CardType.Weight && renderWeightStats()}

          <div style={{
            marginTop: '16px',
            padding: '8px 12px',
            borderLeft: '3px solid #00E676',
            borderRadius: '4px',
          }}>
            <p style={{
              margin: 0,
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '500',
              fontStyle: 'italic',
              textAlign: 'center',
              letterSpacing: '0.3px',
              textShadow: '0px 1px 2px rgba(0,0,0,0.3)',
            }}>
              "{fraseMotivacional}"
            </p>
          </div>
        </div>
      </div>
    );

    const renderOverallStats = () => (
      <div className="flex flex-col w-full gap-3">
        <div className="w-full mb-2">
          <div className="stat-box bg-[#1b1b1b80] rounded-2xl p-3 flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center">
              <ListTodo className="w-5 h-5 text-[#00E676]" />
            </div>
            <div className="text-[#E0E0E0] text-base font-medium">Resumo de Progresso</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 w-full">
          <div className="stat-box bg-[#1b1b1b80] rounded-2xl p-3.5 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-4 h-4 text-[#FFC107]" />
              <span className="text-[#B0B0B0] text-sm">Peso</span>
            </div>
            <span className="text-white text-2xl font-bold">{stats.peso} kg</span>
            <div className="mt-1 w-full h-1 bg-[#FFC10733]">
              <div className="h-full bg-[#FFC107]" style={{ width: '60%' }}></div>
            </div>
          </div>

          <div className="stat-box bg-[#1b1b1b80] rounded-2xl p-3.5 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="w-4 h-4 text-[#00E676]" />
              <span className="text-[#B0B0B0] text-sm">Treinos</span>
            </div>
            <span className="text-white text-2xl font-bold">{stats.treinos}</span>
            <div className="mt-1 w-full h-1 bg-[#00E67633]">
              <div className="h-full bg-[#00E676]" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="stat-box bg-[#1b1b1b80] rounded-2xl p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#FF5252]" />
                <span className="text-[#B0B0B0] text-sm">Calorias Gastas</span>
              </div>
              <span className="text-white text-xl font-bold">{stats.calorias} kcal</span>
            </div>
            <div className="w-full h-1 bg-[#FF525233]">
              <div className="h-full bg-[#FF5252]" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );

    const renderMealStats = () => (
      <div className="flex flex-col w-full gap-4">
        <div className="stat-box bg-[#1b1b1b80] rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-6 h-6 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-[#FF5B52]" />
            </div>
            <div className="text-[#E0E0E0] text-lg font-medium">Refeições</div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-white text-3xl font-bold">{stats.refeicoes || 0}</span>
            <span className="text-[#B0B0B0] text-sm pb-1">{stats.periodo === PeriodType.Day ? 'hoje' : 'total'}</span>
          </div>
          <div className="mt-1 w-full h-1 bg-[#FF5B5233]">
            <div className="h-full bg-[#FF5B52]" style={{ width: '100%' }}></div>
          </div>
        </div>
    
        <div className="stat-box bg-[#1b1b1b80] rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-6 h-6 flex items-center justify-center">
              <Dna className="w-4 h-4 text-[#3D5AFE]" />
            </div>
            <div className="text-[#E0E0E0] text-lg font-medium">Proteína Consumida</div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-white text-3xl font-bold">{stats.proteinas || 0}</span>
            <span className="text-[#B0B0B0] text-sm pb-1">g</span>
          </div>
          <div className="mt-1 w-full h-1 bg-[#3D5AFE33]">
            <div className="h-full bg-[#3D5AFE]" style={{ width: `${Math.min(100, ((stats.proteinas || 0) / (stats.meta_proteina || 120)) * 100)}%` }}></div>
          </div>
          <div className="text-[#B0B0B0] text-xs mt-1">Limite diário: {stats.meta_proteina || 120}g</div>
        </div>
    
        <div className="stat-box bg-[#1b1b1b80] rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-6 h-6 flex items-center justify-center">
              <Flame className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div className="text-[#E0E0E0] text-lg font-medium">Calorias Consumidas</div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-white text-3xl font-bold">{stats.caloriaConsumidas || 0}</span>
            <span className="text-[#B0B0B0] text-sm pb-1">kcal</span>
          </div>
          <div className="mt-1 w-full h-1 bg-[#FFD70033]">
            <div className="h-full bg-[#FFD700]" style={{ width: `${Math.min(100, ((stats.caloriaConsumidas || 0) / (stats.meta_calorica || 2300)) * 100)}%` }}></div>
          </div>
          <div className="text-[#B0B0B0] text-xs mt-1">Limite diário: {stats.meta_calorica || 2300} kcal</div>
        </div>
      </div>
    );
    
    const renderWorkoutStats = () => (
      <div className="flex flex-col w-full gap-4">
        <div className="stat-box bg-[#1b1b1b80] rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-6 h-6 flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#FF5252]" />
            </div>
            <div className="text-[#E0E0E0] text-lg font-medium">Calorias Gastas</div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-white text-3xl font-bold">{stats.calorias || 0}</span>
            <span className="text-[#B0B0B0] text-sm pb-1">kcal</span>
          </div>
          <div className="mt-1 w-full h-1 bg-[#FF525233]">
            <div className="h-full bg-[#FF5252]" style={{ width: '100%' }}></div>
          </div>
        </div>
    
        <div className="stat-box bg-[#1b1b1b80] rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-6 h-6 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div className="text-[#E0E0E0] text-lg font-medium">Tempo de Treino</div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-white text-3xl font-bold">{stats.tempoTreino || 0}</span>
            <span className="text-[#B0B0B0] text-sm pb-1">min</span>
          </div>
          <div className="mt-1 w-full h-1 bg-[#FFD70033]">
            <div className="h-full bg-[#FFD700]" style={{ width: '100%' }}></div>
          </div>
        </div>
    
        <div className="w-full bg-[#1b1b1b80] rounded-2xl p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-6 h-6 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-[#00E676]" />
            </div>
            <div className="text-[#E0E0E0] text-base font-medium">Treinos Realizados</div>
          </div>
    
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#3D5AFE]"></div>
              <span className="text-[#E0E0E0] text-sm">Musculação</span>
            </div>
            <span className="text-white font-semibold">{stats.musculacao || 0}</span>
          </div>
    
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#00E676]"></div>
              <span className="text-[#E0E0E0] text-sm">Cardio</span>
            </div>
            <span className="text-white font-semibold">{stats.cardio || 0}</span>
          </div>
    
          <div className="mt-3 w-full h-1.5 bg-[#3D5AFE33] rounded-full overflow-hidden">
            <div className="h-full bg-[#3D5AFE]" style={{ width: `${Math.min(100, (((stats.musculacao || 0) + (stats.cardio || 0)) / (stats.periodo === PeriodType.Day ? 1 : stats.periodo === PeriodType.Week ? 5 : 20)) * 100)}%` }}></div>
          </div>
          <div className="text-[#B0B0B0] text-xs mt-1 text-right">
            {Math.round(((stats.musculacao || 0) + (stats.cardio || 0)) / (stats.periodo === PeriodType.Day ? 1 : stats.periodo === PeriodType.Week ? 5 : 20) * 100)}% do objetivo
          </div>
        </div>
      </div>
    );
    
    const renderWeightStats = () => {
      const pesoInicial = stats.pesoInicial || 0;
      const pesoAtual = stats.peso || 0;
      const pesoPerdido = Math.max(0, pesoInicial - pesoAtual).toFixed(1);
      const metaPeso = Math.max(0, pesoInicial - 10);
      const percentualAtingido = Math.min(100, Math.round((pesoInicial - pesoAtual) / 10 * 100));

      return (
        <div className="flex flex-col w-full gap-4">
          <div className="flex items-center justify-between p-4 bg-[#1b1b1b80] rounded-2xl">
            <div>
              <div className="text-[#B0B0B0] text-sm mb-1">Peso Atual</div>
              <div className="text-white text-3xl font-bold">{pesoAtual} kg</div>
            </div>
            <div className="w-16 h-16 rounded-full bg-[rgba(0,230,118,0.1)] flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23 7L13.5 17.5L8.5 12.5L1 20M16 7H23V14" stroke="#00E676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
    
          <div className="p-4 bg-[#1b1b1b80] rounded-2xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M5.00006 19L19.0001 19M12 3V5M19 12H21M5 5L7.5 7.5M19 5L16.5 7.5M12 12L7 20.6612M12 12L17 20.6612M12 12V17.5" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-[#E0E0E0] text-lg font-medium">Progresso de Peso</div>
            </div>
    
            <div className="flex justify-between mb-4">
              <div>
                <div className="text-[#B0B0B0] text-sm mb-1">Peso Inicial</div>
                <div className="text-white text-xl font-semibold">{pesoInicial} kg</div>
              </div>
              <div>
                <div className="text-[#B0B0B0] text-sm mb-1">Peso Perdido</div>
                <div className="text-[#00E676] text-xl font-semibold">{pesoPerdido} kg</div>
              </div>
            </div>
    
            <div className="mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-[#B0B0B0] text-sm">Progresso da Meta</span>
                <span className="text-[#B0B0B0] text-sm">{percentualAtingido}%</span>
              </div>
              <div className="h-2 bg-[rgba(0,230,118,0.1)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00E676] rounded-full"
                  style={{ width: `${percentualAtingido}%` }}
                ></div>
              </div>
            </div>
    
            <div className="flex justify-between text-xs text-[#B0B0B0] mt-2">
              <span>Inicial: {pesoInicial} kg</span>
              <span>Atual: {pesoAtual} kg</span>
              <span>Meta: {metaPeso} kg</span>
            </div>
          </div>
    
          <div className="p-4 bg-[#1b1b1b80] rounded-2xl">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#3D5AFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-[#E0E0E0] text-base font-medium">Histórico de Perda</div>
            </div>
    
            <div className="flex items-center mt-2">
              <div className="flex-1 h-24 relative">
                <div className="absolute inset-0 flex items-end">
                  <div className="w-1/6 h-[30%] bg-[#3D5AFE33] rounded-t-sm mr-1"></div>
                  <div className="w-1/6 h-[45%] bg-[#3D5AFE33] rounded-t-sm mr-1"></div>
                  <div className="w-1/6 h-[25%] bg-[#3D5AFE33] rounded-t-sm mr-1"></div>
                  <div className="w-1/6 h-[60%] bg-[#3D5AFE33] rounded-t-sm mr-1"></div>
                  <div className="w-1/6 h-[40%] bg-[#3D5AFE33] rounded-t-sm mr-1"></div>
                  <div className="w-1/6 h-[70%] bg-[#3D5AFE33] rounded-t-sm"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#444]"></div>
              </div>
            </div>
    
            <div className="text-center text-[#B0B0B0] text-xs mt-2">
              Perda de peso consistente nas últimas 6 semanas
            </div>
          </div>
        </div>
      );
    };
    
    return renderBasicCard();
  }, [stats, fraseMotivacional, selectedCardType, cardRef]);
    
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
          style={{ zIndex: 100 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#0F0F0F] rounded-2xl shadow-xl p-5 max-w-md w-full max-h-[90vh] relative overflow-hidden my-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative gradients in corners */}
            <div 
              className="absolute top-0 right-0 w-72 h-72 opacity-15 z-0 pointer-events-none"
              style={{ 
                background: 'radial-gradient(circle at top right, rgba(61, 90, 254, 0.5), transparent 70%)',
                transform: 'translate(30%, -30%)'
              }}
            />
            <div 
              className="absolute bottom-0 left-0 w-72 h-72 opacity-15 z-0 pointer-events-none"
              style={{ 
                background: 'radial-gradient(circle at bottom left, rgba(0, 230, 118, 0.5), transparent 70%)',
                transform: 'translate(-30%, 30%)'
              }}
            />
            
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h2 className="text-xl font-bold text-white">
                Compartilhar Progresso
              </h2>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[#222222] text-white"
                whileTap={{ scale: 0.9 }}
              >
                <FiX className="w-5 h-5" />
              </motion.button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-1 relative z-10 hide-scrollbar">
              <div className="mb-4">
                <motion.div 
                  className="flex gap-2 p-2 rounded-lg bg-[#1A1A1A] flex-grow mb-4"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.button
                    onClick={() => setSelectedCardType(CardType.Overall)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      selectedCardType === CardType.Overall
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : 'text-[#B0B0B0] hover:text-white'
                    }`}
                    whileTap={{ scale: 0.97 }}
                  >
                    Geral
                  </motion.button>
                  <motion.button
                    onClick={() => setSelectedCardType(CardType.Meal)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      selectedCardType === CardType.Meal
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : 'text-[#B0B0B0] hover:text-white'
                    }`}
                    whileTap={{ scale: 0.97 }}
                  >
                    Refeição
                  </motion.button>
                  <motion.button
                    onClick={() => setSelectedCardType(CardType.Workout)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      selectedCardType === CardType.Workout
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : 'text-[#B0B0B0] hover:text-white'
                    }`}
                    whileTap={{ scale: 0.97 }}
                  >
                    Treino
                  </motion.button>
                  <motion.button
                    onClick={() => setSelectedCardType(CardType.Weight)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      selectedCardType === CardType.Weight
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : 'text-[#B0B0B0] hover:text-white'
                    }`}
                    whileTap={{ scale: 0.97 }}
                  >
                    Peso
                  </motion.button>
                </motion.div>
              </div>
    
              <div className="mb-4">
                <motion.div 
                  className="flex gap-2 p-2 rounded-lg bg-[#1A1A1A] flex-grow"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.button
                    onClick={() => setSelectedPeriod(PeriodType.Day)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      selectedPeriod === PeriodType.Day
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : 'text-[#B0B0B0] hover:text-white'
                    }`}
                    whileTap={{ scale: 0.97 }}
                  >
                    Dia
                  </motion.button>
    
                  {selectedCardType !== CardType.Meal && (
                    <>
                      <motion.button
                        onClick={() => setSelectedPeriod(PeriodType.Week)}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                          selectedPeriod === PeriodType.Week
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                            : 'text-[#B0B0B0] hover:text-white'
                        }`}
                        whileTap={{ scale: 0.97 }}
                      >
                        Semana
                      </motion.button>
                      <motion.button
                        onClick={() => setSelectedPeriod(PeriodType.Month)}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                          selectedPeriod === PeriodType.Month
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                            : 'text-[#B0B0B0] hover:text-white'
                        }`}
                        whileTap={{ scale: 0.97 }}
                      >
                        Mês
                      </motion.button>
                    </>
                  )}
                </motion.div>
              </div>
    
              <div className="flex justify-center mb-6 overflow-hidden">
                {loading ? (
                  <motion.div 
                    className="flex items-center justify-center h-[400px] w-full rounded-xl bg-[#1A1A1A]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex flex-col items-center">
                      <motion.div 
                        className="w-8 h-8 border-4 border-t-blue-500 border-b-transparent border-l-transparent border-r-transparent rounded-full mb-2"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      ></motion.div>
                      <p className="text-[#B0B0B0]">Carregando estatísticas...</p>
                    </div>
                  </motion.div>
                ) : stats ? (
                  <div className="relative">
                    {/* Card sempre renderizado quando stats existe */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {cardContent}
                    </motion.div>
                    
                    {/* Overlay de loading que será escondido durante a captura */}
                    {isLoading && (
                      <motion.div 
                        className="loading-overlay absolute inset-0 flex items-center justify-center bg-[#1A1A1A] bg-opacity-80 rounded-xl z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="flex flex-col items-center">
                          <motion.div 
                            className="w-8 h-8 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full mb-2"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          ></motion.div>
                          <p className="text-[#B0B0B0]">Gerando imagem...</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <motion.div 
                    className="flex items-center justify-center h-[400px] w-full rounded-xl bg-[#1A1A1A]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className="text-[#B0B0B0]">Nenhuma estatística disponível</p>
                  </motion.div>
                )}
              </div>
    
              <motion.div 
                className="flex gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <motion.button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all"
                  disabled={loading || !stats || isLoading || !cardVisible}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <motion.div 
                      className="w-5 h-5 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    ></motion.div>
                  ) : (
                    <Share2 />
                  )}
                  <span>{isLoading ? "Processando..." : "Compartilhar"}</span>
                </motion.button>
    
                <motion.button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#1A1A1A] hover:bg-[#222222] text-white border border-[#333333] transition-all"
                  disabled={loading || !stats || isLoading || !cardVisible}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <motion.div 
                      className="w-5 h-5 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    ></motion.div>
                  ) : (
                    <Download />
                  )}
                  <span>{isLoading ? "Processando..." : "Baixar"}</span>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;