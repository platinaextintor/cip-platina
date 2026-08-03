# CIP · Central Inteligente de Processos

Projeto da Platina Extintores para centralizar, ensinar e manter vivos os processos da empresa.

## A ideia central

O CIP não é um repositório de documentos. É uma tentativa de transformar o jeito Platina de fazer as coisas — que hoje mora na cabeça das pessoas — em algo explícito, oficial e **ensinável**.

O que amarra tudo é a ligação **cargo → o que esse cargo precisa saber**. A pessoa não procura o que interessa: o sistema diz quais processos ela executa e o que ela precisa dominar.

Quatro telas, encaixadas:

| Tela | Responde |
|---|---|
| **Organograma** | quem é quem, quem responde a quem |
| **Trilha do cargo** | o que essa pessoa precisa saber e treinar |
| **Fluxo macro** | o que a empresa faz, em que ordem |
| **Aula** | como cada processo se faz, passo a passo |
| **Biblioteca** | regimento, políticas e manuais da empresa |

O encaixe acontece no cargo: selecione alguém no organograma e os processos dele acendem no fluxo macro. Abra um processo e ele diz quais cargos executam.

## A trilha do cargo

Clicar num cargo no organograma abre a trilha dele. Ela reúne:

- **por que esse cargo existe** — a missão, em uma frase
- **o que se espera de quem ocupa** — as expectativas, uma por linha
- **o que precisa dominar** — os temas de conhecimento
- **processos obrigatórios** — essa lista **se monta sozinha**: todo processo que marca o cargo em "quem executa" aparece aqui. Você não digita duas vezes.
- **treinamentos** — vídeo do YouTube (toca dentro da página), curso externo, leitura, prática acompanhada ou documento da biblioteca. Cada item marca se é obrigatório e quanto tempo leva.

## Os dois níveis

O CIP desenha a empresa em duas alturas, e só duas:

| Nível | O que é | Raias | Onde se desenha |
|---|---|---|---|
| **Macro** | os processos da empresa e as decisões entre eles | setores | Fluxo macro → **Desenhar o macro** |
| **Subprocesso** | o que se faz dentro de um processo | cargos | dentro do processo → **Desenhar em tela cheia** |

Um subprocesso aparece na aula como **passo** — mesma coisa, nome diferente conforme a tela.

### Desenhar o macro

Painel em tela cheia, paleta em cima, inspetor à direita.

- **Processo** e **Decisão** na paleta. A peça nova já nasce **ligada** à que estava selecionada — é assim que se desenha uma cadeia sem parar para ligar uma por uma.
- **Decisão** é o losango. No inspetor você escreve a pergunta ("Aprovado?") e dá um rótulo a cada saída ("sim", "não"). Os rótulos aparecem nas setas.
- **Ligar** aponta uma peça para outra, inclusive de volta para um setor anterior.
- **Duplo clique** numa peça renomeia ali mesmo. Para entrar no processo, clique no **+** do canto de baixo.
- A **posição é automática**: ligou, andou para a direita. Arrastar serve para mudar de raia.

O exemplo que motivou isso: *Orçamento* no Comercial → decisão *Aprovado?* → pelo "sim" sobe para *Análise de crédito* no Administrativo → volta para *Cadastro de pedido* no Comercial. Tudo isso é desenhável.

O **Fluxo macro** mostra esse mesmo desenho em modo de leitura: clique numa peça e ela abre. Para mexer no desenho, **Desenhar o macro**.

## O mapa da operação

O fluxo macro é um fluxograma editável, na mesma linguagem visual do organograma.

**Raias são os setores** — quem faz. O nome da raia fica preso na borda direita: num macro largo, rolar até o fim e não saber mais em que setor está cada linha é o que torna o mapa inútil. Renomeie uma raia clicando no nome dela.

**Ligações.** O ícone de corrente no nó entra em modo ligação; clique no processo que vem depois e a seta é desenhada. Clique numa seta para desfazer. `Esc` cancela.

**A coluna vem das ligações.** Você não posiciona nada à mão: ligou A em B, B anda uma casa para a direita, mesmo estando em outra raia. É isso que impede a seta de voltar para trás e mantém o mapa legível conforme cresce.

Retorno é permitido — "não aprovou, volta pro orçamento" é processo real. A seta de retorno é desenhada normalmente, ela apenas não conta para a posição, senão o mapa se esticaria para sempre.

**Arraste** um nó para movê-lo de raia.

## O fluxograma em BPMN 2.0

Além do passo a passo, cada processo tem um fluxograma na notação padrão — a mesma que qualquer consultor, auditor ou certificadora reconhece. Ele aparece na abertura da aula e dentro do editor, e é desenhado a partir dos passos: você não mantém dois desenhos.

A tradução é direta:

