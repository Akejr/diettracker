import React, { useState, useEffect } from 'react';
import { CalendarDays, TrendingDown, TrendingUp, Target } from 'lucide-react';

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

  const progresso = analisarProgresso();

  return (
    <div className="space-y-6">
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CalendarDays className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhum histórico disponível</p>
          <p className="text-sm text-gray-400 mt-1">Complete seu primeiro dia para ver o histórico</p>
        </div>
      ) : (
        <>
          {/* Resumo do Progresso */}
          {progresso && (
            <div className="bg-white border border-gray-100 p-6 rounded-2xl">
              <h2 className="text-lg font-medium text-black mb-4">Análise da Última Semana</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Metas de Calorias Atingidas</p>
                    <p className="text-xl font-semibold text-black mt-1">{progresso.metasCalorias}/7</p>
                  </div>
                  {progresso.metasCalorias >= 5 ? (
                    <TrendingDown className="w-6 h-6 text-green-500" />
                  ) : (
                    <TrendingUp className="w-6 h-6 text-red-500" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Metas de Proteína Atingidas</p>
                    <p className="text-xl font-semibold text-black mt-1">{progresso.metasProteina}/7</p>
                  </div>
                  {progresso.metasProteina >= 5 ? (
                    <Target className="w-6 h-6 text-green-500" />
                  ) : (
                    <Target className="w-6 h-6 text-red-500" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Treinos Realizados</p>
                    <p className="text-xl font-semibold text-black mt-1">{progresso.treinos}/7</p>
                  </div>
                </div>

                {progresso.diferencaPeso !== null && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">Variação de Peso</p>
                    <div className="flex items-center mt-1">
                      <p className={`text-xl font-semibold ${
                        progresso.diferencaPeso <= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {progresso.diferencaPeso.toFixed(1)} kg
                      </p>
                      {progresso.diferencaPeso <= 0 ? (
                        <TrendingDown className="w-5 h-5 text-green-500 ml-2" />
                      ) : (
                        <TrendingUp className="w-5 h-5 text-red-500 ml-2" />
                      )}
                    </div>
                  </div>
                )}

                {/* Sugestões de Melhoria */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Sugestões de Melhoria</h3>
                  <ul className="space-y-2">
                    {progresso.metasCalorias < 5 && (
                      <li className="text-sm text-gray-600">
                        • Tente planejar suas refeições com antecedência para manter o déficit calórico
                      </li>
                    )}
                    {progresso.metasProteina < 5 && (
                      <li className="text-sm text-gray-600">
                        • Inclua mais fontes de proteína magra em suas refeições principais
                      </li>
                    )}
                    {progresso.treinos < 4 && (
                      <li className="text-sm text-gray-600">
                        • Estabeleça uma rotina fixa de treinos para aumentar a frequência
                      </li>
                    )}
                    {progresso.diferencaPeso !== null && progresso.diferencaPeso > 0 && (
                      <li className="text-sm text-gray-600">
                        • Revise suas porções e considere aumentar a atividade física
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Histórico Diário */}
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div key={index} className="bg-white border border-gray-100 p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-black">{formatDate(entry.date)}</h2>
                  <CalendarDays className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total de Calorias</p>
                    <p className="text-xl font-semibold text-black mt-1">
                      {entry.totalCalories}
                      <span className="text-sm text-gray-400 ml-1">kcal</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total de Proteína</p>
                    <p className="text-xl font-semibold text-black mt-1">
                      {entry.totalProtein}
                      <span className="text-sm text-gray-400 ml-1">g</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-500 mb-2">Refeições</p>
                  <div className="space-y-3">
                    {entry.entries.map((meal, mealIndex) => (
                      <div key={mealIndex} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-black">{meal.food}</p>
                          <p className="text-sm text-gray-500">{meal.time}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-black">{meal.calories} kcal</p>
                          <p className="text-sm text-gray-500">{meal.protein}g proteína</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status do Dia */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex space-x-4">
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      entry.metasAtingidas.calorias 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {entry.metasAtingidas.calorias ? 'Meta Calórica ✓' : 'Meta Calórica ✗'}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      entry.metasAtingidas.proteina 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {entry.metasAtingidas.proteina ? 'Meta Proteica ✓' : 'Meta Proteica ✗'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default History;
