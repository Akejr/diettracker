import { supabaseApi } from '../lib/supabase';

async function testarConexao() {
  try {
    console.log('Verificando tabelas...');

    // Tenta listar usuários
    const { data: usuarios, error: usuariosError } = await supabaseApi.supabase
      .from('usuarios')
      .select('*')
      .limit(1);

    if (usuariosError) {
      console.error('Erro ao verificar tabela usuarios:', usuariosError.message);
    } else {
      console.log('✅ Tabela usuarios OK');
      console.log('Usuários encontrados:', usuarios);
    }

    // Se não houver usuários, tenta criar um
    if (!usuarios || usuarios.length === 0) {
      console.log('Nenhum usuário encontrado. Tentando criar um usuário de teste...');

      const dadosTeste = {
        nome: "Evandro",
        idade: 30,
        peso: 85,
        altura: 180,
        sexo: "masculino" as const,
        nivel_atividade: "moderado",
        objetivo: "perder" as const,
        meta_calorica: 2200,
        meta_proteina: 170,
        meta_treinos: 6
      };

      const { data: novoUsuario, error: erroUsuario } = await supabaseApi.criarUsuario(dadosTeste);

      if (erroUsuario) {
        console.error('Erro ao criar usuário:', erroUsuario);
      } else {
        console.log('✅ Usuário criado com sucesso:', novoUsuario);
      }
    }

    // Tenta listar refeições
    const { data: refeicoes, error: refeicoesError } = await supabaseApi.supabase
      .from('refeicoes')
      .select('*')
      .limit(1);

    if (refeicoesError) {
      console.error('Erro ao verificar tabela refeicoes:', refeicoesError.message);
    } else {
      console.log('✅ Tabela refeicoes OK');
      console.log('Refeições encontradas:', refeicoes);
    }

    // Tenta listar registros de peso
    const { data: registros, error: registrosError } = await supabaseApi.supabase
      .from('registro_peso')
      .select('*')
      .limit(1);

    if (registrosError) {
      console.error('Erro ao verificar tabela registro_peso:', registrosError.message);
    } else {
      console.log('✅ Tabela registro_peso OK');
      console.log('Registros encontrados:', registros);
    }

  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testarConexao(); 