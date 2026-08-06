-- A regra de negócio sai do CIP.
--
-- Ela chegou a ser peça de primeira classe, com código RN-000 e catálogo na
-- Biblioteca. A intenção era boa: "pedido acima de 10 mil pode ser faturado em
-- 30/60/90/120" vale no Comercial ao orçar e no Financeiro ao aprovar, então
-- não pertence a um processo só.
--
-- O que derrubou não foi a ideia, foi a duplicidade na cabeça de quem usa:
-- norma, política e contrato já moram em Documento. Quem procura "a regra do
-- faturamento" não sabe qual das duas gavetas abrir, e o time começa a
-- cadastrar nas duas. Uma gaveta só erra menos que duas gavetas certas.
--
-- Regra que precise ser escrita vira Documento do tipo política ou norma,
-- ligado ao processo.
--
-- As linhas saem, mas não evaporam: cópia no schema `backup`, que fica fora do
-- alcance da API porque não está no schema público.

create table if not exists backup.regras_removidas_20260806 as
  select * from public.pecas where tipo = 'regra';

delete from public.pecas where tipo = 'regra';
