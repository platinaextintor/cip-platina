-- Cinco tabelas de backup viram uma.
--
-- Cada uma nasceu de um momento da nossa conversa: antes do rascunho da IA,
-- antes de limpar, o estado limpo, a regra removida. Serviram enquanto a gente
-- ia e voltava. Num projeto entregue elas são só confusão — quem abrir o banco
-- vê seis tabelas e não sabe qual é a de verdade.
--
-- `antes_da_entrega_20260807` é a mais completa e a mais recente: tem as 33
-- peças que existiam antes da limpeza, incluindo os 19 processos importados do
-- .bpmn. E o .bpmn continua versionado em documentacao/, então esse conteúdo
-- pode ser reimportado sem depender de tabela nenhuma.
--
-- `regras_removidas_20260806` sai também, e com ela some o alerta de RLS
-- desligado. O schema `backup` nunca esteve exposto na API — testado: o
-- PostgREST responde "Only the following schemas are exposed: public,
-- graphql_public" —, então nunca foi porta aberta. Mas tabela sem política num
-- projeto entregue é dívida esperando alguém expor o schema por engano.

begin;

drop table if exists backup.pecas_backup_20260803;
drop table if exists backup.pecas_backup_antes_rascunho;
drop table if exists backup.antes_de_limpar;
drop table if exists backup.estado_limpo;
drop table if exists backup.regras_removidas_20260806;

comment on table backup.antes_da_entrega_20260807 is
  'Retrato do CIP em 07/08/2026, antes de reduzir aos dados de teste mínimos. 33 peças, incluindo os 19 processos importados do macroprocesso .bpmn.';

commit;
