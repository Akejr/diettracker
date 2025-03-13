import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import Profile from './components/Profile';
import Tips from './components/Tips';
import Analise from './components/Analise';
import { supabaseApi } from './lib/supabase';
import { dateService } from './services/dateService';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserName = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabaseApi.supabase
          .from('usuarios')
          .select('nome')
          .limit(1)
          .single();
        
        if (error) {
          console.error('Erro ao carregar nome do usuário:', error);
          setError(error.message);
          return;
        }
        
        if (data?.nome) {
          const firstName = data.nome.split(' ')[0] || '';
          setUserName(firstName);
        }
      } catch (error) {
        console.error('Erro ao carregar nome do usuário:', error);
        setError('Erro ao carregar dados do usuário');
      } finally {
        setLoading(false);
      }
    };

    loadUserName();
  }, []);

  useEffect(() => {
    // Inicializa o serviço de data quando o app carrega
    dateService.fetchServerDate();
  }, []);

  const getHeaderTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return userName ? `Dieta de ${userName}` : 'Dashboard';
      case 'dicas':
        return 'Dicas e Recomendações';
      case 'analise':
        return 'Análise';
      case 'perfil':
        return 'Perfil';
      default:
        return activeView.charAt(0).toUpperCase() + activeView.slice(1);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'dicas':
        return <Tips />;
      case 'analise':
        return <Analise />;
      case 'perfil':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] max-w-md mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#70707033]">
        <div className="px-4 py-4 flex items-center justify-center">
          <h1 className={`text-xl font-bold text-center ${
            activeView === 'dashboard' 
              ? 'bg-gradient-to-r from-[#343030] to-[#454545] inline-block text-transparent bg-clip-text'
              : 'text-[#343030]'
          }`}>
            {getHeaderTitle()}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-[72px] pt-4 overflow-y-auto">
        {renderContent()}
      </div>

      {/* Navigation */}
      <Navigation activeView={activeView} onChangeView={setActiveView} />
    </div>
  );
}

export default App;
