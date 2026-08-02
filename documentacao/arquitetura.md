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

É o que impede o CIP de virar cópias desencontradas — o erro clássico de ferramenta caseira de processo. É também o princípio central do ARIS: cada objeto existe uma vez e é reutilizado.

## O modelo

```js
{
  empresa:    { nome },
  setores:    [{ id, nome, camada }],                           // estrategico | principal | apoio
  cargos:     [{ id, setorId, nome, reportaA, missao, expectativas, conhecimentos,
                 trilha: [{ id, tipo, titulo, url, duracao, obrigatorio, nota, documentoId }] }],
  fases:      [{ id, nome }],                                  // a cadeia de valor
  decisoes:   [{ id, tipo, pergunta, setorId, faseId, proximos }], // exclusivo | inclusivo
  fins:       [{ id, nome, setorId, faseId }],                  // desfechos nomeados
  documentos: [{ id, titulo, categoria, escopo, resumo, url, videoUrl }],
  sistemas:   [{ id, nome, descricao, url, critico }],          // onde o trabalho acontece
  processos:  [{
    id, nome, faseId, setorId, donoCargoId, cargosIds[], status, revisado, videoUrl,
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

Dois níveis, e só dois: **processo** e **subprocesso**. O subprocesso aparece na aula como *passo* — mesma coisa, nome diferente conforme a tela.

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
15. **Elo fraco é ausência, não semântica.** `elosFracos()` aponta quem entrega sem declarar o que entrega. Se a saída de um é *mesmo* a entrada do outro, só leitura humana diz.

## Os testes

`testes.html` — abra no navegador, veja verde. Sem instalar nada, sem build.

Dois casos exigem layout de verdade (`getComputedStyle`) e só valem no navegador. O resto roda em qualquer lugar que execute `dominio.js` e `bpmn.js`.

Cobre as três camadas, porque os três bugs que mais custaram nesta semana foram um de cada:

| Bug | Camada | Custo |
|---|---|---|
| apagar tudo deixava o estado incompleto | domínio | 3 telas quebradas |
| DELETE do Realtime lido do campo errado | nuvem | remoção não propagava |
| `hidden` perdendo para `.classe { display }` | tela | 6 rodadas de diagnóstico |

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

## O que ainda não está separado

Honestidade sobre o estado atual:

- `app.js` tem 3.000 linhas. Melhor que 3.355 num arquivo só, mas ainda é grande. As telas poderiam virar arquivos por assunto.
- O domínio lê um `state` compartilhado em vez de receber por parâmetro. Testável (a bancada troca o `state` antes de cada caso), mas não é isolamento de verdade.
- A camada de nuvem não tem teste automatizado — foi verificada à mão, com duas abas e gravação direta no banco.
