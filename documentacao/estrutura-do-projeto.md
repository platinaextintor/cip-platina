# Estrutura do projeto CIP

```text
CIP Platina Extintores/
├── index.html          casca da aplicação
├── styles.css          identidade visual e responsividade
├── bpmn.js             renderizador BPMN 2.0 em SVG
├── app.js              toda a lógica
├── documentacao/
│   ├── README-CIP.md
│   └── estrutura-do-projeto.md
├── supabase/
│   └── cip-ia.ts                    fonte da Edge Function (cópia do que está implantado)
├── dados/
│   └── cip-workspace.json           o esqueleto em v3, para semear ou importar
└── backups/
    ├── snapshot-2026-07-28/          versão anterior (formato antigo)
    └── snapshot-2026-07-28-final/    versão anterior (formato antigo)
```

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
| IA | `chamarIA()`, `contextoBase()`, `comEspera()`, `preencherVazios()` e a tela "Contar um processo" |
| drawer | painel de dados do projeto e o "Contar um processo" |

## O modelo de dados

```js
{
  empresa:  { nome },
  setores:  [{ id, nome }],
  cargos:   [{ id, setorId, nome, reportaA, missao, expectativas, conhecimentos,
               trilha: [{ id, tipo, titulo, url, duracao, obrigatorio, nota, documentoId }] }],
  documentos:[{ id, titulo, categoria, escopo, resumo, url, videoUrl }],
  sistemas: [{ id, nome, descricao, url, critico }],
  regras:   [{ id, codigo, titulo, texto, vigenteDesde }],   // RN-001, vale na empresa
  indicadores:[{ id, nome, pergunta, unidade, direcao, meta, frequencia, processoIds[] }],
  decisoes: [{ id, tipo, pergunta, setorId, proximos }],     // os losangos do macro
  fins:     [{ id, nome, setorId }],                         // desfechos nomeados
  processos:[{
    id, nome, setorId, donoCargoId, cargosIds[], consultadosIds[], informadosIds[],
    status, revisado, aprovacao, historico[], videoUrl,
    proximos: [{ para, rotulo }],   // as setas do macro, com "sim"/"não"
    entrada, saida, porque, seErrar,
    anexos: [{ id, titulo, url }],
    passos: [{ id, tipo, cargoId, oQue, comoFazer, porque, armadilha,
               sistemaIds[], regraIds[], imagem, videoUrl,
               proximos: [{ para, rotulo }] }],              // o subprocesso é grafo
    perguntas: [{ id, pergunta, resposta }]
  }]
}
```

`expectativas` e `conhecimentos` são texto com um item por linha — `linhas()` quebra na hora de exibir. São itens curtos, não parágrafos.

Quatro decisões que sustentam o resto:

**`reportaA` no cargo** é o que faz o organograma ser hierarquia de verdade, e não uma lista agrupada por setor. O setor virou atributo (a cor), não nível da árvore.

**O que vale em mais de um processo mora fora dele.** Sistema, regra e indicador são objetos próprios, referenciados pelos passos. A regra do prazo de pagamento pega Comercial, Financeiro e Faturamento; guardada dentro de cada um, seriam três cópias que um dia divergem.

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

A função recebe `{ acao, entrada, contexto }` e devolve `{ dados }`. Cada ação tem seu próprio schema JSON e sua própria instrução; o modelo é `claude-opus-5` com **structured outputs**, então o retorno já chega no formato do CIP — não existe parsing de texto solto para dar errado.

| Ação | Devolve |
|---|---|
| `processo` | processo inteiro: nome, ids, porquê, passos tipados, perguntas |
| `passo` | os campos de um passo |
| `perguntas` | três perguntas de situação |
| `cargo` | missão, expectativas, conhecimentos |
| `trilha` | lista de treinamentos |
| `documento` | resumo, categoria, escopo |

Três regras que estão no código e valem manter:

**`contextoBase()` manda os ids reais** de setor e cargo junto com o pedido, e o cliente valida o que volta — id que não existe cai no primeiro da lista. Sem isso a IA inventa referência.

**`preencherVazios()` nunca sobrescreve.** A IA só entra onde o campo está vazio. O texto do gestor é a fonte; o da IA é o preenchimento.

**O prompt de sistema proíbe inventar número, prazo, norma e link.** Numa empresa de extintores, um campo vazio é melhor que um dado plausível e errado. Ao mexer no prompt, essa parte não sai.

`processo.revisado` é a trava: rascunho de IA entra como `false`, `mapeado()` recusa, e o editor mostra o aviso até o gestor clicar em "Revisei".

`importar()` passa o arquivo por `normalizar()` — sem isso, um backup antigo entra sem `decisoes`/`documentos` e quebra as telas depois. Mesma classe do bug do apagar tudo: **todo caminho que instala um estado novo tem que passar pelo mesmo funil.** Hoje são três: carregar, importar e apagar.

Trocar a quem um cargo responde acontece em dois lugares — arrastar no organograma e o campo "Responde a" no editor. Ambos passam por `descendeDe()`; sem a trava no segundo, dava para fechar um ciclo e deixar a árvore sem raiz.

**`estadoVazio()` é a única fonte de "estado completo e vazio."** A semente sai dela e o botão de apagar tudo também. Antes cada um montava o seu, e o de apagar esqueceu `decisoes` e `documentos` — resultado: três telas quebravam depois de limpar a base. Ao acrescentar uma lista nova ao modelo, ela entra aqui e em `normalizar()`, nos dois.

`normalizar()` roda em todo carregamento e preenche o que versões anteriores não gravaram. Ao adicionar campo novo ao modelo, acrescente o valor padrão lá — é o que impede o app de abrir quebrado para quem já tem dados salvos.

O editor liga os eventos direto nos campos e **não re-renderiza a cada tecla**, senão o cursor pula. O `render()` só é chamado quando a estrutura muda: adicionar, remover, mover passo ou trocar o tipo.

`mapeado()` é a régua do que conta como pronto: tem o "por que existe" e pelo menos 3 passos com título. Mudar essa função muda o contador do topo e as etiquetas em todas as telas de uma vez.
