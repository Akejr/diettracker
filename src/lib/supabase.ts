// Configuração do Supabase - MODO DEMO com dados fictícios
import { mockSupabaseApi } from './mockSupabase';

// Flag para controlar se usa dados mock ou Supabase real
const USE_MOCK_DATA = true; // Mude para false para usar Supabase real

// Usar variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pbejndhzvliniswiexin.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWpuZGh6dmxpbm5pc3dpZXhpbiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzQxNzI2NTEwLCJleHAiOjIwNTczMDI1MTB9.Itw3DJ6tQwPsMGm3FbBnQe0wT7DvNd53vyl_QRdMm2A';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

// Tipos para as tabelas do Supabase
export interface Usuario {
  id?: string;
  created_at?: string;
  updated_at?: string;
  nome: string;
  senha?: string;
  idade: number;
  peso: number; // Peso inicial
  peso_atual?: number; // Último peso registrado (campo virtual)
  diferenca_peso?: string; // Diferença entre peso inicial e atual (campo virtual)
  peso_anterior: number | null;
  peso_inicial: number;
  data_peso: string;
  altura: number;
  sexo: 'masculino' | 'feminino';
  nivel_atividade: string;
  objetivo: 'perder' | 'manter' | 'ganhar';
  meta_calorica: number;
  meta_proteina: number;
  meta_treinos: number;
  foto_url?: string;
}

export interface Refeicao {
  id: string;
  usuario_id: string;
  alimento: string;
  calorias: number;
  proteina: number;
  horario: string;
  data: string;
  created_at: string;
}

export interface RegistroPeso {
  id: string;
  usuario_id: string;
  peso: number;
  data: string;
  created_at: string;
}

export interface Treino {
  id: string;
  usuario_id: string;
  data: string;
  tipo: 'musculacao' | 'cardio';
  duracao: number;
  descricao: string;
  calorias: number;
  created_at: string;
}

// Classe para erros de autenticação - não usada no modo demo
class UserAuthError extends Error {
  constructor(message = 'Usuário não autenticado. Faça login novamente.') {
    super(message);
    this.name = 'UserAuthError';
  }
}

// Cliente Supabase placeholder (não usado no modo demo)
export const supabase = {
  auth: {
    refreshSession: () => Promise.resolve(),
  },
  rpc: () => Promise.resolve(),
};

// API principal - usa mock ou Supabase real baseado na flag
export const supabaseApi = USE_MOCK_DATA ? mockSupabaseApi : {
  // Implementação original do Supabase seria mantida aqui
  // Por enquanto, sempre usa mock
  ...mockSupabaseApi
};

// Log para indicar modo de operação
console.log(USE_MOCK_DATA ? '🎯 Modo Demo ativo - Usando dados fictícios' : '🔗 Conectado ao Supabase');