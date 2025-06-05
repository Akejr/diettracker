import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface Tip {
  id: string;
  title: string;
  description: string;
  severity: 'alta' | 'media' | 'informativo';
}

interface DicasSectionProps {
  tips: Tip[];
}

const DicasSection: React.FC<DicasSectionProps> = ({ tips }) => {
  // Agrupar dicas por severidade
  const tipsByPriority = {
    alta: tips.filter(tip => tip.severity === 'alta'),
    media: tips.filter(tip => tip.severity === 'media'),
    informativo: tips.filter(tip => tip.severity === 'informativo')
  };

  return (
    <div className="space-y-3">
      {/* Cabeçalho da seção de dicas */}
      <div className="bg-[#1b1b1b80] rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-6 h-6 rounded-full bg-amber-500 bg-opacity-20 flex items-center justify-center">
            <Lightbulb size={16} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">Dicas Personalizadas</h3>
            <p className="text-[#B0B0B0] text-xs">Com base na sua atividade mensal</p>
          </div>
        </div>
        
        <p className="text-[#B0B0B0] text-sm">
          Estas dicas são geradas automaticamente analisando seus registros de alimentação e treinos para ajudar você a atingir seus objetivos.
        </p>
      </div>
      
      {/* Lista de dicas de alta prioridade */}
      {tipsByPriority.alta.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white text-sm font-medium px-1">Alta Prioridade</h4>
          {tipsByPriority.alta.map((tip, index) => (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#1b1b1b80] rounded-xl p-3"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={14} className="text-red-500" />
                </div>
                <div>
                  <h5 className="text-white text-sm font-medium mb-1">{tip.title}</h5>
                  <p className="text-[#B0B0B0] text-xs">{tip.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Lista de dicas de média prioridade */}
      {tipsByPriority.media.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white text-sm font-medium px-1">Sugestões</h4>
          {tipsByPriority.media.map((tip, index) => (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-[#1b1b1b80] rounded-xl p-3"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-amber-500 bg-opacity-20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={14} className="text-amber-500" />
                </div>
                <div>
                  <h5 className="text-white text-sm font-medium mb-1">{tip.title}</h5>
                  <p className="text-[#B0B0B0] text-xs">{tip.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Lista de dicas informativas */}
      {tipsByPriority.informativo.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white text-sm font-medium px-1">Informações</h4>
          {tipsByPriority.informativo.map((tip, index) => (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="bg-[#1b1b1b80] rounded-xl p-3"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-blue-500 bg-opacity-20 flex items-center justify-center flex-shrink-0">
                  <Info size={14} className="text-blue-500" />
                </div>
                <div>
                  <h5 className="text-white text-sm font-medium mb-1">{tip.title}</h5>
                  <p className="text-[#B0B0B0] text-xs">{tip.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Mensagem quando não há dicas */}
      {tips.length === 0 && (
        <div className="bg-[#1b1b1b80] rounded-xl p-4 text-center">
          <p className="text-[#B0B0B0] text-sm">
            Não há dicas disponíveis para este mês. Continue registrando suas atividades para receber recomendações personalizadas.
          </p>
        </div>
      )}
      
      {/* Seção de explicação */}
      <div className="bg-[#1b1b1b80] rounded-xl p-4">
        <h4 className="text-white font-medium mb-2">Como as dicas funcionam?</h4>
        <p className="text-[#B0B0B0] text-sm mb-4">
          Nosso sistema analisa seus dados e identifica padrões que podem ajudar a melhorar seus resultados:
        </p>
        
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="min-w-[24px] h-6 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
            </div>
            <p className="text-[#B0B0B0] text-sm">
              <span className="text-red-400 font-medium">Alta prioridade</span> - Questões que precisam de atenção imediata para atingir seus objetivos
            </p>
          </div>
          
          <div className="flex items-start gap-2">
            <div className="min-w-[24px] h-6 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            </div>
            <p className="text-[#B0B0B0] text-sm">
              <span className="text-yellow-400 font-medium">Média prioridade</span> - Aspectos que podem ser melhorados para otimizar seus resultados
            </p>
          </div>
          
          <div className="flex items-start gap-2">
            <div className="min-w-[24px] h-6 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
            <p className="text-[#B0B0B0] text-sm">
              <span className="text-blue-400 font-medium">Informativo</span> - Sugestões gerais para aprimorar ainda mais seu desempenho
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DicasSection;