// Dados fictícios para demonstração do sistema
import { Usuario, Refeicao, RegistroPeso, Treino } from '../lib/supabase';

// Usuário demo
export const mockUser: Usuario = {
  id: 'demo-user-id',
  nome: 'Carlos Demo',
  idade: 28,
  peso: 75,
  peso_atual: 74.2,
  diferenca_peso: '-0.8kg',
  peso_anterior: 74.5,
  peso_inicial: 75,
  data_peso: new Date().toISOString().split('T')[0],
  altura: 175,
  sexo: 'masculino',
  nivel_atividade: 'moderado',
  objetivo: 'perder',
  meta_calorica: 2000,
  meta_proteina: 120,
  meta_treinos: 4,
  foto_url: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Função para gerar datas dos últimos N dias
const getDateDaysAgo = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// Refeições dos últimos 7 dias
export const mockRefeicoes: Refeicao[] = [
  // Hoje
  { id: '1', usuario_id: 'demo-user-id', alimento: 'Omelete com queijo e presunto', calorias: 380, proteina: 25, horario: '08:00', data: getDateDaysAgo(0), created_at: new Date().toISOString() },
  { id: '2', usuario_id: 'demo-user-id', alimento: 'Frango grelhado com arroz integral', calorias: 550, proteina: 45, horario: '12:30', data: getDateDaysAgo(0), created_at: new Date().toISOString() },
  { id: '3', usuario_id: 'demo-user-id', alimento: 'Salmão com batata doce', calorias: 480, proteina: 35, horario: '19:00', data: getDateDaysAgo(0), created_at: new Date().toISOString() },
  
  // Ontem
  { id: '4', usuario_id: 'demo-user-id', alimento: 'Aveia com banana e whey', calorias: 320, proteina: 28, horario: '07:30', data: getDateDaysAgo(1), created_at: new Date().toISOString() },
  { id: '5', usuario_id: 'demo-user-id', alimento: 'Peito de frango com salada', calorias: 420, proteina: 40, horario: '12:00', data: getDateDaysAgo(1), created_at: new Date().toISOString() },
  { id: '6', usuario_id: 'demo-user-id', alimento: 'Peixe grelhado com legumes', calorias: 350, proteina: 30, horario: '18:30', data: getDateDaysAgo(1), created_at: new Date().toISOString() },
  
  // 2 dias atrás
  { id: '7', usuario_id: 'demo-user-id', alimento: 'Panqueca de aveia com frutas', calorias: 280, proteina: 18, horario: '08:15', data: getDateDaysAgo(2), created_at: new Date().toISOString() },
  { id: '8', usuario_id: 'demo-user-id', alimento: 'Carne magra com quinoa', calorias: 520, proteina: 42, horario: '13:00', data: getDateDaysAgo(2), created_at: new Date().toISOString() },
  { id: '9', usuario_id: 'demo-user-id', alimento: 'Tofu grelhado com verduras', calorias: 300, proteina: 20, horario: '19:30', data: getDateDaysAgo(2), created_at: new Date().toISOString() },
  
  // 3 dias atrás
  { id: '10', usuario_id: 'demo-user-id', alimento: 'Iogurte grego com granola', calorias: 250, proteina: 20, horario: '07:45', data: getDateDaysAgo(3), created_at: new Date().toISOString() },
  { id: '11', usuario_id: 'demo-user-id', alimento: 'Peixe com arroz e feijão', calorias: 580, proteina: 38, horario: '12:45', data: getDateDaysAgo(3), created_at: new Date().toISOString() },
  { id: '12', usuario_id: 'demo-user-id', alimento: 'Frango com batata doce', calorias: 450, proteina: 35, horario: '18:45', data: getDateDaysAgo(3), created_at: new Date().toISOString() },
];

// Registros de peso dos últimos 15 dias
export const mockRegistrosPeso: RegistroPeso[] = Array.from({ length: 15 }, (_, i) => ({
  id: `peso-${i + 1}`,
  usuario_id: 'demo-user-id',
  peso: parseFloat((75 - (i * 0.1) + (Math.random() - 0.5) * 0.3).toFixed(1)), // Tendência decrescente limpa
  data: getDateDaysAgo(i),
  created_at: new Date().toISOString()
}));

// Treinos dos últimos 10 dias
export const mockTreinos: Treino[] = [
  { id: '1', usuario_id: 'demo-user-id', data: getDateDaysAgo(0), tipo: 'musculacao', duracao: 60, descricao: 'Treino de peito e tríceps', calorias: 320, created_at: new Date().toISOString() },
  { id: '2', usuario_id: 'demo-user-id', data: getDateDaysAgo(1), tipo: 'cardio', duracao: 30, descricao: 'Corrida na esteira', calorias: 280, created_at: new Date().toISOString() },
  { id: '3', usuario_id: 'demo-user-id', data: getDateDaysAgo(2), tipo: 'musculacao', duracao: 55, descricao: 'Treino de costas e bíceps', calorias: 300, created_at: new Date().toISOString() },
  { id: '4', usuario_id: 'demo-user-id', data: getDateDaysAgo(3), tipo: 'cardio', duracao: 45, descricao: 'Bike ergométrica', calorias: 350, created_at: new Date().toISOString() },
  { id: '5', usuario_id: 'demo-user-id', data: getDateDaysAgo(4), tipo: 'musculacao', duracao: 65, descricao: 'Treino de pernas', calorias: 380, created_at: new Date().toISOString() },
  { id: '6', usuario_id: 'demo-user-id', data: getDateDaysAgo(6), tipo: 'musculacao', duracao: 50, descricao: 'Treino de ombros e abdome', calorias: 270, created_at: new Date().toISOString() },
  { id: '7', usuario_id: 'demo-user-id', data: getDateDaysAgo(7), tipo: 'cardio', duracao: 40, descricao: 'Caminhada rápida', calorias: 200, created_at: new Date().toISOString() },
  { id: '8', usuario_id: 'demo-user-id', data: getDateDaysAgo(8), tipo: 'musculacao', duracao: 55, descricao: 'Treino superior completo', calorias: 310, created_at: new Date().toISOString() },
  { id: '9', usuario_id: 'demo-user-id', data: getDateDaysAgo(9), tipo: 'cardio', duracao: 35, descricao: 'HIIT', calorias: 320, created_at: new Date().toISOString() },
];

// Hábitos mock
export const mockHabitos = [
  { id: '1', usuario_id: 'demo-user-id', nome: 'Beber 2L de água', tipo: 'saude', meta_diaria: 2, unidade: 'litros', completado_hoje: true, created_at: new Date().toISOString() },
  { id: '2', usuario_id: 'demo-user-id', nome: 'Meditar 15 minutos', tipo: 'bem_estar', meta_diaria: 15, unidade: 'minutos', completado_hoje: false, created_at: new Date().toISOString() },
  { id: '3', usuario_id: 'demo-user-id', nome: 'Caminhar 8000 passos', tipo: 'exercicio', meta_diaria: 8000, unidade: 'passos', completado_hoje: true, created_at: new Date().toISOString() },
  { id: '4', usuario_id: 'demo-user-id', nome: 'Dormir 8 horas', tipo: 'saude', meta_diaria: 8, unidade: 'horas', completado_hoje: false, created_at: new Date().toISOString() },
  { id: '5', usuario_id: 'demo-user-id', nome: 'Ler 30 minutos', tipo: 'lazer', meta_diaria: 30, unidade: 'minutos', completado_hoje: true, created_at: new Date().toISOString() },
]; 