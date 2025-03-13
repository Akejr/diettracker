import { createClient } from '@supabase/supabase-js';

// Usar variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pbejndhzvliniswiexin.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWpuZGh6dmxpbmlzd2lleGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MjY1MTAsImV4cCI6MjA1NzMwMjUxMH0.Itw3DJ6tQwPsMGm3FbBnQe0wT7DvNd53vyl_QRdMm2A';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Tipos para as tabelas do Supabase
export interface Usuario {
  id?: string;
  created_at?: string;
  updated_at?: string;
  nome: string;
  idade: number;
  peso: number;
  altura: number;
  sexo: 'masculino' | 'feminino';
  nivel_atividade: string;
  objetivo: 'perder' | 'manter' | 'ganhar';
  meta_calorica: number;
  meta_proteina: number;
  meta_treinos: number;
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
  created_at: string;
}

// Funções auxiliares para interagir com o Supabase
export const supabaseApi = {
  supabase,

  // Usuários
  async criarUsuario(usuario: Omit<Usuario, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Usuario | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .insert([usuario])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar usuário:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return { data: null, error: error as Error };
    }
  },

  async atualizarUsuario(id: string, usuario: Partial<Usuario>): Promise<{ data: Usuario | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update(usuario)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar usuário:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { data: null, error: error as Error };
    }
  },

  // Refeições
  async adicionarRefeicao(dados: Omit<Refeicao, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('refeicoes')
      .insert([dados])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async listarRefeicoesDoDia(usuarioId: string, data: string) {
    const { data: refeicoes, error } = await supabase
      .from('refeicoes')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('data', data)
      .order('horario', { ascending: true });
    
    if (error) throw error;
    return refeicoes;
  },

  // Registro de Peso
  async registrarPeso(dados: Omit<RegistroPeso, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('registro_peso')
      .insert([dados])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async listarHistoricoPeso(usuarioId: string) {
    const { data: registros, error } = await supabase
      .from('registro_peso')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('data', { ascending: false });
    
    if (error) throw error;
    return registros;
  },

  // Treinos
  async adicionarTreino(dados: Omit<Treino, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('treinos')
      .insert([dados])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async listarTreinosDoDia(usuarioId: string, data: string) {
    const { data: treinos, error } = await supabase
      .from('treinos')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('data', data)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return treinos;
  },

  async listarTreinosDoMes(usuarioId: string, ano: number, mes: number) {
    const primeiroDia = new Date(ano, mes - 1, 1).toISOString().split('T')[0];
    const ultimoDia = new Date(ano, mes, 0).toISOString().split('T')[0];

    const { data: treinos, error } = await supabase
      .from('treinos')
      .select('*')
      .eq('usuario_id', usuarioId)
      .gte('data', primeiroDia)
      .lte('data', ultimoDia)
      .order('data', { ascending: true });
    
    if (error) throw error;
    return treinos;
  }
}; 