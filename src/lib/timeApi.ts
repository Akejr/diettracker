import { supabaseApi } from './supabase';

export const getServerTime = async (): Promise<Date> => {
  try {
    // Primeiro tenta buscar do Supabase
    const { data: currentTime } = await supabaseApi.supabase.rpc('get_current_date');
    if (currentTime) {
      return new Date(currentTime);
    }
  } catch (error) {
    console.error('Erro ao buscar hora do Supabase:', error);
  }

  // Se falhar, usa a hora local ajustada para Brasília
  const dataLocal = new Date();
  // Ajusta para UTC-3 (Brasília)
  dataLocal.setHours(dataLocal.getHours() - 3);
  return dataLocal;
}; 