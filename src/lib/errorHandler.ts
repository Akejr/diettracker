// Error Handler para a aplicação

/**
 * Classe para erros de autenticação
 */
export class AuthError extends Error {
  constructor(message = 'Usuário não autenticado. Faça login novamente.') {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Classe para erros de permissão
 */
export class PermissionError extends Error {
  constructor(message = 'Você não tem permissão para acessar estes dados.') {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Classe para erros de servidor
 */
export class ServerError extends Error {
  constructor(message = 'Erro no servidor. Tente novamente mais tarde.') {
    super(message);
    this.name = 'ServerError';
  }
}

/**
 * Função para lidar com erros do Supabase
 * @param error Erro retornado pelo Supabase
 * @returns Mensagem de erro amigável
 */
export function handleSupabaseError(error: any): string {
  console.error('Erro do Supabase:', error);
  
  // Verificar o código de erro
  if (error.code) {
    switch (error.code) {
      case 'PGRST116': 
        return 'Nenhum registro encontrado.';
      case '42P01': 
        return 'Tabela não encontrada. O banco de dados pode estar desatualizado.';
      case '23505': 
        return 'Este registro já existe.';
      case '23503': 
        return 'Este registro não pode ser manipulado pois está relacionado a outros dados.';
      case '42703': 
        return 'Coluna não encontrada. A estrutura do banco de dados pode estar desatualizada.';
      case '42601': 
        return 'Erro de sintaxe na consulta.';
      case '28000': 
        return 'Erro de autenticação. Faça login novamente.';
      default: 
        return error.message || 'Ocorreu um erro desconhecido.';
    }
  }
  
  return error.message || 'Ocorreu um erro desconhecido.';
}

/**
 * Função para redirecionar o usuário para a tela de login em caso de erro de autenticação
 */
export function redirectToLogin() {
  // Limpar localStorage
  localStorage.clear();
  
  // Recarregar a página para ir para a tela de login
  window.location.reload();
}

/**
 * Trata erros de forma global na aplicação
 * @param error Erro a ser tratado
 * @param showAlert Se true, mostra um alerta com a mensagem de erro
 * @returns Mensagem de erro amigável
 */
export function handleError(error: any, showAlert = false): string {
  let message: string;
  
  // Verificar se é um erro específico da nossa aplicação
  if (error instanceof AuthError) {
    // Erros de autenticação redirecionam para login
    message = error.message;
    redirectToLogin();
  } else if (error instanceof PermissionError) {
    message = error.message;
  } else if (error instanceof ServerError) {
    message = error.message;
  } else if (error.code && error.code.startsWith('PGRST')) {
    // Erros específicos do PostgREST/Supabase
    message = handleSupabaseError(error);
  } else {
    // Erros genéricos
    message = error.message || 'Ocorreu um erro desconhecido.';
  }
  
  // Mostrar alerta se solicitado
  if (showAlert) {
    alert(message);
  }
  
  return message;
} 