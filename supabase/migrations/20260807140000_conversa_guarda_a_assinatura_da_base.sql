-- Cada fala guarda a assinatura da base de quando foi dita.
--
-- O caso que exigiu isso: a base tinha 19 processos importados, virou um
-- exemplo mínimo de dois, e a conversa antiga continuou falando dos processos
-- apagados. A consultora relê o próprio histórico a cada pergunta — então ela
-- estava analisando trabalho que não existe mais, com a segurança de quem viu.
--
-- A assinatura cobre só QUE peças existem, não o que está escrito dentro delas.
-- Escrever um passo não envelhece a conversa; apagar um processo sim.
--
-- Nulo é o estado das falas anteriores a esta migração: elas não sabem de que
-- base vieram, e a tela trata isso como "não dá para afirmar" em vez de fingir
-- que estão em dia.

alter table public.conversas add column if not exists assinatura text;

comment on column public.conversas.assinatura is
  'Assinatura da base (quais peças existiam) no momento da fala. Nulo em falas anteriores a 07/08/2026.';
