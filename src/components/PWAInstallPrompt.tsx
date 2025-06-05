import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Share } from 'lucide-react';

interface PWAInstallPromptProps {
  onClose: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Detecta se é iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Detecta se já está instalado como PWA
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                              (window.navigator as any).standalone === true;

    // Só mostra o prompt se for iOS e não estiver em modo standalone
    setIsVisible(isIOS && !isInStandaloneMode);

    // Salva no localStorage que já mostramos o prompt
    const hasShownPrompt = localStorage.getItem('pwaPromptShown');
    if (hasShownPrompt) {
      setIsVisible(false);
    } else {
      localStorage.setItem('pwaPromptShown', 'true');
    }
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-4 left-4 right-4 z-50"
    >
      <div className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl p-4 shadow-lg backdrop-blur-sm">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            <Download className="text-[#00E676] w-5 h-5 mr-2" />
            <h3 className="text-white font-medium">Instale o app</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-[#808080] hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <p className="text-[#B0B0B0] text-sm mb-4">
          Instale o minimalist.fit na sua tela inicial para acesso rápido e uma experiência completa.
        </p>
        
        <div className="bg-[#2a2a2a] rounded-lg p-3 mb-3">
          <div className="flex items-center mb-2">
            <span className="bg-[#00E676] text-black font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">1</span>
            <p className="text-white text-sm">Toque no botão de compartilhamento</p>
          </div>
          <div className="flex justify-center mb-1">
            <Share className="text-white w-6 h-6" />
          </div>
        </div>
        
        <div className="bg-[#2a2a2a] rounded-lg p-3">
          <div className="flex items-center mb-2">
            <span className="bg-[#00E676] text-black font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">2</span>
            <p className="text-white text-sm">Selecione "Adicionar à Tela de Início"</p>
          </div>
          <div className="flex justify-center">
            <div className="bg-[#1A1A1A] rounded-lg px-3 py-1 text-white text-sm">
              Adicionar à Tela de Início
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PWAInstallPrompt;
