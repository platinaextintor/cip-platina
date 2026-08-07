# CIP · Central Inteligente de Processos

Projeto da Platina Extintores para centralizar, ensinar e manter vivos os processos da empresa.

**No ar em https://platinaextintor.github.io/cip-platina/**, com login.

## A ideia central

O CIP não é um repositório de documentos. É uma tentativa de transformar o jeito Platina de fazer as coisas — que hoje mora na cabeça das pessoas — em algo explícito, oficial e **ensinável**.

O que amarra tudo é a ligação **cargo → o que esse cargo precisa saber**. A pessoa não procura o que interessa: o sistema diz quais processos ela executa e o que ela precisa dominar.

| Tela | Responde |
|---|---|
| **Organograma** | quem é quem, quem responde a quem |
| **Trilha do cargo** | o que essa pessoa faz, precisa saber, e pelo que é cobrada |
| **Fluxo macro** | o que a empresa faz, em que ordem |
| **Aula** | como cada processo se faz, passo a passo |
| **Biblioteca** | normas, políticas, manuais e os sistemas usados |
| **O que falta** | o que está incompleto, na ordem da consequência |

O encaixe acontece no cargo: abra alguém no organograma e os processos dele aparecem. Abra um processo e ele diz quais cargos executam.

## O vocabulário

Seis palavras, e vale usá-las com precisão — é o que evita duas pessoas chamarem coisas diferentes pelo mesmo nome.

| Palavra | O que é |
|---|---|
| **Setor** | uma área da empresa. Vira raia no fluxograma. |
| **Cargo** | uma função dentro de um setor. |
| **Macro** | a visão de cima, onde os processos se ligam ponta a ponta. |
| **Processo** | uma peça do macro. Tem dono, executor, entrada e saída. |
| **Subprocesso** | o desenho de dentro de um processo, feito de passos. |
| **Passo** | a unidade menor. É onde mora o conteúdo de verdade. |

**POP** no CIP é o passo a passo do processo — não é documento separado. Precisou de POP em papel? Abra o processo e use *Imprimir o passo a passo*: sai com carimbo dizendo se está aprovado, por quem e quando.

## O processo é uma aula, não um documento

Um especialista não entrega apostila. Ele diz por que existe, mostra o caminho inteiro, vai um passo por vez, mostra um exemplo real, aponta onde todo mundo erra e checa se você entendeu.

Por isso a unidade do sistema não é o processo — é o **passo**. Cada passo carrega:

- **o que fazer** — uma frase, verbo na frente
- **como fazer** — o detalhe prático
- **exemplo real** — print ou foto (é o que faz grudar)
- **por quê** — a razão, o que faz lembrar em campo
- **onde todo mundo erra** — a armadilha, e o inegociável quando houver
- **quem faz** — o cargo, que é o que cria as raias no fluxograma
- **em que sistema** — o CAD, o ERP, a planilha

Passos de decisão ganham dois caminhos. Cada tipo — etapa, decisão, evidência, aprovação — tem cor e forma próprias.

## Os dois níveis de desenho

| Nível | O que é | Raias | Onde se desenha |
|---|---|---|---|
| **Macro** | os processos da empresa e as decisões entre eles | setores | Fluxo macro → **Desenhar o macro** |
| **Subprocesso** | o que se faz dentro de um processo | cargos | dentro do processo → **Desenhar em tela cheia** |

### Desenhar

Paleta em cima com os símbolos desenhados, inspetor à direita, e um **menu colado na peça selecionada**.

- A peça nova **nasce ligada** à que estava selecionada. `Processo → Decisão → Fim` são três cliques.
- **Decisão** é o losango. Escreva a pergunta e dê rótulo a cada saída — os rótulos aparecem nas setas.
- **Duplo clique** renomeia ali mesmo. O **+** no canto de baixo entra no subprocesso.
- **A posição é automática**: ligou, andou para a direita. Arrastar serve para mudar de raia.
- **Setor** também se cria aqui, na mesma paleta. É o mesmo cadastro do organograma — criou num, aparece no outro.

Retorno é permitido: *"não aprovou, volta pro orçamento"* é processo real. A seta de retorno é desenhada normalmente; ela só não conta para a posição, senão o mapa se esticaria para sempre.

