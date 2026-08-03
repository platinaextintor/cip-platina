-- A regra de negócio deixa de ser texto dentro do passo e vira peça própria,
-- como cargo, setor e sistema. O caso que forçou: "pedido acima de 10 mil pode
-- ser faturado em 30/60/90/120 ddl" vale no Comercial ao orçar, no Financeiro
-- ao aprovar e no Faturamento ao emitir. Escrita como texto, era a mesma frase
-- digitada três vezes — e mudar o valor exigia lembrar dos três lugares.
--
-- Sendo objeto, muda num lugar só e o CIP responde quem é afetado.
alter table public.pecas drop constraint if exists pecas_tipo_check;

alter table public.pecas
  add constraint pecas_tipo_check
  check (tipo in ('estrutura', 'processo', 'decisao', 'fim', 'documento', 'sistema', 'regra'));