| No CIP | Em BPMN 2.0 |
|---|---|
| início e fim do processo | evento de início (círculo fino) e de fim (círculo grosso) |
| passo do tipo **etapa** | tarefa de usuário |
| passo do tipo **evidência** | tarefa com objeto de dados anexado — a foto, o comprovante |
| passo do tipo **aprovação** | tarefa de usuário |
| passo do tipo **decisão** | gateway exclusivo (losango com X) |
| "se sim" e "se não" | os dois caminhos que saem do gateway, com rótulo |
| **quem faz** o passo | a raia (lane) |

O caminho do "não" vira uma tarefa própria que reentra no fluxo depois — não fica só descrito em texto, fica desenhado.

**Quem faz** é um campo novo em cada passo. É ele que cria as raias, e é aí que o BPMN paga: você vê o trabalho atravessando do Vendedor para o Supervisor e voltando. Deixando em branco, o passo cai na raia do dono do processo.

### Desenhar direto na tela

O caminho também corre ao contrário: **você desenha e os passos aparecem**. No editor do processo, o botão **Desenhar em tela cheia** abre o canvas ocupando a janela inteira, com a paleta em cima e um inspetor à direita.

- **Paleta** — Etapa, Decisão, Evidência, Aprovação. Cada forma que entra no desenho é um passo criado na hora, inserido depois do que estiver selecionado.
- **Clicar numa forma** abre os campos dela à direita: o que fazer, quem faz, como fazer, e os dois caminhos quando é decisão.
- **Arrastar uma forma sobre outra** a coloca antes daquela — a lista de passos se reorganiza junto.
- **Zoom** com − / + e um **Ajustar** que encaixa o desenho inteiro na largura da tela.

Não existem dois lugares para manter. O desenho é a lista de passos, vista de outro jeito: o que você faz num aparece no outro na mesma hora. Por quê, armadilha, regra, foto e vídeo continuam no editor — no canvas fica o esqueleto do fluxo.

No **macro** cada processo vira um subprocesso colapsado (o retângulo com +), as raias são os setores, as ligações viram sequence flows, e quem não tem ninguém antes ou depois ganha evento de início ou de fim. As raias aparecem mesmo vazias: o quadro em branco já mostra a empresa inteira esperando ser preenchida.

## A IA que escuta

Em vez de preencher campo por campo, você conta e a IA estrutura. Ela aparece em cinco lugares:

| Onde | Botão | O que faz |
|---|---|---|
| Fluxo macro | **Contar um processo** | Você escreve solto; sai um processo com passos tipados, armadilhas e 3 perguntas |
| Editor do processo, em cada passo | ícone de brilho | Preenche o porquê, a armadilha e a regra a partir do que você já escreveu |
| Editor do processo, nas perguntas | **IA escrever 3 perguntas** | Gera perguntas de situação a partir dos passos |
| Editor do cargo | **IA descrever este cargo** | Missão, expectativas e conhecimentos, a partir dos processos que ele executa |
| Editor do cargo | **IA sugerir treinamentos** | Vídeo, curso, leitura, prática — sem inventar link |
| Biblioteca | **IA descrever pelo título** | Resumo, categoria e escopo do documento |

**A IA nunca sobrescreve o que você escreveu.** Ela preenche só os campos vazios. O que é seu continua seu.

### O limite que ela respeita

Ela **não inventa prazo, valor, percentual, norma técnica nem exigência legal**. Se você não disser, o campo fica em branco esperando você.

Isso não é timidez: extintor mal recarregado mata gente, e um prazo errado escrito como se fosse oficial é pior que um campo vazio. Ela também não inventa nome de documento, sistema ou link.

### O selo de revisão

Todo processo que passou pela IA entra como **não revisado**. Enquanto estiver assim, ele **não conta como pronto** no contador do topo, e o editor mostra um aviso vermelho.

Você lê, corrige o que estiver torto e clica em "Revisei". Depois disso ainda falta a **aprovação com nome** — são duas coisas: revisar o que a IA escreveu, e assumir publicamente que o processo é esse.

### Onde a chave da IA mora

Numa Edge Function do Supabase chamada `cip-ia`, no projeto **CIP Platina** — nunca no navegador. O que vai no `app.js` é só a chave pública do projeto, que existe exatamente para isso.

Para a IA funcionar, a variável `ANTHROPIC_API_KEY` precisa estar nos secrets do projeto:

> Supabase → CIP Platina → Project Settings → Edge Functions → Secrets → **Add new secret**
> Nome: `ANTHROPIC_API_KEY` · Valor: a chave do console da Anthropic

Sem ela, os botões de IA respondem com uma mensagem clara dizendo exatamente isso.

A função **exige usuário autenticado**, aceita chamadas só das origens da Platina e trava em 12 chamadas por minuto para segurar um laço acidental. Como o cadastro público está desligado no Supabase, quem não tem conta criada por você não chega nela.

Ainda assim, vale manter um **limite de gasto no console da Anthropic**: é a trava que não depende de nada dar certo.

## Onde entram vídeo e documento

