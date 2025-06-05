// Mock do Supabase API para demonstração
import { Usuario, Refeicao, RegistroPeso, Treino } from './supabase';
import { 
  mockUser, 
  mockRefeicoes, 
  mockRegistrosPeso, 
  mockTreinos, 
  mockHabitos 
} from '../data/mockData';

// Dados locais que serão modificados durante o uso
let localRefeicoes = [...mockRefeicoes];
let localTreinos = [...mockTreinos];
let localRegistrosPeso = [...mockRegistrosPeso];
let localHabitos = [...mockHabitos];
let localUser = { ...mockUser };

// Simular delay de API
const simulateDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const mockSupabaseApi = {
  // Mock do Supabase client
  supabase: null,

  // Sempre retorna true para o usuário demo
  requireAuth(): string {
    return 'demo-user-id';
  },

  // Usuários
  async criarUsuario(usuario: Omit<Usuario, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Usuario | null; error: Error | null }> {
    await simulateDelay();
    return { data: mockUser, error: null };
  },

  async atualizarUsuario(id: string, usuario: Partial<Usuario>): Promise<{ data: Usuario | null; error: Error | null }> {
    await simulateDelay();
    localUser = { ...localUser, ...usuario };
    return { data: localUser, error: null };
  },

  // Refeições
  async adicionarRefeicao(dados: Omit<Refeicao, 'id' | 'created_at'>): Promise<Refeicao> {
    await simulateDelay();
    const novaRefeicao: Refeicao = {
      ...dados,
      id: `refeicao-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    localRefeicoes.unshift(novaRefeicao);
    return novaRefeicao;
  },

  async removerRefeicao(id: string): Promise<void> {
    await simulateDelay();
    localRefeicoes = localRefeicoes.filter(r => r.id !== id);
  },

  async listarRefeicoesDoDia(data: string, usuarioId?: string) {
    await simulateDelay();
    const refeicoesDoDia = localRefeicoes.filter(r => r.data === data);
    return { data: refeicoesDoDia, error: null };
  },

  // Peso
  async registrarPeso(dados: Omit<RegistroPeso, 'id' | 'created_at'>) {
    await simulateDelay();
    const novoRegistro: RegistroPeso = {
      ...dados,
      id: `peso-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    localRegistrosPeso.unshift(novoRegistro);
    
    // Atualizar peso atual do usuário
    localUser.peso_atual = dados.peso;
    localUser.peso_anterior = localUser.peso;
    localUser.diferenca_peso = `${(dados.peso - localUser.peso_inicial).toFixed(1)}kg`;
    
    return { data: novoRegistro, error: null };
  },

  async listarHistoricoPeso(usuarioId?: string): Promise<{ data: any[]; error: Error | null }> {
    await simulateDelay();
    return { data: localRegistrosPeso, error: null };
  },

  // Treinos
  async adicionarTreino(dados: Omit<Treino, 'id' | 'created_at'>) {
    await simulateDelay();
    const novoTreino: Treino = {
      ...dados,
      id: `treino-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    localTreinos.unshift(novoTreino);
    return { data: novoTreino, error: null };
  },

  async listarTreinosDoDia(data: string, userId: string): Promise<{ data: Treino[]; error: Error | null }> {
    await simulateDelay();
    const treinosDoDia = localTreinos.filter(t => t.data === data);
    return { data: treinosDoDia, error: null };
  },

  async listarTreinosDoMes(ano: number, mes: number, usuarioId?: string) {
    await simulateDelay();
    const treinosDoMes = localTreinos.filter(t => {
      const dataTreino = new Date(t.data);
      return dataTreino.getFullYear() === ano && dataTreino.getMonth() === mes - 1;
    });
    return { data: treinosDoMes, error: null };
  },

  // Hábitos
  async listarHabitos(usuarioId?: string) {
    await simulateDelay();
    return { data: localHabitos, error: null };
  },

  async criarHabito(dados: Omit<any, 'id' | 'created_at'>) {
    await simulateDelay();
    const novoHabito = {
      id: `habito-${Date.now()}`,
      usuario_id: 'demo-user-id',
      nome: dados.nome,
      tipo: dados.tipo,
      meta_diaria: dados.meta_diaria,
      unidade: dados.unidade,
      created_at: new Date().toISOString(),
      completado_hoje: false
    };
    localHabitos.push(novoHabito);
    return { data: novoHabito, error: null };
  },

  // Autenticação (sempre retorna sucesso para o usuário demo)
  async autenticarUsuario(nome: string, senha: string): Promise<{ data: { id: string; nome: string } | null; error: Error | null }> {
    await simulateDelay();
    return { 
      data: { id: 'demo-user-id', nome: 'Carlos Demo' }, 
      error: null 
    };
  },

  // Obter usuário
  async getUser(id: string): Promise<{ data: Usuario | null; error: Error | null }> {
    await simulateDelay();
    return { data: localUser, error: null };
  },

  async listarRefeicoesPeriodo(dataInicio: string, dataFim: string, usuarioId?: string): Promise<{ data: any[]; error: Error | null }> {
    await simulateDelay();
    const refeicoesPeriodo = localRefeicoes.filter(r => r.data >= dataInicio && r.data <= dataFim);
    return { data: refeicoesPeriodo, error: null };
  },

  async listarTreinosPeriodo(dataInicio: string, dataFim: string, usuarioId?: string): Promise<{ data: any[]; error: Error | null }> {
    await simulateDelay();
    const treinosPeriodo = localTreinos.filter(t => t.data >= dataInicio && t.data <= dataFim);
    return { data: treinosPeriodo, error: null };
  },

  async atualizarPerfil(dados: {
    id: string;
    peso: number;
    peso_anterior: number | null;
    peso_inicial: number;
  }): Promise<{ data: Usuario | null; error: Error | null }> {
    await simulateDelay();
    localUser.peso_atual = dados.peso;
    localUser.peso_anterior = dados.peso_anterior;
    localUser.peso_inicial = dados.peso_inicial;
    localUser.diferenca_peso = `${(dados.peso - dados.peso_inicial).toFixed(1)}kg`;
    return { data: localUser, error: null };
  },

  async obterPerfil(userId: string): Promise<{ data: Usuario | null; error: Error | null }> {
    await simulateDelay();
    return { data: localUser, error: null };
  },

  async listarTreinosDaSemana(userId: string): Promise<{ data: Treino[]; error: Error | null }> {
    await simulateDelay();
    const hoje = new Date();
    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(hoje.getDate() - 7);
    
    const treinosSemana = localTreinos.filter(t => {
      const dataTreino = new Date(t.data);
      return dataTreino >= seteDiasAtras && dataTreino <= hoje;
    });
    
    return { data: treinosSemana, error: null };
  },

  async obterUltimoPesoRegistrado(usuarioId: string): Promise<{ data: any; error: Error | null }> {
    await simulateDelay();
    const ultimoPeso = localRegistrosPeso[0];
    return { data: ultimoPeso, error: null };
  }
}; 