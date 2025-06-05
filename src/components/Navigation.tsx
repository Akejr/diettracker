import React from 'react';
import { Home, CheckSquare, PieChart, User, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavigationProps {
  activeView: string;
  onChangeView: (view: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeView, onChangeView }) => {
  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pb-safe-bottom"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", bounce: 0.3 }}
    >
      <div className="max-w-md mx-auto">
        <div className="bg-[#1A1A1A] backdrop-blur-lg border border-[#2a2a2a] rounded-2xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-around relative">
            {/* Indicador de item ativo */}
            <AnimatePresence>
              <motion.div 
                className="absolute top-0 h-1 bg-gradient-to-r from-[#3D5AFE] to-[#00E676] rounded-b-md"
                layoutId="nav-indicator"
                style={{ 
                  width: '25%',
                  left: getIndicatorPosition(activeView)
                }}
                transition={{ type: "spring", bounce: 0.2 }}
              />
            </AnimatePresence>
            
            <NavButton 
              icon={<Home size={20} />} 
              label="Home" 
              isActive={activeView === 'dashboard'} 
              onClick={() => onChangeView('dashboard')}
            />
            
            <NavButton 
              icon={<CheckSquare size={20} />} 
              label="Hábitos" 
              isActive={activeView === 'habitos'} 
              onClick={() => onChangeView('habitos')}
            />
            
            <NavButton 
              icon={<PieChart size={20} />} 
              label="Análise" 
              isActive={activeView === 'analise'} 
              onClick={() => onChangeView('analise')}
            />
            
            <NavButton 
              icon={<User size={20} />} 
              label="Perfil" 
              isActive={activeView === 'perfil'} 
              onClick={() => onChangeView('perfil')}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Função auxiliar para calcular a posição do indicador
const getIndicatorPosition = (activeView: string): string => {
  switch (activeView) {
    case 'dashboard': return '0%';
    case 'habitos': return '25%';
    case 'analise': return '50%';
    case 'perfil': return '75%';
    default: return '0%';
  }
};

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center py-3 px-4 w-1/4 relative"
    >
      <div className="relative">
        {isActive && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#3D5AFE]/20 to-[#00E676]/20 rounded-full"
            style={{ transform: 'scale(1.8)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
        
        <motion.div 
          className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500'}`}
          whileTap={{ scale: 0.9 }}
        >
          {icon}
        </motion.div>
      </div>
      
      <span className={`text-xs font-medium mt-1 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500'}`}>
        {label}
      </span>
    </button>
  );
};

export default Navigation;