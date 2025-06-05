// Script para executar as migrações no Supabase
// Utiliza a API HTTP do Supabase para executar SQL
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Configurando caminhos relativos para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregue as variáveis de ambiente do arquivo .env
dotenv.config();

// URL e chave de serviço do Supabase (precisa ser chave de serviço para executar SQL)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: VITE_SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar definidos no arquivo .env');
  process.exit(1);
}

// Criar cliente Supabase com a chave de serviço
const supabase = createClient(supabaseUrl, supabaseKey);

async function executarMigracao() {
  console.log('Iniciando migração do Supabase...');

  try {
    // Verificar se os arquivos SQL existem
    const arquivosSQL = [
      'create_habitos_table.sql',
      'create_peso_registros.sql',
      'fix_rls.sql'
    ];
    
    for (const arquivo of arquivosSQL) {
      const caminhoArquivo = join(__dirname, arquivo);
      if (!existsSync(caminhoArquivo)) {
        console.error(`Erro: Arquivo ${arquivo} não encontrado em ${caminhoArquivo}!`);
        return;
      }
    }

    // Ler os arquivos SQL
    const sqlHabitos = readFileSync(join(__dirname, 'create_habitos_table.sql'), 'utf8');
    const sqlPesoRegistros = readFileSync(join(__dirname, 'create_peso_registros.sql'), 'utf8');
    const sqlRLS = readFileSync(join(__dirname, 'fix_rls.sql'), 'utf8');

    // Executar SQL para criar a tabela de hábitos
    console.log('Criando tabela de hábitos...');
    const { error: errorHabitos } = await supabase.rpc('exec_sql', { query: sqlHabitos });
    
    if (errorHabitos) {
      console.error('Erro ao criar tabela de hábitos:', errorHabitos);
    } else {
      console.log('✅ Tabela de hábitos criada com sucesso!');
    }

    // Executar SQL para criar a tabela de registros de peso
    console.log('Criando tabela de registros de peso...');
    const { error: errorPesoRegistros } = await supabase.rpc('exec_sql', { query: sqlPesoRegistros });
    
    if (errorPesoRegistros) {
      console.error('Erro ao criar tabela de registros de peso:', errorPesoRegistros);
    } else {
      console.log('✅ Tabela de registros de peso criada com sucesso!');
    }

    // Executar SQL para configurar as políticas de segurança
    console.log('Configurando políticas de segurança...');
    const { error: errorRLS } = await supabase.rpc('exec_sql', { query: sqlRLS });
    
    if (errorRLS) {
      console.error('Erro ao configurar políticas de segurança:', errorRLS);
    } else {
      console.log('✅ Políticas de segurança configuradas com sucesso!');
    }

    console.log('Migração concluída!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
    process.exit(1);
  }
}

executarMigracao(); 