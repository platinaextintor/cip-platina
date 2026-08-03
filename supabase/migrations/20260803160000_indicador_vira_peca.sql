-- O indicador é a ponte entre a modelagem e o Bloco 9: sem número definido aqui,
-- a Inteligência não tem o que medir.
--
-- Peça própria, e não campo dentro do processo, porque um número costuma medir
-- mais de um processo — "prazo médio de entrega" é do Comercial e da Logística
-- ao mesmo tempo, e guardado nos dois cada um mediria de um jeito.
alter table public.pecas drop constraint if exists pecas_tipo_check;

alter table public.pecas
  add constraint pecas_tipo_check
  check (tipo in ('estrutura', 'processo', 'decisao', 'fim', 'documento', 'sistema', 'regra', 'indicador'));
