import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pbejndhzvliniswixin.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWpuZGh6dmxpbmlzd2lleGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MjY1MTAsImV4cCI6MjA1NzMwMjUxMH0.Itw3DJ6tQwPsMGm3FbBnQe0wT7DvNd53vyl_QRdMm2A'
);

async function criarUsuario() {
  console.log('Criando usuário...');

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        {
          nome: 'João Evandro',
          peso: 85,
          altura: 180,
          idade: 30,
          sexo: 'masculino',
          nivel_atividade: 'moderado',
          objetivo: 'perder',
          meta_calorica: 2200,
          meta_proteina: 170,
          meta_treinos: 6
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error.message);
      console.error('Detalhes do erro:', error);
    } else {
      console.log('✅ Usuário criado com sucesso:', data);
    }

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
  }
}

criarUsuario(); 