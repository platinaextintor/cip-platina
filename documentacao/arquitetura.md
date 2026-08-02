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

É o que impede o CIP de virar cópias desencontradas — o erro clássico de ferramenta caseira de processo. É também o princípio central do ARIS: cada objeto existe uma vez e é reutilizado.

## O modelo

```js
{
  empresa:    { nome },
  setores:    [{ id, nome, camada }],                           // estrategico | principal | apoio
  cargos:     [{ id, setorId, nome, reportaA, missao, expectativas, conhecimentos,
                 trilha: [{ id, tipo, titulo, url, duracao, obrigatorio, nota, documentoId }] }],
  fases:      [{ id, nome }],                                  // a cadeia de valor
  decisoes:   [{ id, pergunta, setorId, faseId, proximos }],    // os losangos do macro
  documentos: [{ id, titulo, categoria, escopo, resumo, url, videoUrl }],
  sistemas:   [{ id, nome, descricao, url, critico }],          // onde o trabalho acontece
  processos:  [{
    id, nome, faseId, setorId, donoCargoId, cargosIds[], status, revisado, videoUrl,
    proximos: [{ para, rotulo }],
    entrada, saida,                                            // o que chega e o que sai
    porque, seErrar,
    anexos:    [{ id, titulo, url }],
    passos:    [{ id, tipo, cargoId, oQue, comoFazer, porque, armadilha, regra,
                  imagem, videoUrl, seSim, seNao, sistemaIds[] }],
    perguntas: [{ id, pergunta, resposta }],
  }],
}
```

Dois níveis, e só dois: **processo** e **subprocesso**. O subprocesso aparece na aula como *passo* — mesma coisa, nome diferente conforme a tela.

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
10. **Elo fraco é ausência, não semântica.** `elosFracos()` aponta quem entrega sem declarar o que entrega. Se a saída de um é *mesmo* a entrada do outro, só leitura humana diz.

## Os testes

`testes.html` — abra no navegador, veja verde. Sem instalar nada, sem build.

Cobre as três camadas, porque os três bugs que mais custaram nesta semana foram um de cada:

| Bug | Camada | Custo |
|---|---|---|
| apagar tudo deixava o estado incompleto | domínio | 3 telas quebradas |
| DELETE do Realtime lido do campo errado | nuvem | remoção não propagava |
| `hidden` perdendo para `.classe { display }` | tela | 6 rodadas de diagnóstico |

Testar só função pura teria pego um de três.

**A página nunca é servida do cache** — a versão sai do relógio. Testar código velho por engano já custou uma rodada aqui.

## O que ainda não está separado

Honestidade sobre o estado atual:

- `app.js` tem 3.000 linhas. Melhor que 3.355 num arquivo só, mas ainda é grande. As telas poderiam virar arquivos por assunto.
- O domínio lê um `state` compartilhado em vez de receber por parâmetro. Testável (a bancada troca o `state` antes de cada caso), mas não é isolamento de verdade.
- A camada de nuvem não tem teste automatizado — foi verificada à mão, com duas abas e gravação direta no banco.
