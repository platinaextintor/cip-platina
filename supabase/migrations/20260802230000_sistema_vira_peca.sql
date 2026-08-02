-- O sistema (CAD, ERP, WhatsApp) passa a ser peça própria, como cargo e setor:
-- existe uma vez e é referenciado pelos passos. É o que permite perguntar
-- "o que para se o CAD cair?" em vez de procurar o nome dele em texto solto.
alter table public.pecas
  drop constraint pecas_tipo_check;

alter table public.pecas
  add constraint pecas_tipo_check
  check (tipo in ('estrutura', 'processo', 'decisao', 'documento', 'sistema'));
