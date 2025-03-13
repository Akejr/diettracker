import React from 'react';
import { Home, BarChart2, LineChart, User } from 'lucide-react';

interface NavigationProps {
  activeView: string;
  onChangeView: (view: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeView, onChangeView }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#70707033] px-6 py-2">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center">
          <button
            onClick={() => onChangeView('dashboard')}
            className={`flex flex-col items-center p-2 ${
              activeView === 'dashboard' ? 'text-[#181818]' : 'text-[#343030]'
            } hover:text-[#181818]`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </button>

          <button
            onClick={() => onChangeView('dicas')}
            className={`flex flex-col items-center p-2 ${
              activeView === 'dicas' ? 'text-[#181818]' : 'text-[#343030]'
            } hover:text-[#181818]`}
          >
            <BarChart2 className="w-6 h-6" />
            <span className="text-xs mt-1">Dicas</span>
          </button>

          <button
            onClick={() => onChangeView('analise')}
            className={`flex flex-col items-center p-2 ${
              activeView === 'analise' ? 'text-[#181818]' : 'text-[#343030]'
            } hover:text-[#181818]`}
          >
            <LineChart className="w-6 h-6" />
            <span className="text-xs mt-1">Análise</span>
          </button>

          <button
            onClick={() => onChangeView('perfil')}
            className={`flex flex-col items-center p-2 ${
              activeView === 'perfil' ? 'text-[#181818]' : 'text-[#343030]'
            } hover:text-[#181818]`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">Perfil</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 