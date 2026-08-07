-- O CIP entregue: só o necessário para experimentar, tudo marcado como TESTE.
--
-- Antes daqui o banco tinha 19 processos importados de um .bpmn real, mais três
-- peças vazias que sobraram de teste meu. Servia para eu exercitar o sistema,
-- não para alguém começar a trabalhar: quem abrisse encontraria um mapa cheio
-- de conteúdo de outra pessoa e não saberia o que apagar.
--
-- O que fica é o menor conjunto que ainda exercita tudo:
--   duas raias, para ver a passagem de bastão entre setores
--   dois processos com passos escritos, um em cada raia
--   uma decisão com dois rótulos e dois desfechos nomeados
--   um documento, um sistema e um indicador, cada um ligado a alguma coisa
--
-- Setores e processos levam (TESTE) no nome, de propósito: quem abrir sabe na
-- primeira olhada que aquilo é exemplo, não o trabalho da casa.
--
-- Os dois processos ficam como rascunho. Aprovar é um clique, e é justamente o
-- que vale a pena a equipe experimentar — o selo, o histórico com nome e data,
-- e a aprovação caindo sozinha quando alguém edita depois.

begin;

-- Retrato do que existia, caso alguém queira olhar depois.
create table if not exists backup.antes_da_entrega_20260807 as
  select * from public.pecas;
alter table backup.antes_da_entrega_20260807 enable row level security;

delete from public.pecas;

-- A estrutura: empresa, setores e cargos moram numa linha só.
insert into public.pecas (id, tipo, dados) values ('estrutura', 'estrutura', '{
  "empresa": { "nome": "Platina Extintores" },
  "setores": [
    { "id": "s-comercial", "nome": "Comercial (TESTE)", "camada": "principal" },
    { "id": "s-tecnica",   "nome": "Técnica (TESTE)",   "camada": "principal" }
  ],
  "cargos": [
    { "id": "c-supervisor", "setorId": "s-comercial", "nome": "Supervisor Operacional", "reportaA": null,
      "missao": "Responder pelo que foi prometido ao cliente, do orçamento à entrega.",
      "expectativas": "Decidir exceção em vez de empurrar para o cliente\nConferir o que sai antes de sair\nFormar quem entra",
      "conhecimentos": "Tipos de extintor e classe de fogo\nCondições comerciais da casa\nLeitura de laudo",
      "atividades": "Aprovar exceção de preço e prazo\nAcompanhar a agenda da semana",
      "planoDeCarreira": "Entra com experiência em operação. Caminho natural é a coordenação de mais de um setor.",
      "trilha": [] },
    { "id": "c-vendedor", "setorId": "s-comercial", "nome": "Vendedor", "reportaA": "c-supervisor",
      "missao": "Transformar pedido do cliente em proposta que a casa consegue cumprir.",
      "expectativas": "Perguntar antes de orçar\nRegistrar tudo no sistema\nEscalar exceção antes de prometer",
      "conhecimentos": "Tipos de extintor e classe de fogo\nAtendimento no WhatsApp",
      "atividades": "Atender o WhatsApp comercial\nMontar e enviar proposta\nCobrar retorno de proposta enviada",
      "planoDeCarreira": "Entra sem experiência, com treinamento interno. Vira Vendedor Sênior depois de bater meta por 12 meses e formar um substituto.",
      "trilha": [] },
    { "id": "c-tecnico", "setorId": "s-tecnica", "nome": "Técnico de Extintores", "reportaA": "c-supervisor",
      "missao": "Devolver o equipamento em condição de funcionar quando alguém precisar dele.",
      "expectativas": "Não assinar laudo do que não conferiu\nParar e chamar o supervisor na dúvida",
      "conhecimentos": "Procedimento de recarga\nLeitura de etiqueta e número de série",
      "atividades": "Recarregar e testar\nEmitir laudo",
      "planoDeCarreira": "Entra como auxiliar. Vira Técnico depois da formação e do acompanhamento em campo.",
      "trilha": [] }
  ]
}'::jsonb);

-- Processo 1 · Comercial. Recebe do cliente e entrega para a decisão.
insert into public.pecas (id, tipo, dados) values ('p:p-orcamento', 'processo', '{
  "id": "p-orcamento",
  "nome": "Orçamento (TESTE)",
  "setorId": "s-comercial",
  "donoCargoId": "c-supervisor",
  "cargosIds": ["c-vendedor"],
  "consultadosIds": ["c-tecnico"],
  "informadosIds": [],
  "status": "rascunho",
  "porque": "É o primeiro contato comercial de verdade. Proposta errada ou atrasada custa o pedido inteiro, e o cliente raramente volta para reclamar — ele só some.",
  "entrada": "Pedido de orçamento recebido do cliente",
  "saida": "Proposta enviada e registrada",
  "seErrar": "",
  "videoUrl": "",
  "documentoIds": [],
  "perguntas": [],
  "historico": [],
  "aprovacao": null,
  "proximos": [{ "para": "d-aprovou", "rotulo": "" }],
  "passos": [
    { "id": "ps-orc-1", "tipo": "etapa", "cargoId": "c-vendedor", "setorId": "", "sistemaIds": [],
      "oQue": "Pergunte o que o cliente precisa",
      "comoFazer": "Pergunte o tipo e a quantidade de equipamento, onde vão ficar e se é venda, recarga ou contrato. Anote quem pediu e por qual canal.",
      "porque": "Proposta feita sobre suposição vira retrabalho ou perda de margem.",
      "armadilha": "Aceitar \"me manda um orçamento de extintor\" sem perguntar tipo, capacidade e local.",
      "imagem": "", "videoUrl": "", "seSim": "", "seNao": "",
      "proximos": [{ "para": "ps-orc-2", "rotulo": "" }] },
    { "id": "ps-orc-2", "tipo": "etapa", "cargoId": "c-vendedor", "setorId": "", "sistemaIds": ["sis-cad"],
      "oQue": "Monte a proposta item a item",
      "comoFazer": "Monte no CAD, com o que está incluso e o que não está. Na dúvida sobre preço ou prazo, confirme com o supervisor antes de enviar.",
      "porque": "O que não está escrito na proposta vira discussão na entrega.",
      "armadilha": "Copiar uma proposta antiga sem revisar item, quantidade e condição.",
      "imagem": "", "videoUrl": "", "seSim": "", "seNao": "",
      "proximos": [{ "para": "ps-orc-3", "rotulo": "" }] },
    { "id": "ps-orc-3", "tipo": "evidencia", "cargoId": "c-vendedor", "setorId": "", "sistemaIds": [],
      "oQue": "Registre o envio",
      "comoFazer": "Envie pelo canal que o cliente usou e registre a data e para quem foi.",
      "porque": "Sem registro, ninguém sabe se a proposta foi enviada nem quando cobrar retorno.",
      "armadilha": "Enviar por WhatsApp pessoal e não deixar rastro no sistema.",
      "imagem": "", "videoUrl": "", "seSim": "", "seNao": "",
      "proximos": [] }
  ]
}'::jsonb);

-- A bifurcação. Decisão é passagem, não destino: sai para dois lugares.
insert into public.pecas (id, tipo, dados) values ('d:d-aprovou', 'decisao', '{
  "id": "d-aprovou",
  "tipo": "exclusivo",
  "pergunta": "O cliente aprovou a proposta?",
  "setorId": "s-comercial",
  "proximos": [
    { "para": "p-recarga",   "rotulo": "aprovou" },
    { "para": "f-recusada",  "rotulo": "não aprovou" }
  ]
}'::jsonb);

-- Processo 2 · Técnica. Mostra a passagem de bastão entre raias.
insert into public.pecas (id, tipo, dados) values ('p:p-recarga', 'processo', '{
  "id": "p-recarga",
  "nome": "Recarga de extintor (TESTE)",
  "setorId": "s-tecnica",
  "donoCargoId": "c-supervisor",
  "cargosIds": ["c-tecnico"],
  "consultadosIds": [],
  "informadosIds": ["c-vendedor"],
  "status": "rascunho",
  "porque": "Extintor que não funciona na hora é o pior defeito que esta empresa pode entregar, e ninguém descobre até precisar.",
  "entrada": "Proposta aprovada pelo cliente",
  "saida": "Extintor recarregado, testado e com laudo",
  "seErrar": "",
  "videoUrl": "",
  "documentoIds": ["doc-procedimento"],
  "perguntas": [],
  "historico": [],
  "aprovacao": null,
  "proximos": [{ "para": "f-entregue", "rotulo": "" }],
  "passos": [
    { "id": "ps-rec-1", "tipo": "etapa", "cargoId": "c-tecnico", "setorId": "", "sistemaIds": [],
      "oQue": "Confira a etiqueta e registre o número de série",
      "comoFazer": "Tire a foto da etiqueta, confira se o número bate com a ordem de serviço e registre.",
      "porque": "Sem o número de série a rastreabilidade se perde e o laudo não vale.",
      "armadilha": "Etiqueta apagada: não invente o número, chame o supervisor.",
      "imagem": "", "videoUrl": "", "seSim": "", "seNao": "",
      "proximos": [{ "para": "ps-rec-2", "rotulo": "" }] },
    { "id": "ps-rec-2", "tipo": "etapa", "cargoId": "c-tecnico", "setorId": "", "sistemaIds": [],
      "oQue": "Recarregue conforme o procedimento",
      "comoFazer": "Siga o procedimento de recarga do documento vinculado a este processo.",
      "porque": "O procedimento existe porque cada tipo de agente tem exigência diferente.",
      "armadilha": "Fazer de memória porque \"esse aí eu já fiz mil vezes\".",
      "imagem": "", "videoUrl": "", "seSim": "", "seNao": "",
      "proximos": [{ "para": "ps-rec-3", "rotulo": "" }] },
    { "id": "ps-rec-3", "tipo": "aprovacao", "cargoId": "c-supervisor", "setorId": "", "sistemaIds": [],
      "oQue": "Confira e libere o laudo",
      "comoFazer": "Confira o teste e assine o laudo. Só assine o que você conferiu.",
      "porque": "A assinatura é quem responde se o equipamento falhar.",
      "armadilha": "Assinar em lote no fim do dia sem olhar item por item.",
      "imagem": "", "videoUrl": "", "seSim": "", "seNao": "",
      "proximos": [] }
  ]
}'::jsonb);

-- Dois desfechos nomeados. Nem todo fim é sucesso.
insert into public.pecas (id, tipo, dados) values
  ('f:f-entregue', 'fim', '{ "id": "f-entregue", "nome": "Serviço entregue", "setorId": "s-tecnica", "proximos": [] }'::jsonb),
  ('f:f-recusada', 'fim', '{ "id": "f-recusada", "nome": "Proposta recusada", "setorId": "s-comercial", "proximos": [] }'::jsonb);

-- Um documento, ligado ao processo que precisa dele.
insert into public.pecas (id, tipo, dados) values ('doc:doc-procedimento', 'documento', '{
  "id": "doc-procedimento",
  "titulo": "Procedimento de recarga (TESTE)",
  "categoria": "norma",
  "escopo": "Setor técnico",
  "resumo": "Como recarregar cada tipo de extintor, o que testar antes de liberar e o que registrar no laudo. Substitua pelo procedimento real da casa.",
  "url": "",
  "videoUrl": "",
  "validadeMeses": 0
}'::jsonb);

-- Um sistema, usado num passo. Marcado como crítico para exercitar o aviso.
insert into public.pecas (id, tipo, dados) values ('sis:sis-cad', 'sistema', '{
  "id": "sis-cad",
  "nome": "CAD",
  "descricao": "Onde o pedido, o cliente e a proposta são registrados.",
  "url": "",
  "critico": true
}'::jsonb);

-- Um indicador, ligado ao processo que ele mede.
insert into public.pecas (id, tipo, dados) values ('ind:ind-prazo', 'indicador', '{
  "id": "ind-prazo",
  "nome": "Prazo de resposta ao orçamento",
  "pergunta": "Quantos dias entre o pedido do cliente e a proposta enviada?",
  "unidade": "dias",
  "direcao": "menor",
  "meta": 2,
  "frequencia": "mensal",
  "processoIds": ["p-orcamento"],
  "cargoIds": []
}'::jsonb);

commit;
