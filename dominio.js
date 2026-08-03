/* O domínio do CIP — o que o sistema É, independente de como aparece.

   Aqui não há tela, nem rede, nem navegador: só o modelo da empresa e as regras
   que valem sobre ele. É a camada que responde "o que conta como processo
   pronto?", "quem executa o quê?" e "de onde vem a posição de cada peça?".

   As outras camadas dependem desta, nunca o contrário:
     app.js    — como aparece na tela
     nuvem.js  — onde é guardado e como chega ao vivo
     bpmn.js   — como o diagrama é desenhado

   A tradução entre o modelo e as linhas do banco mora na nuvem, de propósito:
   o domínio não sabe que existe banco.

   Por não depender de tela, é a camada que se testa sem abrir navegador. */

/* O estado é o modelo, não a interface — por isso vive aqui. */
let state = estadoVazio();

/* As três camadas do dossiê. A camada mora no SETOR, não no processo: o
   processo herda a do setor dele. Guardar nos dois seria a mesma informação
   em dois lugares, esperando divergir. */
/* Os dois gateways que a operação da Platina precisa.

   Exclusivo: os caminhos se excluem — aprovado OU reprovado.
   Inclusivo: podem valer ao mesmo tempo — o pedido pode ser venda E contrato.

   Modelar um como o outro diz algo falso sobre a operação, por isso os dois
   existem desde o começo. */
const TIPOS_DECISAO = {
  exclusivo: { rotulo: "Ou um, ou outro", simbolo: "X", ajuda: "Só um caminho segue. Aprovado ou reprovado." },
  inclusivo: { rotulo: "Pode ser os dois", simbolo: "O", ajuda: "Mais de um caminho pode seguir junto. Venda e contrato ao mesmo tempo." },
};

const CAMADAS = {
  estrategico: { rotulo: "Estratégico", ordem: 0, ajuda: "Direção, planejamento, indicadores e prioridades." },
  principal: { rotulo: "Principal", ordem: 1, ajuda: "O que entrega valor ao cliente, ponta a ponta." },
  apoio: { rotulo: "Apoio", ordem: 2, ajuda: "Sustenta os principais: pessoas, informação, conformidade." },
};

function camadaDoSetor(id) {
  return CAMADAS[setor(id)?.camada] ? setor(id).camada : "principal";
}

function camadaDoProcesso(p) {
  return camadaDoSetor(p?.setorId);
}

/* Setores na ordem das camadas — é assim que uma arquitetura de processos se
   lê: estratégicos em cima, principais no meio, apoio embaixo. */
function setoresPorCamada() {
  return [...state.setores].sort(
    (a, b) => (CAMADAS[a.camada]?.ordem ?? 1) - (CAMADAS[b.camada]?.ordem ?? 1),
  );
}

const CORES_SETOR = ["#2b46a4", "#0c7048", "#bf1f2c", "#9c5806", "#5b4bb7", "#0d7490"];

const TIPOS_TRILHA = {
  video: { rotulo: "Vídeo", classe: "navy" },
  curso: { rotulo: "Curso externo", classe: "" },
  leitura: { rotulo: "Leitura", classe: "" },
  pratica: { rotulo: "Prática acompanhada", classe: "amber" },
  documento: { rotulo: "Documento interno", classe: "green" },
};

const TIPOS = {
  etapa: { rotulo: "Etapa", cor: "var(--ink-3)", classe: "" },
  decisao: { rotulo: "Decisão", cor: "var(--amber)", classe: "amber" },
  evidencia: { rotulo: "Evidência", cor: "var(--navy-2)", classe: "navy" },
  aprovacao: { rotulo: "Aprovação", cor: "var(--green)", classe: "green" },
};

function estadoVazio() {
  return {
    empresa: { nome: "Platina Extintores" },
    setores: [],
    cargos: [],
    fases: [],
    decisoes: [],
    fins: [],
    documentos: [],
    sistemas: [],
    processos: [],
  };
}

