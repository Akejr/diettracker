import React from 'react';
import { Activity, TrendingUp, Dumbbell, Heart, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MonthlyStats {
  daysLogged: number;
  avgCalories: number;
  avgProtein: number;
  workoutDays: number;
  cardioCount: number;
  musculacaoCount: number;
  progressPercent: number;
}

interface Profile {
  meta_calorica: number;
  meta_proteina: number;
}

interface ResumoSectionProps {
  estatisticas: MonthlyStats;
  usuario: Profile | null;
  mesAtual: number;
  anoAtual: number;
}

const ResumoSection: React.FC<ResumoSectionProps> = ({ 
  estatisticas, 
  usuario, 
  mesAtual, 
  anoAtual 
}) => {
  if (!usuario) return null;
  
  // Verificar qual porcentagem da meta os valores representam
  const caloriesPercent = usuario.meta_calorica ? Math.round((estatisticas.avgCalories / usuario.meta_calorica) * 100) : 0;
  const proteinPercent = usuario.meta_proteina ? Math.round((estatisticas.avgProtein / usuario.meta_proteina) * 100) : 0;
  
  // Cores com base no progresso
  const getCaloriesColor = () => {
    if (caloriesPercent < 80) return 'from-blue-500 to-blue-600';
    if (caloriesPercent < 95) return 'from-green-500 to-emerald-500';
    if (caloriesPercent <= 105) return 'from-green-500 to-emerald-500';
    if (caloriesPercent <= 120) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-red-600';
  };
  
  const getProteinColor = () => {
    if (proteinPercent < 70) return 'from-red-500 to-red-600';
    if (proteinPercent < 95) return 'from-yellow-500 to-orange-500';
    if (proteinPercent >= 95) return 'from-green-500 to-emerald-500';
    return 'from-green-500 to-emerald-500';
  };

  // Dados para o gráfico de barras de treinos
  const workoutChartData = {
    labels: ['Cardio', 'Musculação'],
    datasets: [
      {
        label: 'Quantidade de treinos',
        data: [estatisticas.cardioCount, estatisticas.musculacaoCount],
        backgroundColor: [
          'rgba(61, 90, 254, 0.7)',
          'rgba(0, 230, 118, 0.7)',
        ],
        borderColor: [
          'rgba(61, 90, 254, 1)',
          'rgba(0, 230, 118, 1)',
        ],
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const workoutChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1E1E1E',
        titleColor: '#FFFFFF',
        bodyColor: '#B0B0B0',
        padding: 10,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#222222',
        },
        ticks: {
          color: '#B0B0B0',
          callback: function(this: any, tickValue: any): string {
            return tickValue.toString();
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#B0B0B0',
        }
      }
    }
  };

  // Simular dados para o gráfico de progresso
  const diasNoMes = new Date(anoAtual, mesAtual, 0).getDate();
  const labels = Array.from({ length: diasNoMes }, (_, i) => (i + 1).toString());
  
  const progressChartData = {
    labels,
    datasets: [
      {
        label: 'Progresso',
        data: Array.from({ length: diasNoMes }, () => Math.floor(Math.random() * 100)),
        borderColor: 'rgba(61, 90, 254, 1)',
        backgroundColor: 'rgba(61, 90, 254, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const progressChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1E1E1E',
        titleColor: '#FFFFFF',
        bodyColor: '#B0B0B0',
        padding: 10,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: '#222222',
        },
        ticks: {
          color: '#B0B0B0',
          callback: function(this: any, tickValue: any): string {
            return tickValue.toString();
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#B0B0B0',
          maxTicksLimit: 7,
        }
      }
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="bg-[#1b1b1b80] rounded-xl p-4">
        <h3 className="text-white font-medium mb-3">
          Resumo de {format(new Date(anoAtual, mesAtual - 1), 'MMMM', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
        </h3>
        <p className="text-[#B0B0B0] text-sm">
          {estatisticas.daysLogged > 0 
            ? `Dados registrados em ${estatisticas.daysLogged} ${estatisticas.daysLogged === 1 ? 'dia' : 'dias'} deste mês`
            : 'Nenhum dado registrado neste mês'}
        </p>
      </div>

      {/* Grid de cards de estatísticas */}
      <div className="grid grid-cols-2 gap-2.5 w-full">
        {/* Card de Calorias */}
        <div className="bg-gradient-to-br from-[#1b1b1b80] to-[#2a2a2a80] rounded-xl p-3.5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#B0B0B0] text-sm">Calorias</span>
            <div className="w-5 h-5 rounded-full bg-[#FF6B6B] bg-opacity-30 flex items-center justify-center">
              <Utensils size={14} className="text-[#FF6B6B]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{estatisticas.avgCalories}</p>
          <p className="text-[#B0B0B0] text-xs">Média diária</p>
          
          <div className="mt-2 flex items-center">
            <div className="flex-1 h-1.5 bg-[#222222] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${caloriesPercent}%` }}
                transition={{ duration: 1 }}
                className={`h-full rounded-full bg-gradient-to-r ${getCaloriesColor()}`}
              />
            </div>
            <span className="ml-2 text-xs text-white font-medium">{caloriesPercent}%</span>
          </div>
        </div>

        {/* Card de Proteínas */}
        <div className="bg-gradient-to-br from-[#1b1b1b80] to-[#2a2a2a80] rounded-xl p-3.5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#B0B0B0] text-sm">Proteínas</span>
            <div className="w-5 h-5 rounded-full bg-[#4ECDC4] bg-opacity-30 flex items-center justify-center">
              <Dumbbell size={14} className="text-[#4ECDC4]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{estatisticas.avgProtein}g</p>
          <p className="text-[#B0B0B0] text-xs">Média diária</p>
          
          <div className="mt-2 flex items-center">
            <div className="flex-1 h-1.5 bg-[#222222] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${proteinPercent}%` }}
                transition={{ duration: 1 }}
                className={`h-full rounded-full bg-gradient-to-r ${getProteinColor()}`}
              />
            </div>
            <span className="ml-2 text-xs text-white font-medium">{proteinPercent}%</span>
          </div>
        </div>
      </div>

      {/* Card de Frequência de Treinos */}
      <div className="bg-[#1b1b1b80] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">Frequência de Treinos</h3>
          <div className="w-6 h-6 rounded-full bg-[#3D5AFE] bg-opacity-20 flex items-center justify-center">
            <Activity size={16} className="text-indigo-400" />
          </div>
        </div>
        
        <div className="flex justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-500/20 text-indigo-400 p-1.5 rounded-lg">
              <Heart size={16} />
            </div>
            <div>
              <p className="text-white text-sm font-medium">{estatisticas.cardioCount}</p>
              <p className="text-[#B0B0B0] text-xs">Cardio</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-green-500/20 text-green-400 p-1.5 rounded-lg">
              <Dumbbell size={16} />
            </div>
            <div>
              <p className="text-white text-sm font-medium">{estatisticas.musculacaoCount}</p>
              <p className="text-[#B0B0B0] text-xs">Musculação</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-purple-500/20 text-purple-400 p-1.5 rounded-lg">
              <Activity size={16} />
            </div>
            <div>
              <p className="text-white text-sm font-medium">{estatisticas.workoutDays}</p>
              <p className="text-[#B0B0B0] text-xs">Dias ativos</p>
            </div>
          </div>
        </div>
        
        <div className="h-44 mb-2">
          <Bar data={workoutChartData} options={workoutChartOptions} />
        </div>
        
        <div className="bg-[#1A1A1A] rounded-lg p-3">
          <div className="flex items-center">
            <TrendingUp size={16} className="text-indigo-400 mr-2" />
            <p className="text-sm text-white">
              {estatisticas.workoutDays === 0 ? 'Nenhum treino registrado neste mês.' : 
                estatisticas.workoutDays / estatisticas.daysLogged < 0.3 ? 'Tente aumentar a frequência de treinos para melhores resultados.' :
                estatisticas.workoutDays / estatisticas.daysLogged < 0.5 ? 'Frequência de treinos moderada. Você está no caminho certo!' :
                'Excelente frequência de treinos! Mantenha o bom trabalho!'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Card de progresso mensal */}
      <div className="bg-[#1b1b1b80] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">Progresso Mensal</h3>
          <div className="w-6 h-6 rounded-full bg-[#3D5AFE] bg-opacity-20 flex items-center justify-center">
            <TrendingUp size={16} />
          </div>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[#B0B0B0] text-xs">Progresso geral</span>
            <span className="text-white text-xs font-medium">{estatisticas.progressPercent}%</span>
          </div>
          <div className="h-2.5 bg-[#222222] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${estatisticas.progressPercent}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-gradient-to-r from-indigo-600 to-green-500 rounded-full"
            />
          </div>
        </div>
        
        <div className="h-44 mb-2">
          <Line data={progressChartData} options={progressChartOptions} />
        </div>
        
        <div className="bg-[#1A1A1A] rounded-lg p-3">
          <div className="flex items-center">
            <TrendingUp size={16} className="text-indigo-400 mr-2" />
            <p className="text-sm text-white">
              {estatisticas.progressPercent < 50 ? 'Você está abaixo da meta mensal. Tente ajustar seus hábitos.' :
               estatisticas.progressPercent < 80 ? 'Progresso moderado. Continue melhorando para atingir suas metas.' :
               'Excelente progresso! Você está no caminho certo para atingir seus objetivos.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumoSection;