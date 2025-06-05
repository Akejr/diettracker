import React, { useState } from 'react';
import { FiShare2 } from 'react-icons/fi';
import { useTheme } from '../App';
import ShareModal from './ShareModal';

interface ShareButtonProps {
  className?: string;
  iconOnly?: boolean;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ className = '', iconOnly = false }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { darkMode } = useTheme();
  
  return (
    <>
      <button
        onClick={() => setIsShareModalOpen(true)}
        className={`${
          iconOnly 
            ? `p-2 rounded-full ${darkMode ? 'text-blue-400 hover:bg-gray-800' : 'text-blue-600 hover:bg-gray-100'}`
            : `flex items-center gap-2 py-2 px-4 rounded-lg ${
                darkMode 
                  ? 'bg-[#2A2A2A] text-blue-400 hover:bg-[#3A3A3A]' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`
        } ${className}`}
        aria-label="Compartilhar progresso"
      >
        <FiShare2 className={iconOnly ? 'w-5 h-5' : 'w-4 h-4'} />
        {!iconOnly && <span>Compartilhar</span>}
      </button>
      
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
      />
    </>
  );
};

export default ShareButton; 