function semente() {
  return {
    ...estadoVazio(),
    setores: [
      { id: "s-gestao", nome: "Gestão", camada: "estrategico" },
      { id: "s-comercial", nome: "Comercial", camada: "principal" },
      { id: "s-tecnica", nome: "Técnica", camada: "principal" },
      { id: "s-admin", nome: "Administrativo", camada: "apoio" },
    ],
    cargos: [
      { id: "c-diretor", setorId: "s-gestao", nome: "Diretor", reportaA: null, missao: "", expectativas: "", conhecimentos: "", trilha: [] },
      { id: "c-supervisor", setorId: "s-gestao", nome: "Supervisor Operacional", reportaA: "c-diretor", missao: "", expectativas: "", conhecimentos: "", trilha: [] },
      { id: "c-vendedor", setorId: "s-comercial", nome: "Vendedor", reportaA: "c-supervisor", missao: "", expectativas: "", conhecimentos: "", trilha: [] },
      { id: "c-tecnico", setorId: "s-tecnica", nome: "Técnico de Extintores", reportaA: "c-supervisor", missao: "", expectativas: "", conhecimentos: "", trilha: [] },
      { id: "c-admin", setorId: "s-admin", nome: "Auxiliar Administrativo", reportaA: "c-diretor", missao: "", expectativas: "", conhecimentos: "", trilha: [] },
    ],
    fases: [
      { id: "f-captar", nome: "Captar" },
      { id: "f-orcar", nome: "Orçar" },
      { id: "f-executar", nome: "Executar" },
      { id: "f-entregar", nome: "Entregar" },
      { id: "f-cuidar", nome: "Cuidar" },
      { id: "f-apoio", nome: "Apoio" },
    ],
  };
}

function valido(dados) {
  const listas = ["setores", "cargos", "fases", "processos"];
  return !!dados && listas.every((chave) => Array.isArray(dados[chave]));
}

function normalizarSaidas(bruto) {
  return (Array.isArray(bruto) ? bruto : [])
    .map((x) => (typeof x === "string" ? { para: x, rotulo: "" } : { para: x?.para || "", rotulo: x?.rotulo || "" }))
    .filter((x) => x.para);
}

function normalizar(dados) {
  dados.empresa = dados.empresa || { nome: "Empresa" };
  dados.documentos = Array.isArray(dados.documentos) ? dados.documentos : [];
  dados.decisoes = Array.isArray(dados.decisoes) ? dados.decisoes : [];

  dados.sistemas = Array.isArray(dados.sistemas) ? dados.sistemas : [];
  dados.sistemas.forEach((s) => {
    s.nome = s.nome || "";
    s.descricao = s.descricao || "";
    s.url = s.url || "";
    s.critico = !!s.critico;
  });

  dados.setores.forEach((s) => {
    if (!CAMADAS[s.camada]) s.camada = "principal";
  });

  /* Fim nomeado: "Proposta não aprovada" e "Não aprovado pelo Financeiro" são
     desfechos diferentes, e a diferença é informação. Fim anônimo não ensina. */
  dados.fins = Array.isArray(dados.fins) ? dados.fins : [];
  dados.fins.forEach((f) => {
    f.nome = f.nome || "";
    f.setorId = f.setorId || "";
    f.faseId = f.faseId || "";
    f.proximos = [];
  });

  dados.decisoes.forEach((d) => {
    d.tipo = TIPOS_DECISAO[d.tipo] ? d.tipo : "exclusivo";
    d.pergunta = d.pergunta || "";
    d.setorId = d.setorId || "";
    d.faseId = d.faseId || "";
    d.proximos = normalizarSaidas(d.proximos);
  });

  dados.cargos.forEach((c) => {
    c.missao = c.missao || "";
    c.expectativas = c.expectativas || "";
    c.conhecimentos = c.conhecimentos || "";
    c.trilha = Array.isArray(c.trilha) ? c.trilha : [];
  });

  dados.processos.forEach((p) => {
    p.cargosIds = Array.isArray(p.cargosIds) ? p.cargosIds : [];
    p.passos = Array.isArray(p.passos) ? p.passos : [];
    p.perguntas = Array.isArray(p.perguntas) ? p.perguntas : [];
    p.anexos = Array.isArray(p.anexos) ? p.anexos : [];
    p.videoUrl = p.videoUrl || "";
    p.passos.forEach((s) => { s.videoUrl = s.videoUrl || ""; });
    p.proximos = normalizarSaidas(p.proximos);
    p.entrada = p.entrada || "";
    p.saida = p.saida || "";
    p.revisado = p.revisado !== false;
    /* O subprocesso era uma fila: a ordem do array virava a sequência. Agora é
       desenho — cada passo aponta para os próximos. Base antiga é convertida
       encadeando na ordem em que estava, para nada se perder. */
    const semLigacao = p.passos.every((s) => !Array.isArray(s.proximos) || !s.proximos.length);
    if (semLigacao && p.passos.length) {
      p.passos.forEach((s, i) => {
        const proximo = p.passos[i + 1];
        s.proximos = proximo ? [{ para: proximo.id, rotulo: s.tipo === "decisao" ? "Sim" : "" }] : [];
      });

      /* "Se sim" e "se não" eram texto solto descrevendo o que acontece em cada
         caminho. Texto que descreve trabalho é passo — então vira passo de
         verdade, pendurado no ramo certo e reentrando no fluxo. Senão a
         bifurcação continuaria existindo só na descrição, e o desenho mentiria.
         O rótulo da seta fica curto: quem lê o fluxo lê "Sim"/"Não", não a frase. */
      p.passos.filter((s) => s.tipo === "decisao").forEach((s) => {
        const depois = s.proximos[0]?.para || "";
        const ramo = (texto, rotulo) => {
          const novo = {
            id: uid("ps"), tipo: "etapa", cargoId: s.cargoId, sistemaIds: [],
            oQue: texto, comoFazer: "", porque: "", armadilha: "", regra: "",
            imagem: "", videoUrl: "", seSim: "", seNao: "",
            proximos: depois ? [{ para: depois, rotulo: "" }] : [],
          };
          p.passos.splice(p.passos.indexOf(s) + 1, 0, novo);
          return { para: novo.id, rotulo };
        };

        /* Se o "se sim" virou passo, ele passa a ser o ramo do sim — a seta direta
           para o que vinha depois some, senão o gateway sairia duas vezes pelo
           mesmo lado. O passo novo é quem reentra no fluxo. */
        const sim = s.seSim?.trim() ? ramo(s.seSim.trim(), "Sim")
          : depois ? { para: depois, rotulo: "Sim" } : null;
        const nao = s.seNao?.trim() ? ramo(s.seNao.trim(), "Não") : null;
        s.proximos = [sim, nao].filter(Boolean);
      });
    }

    const idsDePasso = new Set(p.passos.map((s) => s.id));
    p.passos.forEach((s) => {
      s.cargoId = s.cargoId || "";
      s.proximos = normalizarSaidas(s.proximos).filter((x) => idsDePasso.has(x.para) && x.para !== s.id);
      /* Sistema que sobrou de um apagado vira lixo silencioso. */
      s.sistemaIds = (Array.isArray(s.sistemaIds) ? s.sistemaIds : [])
        .filter((id) => dados.sistemas.some((x) => x.id === id));
    });
  });

  /* Ligação apontando para peça apagada vira lixo silencioso. */
  const vivos = new Set([...dados.processos, ...dados.decisoes, ...dados.fins].map((n) => n.id));
  [...dados.processos, ...dados.decisoes].forEach((n) => {
    n.proximos = n.proximos.filter((x) => vivos.has(x.para) && x.para !== n.id);
  });

  return dados;
}

