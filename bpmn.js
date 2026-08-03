/* Renderizador BPMN 2.0 em SVG.

   Recebe um modelo neutro e devolve o desenho. Quem monta o modelo é o app.js:
   um processo vira tarefas e gateways; o mapa vira subprocessos. As duas telas
   usam o mesmo desenhista, então a notação é a mesma nos dois lugares.

   Modelo:
   {
     faixas:    [{ id, nome, cor }]                          — as lanes
     elementos: [{ id, tipo, rotulo, sub, faixaId, coluna, dado }]
     fluxos:    [{ de, para, rotulo }]                       — sequence flows
   }
   tipo: inicio | fim | tarefa | subprocesso | gateway
*/

const BPMN = {
  faixaLabel: 32,
  coluna: 208,
  tarefaL: 154,
  tarefaA: 70,
  gateway: 48,
  evento: 20,
  slot: 112,
  margem: 24,
};

/* ---------------------------------------------------------------- texto */

function bpmnQuebrar(texto, maxChars, maxLinhas) {
  const palavras = String(texto || "").split(/\s+/).filter(Boolean);
  const linhas = [];
  let atual = "";

  palavras.forEach((palavra) => {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (tentativa.length <= maxChars) {
      atual = tentativa;
    } else {
      if (atual) linhas.push(atual);
      atual = palavra;
    }
  });
  if (atual) linhas.push(atual);

  if (linhas.length > maxLinhas) {
    const cortado = linhas.slice(0, maxLinhas);
    cortado[maxLinhas - 1] = `${cortado[maxLinhas - 1].slice(0, maxChars - 1)}…`;
    return cortado;
  }
  return linhas;
}

