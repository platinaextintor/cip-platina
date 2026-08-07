# Estrutura do projeto CIP

```text
CIP Platina Extintores/
├── index.html          casca da aplicação
├── styles.css          identidade visual e responsividade
├── dominio.js          o modelo da empresa e as regras que valem sobre ele
├── bpmn.js             renderizador BPMN 2.0 em SVG
├── nuvem.js            login, gravação e sincronia ao vivo
├── app.js              a camada de tela
├── testes.html         a bateria de testes — abra no navegador
├── diagnostico.html    checagem de conexão e permissões
├── ferramentas/
│   └── varredura.js    cruza botões desenhados × botões escutados
├── documentacao/
│   ├── README-CIP.md
│   ├── arquitetura.md
│   ├── estrutura-do-projeto.md
│   └── visao-de-futuro/             o material que originou o projeto
└── supabase/
    ├── functions/cip-ia/index.ts    fonte da Edge Function (cópia do que está implantado)
    └── migrations/                  o histórico do banco, em ordem
```

**As quatro camadas dependem numa direção só**, e é o que permite testar o miolo sem navegador:

```
dominio.js  ←  bpmn.js  ←  nuvem.js  ←  app.js
   (o que a empresa É)              (como aparece)
```

`dominio.js` não conhece tela, rede nem navegador. `testes.html` carrega só as três primeiras — por isso 180 e poucos testes rodam sem subir nada.

## Como o app.js está organizado

Lido de cima para baixo, na ordem em que aparece:

| Bloco | O que faz |
|---|---|
| ícones | SVGs inline e os quatro tipos de passo |
| semente | `estadoVazio()` e `semente()` — o esqueleto da empresa, sem conteúdo |
| estado | carregar, validar e salvar no `localStorage` (salvamento com atraso de 400 ms) |
| helpers | busca por id, `mapeado()` e `faltando()` — a régua do que conta como pronto |
| render | roteador de telas: organograma, trilha, cargoEditor, fluxo, aula, editor, biblioteca, docEditor |
| organograma | árvore por `reportaA`, com o setor como cor; arrastar e ligar reescrevem `reportaA` |
| fluxo macro | mapa em raias, ligações em SVG, arrastar entre raias |
| aula | abertura → passos → fechamento |
| editor | edição sem re-render, para o cursor não pular enquanto se digita |
| trilha | página do cargo: missão, expectativas, conhecimentos, processos e treinamentos |
| biblioteca | documentos gerais da empresa |
| BPMN | `bpmnDoProcesso()` e `bpmnDoMapa()` — traduzem o modelo do CIP para a notação |
| macro | `viewMacro()` e `ligarMacro()` — o painel em tela cheia do nível 1 |
| desenho | `viewDesenho()` e `ligarDesenho()` — o canvas do nível 2 |
| consultora | `perguntarAConsultora()`, `viewConsultora()` e o painel lateral de IA |
| drawer | painel de dados do projeto |

## O modelo de dados

```js
{
  empresa:  { nome },
  setores:  [{ id, nome }],
  cargos:   [{ id, setorId, nome, reportaA, missao, expectativas, conhecimentos,
               atividades, planoDeCarreira,
               trilha: [{ id, tipo, titulo, url, duracao, obrigatorio, nota, documentoId }] }],
  documentos:[{ id, titulo, categoria, escopo, resumo, url, videoUrl }],
  sistemas: [{ id, nome, descricao, url, critico }],
  indicadores:[{ id, nome, pergunta, unidade, direcao, meta, frequencia,
                 processoIds[], cargoIds[] }],              // cargoIds: o que não passa por processo
  decisoes: [{ id, tipo, pergunta, setorId, proximos }],     // os losangos do macro
  fins:     [{ id, nome, setorId }],                         // desfechos nomeados
  processos:[{
    id, nome, setorId, donoCargoId, cargosIds[], consultadosIds[], informadosIds[],
    status, aprovacao, historico[], videoUrl, documentoIds[],
    proximos: [{ para, rotulo }],   // as setas do macro, com "sim"/"não"
    entrada, saida, porque, seErrar,
    passos: [{ id, tipo, cargoId, setorId, oQue, comoFazer, porque, armadilha,
               sistemaIds[], imagem, videoUrl, seSim, seNao,
               proximos: [{ para, rotulo }] }],              // o subprocesso é grafo
    perguntas: [{ id, pergunta, resposta }]
  }]
}
```

