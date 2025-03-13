import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pbejndhzvliniswiexin.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWpuZGh6dmxpbmlzd2lleGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MjY1MTAsImV4cCI6MjA1NzMwMjUxMH0.Itw3DJ6tQwPsMGm3FbBnQe0wT7DvNd53vyl_QRdMm2A'
);

async function verificarTabelas() {
  console.log('Verificando tabelas...');

  try {
    // Verifica tabela usuarios
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1);

    if (usuariosError) {
      console.error('Erro ao verificar tabela usuarios:', usuariosError.message);
    } else {
      console.log('✅ Tabela usuarios OK');
      console.log('Dados encontrados:', usuarios);
    }

    // Verifica tabela refeicoes
    const { data: refeicoes, error: refeicoesError } = await supabase
      .from('refeicoes')
      .select('*')
      .limit(1);

    if (refeicoesError) {
      console.error('Erro ao verificar tabela refeicoes:', refeicoesError.message);
    } else {
      console.log('✅ Tabela refeicoes OK');
      console.log('Dados encontrados:', refeicoes);
    }

    // Verifica tabela registro_peso
    const { data: registroPeso, error: registroPesoError } = await supabase
      .from('registro_peso')
      .select('*')
      .limit(1);

    if (registroPesoError) {
      console.error('Erro ao verificar tabela registro_peso:', registroPesoError.message);
    } else {
      console.log('✅ Tabela registro_peso OK');
      console.log('Dados encontrados:', registroPeso);
    }

  } catch (error) {
    console.error('Erro ao verificar tabelas:', error);
  }
}

verificarTabelas(); 