# Arquitetura do CIP

Escrito em 02/08/2026, quando o projeto passou de script único para camadas.

## As quatro camadas

Cada uma responde uma pergunta diferente, e a dependência corre numa direção só.

```
dominio.js   o que o CIP É          ← não depende de ninguém
   ↑
bpmn.js      como é desenhado       ← recebe modelo neutro, não conhece o CIP
   ↑
nuvem.js     onde é guardado        ← traduz o modelo para linhas do banco
   ↑
app.js       como aparece na tela   ← única camada que toca o navegador
```

**`dominio.js`** — o modelo da empresa e as regras sobre ele. Sem tela, sem rede, sem navegador. Responde: *o que conta como processo pronto? quem executa o quê? de onde vem a posição de cada peça?*

**`bpmn.js`** — recebe `{ faixas, elementos, fluxos }` e devolve SVG. Não sabe o que é um cargo nem um setor. Por isso o macro e o subprocesso usam o mesmo desenhista sem duplicar nada.

**`nuvem.js`** — login, gravação e sincronia. É aqui que mora a tradução entre o modelo e as linhas da tabela `pecas`, **de propósito**: o domínio não sabe que existe banco.

**`app.js`** — telas, eventos, arrastar, teclado. Tudo que toca o DOM.

## A regra que sustenta o resto

**Nada que o sistema consegue deduzir é guardado duas vezes.**

Aplicada em quatro lugares:

| O que poderia ser guardado | De onde é deduzido |
|---|---|
| lista de processos do cargo | do vínculo `processo.cargosIds` |
| posição das peças no mapa | das ligações `proximos` |
| o diagrama BPMN | dos passos do processo |
| a árvore do organograma | de `cargo.reportaA` |
| a camada do processo | da camada do setor dele |
| os sistemas do processo | dos sistemas dos passos dele |
| quem é processo de apoio | de não ter ligação nenhuma no mapa |
| se um processo está vigente | da assinatura do conteúdo bater com a da aprovação |
| quais regras um processo aplica | das regras marcadas nos passos dele |

É o que impede o CIP de virar cópias desencontradas — o erro clássico de ferramenta caseira de processo. É também o princípio central do ARIS: cada objeto existe uma vez e é reutilizado.

## O modelo

```js
{
  empresa:    { nome },
  setores:    [{ id, nome, camada }],                           // estrategico | principal | apoio
  cargos:     [{ id, setorId, nome, reportaA, missao, expectativas, conhecimentos,
                 trilha: [{ id, tipo, titulo, url, duracao, obrigatorio, nota, documentoId }] }],
  decisoes:   [{ id, tipo, pergunta, setorId, proximos }],       // exclusivo | inclusivo
  fins:       [{ id, nome, setorId }],                          // desfechos nomeados
  documentos: [{ id, titulo, categoria, escopo, resumo, url, videoUrl }],
  sistemas:   [{ id, nome, descricao, url, critico }],          // onde o trabalho acontece
  regras:     [{ id, codigo, titulo, texto, vigenteDesde }],    // RN-001; vale na empresa, não no processo
  indicadores:[{ id, nome, pergunta, unidade, direcao, meta,
                 frequencia, processoIds[] }],                  // a ponte com o Bloco 9
  processos:  [{
    id, nome, setorId, donoCargoId, cargosIds[], consultadosIds[], informadosIds[],
    status, revisado, aprovacao, historico[], videoUrl,
    proximos: [{ para, rotulo }],
    entrada, saida,                                            // o que chega e o que sai
    porque, seErrar,
    anexos:    [{ id, titulo, url }],
    passos:    [{ id, tipo, cargoId, oQue, comoFazer, porque, armadilha, regra,
                  imagem, videoUrl, sistemaIds[],
                  proximos: [{ para, rotulo }] }],       // o subprocesso é grafo, não fila
    perguntas: [{ id, pergunta, resposta }],
  }],
}
```

**O vocabulário, fechado com o Eric em 02/08/2026:**

| Palavra | O que é | Exemplo |
|---|---|---|
| Macro | a *vista* que mostra todos os processos de uma vez | — |
| **Processo** | uma caixa do macro | Orçamento |
| **Subprocesso** | o desenho de dentro de um processo | o BPMN do Orçamento |
| **Passo** | uma peça do subprocesso, onde mora o detalhe | Receber o pedido |
| Setor | a raia — gente, não trabalho | Comercial |

