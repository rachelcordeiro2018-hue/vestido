-- Create table
create table public.locacoes (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  celular text not null,
  data_locacao date not null,
  valor numeric(10, 2) not null,
  foto_url text,
  observacoes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Realtime
alter publication supabase_realtime add table locacoes;

-- Quick RLS Policies for demonstration
alter table public.locacoes enable row level security;
create policy "Allow all access" on public.locacoes for all using (true) with check (true);

-- Configuração do Storage (Bucket de Fotos)
-- 1. Criar o bucket 'vestidos'
insert into storage.buckets (id, name, public)
values ('vestidos', 'vestidos', true)
on conflict (id) do nothing;

-- 2. Habilitar políticas de acesso ao bucket
create policy "Acesso Público para Visualização" on storage.objects for select using ( bucket_id = 'vestidos' );
create policy "Permitir Inserção Autenticada/Pública" on storage.objects for insert with check ( bucket_id = 'vestidos' );
create policy "Permitir Atualização Autenticada/Pública" on storage.objects for update with check ( bucket_id = 'vestidos' );
create policy "Permitir Exclusão Autenticada/Pública" on storage.objects for delete using ( bucket_id = 'vestidos' );

-- Tabela de Catálogo de Vestidos
create table public.vestidos (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  descricao text,
  preco_base numeric(10, 2),
  foto_url text,
  disponivel boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter publication supabase_realtime add table vestidos;
alter table public.vestidos enable row level security;
create policy "Allow all access on vestidos" on public.vestidos for all using (true) with check (true);
