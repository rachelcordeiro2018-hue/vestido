# 🚀 Vitrine da Moda LC - Sistema de Locação de Vestidos

Sistema web moderno e responsivo para gestão de locações de vestidos, integrado ao Supabase.

## 🛠️ Configuração do Supabase

Para o sistema funcionar, você precisa executar os seguintes comandos no SQL Editor do seu projeto Supabase:

### 1. Criar Tabela de Locações

```sql
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

-- Habilitar Realtime para a tabela
alter publication supabase_realtime add table locacoes;

-- Habilitar RLS (Opcional, mas recomendado)
alter table public.locacoes enable row level security;

-- Criar política de acesso público (Apenas para demonstração, idealmente restringir via Auth)
create policy "Allow all access" on public.locacoes for all using (true) with check (true);
```

### 2. Configurar Storage (Upload de Fotos)

No painel lateral do Supabase:
1. Vá em **Storage**
2. Crie um novo bucket chamado `vestidos`
3. Marque a opção **Public bucket**
4. Adicione as seguintes políticas (Policies) no bucket:
   - **SELECT**: Permitir para todos (`true`)
   - **INSERT**: Permitir para todos (`true`)
   - **UPDATE**: Permitir para todos (`true`)
   - **DELETE**: Permitir para todos (`true`)

## 💻 Como Rodar Localmente

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente**:
   Crie um arquivo `.env` na raiz do projeto com os dados que você enviou (já foi criado automaticamente neste projeto):
   ```env
   VITE_SUPABASE_URL=seu_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_anon_key
   ```

3. **Subir o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Acesse no navegador**:
   Geralmente em `http://localhost:5173`

## 🔐 Autenticação

Como o sistema utiliza Supabase Auth:
1. Vá em **Authentication** no Supabase.
2. Crie um usuário com e-mail e senha.
3. Use essas credenciais para fazer login na tela inicial do sistema.

## ☁️ Deploy no Cloudflare Pages

1. Conecte seu repositório GitHub ao **Cloudflare Pages**.
2. Configure o framework como **Vite**.
3. Adicione as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no painel do Cloudflare.
4. Clique em **Save and Deploy**.

---
*Desenvolvido com foco em alta performance e design premium.*
