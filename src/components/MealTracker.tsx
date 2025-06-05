import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Apple, Flame, ChevronLeft, ChevronRight, Clock, Utensils } from 'lucide-react';
import { supabaseApi, type Refeicao } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface MealTrackerProps {
  userId: string;
  metaCalorica: number;
  metaProteina: number;
}

const MealTracker: React.FC<MealTrackerProps> = ({ userId, metaCalorica, metaProteina }) => {
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [novaRefeicao, setNovaRefeicao] = useState({
    alimento: '',
    calorias: '',
    proteina: '',
    horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  });
  const [dataAtual, setDataAtual] = useState(new Date().toISOString().split('T')[0]);
  const [totalCalorias, setTotalCalorias] = useState(0);
  const [totalProteina, setTotalProteina] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  // Carregar refeições do dia
  useEffect(() => {
    const carregarRefeicoes = async () => {
      try {
        const refeicoesDoDia = await supabaseApi.listarRefeicoesDoDia(userId, dataAtual);
        setRefeicoes(refeicoesDoDia);
        
        // Calcular totais
        const totais = refeicoesDoDia.reduce((acc, refeicao) => ({
          calorias: acc.calorias + refeicao.calorias,
          proteina: acc.proteina + refeicao.proteina
        }), { calorias: 0, proteina: 0 });

        setTotalCalorias(totais.calorias);
        setTotalProteina(totais.proteina);
      } catch (error) {
        console.error('Erro ao carregar refeições:', error);
      }
    };

    carregarRefeicoes();
  }, [userId, dataAtual]);

  // Adicionar nova refeição
  const handleAddRefeicao = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const novaRefeicaoData: Omit<Refeicao, 'id' | 'created_at'> = {
        usuario_id: userId,
        alimento: novaRefeicao.alimento,
        calorias: parseInt(novaRefeicao.calorias),
        proteina: parseInt(novaRefeicao.proteina),
        horario: novaRefeicao.horario,
        data: dataAtual
      };

      const refeicaoAdicionada = await supabaseApi.adicionarRefeicao(novaRefeicaoData);
      
      setRefeicoes(prev => [...prev, refeicaoAdicionada]);
      setTotalCalorias(prev => prev + refeicaoAdicionada.calorias);
      setTotalProteina(prev => prev + refeicaoAdicionada.proteina);
      
      // Limpar formulário
      setNovaRefeicao({
        alimento: '',
        calorias: '',
        proteina: '',
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
      setIsAdding(false);
    } catch (error) {
      console.error('Erro ao adicionar refeição:', error);
      alert('Erro ao adicionar refeição. Tente novamente.');
    }
  };

  // Mudar data
  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentDate = new Date(dataAtual);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      const today = new Date();
      if (currentDate.getDate() === today.getDate() && 
          currentDate.getMonth() === today.getMonth() && 
          currentDate.getFullYear() === today.getFullYear()) {
        return; // Não permitir selecionar datas futuras
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setDataAtual(currentDate.toISOString().split('T')[0]);
  };

  // Remover refeição
  const handleRemoveRefeicao = async (id: string, calorias: number, proteina: number) => {
    try {
      await supabaseApi.removerRefeicao(id);
      setRefeicoes(prev => prev.filter(refeicao => refeicao.id !== id));
      setTotalCalorias(prev => prev - calorias);
      setTotalProteina(prev => prev - proteina);
    } catch (error) {
      console.error('Erro ao remover refeição:', error);
      alert('Erro ao remover refeição. Tente novamente.');
    }
  };

  // Calcular percentual de meta atingido
  const caloriasPercent = Math.min(100, Math.round((totalCalorias / metaCalorica) * 100));
  const proteinaPercent = Math.min(100, Math.round((totalProteina / metaProteina) * 100));

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
            <Utensils className="text-indigo-400 w-5 h-5" />
            <h1 className="text-2xl font-bold text-white">Refeições</h1>
          </div>
          <p className="text-[#B0B0B0] text-sm mt-1">Acompanhe sua alimentação diária</p>
        </div>
        
        {/* Seletor de Data - Redesenhado */}
        <div className="mb-6">
          <div className="bg-[#151515] rounded-xl p-3 shadow-lg border border-[#222222]">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => handleDateChange('prev')}
                className="p-2 text-white hover:text-indigo-400 transition-colors bg-[#1A1A1A] rounded-lg"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="text-center flex flex-col">
                <p className="text-white font-medium text-base">
                  {new Date(dataAtual).toLocaleDateString('pt-BR', { 
                    weekday: 'long'
                  }).replace(/^\w/, (c) => c.toUpperCase())}
                </p>
                <p className="text-[#B0B0B0] text-xs">
                  {new Date(dataAtual).toLocaleDateString('pt-BR', { 
                    day: 'numeric', 
                    month: 'long'
                  }).replace(/^\w/, (c) => c.toUpperCase())}
                </p>
              </div>
              
              <button 
                onClick={() => handleDateChange('next')}
                className={`p-2 text-white transition-colors bg-[#1A1A1A] rounded-lg ${
                  new Date().toDateString() === new Date(dataAtual).toDateString()
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:text-indigo-400'
                }`}
                disabled={new Date().toDateString() === new Date(dataAtual).toDateString()}
              >
                <ChevronRight size={18} className={new Date().toDateString() === new Date(dataAtual).toDateString() ? "opacity-50" : ""} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Cards de Progresso */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Card de Calorias */}
          <div className="bg-gradient-to-br from-[#151515] to-[#101010] rounded-xl p-4 shadow-lg border border-[#222222]">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="text-orange-400 w-4 h-4" />
              <h3 className="text-white font-medium">Calorias</h3>
            </div>
            
            <div className="flex items-end justify-between mb-2">
              <div className="text-2xl font-bold text-white">{totalCalorias}</div>
              <div className="text-[#B0B0B0] text-xs">/ {metaCalorica}</div>
            </div>
            
            <div className="w-full bg-[#2A2A2A] rounded-full h-2 mb-1">
              <div 
                className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full" 
                style={{ width: `${caloriasPercent}%` }}
              />
            </div>
            <div className="text-right text-xs text-[#B0B0B0]">{caloriasPercent}%</div>
          </div>
          
          {/* Card de Proteínas */}
          <div className="bg-gradient-to-br from-[#151515] to-[#101010] rounded-xl p-4 shadow-lg border border-[#222222]">
            <div className="flex items-center gap-2 mb-2">
              <Apple className="text-green-400 w-4 h-4" />
              <h3 className="text-white font-medium">Proteínas</h3>
            </div>
            
            <div className="flex items-end justify-between mb-2">
              <div className="text-2xl font-bold text-white">{totalProteina}g</div>
              <div className="text-[#B0B0B0] text-xs">/ {metaProteina}g</div>
            </div>
            
            <div className="w-full bg-[#2A2A2A] rounded-full h-2 mb-1">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full" 
                style={{ width: `${proteinaPercent}%` }}
              />
            </div>
            <div className="text-right text-xs text-[#B0B0B0]">{proteinaPercent}%</div>
          </div>
        </div>
        
        {/* Lista de Refeições */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Refeições do Dia</h2>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAdding(true)}
              className="bg-[#3D5AFE] text-white p-2 rounded-lg hover:bg-[#3D5AFEDD] transition-colors"
            >
              <Plus size={18} />
            </motion.button>
          </div>
          
          {refeicoes.length === 0 ? (
            <div className="bg-[#151515] rounded-xl p-6 shadow-lg border border-[#222222] text-center">
              <p className="text-[#B0B0B0]">Nenhuma refeição registrada para este dia.</p>
              <button 
                onClick={() => setIsAdding(true)}
                className="mt-4 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Adicionar refeição
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {refeicoes.map((refeicao) => (
                <motion.div 
                  key={refeicao.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#151515] rounded-xl p-4 shadow-lg border border-[#222222] flex justify-between items-center"
                >
                  <div>
                    <h3 className="text-white font-medium">{refeicao.alimento}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-[#B0B0B0] text-xs">
                        <Flame className="w-3 h-3 text-orange-400" />
                        {refeicao.calorias} kcal
                      </div>
                      <div className="flex items-center gap-1 text-[#B0B0B0] text-xs">
                        <Apple className="w-3 h-3 text-green-400" />
                        {refeicao.proteina}g
                      </div>
                      <div className="flex items-center gap-1 text-[#B0B0B0] text-xs">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        {refeicao.horario}
                      </div>
                    </div>
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRemoveRefeicao(refeicao.id, refeicao.calorias, refeicao.proteina)}
                    className="text-[#B0B0B0] hover:text-red-400 transition-colors p-2"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {/* Modal para adicionar refeição */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsAdding(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#151515] rounded-xl p-5 w-full max-w-md shadow-xl border border-[#222222]"
              >
                <h2 className="text-xl font-bold text-white mb-4">Adicionar Refeição</h2>
                
                <form onSubmit={handleAddRefeicao} className="space-y-4">
                  <div>
                    <label className="block text-[#B0B0B0] text-sm mb-1">Alimento</label>
                    <input
                      type="text"
                      value={novaRefeicao.alimento}
                      onChange={(e) => setNovaRefeicao({...novaRefeicao, alimento: e.target.value})}
                      className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Ex: Frango grelhado"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#B0B0B0] text-sm mb-1">Calorias</label>
                      <input
                        type="number"
                        value={novaRefeicao.calorias}
                        onChange={(e) => setNovaRefeicao({...novaRefeicao, calorias: e.target.value})}
                        className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                        placeholder="Ex: 300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#B0B0B0] text-sm mb-1">Proteínas (g)</label>
                      <input
                        type="number"
                        value={novaRefeicao.proteina}
                        onChange={(e) => setNovaRefeicao({...novaRefeicao, proteina: e.target.value})}
                        className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                        placeholder="Ex: 25"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[#B0B0B0] text-sm mb-1">Horário</label>
                    <input
                      type="time"
                      value={novaRefeicao.horario}
                      onChange={(e) => setNovaRefeicao({...novaRefeicao, horario: e.target.value})}
                      className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="flex-1 bg-[#2A2A2A] text-white py-3 rounded-lg hover:bg-[#333333] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[#3D5AFE] text-white py-3 rounded-lg hover:bg-[#3D5AFEDD] transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MealTracker;