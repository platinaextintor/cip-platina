-- O CIP guardado em peças: uma linha para a estrutura da empresa, uma por
-- processo, uma por documento. Repartir assim é o que impede duas pessoas
-- editando processos diferentes de sobrescreverem uma à outra.
create table public.pecas (
  id text primary key,
  tipo text not null check (tipo in ('estrutura', 'processo', 'documento')),
  dados jsonb not null,
  -- sobe a cada gravação; quem salvar por cima de uma versão velha é avisado
  versao integer not null default 1,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references auth.users (id) on delete set null,
  -- identifica a aba que gravou, para o navegador ignorar o eco da própria escrita
  sessao text
);

comment on table public.pecas is 'Conteúdo do CIP. Uma linha por peça editável.';
comment on column public.pecas.versao is 'Trava de concorrência: a gravação exige a versão que o cliente leu.';
comment on column public.pecas.sessao is 'Aba que gravou. O Realtime usa para o autor não reagir ao próprio evento.';

create index pecas_tipo_idx on public.pecas (tipo);

-- Toda gravação sobe a versão e carimba autor e horário, sem depender do cliente.
create or replace function public.pecas_ao_gravar()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.versao := coalesce(old.versao, 0) + 1;
  new.atualizado_em := now();
  new.atualizado_por := auth.uid();
  return new;
end;
$$;

create trigger pecas_antes_de_gravar
  before insert or update on public.pecas
  for each row execute function public.pecas_ao_gravar();

alter table public.pecas enable row level security;

-- Três pessoas trabalhando: todas leem e todas escrevem. Ninguém sem login entra.
-- O portão real é quem consegue ter conta — o cadastro público fica desligado.
create policy "logado le" on public.pecas
  for select to authenticated using (true);

create policy "logado cria" on public.pecas
  for insert to authenticated with check (true);

create policy "logado atualiza" on public.pecas
  for update to authenticated using (true) with check (true);

create policy "logado apaga" on public.pecas
  for delete to authenticated using (true);

-- Realtime: o banco avisa os navegadores conectados a cada mudança.
alter publication supabase_realtime add table public.pecas;
alter table public.pecas replica identity full;