O subprocesso **não é um nível de dado**: é o desenho que os passos formam. Por isso `processo.passos[]` e nada entre os dois. Antes disso, a mesma coisa se chamava "subprocesso" no macro, "passo" no desenho e "etapa" na paleta — três nomes para duas coisas, e foi o que embaralhou a conversa.

E o macro é vista, não nível: "Comercial" é setor, não processo.

Os dois níveis têm a **mesma natureza**: um grafo de peças ligadas por `proximos`. Não são duas estruturas diferentes com duas telas diferentes — é `colunasDe()` calculando posição nos dois, `bpmn.js` desenhando os dois, o mesmo gesto de arrastar ligando os dois. O subprocesso era uma fila (a ordem do array virava a sequência) e deixou de ser: existe subprocesso que bifurca, que volta atrás, e que atravessa setor porque o passo é de outro cargo.

A conversão da base antiga mora em `normalizar()`: encadeia os passos na ordem em que estavam e transforma o `seSim`/`seNao` — que eram texto descrevendo cada caminho — em passos de verdade, pendurados no ramo certo e reentrando no fluxo. Texto que descreve trabalho é passo.

## Invariantes

Coisas que precisam continuar verdadeiras. Cada uma tem teste.

1. **Estado completo ou nada.** Todo caminho que instala um estado novo passa por `normalizar()`. São três: carregar, importar e apagar. O bug de esquecer um deles quebrou três telas.
2. **Ligação só aponta para peça viva.** `normalizar()` descarta o resto.
3. **Rascunho de IA não conta como pronto** até ter revisão humana.
4. **Ciclo não trava nem estica.** A busca em profundidade marca arestas de retorno e as tira do cálculo de coluna.
5. **Link do usuário só passa se for `http`/`https`.**
6. **Alteração remota substitui no lugar**, nunca no fim — a ordem da lista é a ordem na tela.
7. **O domínio não conhece `ui`.** Se precisar de algo da tela, recebe por parâmetro.
8. **A camada mora no setor**, nunca no processo — o processo herda.
9. **O sistema é objeto, não texto.** Existe uma vez e é referenciado pelo passo — por isso `ondeApareceOSistema()` consegue responder o que para se ele cair. Apagar o sistema limpa a referência em todos os passos.
10. **Fim explícito dispensa o automático.** Quem termina em fim nomeado não ganha um segundo desfecho desenhado.
11. **Do fim não sai alça** — dele não parte nada.
12. **Processo de apoio não é um campo, é uma constatação.** Ninguém marca "este é de apoio". Quem não tem ligação nenhuma no mapa aparece na faixa *Processos que sustentam*; ligou, sobe para o fluxo sozinho. Um mapa sem nenhuma ligação não tem ninguém "fora do fluxo" — sem fluxo, não há fora.
13. **Peça fora do fluxo não ganha início nem fim.** Ela não começa nem termina nada — sustenta. Desenhar evento nela seria dizer o que não é. Continua desenhada na raia dela: está fora do fluxo, não fora do mapa.
14. **Ciclo fechado ainda tem porta.** Quando todo passo tem entrada, o primeiro vira a entrada — no desenho e na aula, pela mesma regra.
15. **Cliente não apaga o que não entende.** A sincronia só considera "sumida" uma peça cujo tipo ele sabe escrever. Sem isso, uma aba com código velho lê uma linha nova, não a reconhece, conclui que sumiu e apaga o trabalho de quem está atualizado.
16. **Toda lista do modelo tem linha no banco.** Um teste percorre o modelo e cobra: acrescentou lista, dá lugar para ela. `fins` viveu meses só no navegador porque ninguém cobrava.
17. **Aprovação tem nome, data e assinatura do que foi aprovado.** O selo cai sozinho quando o conteúdo muda — selo que sobrevive a qualquer edição afirma que alguém conferiu o que ninguém conferiu. Só cai por mudança no que a aprovação de fato aprova: nome, motivo, entradas e saídas, responsáveis, e os passos com suas regras, sistemas e ligações. Trocar um vídeo ou anexar um arquivo não derruba.
18. **"Pronto" passou a exigir aprovação.** Antes bastava estar preenchido — que é a definição de pronto que ninguém assina.
19. **A regra e o indicador moram fora do processo.** Os dois valem em mais de um: a regra do prazo de pagamento pega Comercial, Financeiro e Faturamento; o prazo médio de entrega mede Comercial e Logística. Guardados dentro, seriam cópias que um dia divergem.
20. **Mexer no indicador não derruba a aprovação do processo.** O número mede o processo, não faz parte dele. Se derrubasse, ajustar uma meta obrigaria a reaprovar o passo a passo — e ninguém ajustaria.
21. **Elo fraco é ausência, não semântica.** `elosFracos()` aponta quem entrega sem declarar o que entrega. Se a saída de um é *mesmo* a entrada do outro, só leitura humana diz.

