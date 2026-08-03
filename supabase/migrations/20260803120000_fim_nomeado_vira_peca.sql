-- O fim nomeado existia no navegador e não existia no banco: `pecasDoEstado`
-- não tinha linha para ele, então "Proposta não aprovada" sumia no recarregar.
-- Ninguém tinha esbarrado porque ainda não havia fim nomeado gravado.
--
-- Um desfecho com nome é informação — é o que diferencia "acabou" de "acabou
-- porque o cliente não aprovou". Perder isso é perder o motivo.
alter table public.pecas drop constraint if exists pecas_tipo_check;

alter table public.pecas
  add constraint pecas_tipo_check
  check (tipo in ('estrutura', 'processo', 'decisao', 'fim', 'documento', 'sistema'));