O nome da raia fica preso na borda: num macro largo, rolar até o fim e não saber mais em que setor está cada linha é o que torna o mapa inútil.

## O fluxograma em BPMN 2.0

Cada processo tem um fluxograma na notação padrão — a mesma que qualquer consultor, auditor ou certificadora reconhece. Ele é **desenhado a partir dos passos**: você não mantém dois desenhos.

| No CIP | Em BPMN 2.0 |
|---|---|
| início e fim | evento de início (círculo fino) e de fim (círculo grosso) |
| passo **etapa** / **aprovação** | tarefa de usuário |
| passo **evidência** | tarefa com objeto de dados anexado |
| passo **decisão** | gateway exclusivo (losango com X) |
| "se sim" / "se não" | os dois caminhos, com rótulo |
| **quem faz** | a raia |
| processo, no macro | subprocesso colapsado (retângulo com **+**) |

## A consultora de IA

Um painel que abre em **qualquer tela** pelo ícone ✦ no topo, e fecha quando atrapalhar.

**Ela lê tudo e não escreve nada.** Enxerga setores, cargos, processos, documentos, indicadores e a lista do que falta — e os passos do processo que estiver aberto. Mas não existe caminho entre o que ela diz e os campos do sistema. Não é uma regra que ela possa desobedecer: é um cano que não foi construído.

Gostou de uma frase? Ela vem numa caixa com botão **Copiar**. O copiar e colar não é atrito — é o ato humano de decidir. Para colar, alguém precisa ter lido.

Ela é muito mais útil **achando buraco do que preenchendo buraco**. As melhores perguntas são as de crítica:

> *"Leia este processo e me diga o que está ambíguo."*
> *"Esses passos servem para alguém que entrou ontem?"*
> *"Olhando o macro, o que falta para o fluxo fechar ponta a ponta?"*

Perguntas sugeridas aparecem no rodapé do painel e **mudam conforme a tela** — caixa vazia com cursor piscando não convida ninguém.

A conversa fica **salva por pessoa**. Cada um enxerga só a sua, e o ícone de lixeira apaga.

### O limite que ela respeita

Ela **não inventa prazo, valor, percentual, norma técnica nem exigência legal**. Se você não disser, ela diz que não sabe e pergunta.

Isso não é timidez: extintor mal recarregado mata gente, e um prazo errado dito com segurança é pior que um espaço em branco. Ela também não inventa nome de documento, sistema, cargo ou processo que não exista no CIP.

### Onde a chave dela mora

Numa Edge Function do Supabase chamada `cip-ia`, no projeto **CIP Platina** — nunca no navegador. O que vai no `app.js` é só a chave pública do projeto, que existe exatamente para isso.

Para funcionar, a variável `ANTHROPIC_API_KEY` precisa estar nos secrets:

> Supabase → CIP Platina → Project Settings → Edge Functions → Secrets → **Add new secret**
> Nome: `ANTHROPIC_API_KEY` · Valor: a chave do console da Anthropic

A função **exige usuário autenticado**, aceita chamadas só das origens da Platina e trava em 20 perguntas por minuto. Como o cadastro público está desligado no Supabase, quem não tem conta criada por você não chega nela.

Ainda assim, vale manter um **limite de gasto no console da Anthropic**: é a trava que não depende de nada dar certo.

## Governança

Um processo conta como **pronto** quando tem dono, executor, o porquê, entrada (se recebe de alguém), saída (se entrega para alguém) e passos com título.

Aprovar é um **ato com nome e data**. E a aprovação guarda uma assinatura do conteúdo aprovado: se alguém editar o processo depois, o selo cai sozinho e a tela passa a dizer *"mudou desde a aprovação"*. Sem isso, "aprovado" viraria carimbo eterno.

O histórico registra quem aprovou e quando. A tela **O que falta** lista tudo que está incompleto, ordenado por consequência — o que quebra o fluxo vem antes do que só está solto.

## O cargo

Além da missão e das expectativas, o cargo responde três perguntas que quase nenhuma descrição responde:

- **o que essa pessoa faz no dia a dia** — as atividades que provavelmente nunca virarão processo mapeado. Os processos que já existem aparecem sozinhos ao lado, para ninguém repetir.
- **para onde esse cargo leva** — o plano de carreira
- **pelo que é cobrada** — e aqui **não há campo para digitar**