`expectativas` e `conhecimentos` são texto com um item por linha — `linhas()` quebra na hora de exibir. São itens curtos, não parágrafos.

Quatro decisões que sustentam o resto:

**`reportaA` no cargo** é o que faz o organograma ser hierarquia de verdade, e não uma lista agrupada por setor. O setor virou atributo (a cor), não nível da árvore.

**O que vale em mais de um processo mora fora dele.** Sistema e indicador são objetos próprios, referenciados pelos passos e pelos processos. O CAD é usado no Comercial e no Faturamento; guardado dentro de cada um, seriam duas cópias que um dia divergem.

Regra de negócio já foi um objeto desses, com código RN-000 e catálogo próprio. Saiu: norma e política moram em Documento, e duas gavetas para a mesma coisa é onde o time procura no lugar errado. `normalizar()` apaga os vestígios de bases antigas — o catálogo, a marcação nos passos e o campo de texto solto que existia antes dele.

**O passo é a unidade**, não o processo. Não existe um campo `detalhes` com um parágrafão: quem quiser escrever um, precisa quebrar em passos. É estrutural de propósito.

**A trilha não guarda os processos obrigatórios.** `processosDoCargo()` deriva a lista do vínculo `processo.cargosIds`. Vincular um cargo a um processo já atualiza a trilha dele — não existe lugar para as duas listas discordarem.

## Detalhes que importam na hora de mexer

O `tipo` do passo (`etapa`, `decisao`, `evidencia`, `aprovacao`) aparece na tela em três lugares: a cor da borda no editor, a forma no BPMN e a etiqueta na aula. Ao criar um tipo novo, atualize o objeto `TIPOS`.

As imagens são reduzidas para no máximo 1000px de largura e salvas como JPEG base64 dentro do próprio estado — por isso o painel de dados mostra o espaço usado.

Todo link digitado pelo usuário passa por `linkSeguro()`, que só deixa passar `http` e `https`. Vídeo do YouTube vira embed pelo `youtube-nocookie.com`; qualquer outro endereço vira um botão que abre em aba nova. Ao mexer em link, use essas duas funções em vez de jogar a URL direto no HTML.

### O macro tem dois tipos de peça

`processos` e `decisoes` são listas separadas mas se comportam como uma só no desenho: `nosMacro()` junta as duas, `noMacro(id)` acha qualquer uma e `ehDecisao(id)` distingue. Só o desenho e o painel lateral tratam as duas de forma diferente — layout, ligação, arrasto e limpeza de órfãos são comuns.

A seta virou `{ para, rotulo }` para carregar o "sim" e o "não" que saem de um gateway. `normalizarSaidas()` converte o formato antigo (uma lista de ids) no carregamento, então dados salvos antes continuam abrindo.

Dois rótulos saindo do mesmo gateway partiriam do mesmo ponto e se escreveriam um por cima do outro; `bpmnFluxo()` afasta o texto conforme o destino esteja acima, abaixo ou na mesma linha.

**Nenhuma das duas telas guarda coordenada.** No organograma, arrastar um cargo sobre outro e o botão de ligar fazem a mesma coisa: escrevem `reportaA`. A posição na tela é consequência da árvore, não um dado à parte — `religarCargo()` recusa a ligação que fecharia ciclo, e `noCargo()` carrega um `Set` de vistos para sobreviver a um ciclo que tenha entrado por importação.

