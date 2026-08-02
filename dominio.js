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
    p.passos.forEach((s) => {
      s.cargoId = s.cargoId || "";
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

function colunas() {
  const nos = nosMacro();
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
    saidas[id].forEach((d) => {
      if (estado[d] === 1) retorno.add(`${id}>${d}`);
      else if (!estado[d]) visitar(d);
    });
    estado[id] = 2;
  };
  nos.forEach((n) => { if (!estado[n.id]) visitar(n.id); });

  for (let volta = 0; volta < nos.length; volta++) {
    let mudou = false;
    nos.forEach((n) => {
      saidas[n.id].forEach((d) => {
        if (retorno.has(`${n.id}>${d}`)) return;
        if (col[d] < col[n.id] + 1) { col[d] = col[n.id] + 1; mudou = true; }
      });
    });
    if (!mudou) break;
  }
  return col;
}

function bpmnDoProcesso(p) {
  const passos = p.passos || [];
  if (!passos.length) return null;

  const faixaDe = (s) => (s.cargoId && cargo(s.cargoId) ? s.cargoId : p.donoCargoId || "");

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

  const elementos = [{ id: "inicio", tipo: "inicio", rotulo: "", faixaId: idsFaixa[0], coluna: 0 }];
  const fluxos = [];

  let coluna = 1;
  let anterior = "inicio";
  let rotuloProximo = "";
  let aguardandoMerge = null;

  passos.forEach((s) => {
    const id = s.id;
    const faixaId = faixaDe(s);
    const decisao = s.tipo === "decisao";

    elementos.push({
      id,
      tipo: decisao ? "gateway" : "tarefa",
      rotulo: s.oQue?.trim() || "sem título",
      sub: decisao ? "" : TIPOS[s.tipo]?.rotulo || "",
      faixaId,
      coluna,
      dado: s.tipo === "evidencia" ? "Evidência" : "",
      editavel: true,
    });

    fluxos.push({ de: anterior, para: id, rotulo: rotuloProximo });
    if (aguardandoMerge) {
      fluxos.push({ de: aguardandoMerge, para: id, rotulo: "" });
      aguardandoMerge = null;
    }

    if (decisao && s.seNao?.trim()) {
      const desvio = `${id}::nao`;
      elementos.push({
        id: desvio,
        tipo: "tarefa",
        rotulo: s.seNao,
        sub: "caminho não",
        faixaId,
        coluna: coluna + 1,
        dado: "",
      });
      fluxos.push({ de: id, para: desvio, rotulo: "Não" });
      aguardandoMerge = desvio;
      coluna += 2;
    } else {
      coluna += 1;
    }

    rotuloProximo = decisao ? (s.seSim?.trim() ? "Sim" : "") : "";
    anterior = id;
  });

  elementos.push({ id: "fim", tipo: "fim", rotulo: "", faixaId: faixaDe(passos[passos.length - 1]), coluna });
  fluxos.push({ de: anterior, para: "fim", rotulo: rotuloProximo });
  if (aguardandoMerge) fluxos.push({ de: aguardandoMerge, para: "fim", rotulo: "" });

  return { faixas, elementos, fluxos };
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

    if (!temEntrada.has(n.id)) {
      elementos.push({ id: `ini-${n.id}`, tipo: "inicio", rotulo: "", faixaId, coluna: c - 1 });
      fluxos.push({ de: `ini-${n.id}`, para: n.id, rotulo: "" });
    }

    /* Fim automático só para quem não termina em fim nomeado — senão o desenho
       ganharia dois desfechos para a mesma ponta. */
    if (!eFim && !(n.proximos || []).length) {
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