**Vídeo do YouTube** em três lugares: no passo do processo ("veja sendo feito"), no processo inteiro (visão geral) e no treinamento da trilha. Basta colar o link — o player aparece embutido, sem cookie de rastreamento.

**Documento** em dois lugares: a **Biblioteca** guarda o que vale para a empresa inteira (regimento, políticas, manuais), e o **material de apoio** do processo guarda o que a pessoa abre enquanto executa (modelo de orçamento, tabela de preço).

Como ainda não há upload de arquivo, o documento entra como link — Google Drive, OneDrive, Dropbox. Só links `http`/`https` são aceitos.

## O processo é uma aula, não um documento

Um especialista não entrega apostila. Ele diz por que existe, mostra o caminho inteiro, vai um passo por vez, mostra um exemplo real, aponta onde todo mundo erra e checa se você entendeu.

Por isso a unidade do sistema não é o processo — é o **passo**. Cada passo carrega cinco coisas:

- **o que fazer** — uma frase, verbo na frente
- **como fazer** — o detalhe prático
- **exemplo real** — print ou foto (é o que faz grudar)
- **por quê** — a razão, o que faz lembrar em campo
- **onde todo mundo erra** — a armadilha
- **a regra** — o inegociável, ou quando chamar o supervisor

Passos de decisão ganham dois caminhos (se sim / se não). Cada tipo de passo — etapa, decisão, evidência, aprovação — tem cor e forma próprias na tela.

## Como usar

**No ar em https://platinaextintor.github.io/cip-platina/**, com login. O conteúdo vive no Supabase e a edição é ao vivo — o que uma pessoa faz, a outra vê.

Para mexer no código, `index.html` abre direto no navegador; não precisa instalar nada.

O CIP começa **vazio de conteúdo**: vêm só os 4 setores e os 5 cargos com a hierarquia. Missão, processo, subprocesso, trilha e documento são escritos por você — não há exemplo pré-carregado para confundir com dado real.

Se algo travar, abra com `?seguro=1` no fim do endereço: o app inicia vazio **sem gravar por cima** do que está salvo, e oferece baixar o backup.

1. **Organograma** — monte os cargos. Arraste um cargo sobre outro para subordiná-lo, ou sobre a caixa da empresa para levá-lo ao topo. O ícone de corrente liga a partir do chefe: clique nele e depois em quem responde a ele. A árvore se redesenha sozinha, e uma ligação que fecharia ciclo é recusada.
2. **Trilha** — clique num cargo para escrever a missão, as expectativas e os treinamentos.
3. **Fluxo macro** — o mapa da operação em raias. Clique em `+ processo` na raia certa, e depois no ícone de corrente para ligar um processo no próximo.
4. **Editor** — descreva o processo e escreva os passos. Salva sozinho.
5. **Aula** — clique em qualquer cartão do fluxo para ver como o colaborador vê.
6. **Biblioteca** — cadastre o regimento e as políticas, e depois aponte a trilha para eles.

Um processo conta como **pronto** quando tem o "por que existe", pelo menos 3 passos escritos **e uma aprovação com nome**. Editar um processo aprovado derruba o selo — a tela passa a dizer "mudou desde a aprovação", e alguém precisa aprovar de novo.

Vá um processo por vez. O de maior volume primeiro.

## Quatro regras para não virar documento morto

1. Nenhum campo de texto livre longo — se virou parágrafo, quebra em passo.
2. Passo sem exemplo é passo incompleto.
3. Nada publicado sem dono.
4. Processo não consultado em 90 dias volta pra revisão do gestor.

## Onde os dados vivem

No **Supabase**, uma linha por peça: a estrutura da empresa, cada processo, cada decisão, cada fim nomeado, cada documento, sistema, regra e indicador. Repartir assim é o que permite três pessoas editarem ao mesmo tempo sem uma apagar o trabalho da outra.

O `localStorage` continua sendo usado como cópia local enquanto você trabalha. **Exporte o JSON de vez em quando** — botão de banco de dados no topo à direita.

As imagens são reduzidas para ~1000px antes de guardar, mas ainda assim são o que mais ocupa espaço.

## O caminho daqui

| Etapa | O que entrega | |
|---|---|---|
| 1 | organograma + trilha do cargo + fluxo macro + aula + biblioteca | ✔ |
| 2 | autoria com IA — você conta, ela estrutura | ✔ |
| 3 | Supabase: banco, login, edição ao vivo entre três pessoas | ✔ |
| 4 | sistema, regra de negócio e indicador como objetos de primeira classe | ✔ |
| 5 | governança: aprovação com nome, RACI completo, histórico | ✔ |
| 6 | validade de treinamento — NR e reciclagem vencem | |
| 7 | o mapa como porta de entrada do colaborador | |
| 8 | comunicados por cargo e confirmação de leitura | |

O que entrou até aqui responde as perguntas inversas: *o que para se o CAD cair?*, *quem é afetado se a regra do prazo mudar?*, *quem aprovou este processo e ele mudou desde então?*