A cobrança é **deduzida**: sai dos indicadores dos processos que o cargo executa ou dos quais é dono, com o nome do processo de onde cada número vem. Um campo digitado seria a segunda cópia, e no dia em que a meta mudasse no processo a do cargo mostraria o valor velho.

Indicador que não passa por processo nenhum — *"horas de treinamento"* — pode ser ligado direto ao cargo.

## Onde entram vídeo e documento

**Vídeo do YouTube** em três lugares: no passo, no processo inteiro e no treinamento da trilha. Cole o link — o player aparece embutido, sem cookie de rastreamento.

**Documento** em dois lugares: a **Biblioteca** guarda o que vale para a empresa inteira, e o **material de apoio** do processo guarda o que a pessoa abre enquanto executa.

Regra de negócio que precisa estar escrita — *"pedido acima de 10 mil pode ser faturado em 30/60/90"* — é um **documento do tipo política ou norma**, ligado ao processo. Não existe cadastro separado de regra: duas gavetas para a mesma coisa é onde o time procura no lugar errado.

Como ainda não há upload de arquivo, o documento entra como link — Drive, OneDrive, Dropbox. Só `http`/`https`.

## Impressão

Toda tela relevante imprime: o mapa macro, a ficha do processo, o passo a passo e a trilha do cargo. A folha sai com **carimbo de situação** — vigente, mudou desde a aprovação, ou rascunho — porque folha sem estado vira verdade oficial na mão de quem recebe.

## Como começar

O CIP vem com um **exemplo mínimo, todo marcado com (TESTE)**: dois setores, três cargos, dois processos ligados por uma decisão, dois desfechos, um documento, um sistema e um indicador. Serve para experimentar tudo sem confundir com dado real.

Apague quando sua equipe começar, ou vá substituindo peça por peça.

1. **Organograma** — monte os cargos. Arraste um sobre outro para subordiná-lo. Uma ligação que fecharia ciclo é recusada.
2. **Trilha** — escreva a missão, as atividades, o plano de carreira.
3. **Fluxo macro** — desenhe a operação em raias, um processo por vez.
4. **Editor** — descreva o processo e escreva os passos. Salva sozinho.
5. **Aula** — veja como o colaborador vê.
6. **Biblioteca** — cadastre normas e sistemas, e aponte os processos para eles.

Vá **um processo por vez**. O de maior volume primeiro.

Se algo travar, abra com `?seguro` no fim do endereço: o app inicia vazio **sem gravar por cima** do que está salvo, e oferece baixar uma cópia.

## Quatro regras para não virar documento morto

1. Nenhum campo de texto livre longo — se virou parágrafo, quebra em passo.
2. Passo sem exemplo é passo incompleto.
3. Nada publicado sem dono.
4. Processo não consultado em 90 dias volta pra revisão do gestor.

## Onde os dados vivem

No **Supabase**, uma linha por peça: a estrutura da empresa, cada processo, decisão, fim nomeado, documento, sistema e indicador. Repartir assim é o que permite várias pessoas editarem ao mesmo tempo sem uma apagar o trabalho da outra.

A conversa com a consultora fica em outra tabela, por pessoa.

O `localStorage` é cópia local enquanto você trabalha. **Exporte o JSON de vez em quando** — ícone de banco de dados no topo.

As imagens são reduzidas para ~1000px antes de guardar, mas ainda são o que mais ocupa espaço.

## O caminho daqui

| | O que entrega | |
|---|---|---|
| 1 | organograma + trilha + fluxo macro + aula + biblioteca | ✔ |
| 2 | Supabase: banco, login, edição ao vivo | ✔ |
| 3 | sistema e indicador como objetos de primeira classe | ✔ |
| 4 | governança: aprovação com nome, RACI, histórico | ✔ |
| 5 | consultora de IA que opina e não escreve | ✔ |
| 6 | validade de treinamento — NR e reciclagem vencem | |
| 7 | o mapa como porta de entrada do colaborador | |
| 8 | comunicados por cargo e confirmação de leitura | |

O que entrou até aqui responde as perguntas inversas: *o que para se o CAD cair?*, *quem executa este processo?*, *quem aprovou, e mudou desde então?*
