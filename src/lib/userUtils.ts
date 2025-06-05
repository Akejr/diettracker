// Utilitários para gerenciar o usuário atual e filtrar dados

import { supabaseApi } from './supabase';
import { mockUser } from '../data/mockData';

// Constantes para armazenamento
const USER_STORAGE_KEY = 'currentUser';
const SESSION_TOKEN_KEY = 'sessionToken';
const SESSION_EXPIRY_KEY = 'sessionExpiry';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

// Interface para o usuário armazenado no localStorage
export interface CurrentUser {
  id: string;
  nome: string;
  isLoggedIn: boolean;
}

/**
 * Gera um token de sessão aleatório
 */
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Obtém o usuário atual do localStorage
 */
export function getCurrentUser(): CurrentUser | null {
  // Sempre retorna o usuário demo
  return {
    id: 'demo-user-id',
    nome: 'Carlos Demo',
    isLoggedIn: true
  };
}

/**
 * Obtém o ID do usuário atual
 */
export function getCurrentUserId(): string | null {
  // Sempre retorna o ID do usuário demo
  return 'demo-user-id';
}

/**
 * Salva o usuário atual no localStorage e cria uma sessão
 */
export async function setCurrentUser(user: CurrentUser, senha?: string): Promise<void> {
  // Para demonstração, não precisa fazer nada
  console.log('Demo: usuário definido como', user.nome);
}

/**
 * Remove o usuário atual do localStorage (logout)
 */
export function clearCurrentUser(): void {
  // Para demonstração, não precisa fazer nada
  console.log('Demo: usuário deslogado');
}

/**
 * Verifica se há um usuário logado
 */
export function isUserLoggedIn(): boolean {
  // Sempre retorna true para o usuário demo
  return true;
}

/**
 * Filtra um array de objetos para incluir apenas itens do usuário atual
 * @param items Array de itens com propriedade usuario_id
 * @returns Array filtrado contendo apenas itens do usuário atual
 */
export function filterUserItems<T extends { usuario_id: string }>(items: T[]): T[] {
  const userId = getCurrentUserId();
  if (!userId) {
    console.warn('Tentativa de filtrar itens sem usuário logado');
    return [];
  }
  
  return items.filter(item => item.usuario_id === userId);
}

/**
 * Adiciona o ID do usuário atual a um novo objeto
 * @param item Objeto sem ID de usuário
 * @returns Objeto com ID de usuário adicionado ou null se nenhum usuário estiver logado
 */
export function addUserIdToItem<T>(item: T): (T & { usuario_id: string }) | null {
  const userId = getCurrentUserId();
  if (!userId) {
    console.warn('Tentativa de adicionar ID de usuário sem usuário logado');
    return null;
  }
  
  return {
    ...item,
    usuario_id: userId
  } as T & { usuario_id: string };
}

/**
 * Cria um filtro de usuário para consultas Supabase
 * @returns Um objeto de configuração para consultas Supabase com filtro de usuário
 */
export function createUserFilter() {
  const userId = getCurrentUserId();
  if (!userId) {
    console.warn('Tentativa de criar filtro sem usuário logado');
    return {};
  }
  
  return {
    column: 'usuario_id',
    value: userId,
    operator: 'eq' as const
  };
}

/**
 * Verifica se um objeto pertence ao usuário atual
 * @param item Objeto com propriedade usuario_id
 * @returns boolean indicando se o item pertence ao usuário atual
 */
export function isOwnedByCurrentUser<T extends { usuario_id: string }>(item: T): boolean {
  const userId = getCurrentUserId();
  if (!userId) return false;
  
  return item.usuario_id === userId;
}

/**
 * Renova a sessão do usuário atual
 * @returns boolean indicando se a renovação foi bem-sucedida
 */
export function renewSession(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Atualizar token e expiration date
  const token = generateSessionToken();
  localStorage.setItem(SESSION_TOKEN_KEY, token);
  
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  localStorage.setItem(SESSION_EXPIRY_KEY, expiry.toISOString());
  
  return true;
}

export function setUserToken(token: string): void {
  // Para demonstração, não precisa fazer nada
  console.log('Demo: token definido');
}

export function getUserToken(): string | null {
  // Sempre retorna um token fictício
  return 'demo-token';
}

export function clearUserToken(): void {
  // Para demonstração, não precisa fazer nada
  console.log('Demo: token limpo');
}

// Função para simular login bem-sucedido
export function simulateLogin(nome: string, senha: string): boolean {
  // Sempre retorna sucesso para qualquer credencial
  console.log(`Demo: login simulado para ${nome}`);
  return true;
}

// Função para obter dados do usuário atual
export function getCurrentUserData() {
  // Sempre retorna os dados do usuário demo
  return mockUser;
}

// Função para atualizar dados do usuário (apenas local)
export function updateCurrentUserData(updates: Partial<typeof mockUser>) {
  // Para demonstração, apenas log
  console.log('Demo: dados do usuário atualizados', updates);
} 