function uid(prefixo) {
  return `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function esc(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function linkSeguro(url) {
  const u = String(url || "").trim();
  return /^https?:\/\//i.test(u) ? u : "";
}

function youtubeId(url) {
  const m = String(url || "").match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : "";
}

function corSetor(id) {
  const i = state.setores.findIndex((s) => s.id === id);
  return CORES_SETOR[i < 0 ? 0 : i % CORES_SETOR.length];
}

function processosDoCargo(cargoId) {
  return state.processos.filter((p) => p.cargosIds.includes(cargoId) || p.donoCargoId === cargoId);
}

function mapeado(p) {
  const passosOk = (p.passos || []).filter((s) => s.oQue && s.oQue.trim()).length;
  return !!(p.porque && p.porque.trim()) && passosOk >= 3 && p.revisado !== false;
}

function faltando(p) {
  const faltas = [];
  if (!p.porque?.trim()) faltas.push("por que existe");
  if (!(p.passos || []).length) faltas.push("os passos");
  const semExemplo = (p.passos || []).filter((s) => !s.imagem && !s.comoFazer?.trim()).length;
  if (semExemplo) faltas.push(`${semExemplo} passo(s) sem exemplo`);
  return faltas;
}

function descendeDe(idFilho, idAncestral) {
  const vistos = new Set();
  let atual = cargo(idFilho);
  while (atual?.reportaA && !vistos.has(atual.id)) {
    vistos.add(atual.id);
    if (atual.reportaA === idAncestral) return true;
    atual = cargo(atual.reportaA);
  }
  return false;
}

/* A coluna de cada peça nasce das ligações: quem vem depois anda uma casa para
   a direita.

   Retorno ("não aprovou, volta pro orçamento") é legítimo, mas empurraria as
   colunas para sempre. Uma busca em profundidade marca as arestas de retorno e
   as tira da conta — a seta continua desenhada, só não influencia a posição.

   Serve ao macro e ao subprocesso: os dois são peças ligadas por setas. */
function colunasDe(nos) {
  const vivos = new Set(nos.map((n) => n.id));
  const saidas = {};
  const col = {};
  nos.forEach((n) => {
    col[n.id] = 0;
    saidas[n.id] = (n.proximos || []).map((x) => x.para).filter((d) => d !== n.id && vivos.has(d));
  });

  const estado = {}; // 1 = na pilha, 2 = fechado
  const retorno = new Set();
  const visitar = (id) => {
    estado[id] = 1;
    saidas[id].forEach((destino) => {
      if (estado[destino] === 1) retorno.add(`${id}>${destino}`);
      else if (!estado[destino]) visitar(destino);
    });
    estado[id] = 2;
  };
  nos.forEach((n) => { if (!estado[n.id]) visitar(n.id); });

  for (let volta = 0; volta < nos.length; volta++) {
    let mudou = false;
    nos.forEach((n) => {
      saidas[n.id].forEach((destino) => {
        if (retorno.has(`${n.id}>${destino}`)) return;
        if (col[destino] < col[n.id] + 1) { col[destino] = col[n.id] + 1; mudou = true; }
      });
    });
    if (!mudou) break;
  }
  return col;
}

const colunas = () => colunasDe(nosMacro());


function bpmnDoProcesso(p) {
  const passos = p?.passos || [];
  if (!passos.length) return null;

  const faixaDe = (s) => (s.cargoId && cargo(s.cargoId) ? s.cargoId : p.donoCargoId || "");

  /* A raia é o cargo, e o cargo pode ser de outro setor — é assim que um
     subprocesso que depende de outra área aparece atravessando o desenho. */
  const idsFaixa = [];
  passos.forEach((s) => {
    const id = faixaDe(s);
    if (!idsFaixa.includes(id)) idsFaixa.push(id);
  });
  if (!idsFaixa.length) idsFaixa.push("");

  const faixas = idsFaixa.map((id) => ({
    id,
    nome: cargo(id)?.nome || "Sem responsável",
    cor: id ? corSetor(cargo(id)?.setorId) : "",
  }));

  const col = colunasDe(passos);
  const temEntrada = new Set();
  passos.forEach((s) => (s.proximos || []).forEach((x) => temEntrada.add(x.para)));

  /* Um ciclo fechado não tem ninguém sem entrada — e ficaria sem início, um
     desenho sem porta. Quando isso acontece, o primeiro passo é a porta. É a
     mesma escolha que caminhoDaAula() faz; as duas telas contam a mesma história. */
  if (passos.every((s) => temEntrada.has(s.id))) temEntrada.delete(passos[0].id);

  const elementos = [];
  const fluxos = [];

  passos.forEach((s) => {
    const decisao = s.tipo === "decisao";
    const c = (col[s.id] || 0) * 2 + 1;

    /* Quem ninguém aponta é uma entrada do desenho, e entrada tem início.
       Sai antes da forma para que a leitura do SVG bata com a do olho. */
    if (!temEntrada.has(s.id)) {
      elementos.push({ id: `ini-${s.id}`, tipo: "inicio", rotulo: "", faixaId: faixaDe(s), coluna: c - 1 });
      fluxos.push({ de: `ini-${s.id}`, para: s.id, rotulo: "" });
    }

    elementos.push({
      id: s.id,
      tipo: decisao ? "gateway" : "tarefa",
      rotulo: s.oQue?.trim() || "sem título",
      sub: decisao ? "" : TIPOS[s.tipo]?.rotulo || "",
      simbolo: decisao ? "X" : "",
      faixaId: faixaDe(s),
      coluna: c,
      dado: s.tipo === "evidencia" ? "Evidência" : "",
      editavel: true,
    });

    if (!(s.proximos || []).length) {
      elementos.push({ id: `fim-${s.id}`, tipo: "fim", rotulo: "", faixaId: faixaDe(s), coluna: c + 1 });
      fluxos.push({ de: s.id, para: `fim-${s.id}`, rotulo: "" });
    }

    (s.proximos || []).forEach((x) => {
      if (passos.some((y) => y.id === x.para)) fluxos.push({ de: s.id, para: x.para, rotulo: x.rotulo || "" });
    });
  });

  return { faixas, elementos, fluxos };
}

/* O caminho que a aula percorre. Num desenho com bifurcação, "o próximo" é
   ambíguo — a aula segue a PRIMEIRA saída de cada peça, que é o caminho
   principal, e mostra os outros como desvio na tela do gateway. */
function caminhoDaAula(p) {
  const passos = p?.passos || [];
  if (!passos.length) return [];

  const temEntrada = new Set();
  passos.forEach((s) => (s.proximos || []).forEach((x) => temEntrada.add(x.para)));
  const inicio = passos.find((s) => !temEntrada.has(s.id)) || passos[0];

  const caminho = [];
  const vistos = new Set();
  let atual = inicio;
  while (atual && !vistos.has(atual.id)) {
    vistos.add(atual.id);
    caminho.push(atual);
    const proximo = (atual.proximos || [])[0]?.para;
    atual = passos.find((s) => s.id === proximo);
  }

  /* Quem ficou fora do caminho principal ainda precisa ser ensinado — entra
     no fim, na ordem em que está. */
  passos.forEach((s) => { if (!vistos.has(s.id)) caminho.push(s); });
  return caminho;
}

/* Para onde a decisão manda, além do caminho principal. */
function desviosDoPasso(p, s) {
  return (s.proximos || []).slice(1).map((x) => ({
    rotulo: x.rotulo || "outro caminho",
    passo: (p.passos || []).find((y) => y.id === x.para),
  })).filter((x) => x.passo);
}


/* O agrupamento é escolha de tela, então chega por parâmetro: o domínio não
   conhece `ui`. Foi o teste, rodando sem o app.js, que expôs essa dependência. */
function bpmnDoMapa(porSetor = true) {
  const nos = nosMacro();

  const grupos = porSetor ? setoresPorCamada() : state.fases;
  const chave = porSetor ? "setorId" : "faseId";
  const col = colunas();

  const faixaDe = (n) => (grupos.some((g) => g.id === n[chave]) ? n[chave] : "");

  /* Todas as raias aparecem, mesmo vazias — senão um setor recém-criado fica
     invisível e parece que não foi criado. Só a raia "sem setor" é condicional. */
  const faixas = grupos.map((g) => ({
    id: g.id,
    nome: g.nome,
    cor: porSetor ? corSetor(g.id) : "",
  }));
  if (nos.some((n) => !faixaDe(n))) {
    faixas.push({ id: "", nome: porSetor ? "Sem setor" : "Sem fase", cor: "" });
  }

  const elementos = [];
  const fluxos = [];
  const temEntrada = new Set();
  nos.forEach((n) => (n.proximos || []).forEach((x) => temEntrada.add(x.para)));

  nos.forEach((n) => {
    const faixaId = faixaDe(n);
    const c = (col[n.id] || 0) * 2 + 1;
    const eDecisao = ehDecisao(n.id);
    const eFim = ehFim(n.id);

    elementos.push({
      id: n.id,
      tipo: eFim ? "fim" : eDecisao ? "gateway" : "subprocesso",
      rotulo: eFim ? (n.nome || "fim") : eDecisao ? (n.pergunta || "sem pergunta") : n.nome,
      sub: eDecisao || eFim ? "" : cargo(n.donoCargoId)?.nome || "",
      simbolo: eDecisao ? TIPOS_DECISAO[n.tipo]?.simbolo || "X" : "",
      faixaId,
      coluna: c,
      dado: "",
      editavel: true,
    });

    /* Peça fora do fluxo não ganha início nem fim: ela não começa nem termina
       nada — sustenta. Desenhar evento nela seria dizer o que não é. */
    const noFluxo = estaNoFluxo(n.id);

    if (noFluxo && !temEntrada.has(n.id)) {
      elementos.push({ id: `ini-${n.id}`, tipo: "inicio", rotulo: "", faixaId, coluna: c - 1 });
      fluxos.push({ de: `ini-${n.id}`, para: n.id, rotulo: "" });
    }

    /* Fim automático só para quem não termina em fim nomeado — senão o desenho
       ganharia dois desfechos para a mesma ponta. */
    if (noFluxo && !eFim && !(n.proximos || []).length) {
      elementos.push({ id: `fim-${n.id}`, tipo: "fim", rotulo: "", faixaId, coluna: c + 1 });
      fluxos.push({ de: n.id, para: `fim-${n.id}`, rotulo: "" });
    }

    (n.proximos || []).forEach((x) => {
      if (noMacro(x.para)) fluxos.push({ de: n.id, para: x.para, rotulo: x.rotulo || "" });
    });
  });

  return { faixas, elementos, fluxos };
}

function novoPasso(tipo) {
  return {
    id: uid("ps"),
    tipo,
    cargoId: "",
    sistemaIds: [],
    oQue: "",
    comoFazer: "",
    porque: "",
    armadilha: "",
    regra: "",
    imagem: "",
    videoUrl: "",
    seSim: "",
    seNao: "",
  };
}

function textoDoProcesso(p) {
  const cargos = p.cargosIds.map((id) => cargo(id)?.nome).filter(Boolean).join(", ");
  return [
    `Processo: ${p.nome}`,
    `Setor: ${setor(p.setorId)?.nome || "—"} · Fase: ${fase(p.faseId)?.nome || "—"}`,
    cargos ? `Quem executa: ${cargos}` : "",
    p.porque ? `Por que existe: ${p.porque}` : "",
    p.seErrar ? `Quando sai errado: ${p.seErrar}` : "",
    "",
    "Passos:",
    ...(p.passos || []).map((s, i) => `${i + 1}. [${s.tipo}] ${s.oQue}${s.comoFazer ? ` — ${s.comoFazer}` : ""}`),
  ].filter(Boolean).join("\n");
}

function contextoBase() {
  return {
    empresa: state.empresa?.nome,
    setores: state.setores.map((s) => ({ id: s.id, nome: s.nome })),
    fases: state.fases.map((f) => ({ id: f.id, nome: f.nome })),
    cargos: state.cargos.map((c) => ({ id: c.id, nome: c.nome, setor: setor(c.setorId)?.nome || "" })),
  };
}

function preencherVazios(alvo, sugestao, campos) {
  campos.forEach((campo) => {
    const novo = String(sugestao?.[campo] ?? "").trim();
    if (novo && !String(alvo[campo] ?? "").trim()) alvo[campo] = novo;
  });
}

function aplicarNoEstado(m) {
  if (!m?.peca) return;
  if (m.peca === "estrutura") {
    if (m.acao !== "DELETE" && m.dados) Object.assign(state, m.dados);
    return;
  }
  const [prefixo, ...resto] = m.peca.split(":");
  const id = resto.join(":");
  const lista = { p: "processos", d: "decisoes", doc: "documentos", sis: "sistemas" }[prefixo];
  if (!lista) return;
  const i = state[lista].findIndex((x) => x.id === id);

  /* Substitui no lugar, nunca no fim: a ordem da lista é a ordem na tela. */
  if (m.acao === "DELETE") {
    if (i >= 0) state[lista].splice(i, 1);
  } else if (i >= 0) {
    state[lista][i] = m.dados;
  } else {
    state[lista].push(m.dados);
  }
}

const setor = (id) => state.setores.find((s) => s.id === id);

const cargo = (id) => state.cargos.find((c) => c.id === id);

const fase = (id) => state.fases.find((f) => f.id === id);

const processo = (id) => state.processos.find((p) => p.id === id);

const sistema = (id) => state.sistemas.find((s) => s.id === id);
const documento = (id) => state.documentos.find((d) => d.id === id);

const fim = (id) => state.fins.find((f) => f.id === id);
const decisao = (id) => state.decisoes.find((d) => d.id === id);

const nosMacro = () => [...state.processos, ...state.decisoes, ...state.fins];

const noMacro = (id) => processo(id) || decisao(id) || fim(id);

const ehDecisao = (id) => !!decisao(id);
const ehFim = (id) => !!fim(id);

const linhas = (texto) => String(texto || "").split("\n").map((l) => l.trim()).filter(Boolean);


/* Onde a corrente arrebenta.

   Não dá para conferir por semântica se a saída de um é mesmo a entrada do
   outro — isso é leitura humana. O que dá para conferir é a ausência: peça que
   entrega para alguém sem dizer o que entrega, ou que recebe sem dizer o que
   recebe. É o suficiente para apontar onde olhar. */
function elosFracos(st = state) {
  const falhas = [];
  const temEntrada = new Set();
  const nos = [...st.processos, ...st.decisoes];
  nos.forEach((n) => (n.proximos || []).forEach((x) => temEntrada.add(x.para)));

  st.processos.forEach((p) => {
    const entrega = (p.proximos || []).length > 0;
    if (entrega && !p.saida?.trim()) {
      falhas.push({ processo: p.id, nome: p.nome, falta: "saída", porque: "entrega para outra peça mas não diz o que entrega" });
    }
    if (temEntrada.has(p.id) && !p.entrada?.trim()) {
      falhas.push({ processo: p.id, nome: p.nome, falta: "entrada", porque: "recebe de outra peça mas não diz o que recebe" });
    }
  });
  return falhas;
}


/* O sistema é objeto de primeira classe, como cargo e setor: existe uma vez e é
   referenciado. É isso que permite a pergunta inversa — e a pergunta inversa é
   o que separa um desenhador de processos de um repositório. */

/* Quais sistemas um processo toca. Não é guardado no processo: vem dos passos,
   pela mesma regra que vale para a trilha do cargo. */
function sistemasDoProcesso(p) {
  const ids = [];
  (p?.passos || []).forEach((s) => (s.sistemaIds || []).forEach((id) => {
    if (!ids.includes(id)) ids.push(id);
  }));
  return ids.map(sistema).filter(Boolean);
}

/* A pergunta que justifica tudo isto: o que para se este sistema cair?
   Devolve os processos e, dentro deles, os passos exatos que dependem. */
function ondeApareceOSistema(sistemaId, st = state) {
  return st.processos
    .map((p) => ({
      processo: p,
      passos: (p.passos || []).filter((s) => (s.sistemaIds || []).includes(sistemaId)),
    }))
    .filter((x) => x.passos.length);
}

/* Sistema crítico sem nenhum passo declarado é suspeito: ou não é crítico, ou
   o mapeamento está incompleto. Vale avisar em vez de deixar passar. */
function sistemasOrfaos(st = state) {
  return st.sistemas.filter((s) => s.critico && !ondeApareceOSistema(s.id, st).length);
}


/* Os processos auxiliares do dossiê: "não aparecem necessariamente no fluxo
   ponta a ponta do cliente, mas sustentam, controlam e melhoram toda a
   operação".

   Não precisam de campo próprio: quem não tem ligação nenhuma não está no
   fluxo. Ligou numa peça, entra — e é exatamente o comportamento certo. */
function estaNoFluxo(id, st = state) {
  const no = [...st.processos, ...st.decisoes, ...st.fins].find((n) => n.id === id);
  if (!no) return false;
  if ((no.proximos || []).length) return true;
  return [...st.processos, ...st.decisoes].some((n) => (n.proximos || []).some((x) => x.para === id));
}

function processosQueSustentam(st = state) {
  /* Enquanto nada está ligado, não existe fluxo — e sem fluxo ninguém está
     fora dele. Chamar o primeiro processo do mapa de "apoio" só porque ele
     ainda não tem seta seria mentir para quem está começando a desenhar. */
  const existeFluxo = [...st.processos, ...st.decisoes].some((n) => (n.proximos || []).length);
  if (!existeFluxo) return [];
  return st.processos.filter((p) => !estaNoFluxo(p.id, st));
}

/* ------------------------------------------------------------------ ler BPMN

   Ler um .bpmn de fora e virar mapa do CIP.

   Sem DOMParser de propósito: o domínio não pode depender do navegador, e o
   pedaço do BPMN que interessa é raso — elementos com atributos, sem
   aninhamento além da raia. Um scanner pequeno lê isso e roda em qualquer
   lugar, inclusive no teste.

   O que entra:  raia → setor, subprocesso/tarefa → processo, gateway → decisão,
                 fim → fim nomeado, sequenceFlow → ligação.
   O que fica de fora: início (o CIP deduz), posição (deduzida das ligações),
                 pool, evento de borda, fluxo de mensagem.

   As setas vêm SÓ do sequenceFlow. Os <incoming>/<outgoing> dentro de cada
   elemento são cópia da mesma informação — e no arquivo da Platina eles já
   discordam entre si. Ler a cópia seria escolher a versão errada. */

const BPMN_TAREFA = ["subProcess", "task", "userTask", "serviceTask", "manualTask", "businessRuleTask", "scriptTask", "sendTask", "receiveTask", "callActivity"];

function bpmnAtributo(trecho, nome) {
  const m = trecho.match(new RegExp(`\\s${nome}\\s*=\\s*"([^"]*)"`));
  return m ? bpmnDesescapar(m[1]) : "";
}

