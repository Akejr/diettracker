export interface Usuario {
  id: string;
  email: string;
  nome: string;
  idade: number;
  peso: number;
  altura: number;
  objetivo: string;
  meta_calorias: number;
  meta_proteinas: number;
  meta_carboidratos: number;
  meta_gorduras: number;
  created_at: string;
  updated_at: string;
}

export interface Treino {
  id: string;
  usuario_id: string;
  data: string;
  tipo: string;
  duracao: number;
  calorias: number;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface Refeicao {
  id: string;
  usuario_id: string;
  data: string;
  tipo: string;
  nome: string;
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface Habito {
  id: string;
  usuario_id: string;
  nome: string;
  tipo: string;
  valor_alvo: number;
  unidade: string;
  created_at: string;
  updated_at: string;
}

export interface RegistroHabito {
  id: string;
  habito_id: string;
  usuario_id: string;
  data: string;
  valor: number;
  concluido: boolean;
  created_at: string;
} 