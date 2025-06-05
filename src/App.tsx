import React, { useState, useEffect, createContext, useContext, ComponentType, ErrorInfo } from 'react';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import Profile from './components/Profile';
import Analise from './components/Analise';
import Habitos from './components/Habitos';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import ShareModal from './components/ShareModal';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Componente ErrorBoundary para capturar erros de renderização
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: ComponentType<{error: Error; resetError: () => void}>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Erro capturado pelo ErrorBoundary:", error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-[#121212] text-white">
          <FiAlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h1 className="text-xl font-bold mb-2">Ops! Algo deu errado</h1>
          <p className="text-gray-400 mb-4">
            {this.state.error?.message || "Ocorreu um erro inesperado."}
          </p>
          <button
            onClick={this.resetError}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <FiRefreshCw className="mr-2" /> Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Define ThemeContext com darkMode sempre ativo
const ThemeContext = createContext({
  darkMode: true
});

// Hook para usar o tema
export const useTheme = () => useContext(ThemeContext);

// Define o App como função normal (não export default)
function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(true);

  useEffect(() => {
    // Aplicar dark mode ao documento
    document.documentElement.classList.add('dark');
    console.log('🎯 Aplicação Demo iniciada - Dados fictícios carregados');
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'analise':
        return <Analise />;
      case 'habitos':
        return <Habitos />;
      case 'perfil':
        return <Profile onLogout={() => console.log('Demo: logout simulado')} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-[#121212]">
      {/* Banner de demonstração */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 px-4 text-sm">
        🎯 Modo Demonstração - Dados fictícios para apresentação
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-hidden relative z-10 max-w-md mx-auto w-full px-4 pt-safe">
        <div className="h-full overflow-y-auto pt-4 pb-20">
          {renderContent()}
        </div>
      </div>

      {/* Share modal */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
      />

      {/* PWA Install Prompt para iOS */}
      {showPWAPrompt && (
        <PWAInstallPrompt onClose={() => setShowPWAPrompt(false)} />
      )}

      <Navigation 
        activeView={activeView} 
        onChangeView={setActiveView} 
      />
    </div>
  );
}

// Componente que combina o App com o ThemeContext e ErrorBoundary
const AppWithTheme = () => (
  <ErrorBoundary>
    <ThemeContext.Provider value={{ darkMode: true }}>
      <App />
    </ThemeContext.Provider>
  </ErrorBoundary>
);

// Exporta o AppWithTheme como default
export default AppWithTheme;
