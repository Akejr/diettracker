import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pbejndhzvliniswiexin.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWpuZGh6dmxpbmlzd2lleGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MjY1MTAsImV4cCI6MjA1NzMwMjUxMH0.Itw3DJ6tQwPsMGm3FbBnQe0wT7DvNd53vyl_QRdMm2A';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testarTabelas() {
  console.log('Testando tabela usuarios...');
  const { data: usuarios, error: userError } = await supabase
    .from('usuarios')
    .select('*')
    .limit(1);
  
  if (userError) {
    console.error('Erro ao acessar tabela usuarios:', userError);
  } else {
    console.log('Tabela usuarios OK:', usuarios);
  }

  console.log('\nTestando tabela refeicoes...');
  const { data: refeicoes, error: refError } = await supabase
    .from('refeicoes')
    .select('*')
    .limit(1);
  
  if (refError) {
    console.error('Erro ao acessar tabela refeicoes:', refError);
  } else {
    console.log('Tabela refeicoes OK:', refeicoes);
  }

  console.log('\nTestando tabela registro_peso...');
  const { data: registros, error: regError } = await supabase
    .from('registro_peso')
    .select('*')
    .limit(1);
  
  if (regError) {
    console.error('Erro ao acessar tabela registro_peso:', regError);
  } else {
    console.log('Tabela registro_peso OK:', registros);
  }
}

testarTabelas(); 