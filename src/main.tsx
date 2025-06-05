import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Adicionar manipuladores de erros globais
window.addEventListener('unhandledrejection', (event) => {
  console.error('Promessa não tratada:', event.reason);
  // Evitar fechamento do canal de mensagens quando ocorrer erro de promessa
  if (event.reason && event.reason.message && 
      event.reason.message.includes('message channel closed')) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  console.error('Erro global:', event.error);
});

// Ativar logging de rede para depuração
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch request:', args[0]);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('Fetch response:', response.url, response.status);
      return response;
    })
    .catch(error => {
      console.error('Fetch error:', error, 'URL:', args[0]);
      throw error;
    });
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