function bpmnEsc(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/* ---------------------------------------------------------------- layout */

function bpmnLayout(modelo) {
  const faixas = modelo.faixas.length ? modelo.faixas : [{ id: "", nome: "", cor: "" }];
  const elementos = modelo.elementos.map((e) => ({ ...e }));

  /* Quantos elementos disputam a mesma célula (faixa × coluna). */
  const pilha = new Map();
  elementos.forEach((e) => {
    const chave = `${e.faixaId}|${e.coluna}`;
    const usados = pilha.get(chave) || 0;
    e.slot = usados;
    pilha.set(chave, usados + 1);
  });

  const alturaDaFaixa = {};
  faixas.forEach((f) => {
    let maior = 1;
    elementos.filter((e) => e.faixaId === f.id).forEach((e) => { maior = Math.max(maior, e.slot + 1); });
    alturaDaFaixa[f.id] = maior * BPMN.slot;
  });

  let y = BPMN.margem;
  const topoDaFaixa = {};
  faixas.forEach((f) => {
    topoDaFaixa[f.id] = y;
    y += alturaDaFaixa[f.id];
  });

  const maxColuna = elementos.reduce((m, e) => Math.max(m, e.coluna), 0);
  const esquerda = BPMN.margem + BPMN.faixaLabel;

  elementos.forEach((e) => {
    e.x = esquerda + e.coluna * BPMN.coluna + BPMN.coluna / 2;
    e.y = (topoDaFaixa[e.faixaId] ?? BPMN.margem) + e.slot * BPMN.slot + BPMN.slot / 2;
  });

  return {
    faixas,
    elementos,
    fluxos: modelo.fluxos || [],
    topoDaFaixa,
    alturaDaFaixa,
    largura: esquerda + (maxColuna + 1) * BPMN.coluna + BPMN.margem,
    altura: y + BPMN.margem,
    esquerda,
  };
}

/* Meia-largura e meia-altura de cada forma, para a seta encostar na borda. */
function bpmnMeia(elemento) {
  if (elemento.tipo === "gateway") return { x: BPMN.gateway / 2, y: BPMN.gateway / 2 };
  if (elemento.tipo === "inicio" || elemento.tipo === "fim") return { x: BPMN.evento, y: BPMN.evento };
  return { x: BPMN.tarefaL / 2, y: BPMN.tarefaA / 2 };
}

/* ---------------------------------------------------------------- formas */

function bpmnTarefa(e) {
  const l = BPMN.tarefaL;
  const a = BPMN.tarefaA;
  const x = e.x - l / 2;
  const y = e.y - a / 2;
  const linhas = bpmnQuebrar(e.rotulo, 20, 3);
  const base = e.y - ((linhas.length - 1) * 7) - (e.sub ? 6 : 0);

  return `
    <g class="bpmn-el">
      <rect x="${x}" y="${y}" width="${l}" height="${a}" rx="9" class="bpmn-forma" />
      <g class="bpmn-marcador" transform="translate(${x + 8}, ${y + 8})">
        <circle cx="5" cy="4" r="2.6" />
        <path d="M0 12c0-3 2.2-5 5-5s5 2 5 5" />
      </g>
      ${e.tipo === "subprocesso" ? `
        <g class="bpmn-marcador bpmn-abrir" data-bpmn-abrir="${bpmnEsc(e.id)}" transform="translate(${x + l - 22}, ${y + a - 20})">
          <rect x="-7" y="-7" width="26" height="26" class="bpmn-abrir-area" />
          <rect x="0" y="0" width="12" height="12" rx="1.5" />
          <path d="M6 3v6M3 6h6" />
          <title>Abrir por dentro</title>
        </g>` : ""}
      ${linhas.map((linha, i) => `<text x="${e.x}" y="${base + i * 14}" class="bpmn-txt">${bpmnEsc(linha)}</text>`).join("")}
      ${e.sub ? `<text x="${e.x}" y="${y + a - 12}" class="bpmn-sub">${bpmnEsc(e.sub)}</text>` : ""}
    </g>
  `;
}

function bpmnGateway(e) {
  const m = BPMN.gateway / 2;
  const pontos = `${e.x},${e.y - m} ${e.x + m},${e.y} ${e.x},${e.y + m} ${e.x - m},${e.y}`;
  const d = m * 0.38;
  const linhas = bpmnQuebrar(e.rotulo, 26, 2);

  /* X = os caminhos se excluem. O = podem valer juntos. É a distinção que a
     notação faz, e trocar uma pela outra descreve a operação errado. */
  const marca = e.simbolo === "O"
    ? `<circle cx="${e.x}" cy="${e.y}" r="${d}" class="bpmn-simbolo" fill="none" />`
    : `<path d="M${e.x - d} ${e.y - d}L${e.x + d} ${e.y + d}M${e.x + d} ${e.y - d}L${e.x - d} ${e.y + d}" class="bpmn-simbolo" />`;

  return `
    <g class="bpmn-el">
      <polygon points="${pontos}" class="bpmn-forma" />
      ${marca}
      ${linhas.map((linha, i) => `<text x="${e.x}" y="${e.y + m + 16 + i * 13}" class="bpmn-rotulo-forma">${bpmnEsc(linha)}</text>`).join("")}
    </g>
  `;
}

function bpmnEvento(e) {
  const linhas = bpmnQuebrar(e.rotulo, 24, 2);
  return `
    <g class="bpmn-el">
      <circle cx="${e.x}" cy="${e.y}" r="${BPMN.evento}" class="bpmn-forma ${e.tipo === "fim" ? "bpmn-fim" : "bpmn-inicio"}" />
      ${linhas.map((linha, i) => `<text x="${e.x}" y="${e.y + BPMN.evento + 16 + i * 13}" class="bpmn-rotulo-forma">${bpmnEsc(linha)}</text>`).join("")}
    </g>
  `;
}

/* Data object: o artefato que a tarefa produz (a foto, o comprovante). */
function bpmnDado(e) {
  const x = e.x + BPMN.tarefaL / 2 - 14;
  const y = e.y - BPMN.tarefaA / 2 - 40;
  return `
    <g class="bpmn-el">
      <path d="M${x} ${y}h20l8 8v24h-28z" class="bpmn-forma" />
      <path d="M${x + 20} ${y}v8h8" class="bpmn-simbolo" />
      <path d="M${e.x + BPMN.tarefaL / 2 - 4} ${y + 32}L${e.x + BPMN.tarefaL / 2 - 4} ${e.y - BPMN.tarefaA / 2}" class="bpmn-associacao" />
      <text x="${x + 14}" y="${y + 48}" class="bpmn-rotulo-forma">${bpmnEsc(e.dado)}</text>
    </g>
  `;
}

/* ---------------------------------------------------------------- fluxos */

function bpmnCaminho(de, para) {
  const md = bpmnMeia(de);
  const mp = bpmnMeia(para);
  const x1 = de.x + md.x;
  const y1 = de.y;
  const x2 = para.x - mp.x;
  const y2 = para.y;

  if (Math.abs(y1 - y2) < 2) return `M${x1} ${y1}H${x2}`;

  if (x2 > x1 + 24) {
    const meio = x1 + (x2 - x1) / 2;
    return `M${x1} ${y1}H${meio}V${y2}H${x2}`;
  }

  /* Retorno: desce por baixo e volta pela esquerda. */
  const desvio = Math.max(de.y, para.y) + BPMN.slot / 2 - 18;
  return `M${de.x} ${de.y + md.y}V${desvio}H${para.x}V${para.y + mp.y}`;
}

function bpmnFluxo(fluxo, porId, ordem = 0) {
  const de = porId[fluxo.de];
  const para = porId[fluxo.para];
  if (!de || !para) return "";

  const d = bpmnCaminho(de, para);

  /* Duas saídas do mesmo gateway partem do mesmo ponto — o rótulo é afastado
     conforme o destino esteja acima, abaixo ou na mesma linha, senão "sim" e
     "não" se escrevem um por cima do outro. */
  let rotulo = "";
  if (fluxo.rotulo) {
    /* O rótulo não persegue a sua linha: ele se empilha ao lado do nó de onde
       sai, na ordem da saída. Tentei derivar a posição da direção do destino e
       colidiu três vezes seguidas — mesma raia contra mesma raia, dois descendo,
       e um descendo contra um subindo. Empilhar é distinto por construção, e é
       também como o BPMN costuma ser lido: o rótulo pertence ao gateway, não
       ao caminho. */
    const x = de.x + bpmnMeia(de).x + 10;
    const y = de.y - 12 + ordem * 20;
    rotulo = `<text x="${x}" y="${y}" class="bpmn-rotulo-fluxo" text-anchor="start">${bpmnEsc(fluxo.rotulo)}</text>`;
  }

  return `<path d="${d}" class="bpmn-fluxo" marker-end="url(#bpmn-seta)" />${rotulo}`;
}

/* ---------------------------------------------------------------- desenho */

function bpmnDesenhar(modelo, opcoes = {}) {
  /* Diagrama sem peça nenhuma ainda desenha as raias vazias — é o quadro
     em branco onde o gestor vai encaixar a primeira. */
  if (!modelo.elementos.length && !modelo.faixas.length) {
    return '<div class="empty">Sem elementos para desenhar.</div>';
  }

  const zoom = opcoes.zoom || 1;
  const l = bpmnLayout(modelo);
  const porId = {};
  l.elementos.forEach((e) => { porId[e.id] = e; });

  const faixas = l.faixas.map((f) => {
    const topo = l.topoDaFaixa[f.id] ?? BPMN.margem;
    const altura = l.alturaDaFaixa[f.id] ?? BPMN.slot;
    const meio = topo + altura / 2;
    /* O nome vai girado, então quem limita é a ALTURA da raia, não a largura. */
    const cabe = Math.max(6, Math.floor((altura - 16) / 7.3));
    const nome = f.nome.length > cabe ? `${f.nome.slice(0, cabe - 1)}…` : f.nome;
    return `
      <g class="bpmn-faixa"${opcoes.interativo ? ` data-bpmn-faixa="${bpmnEsc(f.id)}"` : ""}>
        <rect x="${BPMN.margem}" y="${topo}" width="${l.largura - BPMN.margem * 2}" height="${altura}" class="bpmn-faixa-area" />
      </g>
    `;
  }).join("");

  /* O nome da raia sai do grupo dela e vira uma camada própria, desenhada por
     último — para poder ser presa na borda enquanto o desenho rola por baixo.
     Num macro de 6.000px de largura, rolar até o fim e não saber mais em que
     setor cada linha está é o que torna o mapa inútil. */
  const nomesDeFaixa = l.faixas.map((f) => {
    const topo = l.topoDaFaixa[f.id] ?? BPMN.margem;
    const altura = l.alturaDaFaixa[f.id] ?? BPMN.slot;
    const meio = topo + altura / 2;
    const cabe = Math.max(6, Math.floor((altura - 16) / 7.3));
    const nome = f.nome.length > cabe ? `${f.nome.slice(0, cabe - 1)}…` : f.nome;
    const x = l.largura - BPMN.margem - BPMN.faixaLabel;
    return `
      <g class="bpmn-faixa-etiqueta">
        <rect x="${x}" y="${topo}" width="${BPMN.faixaLabel}" height="${altura}" class="bpmn-faixa-fundo" />
        <rect x="${x}" y="${topo}" width="${BPMN.faixaLabel}" height="${altura}" class="bpmn-faixa-banda" style="${f.cor ? `fill:${f.cor}1f` : ""}" />
        <text transform="translate(${x + BPMN.faixaLabel / 2}, ${meio}) rotate(-90)" class="bpmn-faixa-nome">${bpmnEsc(nome)}<title>${bpmnEsc(f.nome)}</title></text>
      </g>
    `;
  }).join("");

  const formas = l.elementos.map((e) => {
    const corpo = e.tipo === "gateway" ? bpmnGateway(e)
      : e.tipo === "inicio" || e.tipo === "fim" ? bpmnEvento(e)
      : bpmnTarefa(e) + (e.dado ? bpmnDado(e) : "");

    if (!opcoes.interativo || !e.editavel) return corpo;

    const marcas = ["bpmn-alvo", opcoes.selecionado === e.id ? "selecionado" : ""].filter(Boolean).join(" ");

    /* A alça na borda direita: arrastar dela até outra forma cria a ligação.
       É o gesto que toda ferramenta de modelagem usa — sem ele, ligar vira um
       modo escondido atrás de um botão, e o desenho fica travado. */
    const meia = bpmnMeia(e);
    const alca = opcoes.ligavel && e.tipo !== "fim"
      ? `<g class="bpmn-alca" data-bpmn-alca="${bpmnEsc(e.id)}">
           <circle cx="${e.x + meia.x}" cy="${e.y}" r="11" class="bpmn-alca-area" />
           <circle cx="${e.x + meia.x}" cy="${e.y}" r="5.5" class="bpmn-alca-ponto" />
           <path d="M${e.x + meia.x - 2.5} ${e.y}h5M${e.x + meia.x} ${e.y - 2.5}v5" class="bpmn-alca-mais" />
         </g>`
      : "";

    return `<g class="${marcas}" data-bpmn-el="${bpmnEsc(e.id)}" tabindex="0" role="button" aria-label="${bpmnEsc(e.rotulo || "elemento")}">${corpo}${alca}</g>`;
  }).join("");

  const saidasPorNo = {};
  const fluxos = l.fluxos.map((f) => {
    const ordem = saidasPorNo[f.de] = (saidasPorNo[f.de] ?? -1) + 1;
    return bpmnFluxo(f, porId, ordem);
  }).join("");

  return `
    <div class="bpmn-wrap${opcoes.interativo ? " bpmn-editando" : ""}">
      <svg class="bpmn" viewBox="0 0 ${Math.round(l.largura)} ${Math.round(l.altura)}"
           width="${Math.round(l.largura * zoom)}" height="${Math.round(l.altura * zoom)}"
           role="img" aria-label="Fluxograma BPMN do processo">
        <defs>
          <marker id="bpmn-seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" class="bpmn-ponta" />
          </marker>
        </defs>
        ${faixas}
        ${fluxos}
        ${formas}
        <path id="fioTemporario" class="bpmn-fio-temp" d="" />
        <g class="bpmn-faixa-nomes" data-largura="${Math.round(l.largura)}">${nomesDeFaixa}</g>
      </svg>
    </div>
  `;
}