## Os testes

`testes.html` — abra no navegador, veja verde. Sem instalar nada, sem build.

Dois casos exigem layout de verdade (`getComputedStyle`) e só valem no navegador. O resto roda em qualquer lugar que execute `dominio.js` e `bpmn.js`.

Cobre as três camadas, porque os três bugs que mais custaram nesta semana foram um de cada:

| Bug | Camada | Custo |
|---|---|---|
| apagar tudo deixava o estado incompleto | domínio | 3 telas quebradas |
| DELETE do Realtime lido do campo errado | nuvem | remoção não propagava |
| `hidden` perdendo para `.classe { display }` | tela | 6 rodadas de diagnóstico |
| "Ajustar" medindo o ícone da legenda | tela | zoom no teto, mapa ilegível |
| rótulo de gateway colidindo | desenho | 3 tentativas antes de parar de calcular |

Os dois últimos só apareceram quando o macro real da Platina entrou — 16 processos e 7 raias fazem perguntas que 3 caixas de teste não fazem. **Importar dado de verdade é teste.**

Testar só função pura teria pego um de três.

**A página nunca é servida do cache** — a versão sai do relógio. Testar código velho por engano já custou uma rodada aqui.

## A tela de desenho

O desenho precisa se explicar sozinho e obedecer ao gesto que a pessoa já conhece de outras ferramentas. Três decisões:

**Legenda sempre à mão.** Um `<details>` no topo das duas telas, com o símbolo desenhado ao lado do que ele significa. Ninguém é obrigado a saber BPMN de cor.

**Ligar é arrastar, não é modo.** Ao passar o mouse numa peça aparece uma alça na borda direita; arrastar dela até outra peça cria a ligação, com um fio pontilhado acompanhando o ponteiro. O botão "Ligar" do inspetor continua, como caminho alternativo — mas deixou de ser o único.

**Teclado.** `Delete` apaga o selecionado, `Esc` desmarca. Antes, apagar exigia achar o botão no inspetor: três movimentos para o que devia ser um.

**Renomear é duplo clique na forma.** Um `<input>` posicionado sobre o *bounding box* dela. Atravessar a tela até um campo lateral para trocar uma palavra é o que fazia o desenho parecer travado.

**Selecionar não redesenha a tela.** Clicar numa peça troca a classe no SVG e reconstrói só o painel lateral. Não é só performance: o navegador **só dispara `dblclick` quando os dois cliques caem no mesmo elemento** — com `render()` no clique, o elemento é trocado no meio do gesto e o duplo clique nunca chega a existir. Foi assim que o renomear "não funcionou" na primeira tentativa, com o código todo certo.

**Entrar no processo é o `+` do canto.** O marcador de subprocesso do BPMN virou alvo clicável, com área de toque maior que o desenho. Antes era duplo clique — que agora tem outro dono.

## Ler um BPMN de fora

`lerBpmn(xml)` mora no domínio e **não usa DOMParser**. Não é purismo: o domínio precisa rodar em qualquer lugar, inclusive num teste sem navegador, e o pedaço do BPMN que interessa é raso — elementos com atributos, sem aninhamento além da raia. Um scanner de ~40 linhas dá conta, e casa a tag com qualquer prefixo (`bpmn:`, `semantic:` ou nenhum), porque cada ferramenta escolhe o seu.

| Do arquivo | Vira |
|---|---|
| `lane` | setor — reaproveitando o que já existe, sem acento e sem caixa |
| `subProcess`, `task` e variantes | processo |
| `exclusiveGateway` / `inclusiveGateway` | decisão exclusiva / inclusiva |
| `endEvent` | fim nomeado |
| `sequenceFlow` | ligação, com o `name` virando rótulo |
| `startEvent` | **nada** — o CIP deduz quem é entrada |

