import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pbejndhzvliniswiexin.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWpuZGh6dmxpbmlzd2lleGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MjY1MTAsImV4cCI6MjA1NzMwMjUxMH0.Itw3DJ6tQwPsMGm3FbBnQe0wT7DvNd53vyl_QRdMm2A';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testarInsercao() {
  const userId = 'fb557e67-1fcc-482f-b0ae-2a4468a20fc4'; // ID do seu usuário
  const dataAtual = new Date().toISOString().split('T')[0];
  
  console.log('Testando inserção na tabela refeicoes...');
  const refeicaoTeste = {
    usuario_id: userId,
    alimento: 'Teste',
    calorias: 100,
    proteina: 20,
    horario: '12:00',
    data: dataAtual
  };
  
  const { data: refeicao, error: refError } = await supabase
    .from('refeicoes')
    .insert([refeicaoTeste])
    .select();
  
  if (refError) {
    console.error('Erro ao inserir refeição:', refError);
  } else {
    console.log('Refeição inserida com sucesso:', refeicao);
  }

  console.log('\nTestando inserção na tabela registro_peso...');
  const registroTeste = {
    usuario_id: userId,
    peso: 90,
    data: dataAtual
  };
  
  const { data: registro, error: regError } = await supabase
    .from('registro_peso')
    .insert([registroTeste])
    .select();
  
  if (regError) {
    console.error('Erro ao inserir registro de peso:', regError);
  } else {
    console.log('Registro de peso inserido com sucesso:', registro);
  }
}

testarInsercao(); 