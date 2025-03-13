import React, { useState } from 'react';
import { Utensils, Flame, Apple, Clock } from 'lucide-react';

interface AddFoodFormProps {
  onAdd: (entry: { food: string; calories: number; protein: number; time: string }) => void;
}

const AddFoodForm: React.FC<AddFoodFormProps> = ({ onAdd }) => {
  const [food, setFood] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [time, setTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!food || !calories || !protein || !time) return;

    onAdd({
      food,
      calories: Number(calories),
      protein: Number(protein),
      time,
    });

    // Limpar formulário
    setFood('');
    setCalories('');
    setProtein('');
    setTime('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-black mb-6">Adicionar Refeição</h2>

      <div className="space-y-6">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Utensils className="w-5 h-5 text-gray-400" />
            <label htmlFor="food" className="text-gray-600">
              Nome do Alimento
            </label>
          </div>
          <input
            type="text"
            id="food"
            value={food}
            onChange={(e) => setFood(e.target.value)}
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
            placeholder="Ex: Frango Grelhado"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Flame className="w-5 h-5 text-orange-500" />
              <label htmlFor="calories" className="text-gray-600">
                Calorias
              </label>
            </div>
            <input
              type="number"
              id="calories"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
              placeholder="kcal"
              required
            />
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Apple className="w-5 h-5 text-green-500" />
              <label htmlFor="protein" className="text-gray-600">
                Proteína
              </label>
            </div>
            <input
              type="number"
              id="protein"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
              placeholder="gramas"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-blue-500" />
            <label htmlFor="time" className="text-gray-600">
              Horário
            </label>
          </div>
          <input
            type="time"
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-black focus:outline-none focus:border-black transition-colors"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-black text-white font-medium py-4 rounded-2xl hover:bg-gray-800 transition-colors mt-8"
      >
        Adicionar Refeição
      </button>
    </form>
  );
};

export default AddFoodForm;
