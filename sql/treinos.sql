-- Create the workouts table
create table treinos (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references usuarios(id) on delete cascade not null,
  descricao text not null,
  duracao integer not null,
  calorias integer not null,
  data date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create an index for faster queries by user and date
create index idx_treinos_usuario_data on treinos(usuario_id, data);

-- Enable Row Level Security (RLS)
alter table treinos enable row level security;

-- Create a policy to allow users to see only their own workouts
create policy "Users can view their own workouts"
  on treinos for select
  using (auth.uid() = usuario_id);

-- Create a policy to allow users to insert their own workouts
create policy "Users can insert their own workouts"
  on treinos for insert
  with check (auth.uid() = usuario_id);

-- Create a policy to allow users to update their own workouts
create policy "Users can update their own workouts"
  on treinos for update
  using (auth.uid() = usuario_id);

-- Create a policy to allow users to delete their own workouts
create policy "Users can delete their own workouts"
  on treinos for delete
  using (auth.uid() = usuario_id); 