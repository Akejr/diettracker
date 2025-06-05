import React, { useState, useEffect } from 'react';
import { CalendarDays, TrendingDown, TrendingUp, Target, Clock, Utensils, Dumbbell, Scale, ChevronRight, Calendar, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryEntry {
  date: string;
  entries: { food: string; calories: number; protein: number; time: string }[];
  totalCalories: number;
  totalProtein: number;
  weight: number | null;
  workoutDone: boolean;
  metasAtingidas: {
    calorias: boolean;
    proteina: boolean;
  };
}

interface ConfigUsuario {
  peso: number;
  metaCalorica: number;
  metaProteina: number;
  dataConfiguracao: string;
}

const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [config, setConfig] = useState<ConfigUsuario | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('history');
    const savedConfig = localStorage.getItem('configUsuario');
    
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long',
    }).replace(/^\w/, (c) => c.toUpperCase());
  };

  const analisarProgresso = () => {
    if (history.length < 7) return null;

    const ultimaSemana = history.slice(-7);
    const metasCalorias = ultimaSemana.filter(day => day.metasAtingidas.calorias).length;
    const metasProteina = ultimaSemana.filter(day => day.metasAtingidas.proteina).length;
    const treinos = ultimaSemana.filter(day => day.workoutDone).length;

    const primeiroRegistro = history[0];
    const ultimoRegistro = history[history.length - 1];
    const diferencaPeso = ultimoRegistro.weight && primeiroRegistro.weight
      ? ultimoRegistro.weight - primeiroRegistro.weight
      : null;

    return {
      metasCalorias,
      metasProteina,
      treinos,
      diferencaPeso
    };
  };

  const toggleExpandDay = (date: string) => {
    if (expandedDay === date) {
      setExpandedDay(null);
    } else {
      setExpandedDay(date);
    }
  };

  const progresso = analisarProgresso();

  return (
    <div className="relative bg-gradient-to-b from-[#0C0C0C] to-[#0A0A0A] min-h-screen pb-20">
      {/* Gradiente principal no fundo - com opacidade reduzida */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ 
          background: 'radial-gradient(circle at center, rgba(20, 20, 25, 0.3), transparent 70%), linear-gradient(135deg, rgba(30, 41, 59, 0.3) 0%, rgba(17, 24, 39, 0.2) 100%)',
        }}
      />
      
      {/* Decorative gradient blobs com opacidade reduzida */}
      <div 
        className="absolute top-0 right-0 w-96 h-96 opacity-20 z-0 pointer-events-none blur-3xl"
        style={{ 
          background: 'radial-gradient(circle at top right, rgba(61, 90, 254, 0.5), transparent 70%)',
          transform: 'translate(30%, -30%)'
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-96 h-96 opacity-20 z-0 pointer-events-none blur-3xl"
        style={{ 
          background: 'radial-gradient(circle at bottom left, rgba(0, 230, 118, 0.5), transparent 70%)',
          transform: 'translate(-30%, 30%)'
        }}
      />
      
      {/* Conteúdo principal */}
      <div className="max-w-md mx-auto px-4 relative z-10 pt-5 pb-20">
        {/* Cabeçalho */}
        <div className="mb-6 flex flex-col items-center">
          <div className="flex items-center gap-2">
            <Calendar className="text-indigo-400 w-5 h-5" />
            <h1 className="text-2xl font-bold text-white">Histórico</h1>
          </div>
          <p className="text-[#B0B0B0] text-sm mt-1">Acompanhe seu progresso ao longo do tempo</p>
        </div>
        
        {history.length === 0 ? (
          <div className="bg-[#151515] rounded-xl p-8 shadow-lg border border-[#222222] flex flex-col items-center justify-center text-center">
            <CalendarDays className="w-12 h-12 text-[#3D5AFE] mb-4 opacity-70" />
            <p className="text-white mb-2">Nenhum histórico disponível</p>
            <p className="text-[#B0B0B0] text-sm">Complete seu primeiro dia para ver o histórico</p>
          </div>
        ) : (
          <>
            {/* Resumo do Progresso */}
            {progresso && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-[#151515] to-[#101010] rounded-xl p-5 shadow-lg border border-[#222222] mb-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="text-indigo-400 w-5 h-5" />
                  <h2 className="text-lg font-semibold text-white">Análise da Última Semana</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#B0B0B0] text-sm">Metas de Calorias</p>
                      <p className="text-xl font-semibold text-white mt-1">{progresso.metasCalorias}/7</p>
                    </div>
                    {progresso.metasCalorias >= 5 ? (
                      <div className="bg-[#1A1A1A] p-2 rounded-lg">
                        <TrendingDown className="w-6 h-6 text-green-400" />
                      </div>
                    ) : (
                      <div className="bg-[#1A1A1A] p-2 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-orange-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#B0B0B0] text-sm">Metas de Proteína</p>
                      <p className="text-xl font-semibold text-white mt-1">{progresso.metasProteina}/7</p>
                    </div>
                    {progresso.metasProteina >= 5 ? (
                      <div className="bg-[#1A1A1A] p-2 rounded-lg">
                        <TrendingDown className="w-6 h-6 text-green-400" />
                      </div>
                    ) : (
                      <div className="bg-[#1A1A1A] p-2 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-orange-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#B0B0B0] text-sm">Treinos Realizados</p>
                      <p className="text-xl font-semibold text-white mt-1">{progresso.treinos}/7</p>
                    </div>
                    <div className="bg-[#1A1A1A] p-2 rounded-lg">
                      <Dumbbell className="w-6 h-6 text-indigo-400" />
                    </div>
                  </div>

                  {progresso.diferencaPeso !== null && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#B0B0B0] text-sm">Variação de Peso</p>
                        <p className="text-xl font-semibold text-white mt-1">
                          {progresso.diferencaPeso > 0 ? '+' : ''}{progresso.diferencaPeso.toFixed(1)} kg
                        </p>
                      </div>
                      <div className="bg-[#1A1A1A] p-2 rounded-lg">
                        <Scale className="w-6 h-6 text-blue-400" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Lista de Dias */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-2">Registros Diários</h2>
              
              {history.slice().reverse().map((day, index) => (
                <motion.div 
                  key={day.date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#151515] rounded-xl shadow-lg border border-[#222222] overflow-hidden"
                >
                  <motion.div 
                    className="p-4 cursor-pointer"
                    onClick={() => toggleExpandDay(day.date)}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">{formatDate(day.date)}</p>
                        <p className="text-[#B0B0B0] text-xs">{formatDay(day.date)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {day.workoutDone && (
                          <div className="bg-[#1A1A1A] p-1.5 rounded-lg">
                            <Dumbbell className="w-4 h-4 text-indigo-400" />
                          </div>
                        )}
                        <motion.div
                          animate={{ rotate: expandedDay === day.date ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="w-5 h-5 text-[#B0B0B0]" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <AnimatePresence>
                    {expandedDay === day.date && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-[#222222]">
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-[#1A1A1A] p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Utensils className="w-4 h-4 text-orange-400" />
                                <p className="text-[#B0B0B0] text-xs">Calorias</p>
                              </div>
                              <p className="text-white font-medium">{day.totalCalories} kcal</p>
                              <div className="mt-1 text-xs">
                                {day.metasAtingidas.calorias ? (
                                  <span className="text-green-400">Meta atingida</span>
                                ) : (
                                  <span className="text-orange-400">Meta não atingida</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="bg-[#1A1A1A] p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Target className="w-4 h-4 text-green-400" />
                                <p className="text-[#B0B0B0] text-xs">Proteínas</p>
                              </div>
                              <p className="text-white font-medium">{day.totalProtein} g</p>
                              <div className="mt-1 text-xs">
                                {day.metasAtingidas.proteina ? (
                                  <span className="text-green-400">Meta atingida</span>
                                ) : (
                                  <span className="text-orange-400">Meta não atingida</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {day.weight && (
                            <div className="bg-[#1A1A1A] p-3 rounded-lg mb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <Scale className="w-4 h-4 text-blue-400" />
                                <p className="text-[#B0B0B0] text-xs">Peso Registrado</p>
                              </div>
                              <p className="text-white font-medium">{day.weight} kg</p>
                            </div>
                          )}
                          
                          {day.entries.length > 0 && (
                            <div>
                              <p className="text-[#B0B0B0] text-xs mb-2">Refeições do Dia</p>
                              <div className="space-y-2">
                                {day.entries.map((entry, i) => (
                                  <div key={i} className="bg-[#1A1A1A] p-3 rounded-lg">
                                    <div className="flex justify-between items-start">
                                      <p className="text-white font-medium">{entry.food}</p>
                                      <div className="flex items-center gap-1 text-[#B0B0B0] text-xs">
                                        <Clock className="w-3 h-3" />
                                        {entry.time}
                                      </div>
                                    </div>
                                    <div className="flex gap-3 mt-1 text-xs text-[#B0B0B0]">
                                      <div className="flex items-center gap-1">
                                        <Utensils className="w-3 h-3 text-orange-400" />
                                        {entry.calories} kcal
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Target className="w-3 h-3 text-green-400" />
                                        {entry.protein} g
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default History;
