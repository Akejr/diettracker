// Script para criar as tabelas necessárias usando a API REST do Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// URL e chave de serviço do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: VITE_SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar definidos no arquivo .env');
  process.exit(1);
}

// Criar cliente Supabase com a chave de serviço
const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarTabelas() {
  try {
    console.log('Verificando tabelas existentes no Supabase...');
    
    // Verificar tabela 'habitos'
    const { data: habitosData, error: habitosError } = await supabase
      .from('habitos')
      .select('id')
      .limit(1);
    
    if (habitosError && habitosError.code === 'PGRST301') {
      console.log('❌ Tabela habitos não existe. Criando...');
      await criarTabelaHabitos();
    } else {
      console.log('✅ Tabela habitos já existe.');
    }
    
    // Verificar tabela 'peso_registros'
    const { data: pesoData, error: pesoError } = await supabase
      .from('peso_registros')
      .select('id')
      .limit(1);
    
    if (pesoError && pesoError.code === 'PGRST301') {
      console.log('❌ Tabela peso_registros não existe. Criando...');
      await criarTabelaPesoRegistros();
    } else {
      console.log('✅ Tabela peso_registros já existe.');
    }
    
    // Configurar políticas de segurança (RLS)
    console.log('Configurando políticas de segurança...');
    await configurarPoliticasSeguranca();
    
    console.log('Processo concluído.');
  } catch (error) {
    console.error('Erro durante a verificação/criação das tabelas:', error);
  }
}

async function criarTabelaHabitos() {
  try {
    // Primeiro, criar tabela habitos usando API de management do Supabase
    const tableDefinition = {
      name: 'habitos',
      schema: 'public',
      if_not_exists: true, // Não criar se já existir
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimaryKey: true,
          primaryKey: { name: 'habitos_pkey', options: { method: 'uuid_generate_v4()' } }
        },
        {
          name: 'usuario_id',
          type: 'uuid',
          isNullable: false,
          foreignKeys: [{ table: 'usuarios', column: 'id', onDelete: 'CASCADE' }]
        },
        { name: 'nome', type: 'text', isNullable: false },
        { name: 'descricao', type: 'text', isNullable: true },
        { 
          name: 'frequencia', 
          type: 'text', 
          isNullable: false,
          // Adicionar check constraint via API
          checks: [{ name: 'frequencia_check', constraint: "frequencia IN ('diario', 'semanal')" }]
        },
        { name: 'dias_semana', type: 'integer[]', isNullable: true },
        { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
        { name: 'completados', type: 'date[]', default: '{}' },
        { name: 'streak', type: 'integer', default: 0 },
        { name: 'ultima_data', type: 'date', isNullable: true }
      ]
    };
    
    console.log('Atenção: Não é possível criar tabelas diretamente via API REST do Supabase.');
    console.log('Por favor, crie manualmente a tabela habitos no painel admin do Supabase ou via SQL.');
    console.log('Definição da tabela habitos:');
    console.log(JSON.stringify(tableDefinition, null, 2));
    
    return false;
  } catch (error) {
    console.error('Erro ao criar tabela habitos:', error);
    return false;
  }
}

async function criarTabelaPesoRegistros() {
  try {
    // Primeiro, criar tabela peso_registros usando API de management do Supabase
    const tableDefinition = {
      name: 'peso_registros',
      schema: 'public',
      if_not_exists: true,
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimaryKey: true,
          primaryKey: { name: 'peso_registros_pkey', options: { method: 'uuid_generate_v4()' } }
        },
        {
          name: 'usuario_id',
          type: 'uuid',
          isNullable: false,
          foreignKeys: [{ table: 'usuarios', column: 'id', onDelete: 'CASCADE' }]
        },
        { name: 'data', type: 'date', isNullable: false },
        { name: 'peso', type: 'numeric(5,2)', isNullable: false },
        { name: 'observacoes', type: 'text', isNullable: true },
        { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
        { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' }
      ],
      constraints: [
        { 
          name: 'peso_registros_usuario_data_unique',
          type: 'unique',
          columns: ['usuario_id', 'data']
        }
      ]
    };
    
    console.log('Atenção: Não é possível criar tabelas diretamente via API REST do Supabase.');
    console.log('Por favor, crie manualmente a tabela peso_registros no painel admin do Supabase ou via SQL.');
    console.log('Definição da tabela peso_registros:');
    console.log(JSON.stringify(tableDefinition, null, 2));
    
    return false;
  } catch (error) {
    console.error('Erro ao criar tabela peso_registros:', error);
    return false;
  }
}

async function configurarPoliticasSeguranca() {
  console.log('Atenção: Não é possível configurar políticas RLS diretamente via API REST do Supabase.');
  console.log('Por favor, configure manualmente as políticas RLS no painel admin do Supabase ou via SQL.');
  
  const politicasNecessarias = [
    {
      tabela: 'habitos',
      politicas: [
        {
          nome: 'habitos_user_select_policy',
          operacao: 'SELECT',
          using: "auth.uid()::text = usuario_id::text OR usuario_id IN (SELECT id FROM public.usuarios WHERE auth.uid()::text = id::text)"
        },
        {
          nome: 'habitos_user_modify_policy',
          operacao: 'ALL',
          using: "auth.uid()::text = usuario_id::text OR usuario_id IN (SELECT id FROM public.usuarios WHERE auth.uid()::text = id::text)"
        }
      ]
    },
    {
      tabela: 'peso_registros',
      politicas: [
        {
          nome: 'peso_user_select_policy',
          operacao: 'SELECT',
          using: "auth.uid()::text = usuario_id::text OR usuario_id IN (SELECT id FROM public.usuarios WHERE auth.uid()::text = id::text)"
        },
        {
          nome: 'peso_user_modify_policy',
          operacao: 'ALL',
          using: "auth.uid()::text = usuario_id::text OR usuario_id IN (SELECT id FROM public.usuarios WHERE auth.uid()::text = id::text)"
        }
      ]
    }
  ];
  
  console.log('Políticas de segurança necessárias:');
  console.log(JSON.stringify(politicasNecessarias, null, 2));
  
  return false;
}

// Executar verificação de tabelas
verificarTabelas(); 