function bpmnDesescapar(texto) {
  return String(texto)
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");
}

/* Casa a tag com ou sem prefixo: bpmn:lane, semantic:lane ou lane. Cada
   ferramenta escolhe o seu, e o prefixo não muda o significado. */
function bpmnAchar(xml, tag) {
  const re = new RegExp(`<(?:[\\w.-]+:)?${tag}\\b([^>]*?)(/?)>`, "g");
  return [...xml.matchAll(re)].map((m) => ({ attrs: m[1], vazio: m[2] === "/", indice: m.index }));
}

function lerBpmn(xml, st = state) {
  const texto = String(xml || "");
  if (!/<(?:[\w.-]+:)?definitions\b/.test(texto)) {
    throw new Error("Isso não parece um arquivo BPMN.");
  }

  const avisos = [];
  const semAcento = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

  /* --- raias viram setores, reaproveitando os que já existem --- */
  const setores = st.setores.map((s) => ({ ...s }));
  const setorDoNo = {};
  const acharSetor = (nome) => setores.find((s) => semAcento(s.nome) === semAcento(nome));

  const blocosDeRaia = texto.split(/<(?:[\w.-]+:)?lane\b/).slice(1);
  blocosDeRaia.forEach((bloco) => {
    const nome = bpmnAtributo("<lane " + bloco.split(">")[0] + ">", "name") || "Sem nome";
    let setor = acharSetor(nome);
    if (!setor) {
      setor = { id: uid("s"), nome, camada: "principal" };
      setores.push(setor);
    }
    const corpo = bloco.split(/<\/(?:[\w.-]+:)?lane>/)[0];
    [...corpo.matchAll(/<(?:[\w.-]+:)?flowNodeRef\b[^>]*>([^<]*)</g)]
      .forEach((m) => { setorDoNo[m[1].trim()] = setor.id; });
  });

  /* --- os nós --- */
  const processos = [];
  const decisoes = [];
  const fins = [];
  const inicios = new Set();
  const conhecido = {};

  const registrar = (attrs, criar) => {
    const id = bpmnAtributo(`<x${attrs}>`, "id");
    if (!id) return;
    const nome = bpmnAtributo(`<x${attrs}>`, "name");
    criar(id, nome);
  };

  BPMN_TAREFA.forEach((tag) => bpmnAchar(texto, tag).forEach(({ attrs }) => registrar(attrs, (id, nome) => {
    processos.push({
      id, nome: nome || "Sem nome", faseId: "", setorId: setorDoNo[id] || "",
      donoCargoId: "", cargosIds: [], status: "rascunho", revisado: true,
      videoUrl: "", entrada: "", saida: "", porque: "", seErrar: "",
      anexos: [], passos: [], perguntas: [], proximos: [],
    });
    conhecido[id] = "processo";
  })));

  [["exclusiveGateway", "exclusivo"], ["inclusiveGateway", "inclusivo"], ["parallelGateway", "inclusivo"], ["eventBasedGateway", "exclusivo"]]
    .forEach(([tag, tipo]) => bpmnAchar(texto, tag).forEach(({ attrs }) => registrar(attrs, (id, nome) => {
      if (tag === "parallelGateway") avisos.push(`"${nome || id}" é um gateway paralelo; virou inclusivo — o CIP não separa os dois.`);
      decisoes.push({ id, tipo, pergunta: nome || "", setorId: setorDoNo[id] || "", faseId: "", proximos: [] });
      conhecido[id] = "decisao";
    })));

  bpmnAchar(texto, "endEvent").forEach(({ attrs }) => registrar(attrs, (id, nome) => {
    fins.push({ id, nome: nome || "Fim", setorId: setorDoNo[id] || "", faseId: "", proximos: [] });
    conhecido[id] = "fim";
  }));

  /* O início do arquivo não vira peça: no CIP quem não recebe seta já é
     entrada, e o desenho põe o círculo sozinho. */
  bpmnAchar(texto, "startEvent").forEach(({ attrs }) => registrar(attrs, (id) => inicios.add(id)));

  /* --- as setas --- */
  const porId = {};
  [...processos, ...decisoes, ...fins].forEach((n) => { porId[n.id] = n; });
  let ligacoes = 0;

  bpmnAchar(texto, "sequenceFlow").forEach(({ attrs }) => {
    const trecho = `<x${attrs}>`;
    const de = bpmnAtributo(trecho, "sourceRef");
    const para = bpmnAtributo(trecho, "targetRef");
    const rotulo = bpmnAtributo(trecho, "name");
    if (inicios.has(de)) return;              // o início some, e o alvo dele vira entrada
    if (!porId[de] || !porId[para]) {
      if (!inicios.has(para)) avisos.push(`Uma seta apontava para algo que o CIP não representa (${de || "?"} → ${para || "?"}) e foi descartada.`);
      return;
    }
    if (conhecido[de] === "fim") {
      avisos.push(`"${porId[de].nome}" é um fim e tinha saída; a seta foi descartada — de um fim não sai nada.`);
      return;
    }
    porId[de].proximos.push({ para, rotulo });
    ligacoes++;
  });

  /* Processo com duas saídas e nenhum gateway é bifurcação implícita: o BPMN
     aceita, mas ninguém que lê o desenho sabe se os dois caminhos acontecem
     juntos ou se é um ou outro. Vale avisar em vez de desenhar em silêncio. */
  processos.filter((p) => p.proximos.length > 1).forEach((p) => {
    avisos.push(`"${p.nome}" sai por ${p.proximos.length} caminhos sem uma decisão no meio. Vale conferir se os dois acontecem juntos.`);
  });

  return {
    setores, processos, decisoes, fins, avisos,
    resumo: { setores: setores.length - st.setores.length, processos: processos.length, decisoes: decisoes.length, fins: fins.length, ligacoes },
  };
}

/* O import não encosta em cargo, documento, sistema nem trilha: o .bpmn não
   sabe nada disso, e apagar o que ele não conhece seria perda pura. */
function estadoComBpmn(xml, st = state) {
  const lido = lerBpmn(xml, st);
  return {
    estado: normalizar({
      ...st,
      setores: lido.setores,
      processos: lido.processos,
      decisoes: lido.decisoes,
      fins: lido.fins,
    }),
    avisos: lido.avisos,
    resumo: lido.resumo,
  };
}
