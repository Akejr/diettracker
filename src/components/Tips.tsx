import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { supabaseApi, type Refeicao, type Treino } from '../lib/supabase';

interface Tip {
  id: string;
  title: string;
  description: string;
  severity: 'grave' | 'moderada' | 'leve';
}

const Tips: React.FC = () => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data, error } = await supabaseApi.supabase
          .from('usuarios')
          .select('*')
          .limit(1)
          .single();

        if (error) {
          console.error('Erro ao carregar perfil:', error);
          return;
        }

        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    const carregarDados = async () => {
      if (!profile?.id) return;

      try {
        // Carregar refeições dos últimos 7 dias
        const dataFinal = new Date();
        const dataInicial = new Date();
        dataInicial.setDate(dataInicial.getDate() - 7);

        const { data: refeicoes, error: refeicoesError } = await supabaseApi.supabase
          .from('refeicoes')
          .select('*')
          .eq('usuario_id', profile.id)
          .gte('data', dataInicial.toISOString().split('T')[0])
          .lte('data', dataFinal.toISOString().split('T')[0]);

        if (refeicoesError) throw refeicoesError;
        setRefeicoes(refeicoes || []);

        // Carregar treinos dos últimos 7 dias
        const { data: treinos, error: treinosError } = await supabaseApi.supabase
          .from('treinos')
          .select('*')
          .eq('usuario_id', profile.id)
          .gte('data', dataInicial.toISOString().split('T')[0])
          .lte('data', dataFinal.toISOString().split('T')[0]);

        if (treinosError) throw treinosError;
        setTreinos(treinos || []);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    carregarDados();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile) return;

    const newTips: Tip[] = [];

    // Análise de consumo calórico excessivo
    const ultimos5Dias = [...Array(5)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const diasComExcessoCalorico = ultimos5Dias.filter(data => {
      const refeicoesData = refeicoes.filter(r => r.data === data);
      const totalCalorias = refeicoesData.reduce((sum, r) => sum + r.calorias, 0);
      return totalCalorias > profile.meta_calorica;
    });

    if (diasComExcessoCalorico.length >= 3) {
      newTips.push({
        id: 'excesso-calorico',
        title: 'Consumo calórico excessivo',
        description: 'Você ultrapassou sua meta calórica em 3 ou mais dias nos últimos 5 dias. Isso pode prejudicar seus objetivos de composição corporal.',
        severity: 'grave'
      });
    }

    // Análise de proteína
    const ultimos7Dias = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const diasComBaixaProteina = ultimos7Dias.filter(data => {
      const refeicoesData = refeicoes.filter(r => r.data === data);
      const totalProteina = refeicoesData.reduce((sum, r) => sum + r.proteina, 0);
      return totalProteina < (profile.meta_proteina * 0.8);
    });

    if (diasComBaixaProteina.length >= 4) {
      newTips.push({
        id: 'proteina-baixa',
        title: 'Falta de proteína recorrente',
        description: 'Seu consumo de proteína está consistentemente abaixo do recomendado. Isso pode comprometer a preservação e ganho de massa muscular.',
        severity: 'grave'
      });
    } else if (diasComBaixaProteina.length >= 2) {
      newTips.push({
        id: 'proteina-irregular',
        title: 'Proteína irregular',
        description: 'Seu consumo de proteína está irregular. Tente manter um consumo mais consistente para otimizar seus resultados.',
        severity: 'moderada'
      });
    }

    // Análise de frequência de treinos
    const treinosUltimos7Dias = treinos.filter(t => ultimos7Dias.includes(t.data));
    
    if (treinosUltimos7Dias.length < 2) {
      newTips.push({
        id: 'frequencia-baixa',
        title: 'Frequência muito baixa',
        description: 'Você treinou menos de 2 vezes na última semana. A consistência é fundamental para alcançar seus objetivos.',
        severity: 'grave'
      });
    } else if (treinosUltimos7Dias.length === 5) {
      newTips.push({
        id: 'frequencia-ideal',
        title: 'Frequência abaixo do ideal',
        description: 'Você treinou 5 vezes esta semana. Tente atingir pelo menos 4 sessões para maximizar seus resultados.',
        severity: 'moderada'
      });
    }

    // Análise de recuperação
    if (treinosUltimos7Dias.length >= 6) {
      newTips.push({
        id: 'recuperacao',
        title: 'Falta de recuperação',
        description: 'Você treinou 6 ou mais vezes sem descanso. Lembre-se que o descanso é essencial para evitar lesões e overtraining.',
        severity: 'grave'
      });
    }

    // Análise de refeições
    const diasComPoucasRefeicoes = ultimos7Dias.filter(data => {
      const refeicoesData = refeicoes.filter(r => r.data === data);
      return refeicoesData.length < 3;
    });

    if (diasComPoucasRefeicoes.length >= 3) {
      newTips.push({
        id: 'refeicoes-baixas',
        title: 'Frequência de refeições baixa',
        description: 'Você teve menos de 3 refeições em vários dias. Tente organizar melhor seus horários de alimentação.',
        severity: 'moderada'
      });
    }

    // Análise de treinos de cardio
    const treinosCardio = treinosUltimos7Dias.filter(t => t.tipo === 'cardio');
    const treinosCardioIncompletos = treinosCardio.filter(t => t.duracao < 30);

    if (treinosCardioIncompletos.length > treinosCardio.length / 2 && treinosCardio.length > 0) {
      newTips.push({
        id: 'treinos-curtos',
        title: 'Treinos curtos ou incompletos',
        description: 'Seus treinos de cardio estão muito curtos. Tente aumentar a duração ou intensidade para melhores resultados.',
        severity: 'moderada'
      });
    }

    // Análise de acompanhamento
    const diasSemRegistros = ultimos7Dias.filter(data => {
      const temRefeicao = refeicoes.some(r => r.data === data);
      const temTreino = treinos.some(t => t.data === data);
      return !temRefeicao && !temTreino;
    });

    if (diasSemRegistros.length >= 2) {
      newTips.push({
        id: 'acompanhamento',
        title: 'Acompanhamento do progresso',
        description: 'Você não registrou atividades em alguns dias. Mantenha o acompanhamento consistente para melhor análise do seu progresso.',
        severity: 'leve'
      });
    }

    // Análise de cardio recente
    const ultimos2Dias = ultimos7Dias.slice(0, 2);
    const temCardioRecente = treinos.some(t => 
      ultimos2Dias.includes(t.data) && t.tipo === 'cardio'
    );

    if (!temCardioRecente) {
      newTips.push({
        id: 'cardio-recente',
        title: 'Falta de cardio recente',
        description: 'Você não registrou treinos de cardio nos últimos dias. Considere incluir para melhorar sua saúde cardiovascular.',
        severity: 'leve'
      });
    }

    setTips(newTips);
  }, [refeicoes, treinos, profile]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'grave':
        return 'border-l-4 border-l-red-500 bg-white';
      case 'moderada':
        return 'border-l-4 border-l-yellow-500 bg-white';
      case 'leve':
        return 'border-l-4 border-l-blue-500 bg-white';
      default:
        return 'border-l-4 border-l-gray-500 bg-white';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'grave':
        return 'bg-red-50 text-red-700 border border-red-100';
      case 'moderada':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-100';
      case 'leve':
        return 'bg-blue-50 text-blue-700 border border-blue-100';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-100';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'grave':
        return 'Atenção';
      case 'moderada':
        return 'Melhoria';
      case 'leve':
        return 'Sugestão';
      default:
        return '';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'grave':
        return <AlertTriangle className="w-5 h-5" />;
      case 'moderada':
        return <AlertCircle className="w-5 h-5" />;
      case 'leve':
        return <Info className="w-5 h-5" />;
      default:
        return null;
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#343030] mb-2">Carregando...</h2>
          <p className="text-[#70707080]">Aguarde enquanto analisamos seus dados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8.5rem)] overflow-hidden">
      <div className="h-full px-4 overflow-y-auto">
        <div className="space-y-2.5 py-2">
          {tips.map((tip) => (
            <div
              key={tip.id}
              className={`rounded-xl ${getSeverityColor(tip.severity)} border border-[#70707033] shadow-sm`}
            >
              <div className="p-3">
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 ${getSeverityBadgeColor(tip.severity)} rounded-lg p-1.5`}>
                    {getSeverityIcon(tip.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-[#343030] truncate">{tip.title}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${getSeverityBadgeColor(tip.severity)}`}>
                        {getSeverityText(tip.severity)}
                      </span>
                    </div>
                    <p className="text-xs text-[#70707080] leading-relaxed line-clamp-2">{tip.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {tips.length === 0 && (
            <div className="bg-white rounded-xl p-5 border border-[#70707033] text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <h3 className="text-base font-semibold text-[#343030] mb-1.5">Tudo em ordem!</h3>
              <p className="text-xs text-[#70707080]">
                Não encontramos nenhum ponto de atenção nos seus registros recentes.
                Continue mantendo a consistência!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tips; 