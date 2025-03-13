const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pbejndhzvliniswixin.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWpuZGh6dmxpbmlzd2lleGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MjY1MTAsImV4cCI6MjA1NzMwMjUxMH0.Itw3DJ6tQwPsMGm3FbBnQe0wT7DvNd53vyl_QRdMm2A'
);

async function testarConexao() {
  try {
    console.log('Verificando tabelas...');

    // Tenta listar usuários
    const { data: usuarios, error: usuariosError } = await supabase
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

      const { data: novoUsuario, error: erroUsuario } = await supabase
        .from('usuarios')
        .insert([{
          nome: "Evandro",
          idade: 30,
          peso: 85,
          altura: 180,
          sexo: "masculino",
          nivel_atividade: "moderado",
          objetivo: "perder",
          meta_calorica: 2200,
          meta_proteina: 170,
          meta_treinos: 6
        }])
        .select()
        .single();

      if (erroUsuario) {
        console.error('Erro ao criar usuário:', erroUsuario);
      } else {
        console.log('✅ Usuário criado com sucesso:', novoUsuario);
      }
    }

    // Tenta listar refeições
    const { data: refeicoes, error: refeicoesError } = await supabase
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
    const { data: registros, error: registrosError } = await supabase
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