-- A conversa com a consultora, guardada por pessoa.
--
-- Não entra em `pecas`: peça é conteúdo da empresa, sincronizado ao vivo entre
-- todo mundo. Conversa é de quem conversou. Misturar as duas coisas faria a
-- pergunta de um aparecer na tela do outro no meio da digitação.
--
-- Por que guardar: a pergunta que alguém já fez é a dúvida real do time. Com o
-- tempo isso vira o retrato do que não está claro no CIP — mais honesto que
-- qualquer pesquisa de satisfação.

create table if not exists public.conversas (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users(id) on delete cascade,
  papel text not null check (papel in ('pessoa', 'ia')),
  texto text not null,
  onde text default '',
  criado_em timestamptz not null default now()
);

comment on table public.conversas is
  'Conversa com a consultora de IA. Uma linha por fala. Cada pessoa só enxerga a sua.';

create index if not exists conversas_do_dono on public.conversas (dono, criado_em);

alter table public.conversas enable row level security;

-- `dono` sai do token, não do corpo da requisição: assim ninguém escreve na
-- conversa alheia nem passando o id de outro na mão.
create policy "cada um lê a sua conversa"
  on public.conversas for select to authenticated
  using (dono = (select auth.uid()));

create policy "cada um escreve na sua conversa"
  on public.conversas for insert to authenticated
  with check (dono = (select auth.uid()));

create policy "cada um apaga a sua conversa"
  on public.conversas for delete to authenticated
  using (dono = (select auth.uid()));