O mapa segue o mesmo princípio e também não guarda coordenada. `colunas()` deriva a posição horizontal das ligações (`processo.proximos`) e o CSS grid coloca cada nó em `grid-column`. As setas são desenhadas por `desenharLigacoes()`, que roda **depois** do layout — ela mede a posição real de cada nó com `getBoundingClientRect()` e escreve os `path` no SVG que cobre o mapa. Por isso ela é chamada num `requestAnimationFrame` no fim do `render()` e de novo no `resize`.

Antes de calcular as colunas, uma busca em profundidade marca as arestas de retorno e as tira da conta. Sem isso um ciclo empurraria as colunas indefinidamente. A seta continua sendo desenhada — só não influencia a posição.

## O BPMN

`bpmn.js` não conhece o CIP. Ele recebe um modelo neutro — `{ faixas, elementos, fluxos }` — e devolve SVG. Quem traduz são `bpmnDoProcesso()` e `bpmnDoMapa()`, no `app.js`. As duas telas usam o mesmo desenhista, então a notação sai idêntica nos dois lugares.

O layout é calculado, não guardado: `bpmnLayout()` empilha os elementos que caem na mesma célula (raia × coluna), a altura da raia é a maior pilha dela, e a seta liga borda a borda com roteamento ortogonal. Fluxo que anda para trás desce e volta por baixo.

`passo.cargoId` é o que define a raia — vazio cai na raia do dono do processo. É o único campo que existe só por causa do BPMN, e é o que faz o desenho mostrar o hand-off entre cargos.

**O nome da raia é limitado pela altura, não pela largura**, porque vai girado 90°. Sem o corte, "Supervisor Operacional" invade a raia vizinha. O nome inteiro fica num `<title>`, que o navegador mostra ao passar o mouse.

No editor, o diagrama é redesenhado sozinho meio segundo depois de você parar de digitar (`redesenharBpmnEditor()`), trocando só o conteúdo da `#bpmnEditor`. Re-renderizar a tela inteira tiraria o cursor do campo.

### Desenhar (o caminho inverso)

`viewDesenho()` é o canvas como superfície de criação. **Não há estado paralelo:** toda ação escreve direto em `p.passos`. A paleta insere um passo depois do selecionado, arrastar uma forma sobre outra é um `splice` na lista, e o inspetor edita o passo selecionado.

O renderizador aceita `{ interativo, selecionado, zoom }`. Com `interativo`, cada elemento que corresponde a um passo é embrulhado num `<g data-bpmn-el="<id do passo>">` — por isso `bpmnDoProcesso()` usa o **id real do passo** como id do elemento, e o desvio do "não" usa `<id>::nao` (o `::` é cortado na hora de mapear de volta).

**Os eventos são delegados no `#telaBpmn`, nunca por forma.** O SVG é reescrito enquanto se digita; ouvintes presos a cada forma se acumulariam a cada redesenho. Um `pointerdown/move/up` na tela cobre seleção e arrasto, com `document.elementFromPoint()` decidindo o alvo, e um sinalizador impede que o clique de fim de arrasto seja lido como seleção.

Passo sem título entra no desenho com o rótulo "sem título". Filtrá-lo — como era antes — quebrava justamente quem desenha primeiro e escreve depois: a forma criada não aparecia.

## A camada de IA

A chave da Anthropic mora numa Edge Function do Supabase (`cip-ia`, projeto `zxbjluzxmucpzvgwtkns`), nunca no navegador. O `app.js` carrega apenas a chave pública do projeto.

**Repare no que ela devolve: uma string.** A função já preencheu campo — recebia um relato e voltava JSON no formato exato de um passo, de um cargo, de uma trilha, e o app despejava aquilo dentro do modelo. Para nos defender disso existiam cinco mecanismos: o campo `revisado`, a tarja vermelha, o selo de rascunho na impressão, a trava na aprovação e uma linha em "O que falta". Todos existiam por causa dessa função, e todos saíram com ela.

