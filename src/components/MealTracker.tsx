import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Apple, Flame } from 'lucide-react';
import { supabaseApi, type Refeicao } from '../lib/supabase';

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
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setDataAtual(currentDate.toISOString().split('T')[0]);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho com Progresso */}
      <div className="bg-white rounded-xl p-4 border border-[#70707033]">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={() => handleDateChange('prev')}
            className="p-2 hover:bg-[#F5F5F5] rounded-lg"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-[#343030]">
            {new Date(dataAtual).toLocaleDateString('pt-BR', { 
              day: '2-digit',
              month: 'long'
            })}
          </h2>
          <button 
            onClick={() => handleDateChange('next')}
            className="p-2 hover:bg-[#F5F5F5] rounded-lg"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-[#F9FAFB] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-[#FF6F00]" />
              <span className="text-sm text-[#343030]">Calorias</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-[#343030]">{totalCalorias}</span>
              <span className="text-sm text-[#70707080]">/ {metaCalorica} kcal</span>
            </div>
            <div className="w-full h-1.5 bg-[#70707033] rounded-full mt-2">
              <div 
                className="h-full bg-[#FF6F00] rounded-full"
                style={{ width: `${Math.min((totalCalorias / metaCalorica) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-[#F9FAFB] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Apple className="w-5 h-5 text-[#3AFF00]" />
              <span className="text-sm text-[#343030]">Proteína</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-[#343030]">{totalProteina}</span>
              <span className="text-sm text-[#70707080]">/ {metaProteina}g</span>
            </div>
            <div className="w-full h-1.5 bg-[#70707033] rounded-full mt-2">
              <div 
                className="h-full bg-[#3AFF00] rounded-full"
                style={{ width: `${Math.min((totalProteina / metaProteina) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Refeições */}
      <div className="bg-white rounded-xl p-4 border border-[#70707033]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#343030]">Refeições</h2>
          <button
            onClick={() => setIsAdding(true)}
            className="p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors"
          >
            <Plus className="w-5 h-5 text-[#343030]" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {isAdding && (
            <form onSubmit={handleAddRefeicao} className="p-3 bg-[#F9FAFB] rounded-lg">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Nome do alimento"
                    value={novaRefeicao.alimento}
                    onChange={e => setNovaRefeicao(prev => ({ ...prev, alimento: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030]"
                    required
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Calorias"
                    value={novaRefeicao.calorias}
                    onChange={e => setNovaRefeicao(prev => ({ ...prev, calorias: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030]"
                    required
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Proteína (g)"
                    value={novaRefeicao.proteina}
                    onChange={e => setNovaRefeicao(prev => ({ ...prev, proteina: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030]"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="time"
                    value={novaRefeicao.horario}
                    onChange={e => setNovaRefeicao(prev => ({ ...prev, horario: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[#70707033] text-[#343030]"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#343030] text-white py-2 rounded-lg text-sm font-semibold active:bg-[#282828] transition-colors"
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 bg-[#F5F5F5] text-[#343030] py-2 rounded-lg text-sm font-semibold active:bg-[#E5E5E5] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {refeicoes.map((refeicao) => (
            <div key={refeicao.id} className="p-3 bg-[#F9FAFB] rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-[#343030]">{refeicao.alimento}</h3>
                  <span className="text-sm text-[#70707080]">{refeicao.horario}</span>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await supabaseApi.supabase
                        .from('refeicoes')
                        .delete()
                        .eq('id', refeicao.id);
                      
                      setRefeicoes(prev => prev.filter(r => r.id !== refeicao.id));
                      setTotalCalorias(prev => prev - refeicao.calorias);
                      setTotalProteina(prev => prev - refeicao.proteina);
                    } catch (error) {
                      console.error('Erro ao deletar refeição:', error);
                    }
                  }}
                  className="p-1 hover:bg-[#E5E5E5] rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-[#FF0000]" />
                </button>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-[#FF6F00]" />
                  <span className="text-sm text-[#343030]">{refeicao.calorias} kcal</span>
                </div>
                <div className="flex items-center gap-1">
                  <Apple className="w-4 h-4 text-[#3AFF00]" />
                  <span className="text-sm text-[#343030]">{refeicao.proteina}g</span>
                </div>
              </div>
            </div>
          ))}

          {refeicoes.length === 0 && !isAdding && (
            <div className="text-center py-8 text-[#70707080]">
              Nenhuma refeição registrada
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealTracker; 