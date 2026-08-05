-- As duas tabelas de backup foram criadas com "create table as select" durante a
-- carga do macro e a do rascunho. `create table as` NÃO herda RLS — e no schema
-- public toda tabela é exposta pela API. Resultado: cópia integral do conteúdo
-- do CIP legível e gravável por qualquer um com a chave pública, que está num
-- repositório aberto. O alerta do Supabase chegou no mesmo dia.
--
-- A correção não é só ligar RLS: é tirar do schema exposto. Backup não é dado de
-- aplicação e não deveria ter porta na API em momento nenhum.
create schema if not exists backup;

revoke all on schema backup from anon, authenticated;
grant usage on schema backup to postgres, service_role;

alter table if exists public.pecas_backup_20260803 set schema backup;
alter table if exists public.pecas_backup_antes_rascunho set schema backup;

-- Cinto e suspensório: mesmo fora da API, RLS ligado e sem política nenhuma
-- significa que nada passa a não ser pelo service_role.
alter table if exists backup.pecas_backup_20260803 enable row level security;
alter table if exists backup.pecas_backup_antes_rascunho enable row level security;

revoke all on all tables in schema backup from anon, authenticated;