Agora não há formato — há texto. **Não existe caminho entre o que a IA diz e os campos.** Não é uma instrução que ela possa desobedecer: é um cano que não foi construído. Ao mexer aqui, essa é a propriedade que não pode voltar.

Três decisões no código que valem manter:

**O contexto vai em duas camadas.** `contextoParaIA(state, { processoId })` manda o mapa inteiro sempre — nomes de tudo, que é barato — e os passos só do processo aberto. Com 19 processos de 8 passos, mandar tudo dava 61 mil caracteres contra um teto de 60 mil, e o servidor fatiava o JSON no meio de uma palavra: a IA lia lixo e respondia pior sem ninguém perceber. Com o foco, 9 mil. Um CIP de 150 processos ainda cabe.

**Nenhum id vai para a IA.** Só nomes. Id não serve para conversar, e vazado ele apareceria numa resposta para uma pessoa.

**O prompt de sistema proíbe inventar número, prazo, norma e link.** Numa empresa de extintores, um "não sei" é melhor que um dado plausível e errado. Ao mexer no prompt, essa parte não sai.

**A resposta vem em fluxo.** A função devolve `text/plain` em pedaços, não JSON pronto — sem isso a tela fica em "pensando…" até a última palavra e parece travada. O preço: erro no meio não vira mais código HTTP, porque o status já foi enviado; ele chega como frase no fim do texto. Erro *antes* do fluxo continua JSON com status.

**O esforço sai da tela, não do texto da pergunta.** Com um processo aberto a pessoa costuma pedir análise e ganha `high`; no mapa geral costuma perguntar vocabulário e ganha `medium`.

No cliente, só o bloco da resposta em curso é redesenhado — redesenhar o painel a cada pedaço tiraria o foco da caixa de escrever. E `falaEmHtml()` fecha a crase que falta enquanto o texto chega, senão uma abertura de bloco sem fechamento faria o resto da resposta virar caixa de copiar.

`importar()` passa o arquivo por `normalizar()` — sem isso, um backup antigo entra sem `decisoes`/`documentos` e quebra as telas depois. Mesma classe do bug do apagar tudo: **todo caminho que instala um estado novo tem que passar pelo mesmo funil.** Hoje são três: carregar, importar e apagar.

Trocar a quem um cargo responde acontece em dois lugares — arrastar no organograma e o campo "Responde a" no editor. Ambos passam por `descendeDe()`; sem a trava no segundo, dava para fechar um ciclo e deixar a árvore sem raiz.

**`estadoVazio()` é a única fonte de "estado completo e vazio."** A semente sai dela e o botão de apagar tudo também. Antes cada um montava o seu, e o de apagar esqueceu `decisoes` e `documentos` — resultado: três telas quebravam depois de limpar a base. Ao acrescentar uma lista nova ao modelo, ela entra aqui e em `normalizar()`, nos dois.

`normalizar()` roda em todo carregamento e preenche o que versões anteriores não gravaram. Ao adicionar campo novo ao modelo, acrescente o valor padrão lá — é o que impede o app de abrir quebrado para quem já tem dados salvos.

O editor liga os eventos direto nos campos e **não re-renderiza a cada tecla**, senão o cursor pula. O `render()` só é chamado quando a estrutura muda: adicionar, remover, mover passo ou trocar o tipo.

**Existe uma régua só para "pronto", e ela é a aprovação.** `faltaParaAprovar()` lista o que impede — dono, executor, o porquê, entrada se recebe, saída se entrega, passos com título — e `mapeado()` é uma linha: `situacaoDoProcesso(p) === "vigente"`.

Houve um tempo em que eram duas definições, e elas discordavam: dava para aprovar um processo de dois passos e o contador do topo continuar dizendo que não estava pronto. Ao mudar o critério, mude `faltaParaAprovar()` — todo o resto sai dela.

`assinaturaDoProcesso()` é o que impede "aprovado" de virar carimbo eterno: a aprovação guarda um resumo do conteúdo aprovado, e editar o processo depois derruba o selo sozinho.
