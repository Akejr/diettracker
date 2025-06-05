import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Dumbbell, Utensils } from 'lucide-react';

interface DadosDiarios {
  dia: number;
  calorias: number | null;
  proteinas: number | null;
  treino: boolean;
  metaCalorias: number;
  metaProteinas: number;
}

interface HistoricoSectionProps {
  dadosDiarios: DadosDiarios[];
  mes: number;
  ano: number;
  diasNoMes: number;
  onDiaClick: (dia: number) => void;
}

const HistoricoSection: React.FC<HistoricoSectionProps> = ({
  dadosDiarios,
  mes,
  ano,
  diasNoMes,
  onDiaClick
}) => {
  const [diaDetalhado, setDiaDetalhado] = useState<number | null>(null);
  
  // Nomes dos dias da semana
  const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  // Nomes dos meses
  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  // Calcular o dia da semana do primeiro dia do mês
  const primeiroDiaMes = new Date(ano, mes, 1).getDay();
  
  // Função para obter a cor de fundo do dia com base nos dados
  const getBackgroundColor = (dia: number): string => {
    const dadosDia = dadosDiarios.find(d => d.dia === dia);
    
    if (!dadosDia) return 'bg-[#1b1b1b80]';
    
    // Se não tiver dados de calorias ou proteínas, retorna cor padrão
    if (dadosDia.calorias === null && dadosDia.proteinas === null && !dadosDia.treino) {
      return 'bg-[#1b1b1b80]';
    }
    
    // Se tiver treino, retorna cor de treino
    if (dadosDia.treino) {
      return 'bg-indigo-500 bg-opacity-20';
    }
    
    // Se tiver atingido a meta de calorias e proteínas
    if (
      dadosDia.calorias !== null && 
      dadosDia.proteinas !== null && 
      dadosDia.calorias >= dadosDia.metaCalorias * 0.8 && 
      dadosDia.proteinas >= dadosDia.metaProteinas * 0.8
    ) {
      return 'bg-green-500 bg-opacity-20';
    }
    
    // Se tiver registrado algo, mas não atingiu as metas
    return 'bg-amber-500 bg-opacity-20';
  };
  
  // Função para renderizar o dia
  const renderDia = (dia: number, index: number) => {
    // Verificar se o dia é válido (dentro do mês)
    if (dia <= 0 || dia > diasNoMes) {
      return <div key={`empty-${index}`} className="w-10 h-10"></div>;
    }
    
    const dadosDia = dadosDiarios.find(d => d.dia === dia);
    const temDados = dadosDia && (dadosDia.calorias !== null || dadosDia.proteinas !== null || dadosDia.treino);
    const hoje = new Date();
    const ehHoje = hoje.getDate() === dia && hoje.getMonth() === mes && hoje.getFullYear() === ano;
    
    return (
      <button
        key={`day-${dia}`}
        onClick={() => {
          setDiaDetalhado(diaDetalhado === dia ? null : dia);
          onDiaClick(dia);
        }}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-colors ${
          getBackgroundColor(dia)
        } ${
          ehHoje ? 'ring-2 ring-indigo-500' : ''
        } ${
          diaDetalhado === dia ? 'ring-2 ring-white' : ''
        } ${
          temDados ? 'text-white' : 'text-[#777777]'
        }`}
      >
        {dia}
      </button>
    );
  };
  
  return (
    <div className="space-y-3">
      {/* Cabeçalho do calendário */}
      <div className="bg-[#1b1b1b80] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">Calendário de Atividades</h3>
          <div className="w-6 h-6 rounded-full bg-indigo-500 bg-opacity-20 flex items-center justify-center">
            <Calendar size={16} className="text-indigo-400" />
          </div>
        </div>
        
        <p className="text-[#B0B0B0] text-sm">
          Visualize seu progresso diário durante o mês de {nomesMeses[mes]}.
        </p>
      </div>
      
      {/* Calendário */}
      <div className="bg-[#1b1b1b80] rounded-xl p-4">
        {/* Dias da semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {diasDaSemana.map((dia, index) => (
            <div key={index} className="text-center text-[#777777] text-xs">
              {dia}
            </div>
          ))}
        </div>
        
        {/* Dias do mês */}
        <div className="grid grid-cols-7 gap-1">
          {/* Espaços vazios para alinhar com o dia da semana correto */}
          {Array.from({ length: primeiroDiaMes }).map((_, index) => (
            <div key={`empty-start-${index}`} className="w-10 h-10"></div>
          ))}
          
          {/* Dias do mês */}
          {Array.from({ length: diasNoMes }).map((_, index) => 
            renderDia(index + 1, index)
          )}
        </div>
      </div>
      
      {/* Detalhes do dia selecionado */}
      {diaDetalhado !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="bg-[#1b1b1b80] rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium">Dia {diaDetalhado} de {nomesMeses[mes]}</h3>
            <button 
              onClick={() => setDiaDetalhado(null)}
              className="text-[#777777] hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          {(() => {
            const dadosDia = dadosDiarios.find(d => d.dia === diaDetalhado);
            
            if (!dadosDia || (dadosDia.calorias === null && dadosDia.proteinas === null && !dadosDia.treino)) {
              return (
                <p className="text-[#B0B0B0] text-sm">
                  Nenhum dado registrado para este dia.
                </p>
              );
            }
            
            return (
              <div className="space-y-3">
                {/* Dados de Calorias e Proteínas */}
                {(dadosDia.calorias !== null || dadosDia.proteinas !== null) && (
                  <div className="grid grid-cols-2 gap-2">
                    {dadosDia.calorias !== null && (
                      <div className="bg-[#222222] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Utensils size={14} className="text-red-400" />
                          <span className="text-[#B0B0B0] text-xs">Calorias</span>
                        </div>
                        <p className="text-white text-lg font-medium">{dadosDia.calorias} kcal</p>
                        <p className="text-[#777777] text-xs">
                          {Math.round((dadosDia.calorias / dadosDia.metaCalorias) * 100)}% da meta
                        </p>
                      </div>
                    )}
                    
                    {dadosDia.proteinas !== null && (
                      <div className="bg-[#222222] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Utensils size={14} className="text-blue-400" />
                          <span className="text-[#B0B0B0] text-xs">Proteínas</span>
                        </div>
                        <p className="text-white text-lg font-medium">{dadosDia.proteinas}g</p>
                        <p className="text-[#777777] text-xs">
                          {Math.round((dadosDia.proteinas / dadosDia.metaProteinas) * 100)}% da meta
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Status de Treino */}
                {dadosDia.treino && (
                  <div className="bg-[#222222] rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Dumbbell size={16} className="text-indigo-400" />
                      <span className="text-white text-sm">Treino realizado</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </motion.div>
      )}
      
      {/* Legenda */}
      <div className="bg-[#1b1b1b80] rounded-xl p-4">
        <h4 className="text-white text-sm font-medium mb-3">Legenda</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-indigo-500 bg-opacity-20"></div>
            <span className="text-[#B0B0B0] text-xs">Dia com treino</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 bg-opacity-20"></div>
            <span className="text-[#B0B0B0] text-xs">Metas de calorias e proteínas atingidas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500 bg-opacity-20"></div>
            <span className="text-[#B0B0B0] text-xs">Dados registrados (metas não atingidas)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#1b1b1b80]"></div>
            <span className="text-[#B0B0B0] text-xs">Nenhum dado registrado</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricoSection;