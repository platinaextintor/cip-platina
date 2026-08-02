# O CIP construído × o Bloco 1 do dossiê

Análise de 02/08/2026, comparando o que existe hoje com o que o dossiê descreve como **Bloco 1 — Modelagem Organizacional**, e com o que o ARIS estabeleceu como padrão de mercado.

## Veredito

**Sim, está caminhando para o Bloco 1** — e acertou a parte mais difícil de acertar. O que falta é volume de campos, não mudança de rumo.

Cerca de **metade do Bloco 1 está de pé.** A metade que falta é quase toda de governança e de medição.

## Arquitetura — quase completo

| O que o Bloco 1 pede | Estado |
|---|---|
| Cadeia de valor | ✔ as fases (Captar → Cuidar) |
| BPMN navegável, atividades clicáveis | ✔ duplo clique desce ao subprocesso |
| Dependências entre processos | ✔ as ligações do macro |
| Estratégicos / principais / apoio | ✕ não existe a classificação em camadas |

## Ficha da atividade — metade

Hoje o subprocesso tem: o que fazer, como fazer, por quê, a armadilha, a regra, quem faz, foto, vídeo.

O dossiê pede também: **entrada**, **saída**, **sistema** e **indicadores**. E que a regra seja **catalogada** (RN-001) em vez de texto solto — para poder responder "quais processos dependem da RN-003?".

Entrada e saída são o que permitem checar se a cadeia fecha: a saída de um processo tem que ser a entrada do próximo. Hoje não há como verificar.

## Governança — o buraco maior

| Item | Estado |
|---|---|
| Dono do processo | ✔ |
| Aprovação antes de publicar | ~ existe o selo "revisado", sem aprovador |
| Controle de versão | ~ o banco numera, mas ninguém consulta |
| Histórico de alterações | ✕ |
| Matriz RACI | ~ só R e A (executa e dono); falta C e I |
| Regras de negócio catalogadas | ✕ |
| Riscos e controles | ✕ a "armadilha" é o parente pobre disso |
| Não conformidades e plano de ação | ✕ |

## Conhecimento — quase completo

| O que o Bloco 1 pede | Estado |
|---|---|
| Descrição de cargo ligada às atividades | ✔ |
| Competências por cargo | ✔ os conhecimentos |
| Trilha | ✔ |
| POPs, vídeos, normas | ✔ biblioteca e vídeo por passo |
| Treinamento obrigatório | ✔ |
| **Validade** do treinamento | ✕ |

Validade importa numa empresa de extintores: NR e reciclagem vencem.

## Indicadores — ausente

Nenhum processo tem KPI. É o que liga o Bloco 1 ao Bloco 9 — sem indicador definido na modelagem, a Inteligência não tem o que medir.

## O que o ARIS ensina

**A ideia central do ARIS é o repositório único:** cada objeto — cargo, sistema, documento, indicador, regra — existe **uma vez** e é reutilizado em todos os modelos. Mudou o nome do cargo, mudou em todos os fluxogramas. E permite a pergunta inversa: "em quais processos o CAD aparece?".

**O CIP já faz isso, e é o seu maior acerto.** Cargo e setor existem uma vez e aparecem no organograma, nas raias e na trilha. A trilha nem guarda a lista de processos — deriva do vínculo. Ferramenta caseira quase sempre erra isso e vira cópia desencontrada.

**O que falta é estender o princípio a mais objetos.** Hoje só cargo, setor e fase são de primeira classe. Sistema, documento, regra, indicador e risco ainda são texto solto dentro do passo — então não dá para perguntar "o que quebra se o CAD sair do ar?".

**O que não vale copiar do ARIS:** as cinco vistas, a notação EPC e os cinco níveis de hierarquia. É peso de consultoria para empresa grande. Dois níveis e BPMN atendem a Platina, e o dossiê confirma — o macroprocesso real tem 16 subprocessos, todos de um nível só de profundidade.

## O que o macroprocesso real revela

O `.bpmn` do dossiê é exatamente o que a tela de Macro deveria conter. Comparando com o que o CIP desenha:

**Aguenta:** 7 raias, subprocessos colapsados, gateways com rótulo, convergência (várias entradas num mesmo ponto) e retorno — o "Comprar → volta para Agenda" já é tratado.

**Não aguenta:**

1. **Gateway inclusivo.** O "Modalidade do atendimento" pode seguir por venda/recarga **e** por contrato ao mesmo tempo. O CIP só tem o exclusivo, onde os caminhos se excluem. Modelar um como o outro é dizer algo falso sobre a operação.

2. **Evento de fim nomeado.** "Proposta não aprovada" e "Não aprovado pelo Financeiro" são finais diferentes e informativos. O CIP gera fins automáticos e anônimos.

3. **Convergência explícita.** "Emitir NF" recebe de produção e de devolução. Desenha certo, mas não se diz se espera os dois ou segue com o primeiro.

## Ordem sugerida

1. **Importar o `.bpmn`** — a Platina passa a ter o macro real dentro do CIP em vez de tela vazia
2. **Gateway inclusivo e fim nomeado** — sem isso o macro real não é representável com honestidade
3. **Entrada e saída** no subprocesso — fecha a cadeia
4. **Sistema como objeto** — a primeira extensão do repositório, e a que mais rende
5. **Histórico e aprovação** — governança de verdade
6. **Indicador por processo** — a ponte para o Bloco 9
