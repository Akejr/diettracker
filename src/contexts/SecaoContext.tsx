import React, { createContext, useState } from 'react';

type SecaoType = 'resumo' | 'dicas' | 'historico';

// Definindo o tipo do contexto como uma função que recebe um parâmetro SecaoType
type SecaoContextType = ((secao: SecaoType) => void) | null;

// Criando o contexto com valor inicial null
export const SecaoContext = createContext<SecaoContextType>(null);

interface SecaoProviderProps {
  children: React.ReactNode;
}

export const SecaoProvider: React.FC<SecaoProviderProps> = ({ children }) => {
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoType>('resumo');

  return (
    <SecaoContext.Provider value={setSecaoAtiva}>
      {children}
    </SecaoContext.Provider>
  );
}; 