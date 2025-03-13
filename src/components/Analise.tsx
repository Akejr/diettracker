import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  Title
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { supabaseApi } from '../lib/supabase';
import { dateService } from '../services/dateService';

// Registra os componentes do Chart.js
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  Title
);

interface DadosDiarios {
  data: string;
  calorias: number;
  proteinas: number;
  musculacao: number;
  cardio: number;
}

const Analise: React.FC = () => {
  const [dadosMensais, setDadosMensais] = useState<DadosDiarios[]>([]);
  const [mediaCalorias, setMediaCalorias] = useState(0);
  const [mediaProteinas, setMediaProteinas] = useState(0);
  const [freqMusculacao, setFreqMusculacao] = useState(0);
  const [freqCardio, setFreqCardio] = useState(0);
  const [metaCalorica, setMetaCalorica] = useState(0);
  const [metaProteina, setMetaProteina] = useState(0);
  const [mesAtual, setMesAtual] = useState<Date>(dateService.getCurrentDate());

  useEffect(() => {
    const unsubscribe = dateService.subscribe((date) => {
      const novaData = new Date(date.getFullYear(), date.getMonth(), 1);
      if (novaData.getTime() !== mesAtual.getTime()) {
        setMesAtual(novaData);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    carregarDados();
  }, [mesAtual]);

  const mesAnterior = () => {
    const dataAtual = dateService.getCurrentDate();
    const novaData = new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1);
    
    if (novaData <= dataAtual) {
      setMesAtual(novaData);
    }
  };

  const mesProximo = () => {
    const dataAtual = dateService.getCurrentDate();
    const novaData = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1);
    
    if (novaData <= dataAtual) {
      setMesAtual(novaData);
    }
  };

  const carregarDados = async () => {
    try {
      const dataAtual = dateService.getCurrentDate();
      let primeiroDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
      let ultimoDiaMes = new Date(dataAtual);

      // Exceção para março de 2025: começar do dia 10
      if (mesAtual.getMonth() === 2 && mesAtual.getFullYear() === 2025) {
        primeiroDiaMes = new Date(2025, 2, 10);
      }

      // Se não for o mês atual, usar o último dia do mês
      if (mesAtual.getMonth() !== dataAtual.getMonth() || 
          mesAtual.getFullYear() !== dataAtual.getFullYear()) {
        ultimoDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);
      }

      const { data: usuario } = await supabaseApi.supabase
        .from('usuarios')
        .select('*')
        .limit(1)
        .single();

      if (!usuario) {
        console.error('Usuário não encontrado');
        return;
      }

      setMetaCalorica(usuario.meta_calorica);
      setMetaProteina(usuario.meta_proteina);

      const { data: refeicoes } = await supabaseApi.supabase
        .from('refeicoes')
        .select('*')
        .eq('usuario_id', usuario.id)
        .gte('data', dateService.formatDate(primeiroDiaMes))
        .lte('data', dateService.formatDate(ultimoDiaMes));

      const { data: treinos } = await supabaseApi.supabase
        .from('treinos')
        .select('*')
        .eq('usuario_id', usuario.id)
        .gte('data', dateService.formatDate(primeiroDiaMes))
        .lte('data', dateService.formatDate(ultimoDiaMes));

      const dadosPorDia = new Map<string, DadosDiarios>();
      
      let diaAtual = new Date(primeiroDiaMes);
      while (diaAtual <= ultimoDiaMes) {
        const dataFormatada = dateService.formatDate(diaAtual);
        dadosPorDia.set(dataFormatada, {
          data: dataFormatada,
          calorias: 0,
          proteinas: 0,
          musculacao: 0,
          cardio: 0
        });
        diaAtual.setDate(diaAtual.getDate() + 1);
      }
      
      refeicoes?.forEach(refeicao => {
        const dia = refeicao.data;
        const dadosDia = dadosPorDia.get(dia);
        if (dadosDia) {
          dadosDia.calorias += refeicao.calorias;
          dadosDia.proteinas += refeicao.proteina;
        }
      });

      treinos?.forEach(treino => {
        const dia = treino.data;
        const dadosDia = dadosPorDia.get(dia);
        if (dadosDia) {
          if (treino.tipo === 'musculacao') {
            dadosDia.musculacao += treino.duracao / 60;
          } else if (treino.tipo === 'cardio') {
            dadosDia.cardio += treino.duracao;
          }
        }
      });

      const dadosOrdenados = Array.from(dadosPorDia.values())
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

      setDadosMensais(dadosOrdenados);

      const diasComDados = dadosOrdenados.filter(dia => 
        dia.calorias > 0 || dia.proteinas > 0 || dia.musculacao > 0 || dia.cardio > 0
      );

      if (diasComDados.length > 0) {
        const totalCalorias = diasComDados.reduce((sum, dia) => sum + dia.calorias, 0);
        const totalProteinas = diasComDados.reduce((sum, dia) => sum + dia.proteinas, 0);
        
        setMediaCalorias(totalCalorias / diasComDados.length);
        setMediaProteinas(totalProteinas / diasComDados.length);

        const hoje = dateService.getCurrentDate();
        hoje.setHours(0, 0, 0, 0);

        const primeiroDiaPeriodo = mesAtual.getMonth() === 2 && mesAtual.getFullYear() === 2025
          ? new Date(2025, 2, 10)
          : new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);

        const ultimoDiaPeriodo = mesAtual.getMonth() === hoje.getMonth() && 
                                mesAtual.getFullYear() === hoje.getFullYear()
          ? hoje
          : ultimoDiaMes;

        let diasUteisPassados = 0;
        let dataTemp = new Date(primeiroDiaPeriodo);
        
        while (dataTemp <= ultimoDiaPeriodo) {
          const diaDaSemana = dataTemp.getDay();
          if (diaDaSemana >= 1 && diaDaSemana <= 5) {
            diasUteisPassados++;
          }
          dataTemp.setDate(dataTemp.getDate() + 1);
        }

        const treinos = dadosOrdenados.filter(dia => {
          const dataDia = new Date(dia.data);
          return dataDia >= primeiroDiaPeriodo && dataDia <= ultimoDiaPeriodo;
        });

        const diasComMusculacao = treinos.filter(dia => dia.musculacao > 0).length;
        const diasComCardio = treinos.filter(dia => dia.cardio > 0).length;

        setFreqMusculacao(diasComMusculacao / diasUteisPassados);
        setFreqCardio(diasComCardio / diasUteisPassados);
      } else {
        setMediaCalorias(0);
        setMediaProteinas(0);
        setFreqMusculacao(0);
        setFreqCardio(0);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const avaliarProgressoCalorias = (porcentagem: number) => {
    if (porcentagem <= 100) return 'Bom';
    if (porcentagem <= 120) return 'Moderado';
    return 'Ruim';
  };

  const avaliarProgressoProteinas = (porcentagem: number) => {
    if (porcentagem >= 100) return 'Bom';
    if (porcentagem >= 70) return 'Moderado';
    return 'Ruim';
  };

  const getProgressColorCalorias = (porcentagem: number) => {
    if (porcentagem <= 100) return '#22C55E';
    if (porcentagem <= 120) return '#3B82F6';
    return '#EF4444';
  };

  const getProgressColorProteinas = (porcentagem: number) => {
    if (porcentagem >= 100) return '#22C55E';
    if (porcentagem >= 70) return '#3B82F6';
    return '#EF4444';
  };

  const getProgressColorTreino = (porcentagem: number) => {
    if (porcentagem >= 70) return '#22C55E';
    if (porcentagem >= 50) return '#3B82F6';
    return '#EF4444';
  };

  const avaliarProgresso = (porcentagem: number) => {
    if (porcentagem >= 70) return 'Bom';
    if (porcentagem >= 50) return 'Moderado';
    return 'Ruim';
  };

  const doughnutOptions = {
    responsive: true,
    cutout: '75%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    elements: {
      arc: {
        borderWidth: 0,
      },
    },
  };

  const createDoughnutData = (valor: number, meta: number, tipo: 'calorias' | 'proteinas' | 'treino') => {
    const porcentagem = (valor / meta) * 100;
    let color;
    if (tipo === 'calorias') {
      color = getProgressColorCalorias(porcentagem);
    } else if (tipo === 'proteinas') {
      color = getProgressColorProteinas(porcentagem);
    } else {
      color = getProgressColorTreino(porcentagem);
    }
    
    return {
      datasets: [{
        data: [Math.min(porcentagem, tipo === 'proteinas' ? 150 : 100), Math.max(0, (tipo === 'proteinas' ? 150 : 100) - porcentagem)],
        backgroundColor: [
          color,
          '#E5E7EB',
        ],
      }],
    };
  };

  const scrollParaDiaAtual = () => {
    const hoje = dateService.formatDate(dateService.getCurrentDate());
    const elementoHoje = document.getElementById(`dia-${hoje}`);
    if (elementoHoje) {
      setTimeout(() => {
        elementoHoje.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  useEffect(() => {
    if (dadosMensais.length > 0 &&
        mesAtual.getMonth() === dateService.getCurrentDate().getMonth() && 
        mesAtual.getFullYear() === dateService.getCurrentDate().getFullYear()) {
      scrollParaDiaAtual();
    }
  }, [dadosMensais, mesAtual]);

  const calcularFrequencia = (tipo: string) => {
    const hoje = dateService.getCurrentDate();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    if (hoje.getMonth() === 2 && hoje.getFullYear() === 2025) {
      inicioMes.setDate(10);
    }

    let diasUteis = 0;
    let dataAtual = new Date(inicioMes);
    
    while (dataAtual <= hoje) {
      if (dataAtual.getDay() !== 0 && dataAtual.getDay() !== 6) {
        diasUteis++;
      }
      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    const diasTreino = dadosMensais.filter(dia => {
      const dataDia = new Date(dia.data);
      return dataDia <= hoje && (
        tipo === 'musculacao' ? dia.musculacao : dia.cardio
      );
    }).length;

    return diasUteis > 0 ? (diasTreino / diasUteis) * 100 : 0;
  };

  return (
    <div className="flex-1 px-4 pb-4">
      <div className="space-y-4">
        {/* Seletor de Mês */}
        <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-[#70707033]">
          <button 
            onClick={mesAnterior}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#343030" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-sm font-medium text-[#343030]">
            {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <button 
            onClick={mesProximo}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={
              mesAtual.getMonth() === dateService.getCurrentDate().getMonth() && 
              mesAtual.getFullYear() === dateService.getCurrentDate().getFullYear()
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke={
              mesAtual.getMonth() === dateService.getCurrentDate().getMonth() && 
              mesAtual.getFullYear() === dateService.getCurrentDate().getFullYear()
              ? "#70707050"
              : "#343030"
            } className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-[#70707033]">
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-semibold text-[#343030] mb-3">
                Calorias Consumidas
              </h3>
              <div className="w-24 h-24 relative mb-2">
                <Doughnut 
                  options={doughnutOptions} 
                  data={createDoughnutData(mediaCalorias, metaCalorica, 'calorias')} 
                />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-xl font-bold text-[#343030]">
                    {Math.round((mediaCalorias / metaCalorica) * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#343030] text-center">
                <span className="font-medium">{mediaCalorias.toFixed(0)}</span>
                <span className="text-[#70707080]"> / {metaCalorica} kcal</span>
              </p>
              <p className="text-xs mt-1" style={{ color: getProgressColorCalorias((mediaCalorias / metaCalorica) * 100) }}>
                {avaliarProgressoCalorias((mediaCalorias / metaCalorica) * 100)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-[#70707033]">
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-semibold text-[#343030] mb-3">
                Proteínas Consumidas
              </h3>
              <div className="w-24 h-24 relative mb-2">
                <Doughnut 
                  options={doughnutOptions} 
                  data={createDoughnutData(mediaProteinas, metaProteina, 'proteinas')} 
                />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-xl font-bold text-[#343030]">
                    {Math.round((mediaProteinas / metaProteina) * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#343030] text-center">
                <span className="font-medium">{mediaProteinas.toFixed(0)}</span>
                <span className="text-[#70707080]"> / {metaProteina}g</span>
              </p>
              <p className="text-xs mt-1" style={{ color: getProgressColorProteinas((mediaProteinas / metaProteina) * 100) }}>
                {avaliarProgressoProteinas((mediaProteinas / metaProteina) * 100)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-[#70707033]">
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-semibold text-[#343030] mb-3">
                Musculação
              </h3>
              <div className="w-24 h-24 relative mb-2">
                <Doughnut 
                  options={doughnutOptions} 
                  data={createDoughnutData(calcularFrequencia('musculacao'), 100, 'treino')} 
                />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-xl font-bold text-[#343030]">
                    {Math.round(calcularFrequencia('musculacao'))}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#343030] text-center">
                Meta: 5x por semana
              </p>
              <p className="text-xs mt-1" style={{ color: getProgressColorTreino(calcularFrequencia('musculacao')) }}>
                {avaliarProgresso(calcularFrequencia('musculacao'))}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-[#70707033]">
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-semibold text-[#343030] mb-3">
                Cardio
              </h3>
              <div className="w-24 h-24 relative mb-2">
                <Doughnut 
                  options={doughnutOptions} 
                  data={createDoughnutData(calcularFrequencia('cardio'), 100, 'treino')} 
                />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-xl font-bold text-[#343030]">
                    {Math.round(calcularFrequencia('cardio'))}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#343030] text-center">
                Meta: 5x por semana
              </p>
              <p className="text-xs mt-1" style={{ color: getProgressColorTreino(calcularFrequencia('cardio')) }}>
                {avaliarProgresso(calcularFrequencia('cardio'))}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Cards Diários */}
        <div>
          <h3 className="text-sm font-semibold text-[#343030] mb-3">
            Análise Diária
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {dadosMensais.map((dia) => {
              const dataDia = new Date(dia.data);
              const dataAtual = dateService.getCurrentDate();
              const isHoje = 
                dataDia.getDate() === dataAtual.getDate() &&
                dataDia.getMonth() === dataAtual.getMonth() &&
                dataDia.getFullYear() === dataAtual.getFullYear();

              return (
                <div 
                  key={dia.data} 
                  id={`dia-${dia.data}`}
                  className={`bg-white rounded-xl p-3 border transition-colors ${
                    isHoje
                      ? 'border-[#3B82F6] hover:border-[#3B82F6]'
                      : 'border-[#70707033] hover:border-[#70707066]'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="font-semibold text-sm text-[#343030]">
                          {dataDia.toLocaleDateString('pt-BR', { weekday: 'long' })}
                        </p>
                        <p className="text-xs text-[#343030]">
                          {dataDia.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {dia.musculacao > 0 && (
                          <div className="flex items-center gap-1 bg-[#22C55E15] px-2 py-1 rounded-lg">
                            <span className="text-xs font-medium text-[#22C55E]">
                              {dia.musculacao.toFixed(1)}h
                            </span>
                            <span className="text-xs text-[#22C55E]">treino</span>
                          </div>
                        )}
                        {dia.cardio > 0 && (
                          <div className="flex items-center gap-1 bg-[#3B82F615] px-2 py-1 rounded-lg">
                            <span className="text-xs font-medium text-[#3B82F6]">
                              {dia.cardio}
                            </span>
                            <span className="text-xs text-[#3B82F6]">min</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#343030]">Calorias consumidas</span>
                            <span className="text-xs font-medium text-[#343030]">{dia.calorias} kcal</span>
                          </div>
                          <span 
                            className="text-xs font-medium"
                            style={{ color: getProgressColorCalorias((dia.calorias / metaCalorica) * 100) }}
                          >
                            {Math.round((dia.calorias / metaCalorica) * 100)}%
                          </span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-300" 
                            style={{
                              width: `${Math.min(120, (dia.calorias / metaCalorica) * 100)}%`,
                              backgroundColor: getProgressColorCalorias((dia.calorias / metaCalorica) * 100),
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#343030]">Proteínas consumidas</span>
                            <span className="text-xs font-medium text-[#343030]">{dia.proteinas}g</span>
                          </div>
                          <span 
                            className="text-xs font-medium"
                            style={{ color: getProgressColorProteinas((dia.proteinas / metaProteina) * 100) }}
                          >
                            {Math.round((dia.proteinas / metaProteina) * 100)}%
                          </span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-300" 
                            style={{
                              width: `${Math.min(150, (dia.proteinas / metaProteina) * 100)}%`,
                              backgroundColor: getProgressColorProteinas((dia.proteinas / metaProteina) * 100),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analise; 