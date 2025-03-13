-- Habilita a extensão para gerar UUIDs
create extension if not exists "uuid-ossp";

-- Tabela de Usuários
create table usuarios (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  peso numeric not null,
  altura numeric not null,
  idade integer not null,
  sexo text not null check (sexo in ('masculino', 'feminino')),
  nivel_atividade text not null,
  objetivo text not null check (objetivo in ('perder', 'manter', 'ganhar')),
  meta_calorica integer not null,
  meta_proteina integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Refeições
create table refeicoes (
  id uuid default uuid_generate_v4() primary key,
  usuario_id uuid references usuarios(id) not null,
  alimento text not null,
  calorias integer not null,
  proteina numeric not null,
  horario time not null,
  data date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Registro de Peso
create table registro_peso (
  id uuid default uuid_generate_v4() primary key,
  usuario_id uuid references usuarios(id) not null,
  peso numeric not null,
  data date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger para atualizar o updated_at dos usuários
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_usuarios_updated_at
  before update on usuarios
  for each row
  execute function update_updated_at_column(); 