**As setas vêm só do `sequenceFlow`.** Os `<incoming>`/`<outgoing>` dentro de cada elemento são cópia da mesma informação — e no arquivo da Platina eles já discordam entre si (`Task_Faturar` declara receber `F23`, que na verdade vai para `Task_Devolver`). Ler a cópia seria escolher a versão errada de uma verdade duplicada; é o mesmo motivo pelo qual o CIP não guarda nada duas vezes.

O import **não encosta** em cargo, documento, sistema nem trilha: o arquivo não sabe nada disso, e apagar o que ele não conhece seria perda pura. Também não inventa nada que o arquivo não diga.

O que o leitor **não** lê: pool, fluxo de mensagem, evento de borda, e a posição (`bpmndi`). Posição o CIP calcula das ligações — é invariante, não omissão.

## Uma representação por coisa

A fase saiu em 03/08/2026, e a tela de cartões junto. Eram duas formas de agrupar o mesmo mapa (por setor, por fase) e duas formas de desenhá-lo (cartões no "Fluxo macro", BPMN no "Desenhar o macro"). Manter as duas custava manter duas classificações em dia e dois motores de layout com dois conjuntos de bugs — e na prática só uma de cada par era usada.

Hoje: **o setor agrupa, o BPMN desenha.** A tela de fluxo lê e navega; "Desenhar o macro" é a mesma coisa em modo de edição.

**O nome da raia fica preso na borda esquerda.** Num macro de 6.000px, rolar para o meio e não saber mais em que setor cada linha está é o que torna o mapa inútil. O SVG não tem `position: sticky`, então a camada dos nomes é empurrada por `transform` a cada rolagem — no começo do desenho o deslocamento é zero e ela fica no lugar de origem.

**Navegar é com o mouse.** Arrastar o fundo move; `Ctrl` + roda dá zoom **no ponto do cursor**. Zoom que ignora onde você está olhando obriga a procurar o lugar de novo a cada passo. O ponto do mundo sob o cursor é guardado antes de redesenhar e a rolagem é recolocada depois — medindo o recuo do desenho **depois** do redesenho, nunca antes: supor que ele não muda foi o que fez o zoom deslizar na vertical.

Arrastar só pega o **fundo**. Em cima de uma peça ou da alça, quem manda são os gestos de desenhar, que existiam antes deste.

**A casca tem altura definida e um lugar só rola por vez.** `.desenho` tinha `height: calc(100vh - 61px)` — um palpite sobre a altura da topbar. Qualquer faixa de aviso empurrava o desenho para fora da janela e quem passava a rolar era a PÁGINA, não a tela. Com a página rolando, o zoom no cursor não tinha como corrigir a vertical: a compensação simplesmente não era aplicada, e o desvio media exatamente o tamanho dela.

## Carga de dados é fora do app

Não existe botão de importar `.bpmn` na tela, e é decisão, não pendência: o import substitui o fluxo macro inteiro, e um clique errado num seletor de arquivo apagaria o trabalho de três pessoas. `lerBpmn()` fica no domínio como a **regra de tradução, testada**, e a carga é operação de uma vez, feita fora do app, com backup da tabela antes.

O macro real da Platina — 16 processos, 4 decisões, 3 fins nomeados, 25 ligações — entrou assim em 03/08/2026.

## Governança: o que existe e o que não

Existe: aprovação com nome e data, o selo caindo sozinho quando o conteúdo muda, RACI completo (R e A já existiam como "quem executa" e "dono"; C e I entraram), validação de responsabilidade, e histórico dos atos de governança.

**O histórico é de governança, não é log de alterações.** Ele registra quem aprovou e quem tirou a aprovação, com data — não quem mudou qual palavra. Guardar diff de tudo é outro produto, e cabe no banco, não numa lista dentro do processo. O que a assinatura garante é que ninguém *precisa* do diff para saber que mudou.

## O que ainda não está separado

Honestidade sobre o estado atual:

- `app.js` tem 3.000 linhas. Melhor que 3.355 num arquivo só, mas ainda é grande. As telas poderiam virar arquivos por assunto.
- O domínio lê um `state` compartilhado em vez de receber por parâmetro. Testável (a bancada troca o `state` antes de cada caso), mas não é isolamento de verdade.
- A camada de nuvem passou a ter teste da tradução estado↔peças (era o buraco que deixou o fim nomeado meses sem linha no banco). O que continua sem teste automatizado é a conversa com o servidor: login, Realtime e concorrência seguem verificados à mão, com duas abas.
