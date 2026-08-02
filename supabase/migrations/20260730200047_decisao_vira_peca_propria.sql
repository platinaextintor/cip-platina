-- A decisão do macro passa a ser uma peça própria. Sem isso ela moraria dentro
-- da linha "estrutura", e duas pessoas desenhando o macro ao mesmo tempo — que
-- é exatamente o que três pessoas vão fazer — brigariam pela mesma linha.
alter table public.pecas
  drop constraint pecas_tipo_check;

alter table public.pecas
  add constraint pecas_tipo_check
  check (tipo in ('estrutura', 'processo', 'decisao', 'documento'));
