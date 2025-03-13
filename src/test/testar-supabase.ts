import { supabaseApi } from '../lib/supabase';

async function testarConexao() {
  try {
    // Tenta criar um usuário de teste
    const dadosTeste = {
      nome: "Usuário Teste",
      idade: 30,
      peso: 75,
      altura: 175,
      sexo: "masculino" as const,
      nivel_atividade: "moderado",
      objetivo: "manter" as const,
      meta_calorica: 2000,
      meta_proteina: 150,
      meta_treinos: 3
    };

    console.log('Tentando criar usuário com os dados:', dadosTeste);

    const { data, error } = await supabaseApi.criarUsuario(dadosTeste);

    if (error) {
      console.error('Erro ao criar usuário:', error);
      return;
    }

    console.log('Usuário criado com sucesso:', data);

  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testarConexao(); 