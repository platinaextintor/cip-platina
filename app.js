/* CIP · Central Inteligente de Processos — Platina Extintores
   Fase 1: organograma + fluxo macro + aula do processo.
   Sem backend. Os dados vivem no localStorage e saem por JSON. */

const VERSAO = "v19";

/* Tela em branco não diz nada a quem está usando. Qualquer erro solto vira uma
   tarja vermelha no topo — mesmo os que acontecem antes do app existir. */
(function denunciarErros() {
  const pintar = (texto) => {
    let tarja = document.getElementById("tarjaErro");
    if (!tarja) {
      tarja = document.createElement("div");
      tarja.id = "tarjaErro";
      tarja.style.cssText =
        "position:fixed;top:0;left:0;right:0;z-index:9999;background:#bf1f2c;color:#fff;" +
        "padding:10px 14px;font:13px/1.5 ui-sans-serif,system-ui;white-space:pre-wrap";
      document.addEventListener("DOMContentLoaded", () => document.body.prepend(tarja));
      if (document.body) document.body.prepend(tarja);
    }
    tarja.textContent = `Erro (${VERSAO}): ${texto}`;
  };

  window.addEventListener("error", (e) => pintar(e.message || String(e.error)));
  window.addEventListener("unhandledrejection", (e) =>
    pintar(e.reason?.message || String(e.reason)),
  );
})();

const STORAGE_KEY = "cip.platina.v3";

/* Modo seguro: abrir com ?seguro=1 na URL inicia o app vazio SEM tocar no que
   está salvo. Serve para quando algum dado trava a tela — dá para entrar,
   baixar o backup e só então decidir o que fazer.

   Fica aqui no topo de propósito: `carregar()` lê esta constante, e `carregar()`
   é chamado logo na primeira linha do estado. Declarada mais abaixo, o arquivo
   inteiro estoura no carregamento. */
const MODO_SEGURO = new URLSearchParams(location.search).has("seguro");

/* Abrir com ?zerar=1 apaga o que está salvo e começa do esqueleto. Antes de
   apagar, guarda uma cópia sob outra chave — zerar é irreversível, e uma
   cópia de segurança não custa nada nem atrapalha quem quis mesmo zerar. */
const CHAVE_ANTERIOR = `${STORAGE_KEY}.antes-de-zerar`;
const ZEROU = (() => {
  if (!new URLSearchParams(location.search).has("zerar")) return false;
  const anterior = localStorage.getItem(STORAGE_KEY);
  if (anterior) localStorage.setItem(CHAVE_ANTERIOR, anterior);
  localStorage.removeItem(STORAGE_KEY);
  history.replaceState(null, "", location.pathname); // recarregar não zera de novo
  return true;
})();

/* ---------------------------------------------------------------- ícones */

const ICON = {
  etapa: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  decisao: '<path d="M12 3l9 9-9 9-9-9 9-9z"/>',
  evidencia: '<path d="M3 8h3l2-3h8l2 3h3v11H3zM12 16a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"/>',
  aprovacao: '<path d="M20 6L9 17l-5-5"/>',
  back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  edit: '<path d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4"/>',
  data: '<path d="M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M18 13l-6 6-6-6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  video: '<path d="M3 6h12v12H3zM15 10l6-3v10l-6-3"/>',
  curso: '<path d="M12 4L2 9l10 5 10-5-10-5zM6 12v5c0 1 3 2 6 2s6-1 6-2v-5"/>',
  leitura: '<path d="M4 5h7v15H4zM13 5h7v15h-7z"/>',
  pratica: '<path d="M12 3l2.4 5.6L20 9.6l-4 4.1.9 5.9-4.9-2.8L7 19.6l.9-5.9-4-4.1 5.6-1z"/>',
  documento: '<path d="M14 3H6v18h12V7l-4-4zM14 3v4h4M9 13h6M9 17h6"/>',
  link: '<path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/>',
  ia: '<path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3zM18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"/>',
  ok: '<path d="M9 11l3 3L22 4M21 12a9 9 0 11-6.2-8.5"/>',
};

function icon(name, size = 16) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ""}</svg>`;
}







/* ---------------------------------------------------------------- IA

   A chave da Anthropic não mora aqui — mora numa Edge Function do Supabase.
   O que vai no navegador é só a chave pública do projeto, que existe para isso. */

const IA = {
  url: "https://zxbjluzxmucpzvgwtkns.supabase.co/functions/v1/cip-ia",
  chave: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4YmpsdXp4bXVjcHp2Z3d0a25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNTU2MjgsImV4cCI6MjEwMDgzMTYyOH0.2R4zTbSupwt7n3i5PMciG_paRmJNuV9L4QW3qVVlcHk",
};

async function chamarIA(acao, entrada, contexto) {
  const token = await tokenDoUsuario();
  if (!token) throw new Error("Entre na sua conta para usar a IA.");

  const resposta = await fetch(IA.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      apikey: IA.chave,
    },
    body: JSON.stringify({ acao, entrada, contexto }),
  });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok || corpo.erro) throw new Error(corpo.erro || `Falha ${resposta.status}`);
  return corpo.dados;
}

/* Os ids que a IA pode usar. Sem isso ela inventa setor e cargo. */


/* Opus 5 pensa antes de responder — a espera é de dezenas de segundos. */
async function comEspera(botao, tarefa) {
  const antes = botao.innerHTML;
  botao.disabled = true;
  botao.classList.add("pensando");
  botao.innerHTML = `${icon("ia", 15)} pensando…`;
  try {
    return await tarefa();
  } catch (erro) {
    alert(`A IA não conseguiu: ${erro.message}`);
    return null;
  } finally {
    botao.disabled = false;
    botao.classList.remove("pensando");
    botao.innerHTML = antes;
  }
}

/* Só preenche o que está vazio — o que você escreveu é seu. */


/* Só http/https saem daqui — o link é digitado pelo usuário. */




function video(url, rotulo = "Abrir vídeo") {
  const id = youtubeId(url);
  if (id) {
    return `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="Vídeo do passo" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
  }
  const seguro = linkSeguro(url);
  return seguro ? `<a class="btn link-btn" href="${esc(seguro)}" target="_blank" rel="noopener noreferrer">${icon("video", 15)} ${rotulo}</a>` : "";
}

/* ---------------------------------------------------------------- semente */

/* Uma única fonte de verdade para "estado completo e vazio". Tanto a semente
   quanto o botão de apagar tudo saem daqui — foi a falta disso que deixou o
   app abrir sem `decisoes` e sem `documentos`, quebrando três telas. */


/* O esqueleto da empresa: setores, cargos e a cadeia de valor. Nada de
   conteúdo — missão, processo, trilha e documento são escritos pelo gestor. */


/* ---------------------------------------------------------------- estado */


/* Só aqui, e não no topo: `carregar()` lê STORAGE_KEY e MODO_SEGURO, que são
   declarados acima. Chamado antes deles, o arquivo inteiro aborta em silêncio. */
state = carregar();

let ui = {
  view: "organograma",
  cargoSel: null,
  processoId: null,
  passoIdx: 0,
  docId: null,
  agrupar: "setor",
  ligando: null,
  arrastando: null,
  ligandoCargo: null,
  arrastandoCargo: null,
  elSel: null,
  zoom: 1,
  macroSel: null,
  zoomMacro: 1,
};

function carregar() {
  if (MODO_SEGURO) return semente();
  try {
    const bruto = localStorage.getItem(STORAGE_KEY);
    if (!bruto) return semente();
    const dados = JSON.parse(bruto);
    return valido(dados) ? normalizar(dados) : semente();
  } catch {
    return semente();
  }
}

function baixarBrutoSalvo() {
  const bruto = localStorage.getItem(STORAGE_KEY);
  if (!bruto) return alert("Não há nada salvo neste navegador.");
  const url = URL.createObjectURL(new Blob([bruto], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `cip-recuperado-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}



/* A seta do macro passou a carregar rótulo ("sim", "não"), então o formato
   antigo — uma lista de ids — vira uma lista de { para, rotulo }. */


/* Preenche o que versões anteriores não tinham, para o app nunca abrir quebrado. */


/* Sobe para o banco o que mudou. Sempre com atraso: digitar dispara `salvar`
   a cada tecla, e uma ida ao servidor por tecla seria absurdo. */
let nuvemTimer = null;
function sincronizar() {
  if (MODO_SEGURO || !quemEstaLogado()) return;
  clearTimeout(nuvemTimer);
  nuvemTimer = setTimeout(async () => {
    try {
      const { gravadas, apagadas } = await gravarMudancas(state);
      if (gravadas || apagadas) marcarEstado("salvo");
    } catch (erro) {
      marcarEstado("erro", erro.message);
    }
  }, 700);
}

let salvarTimer = null;
function salvar(imediato = false) {
  if (MODO_SEGURO) return; // no modo seguro nada é gravado por cima do backup
  sincronizar();
  clearTimeout(salvarTimer);
  const grava = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      alert("A memória do navegador encheu. Exporte o JSON em Dados do projeto e apague algumas imagens antes de continuar.");
    }
    atualizarProgresso();
  };
  if (imediato) grava();
  else salvarTimer = setTimeout(grava, 400);
}

/* ---------------------------------------------------------------- helpers */

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));












/* O macro tem dois tipos de peça: processo e decisão. Quase tudo trata as duas
   igual — só o desenho e o painel lateral distinguem. */










/* Um processo conta como mapeado quando tem o porquê, pelo menos 3 passos com
   "o que fazer" preenchido, e passou por revisão humana. Rascunho de IA entra
   com revisado = false: a régua não aceita texto que ninguém conferiu. */




/* ---------------------------------------------------------------- navegação */

function ir(view, extras = {}) {
  ui = { ...ui, view, ligando: null, arrastando: null, ligandoCargo: null, arrastandoCargo: null, macroSel: null, ...extras };
  fecharDrawer();
  window.scrollTo({ top: 0 });
  render();
}

function abrirAula(processoId) {
  ir("aula", { processoId, passoIdx: 0 });
}

/* ---------------------------------------------------------------- render */

function render() {
  const grupo = {
    organograma: "organograma", trilha: "organograma", cargoEditor: "organograma",
    fluxo: "fluxo", aula: "fluxo", editor: "fluxo", desenho: "fluxo", macro: "fluxo",
    biblioteca: "biblioteca", docEditor: "biblioteca",
  }[ui.view];
  $$(".tab").forEach((b) => b.classList.toggle("is-active", b.dataset.go === grupo));

  const telas = {
    organograma: viewOrganograma,
    fluxo: viewFluxo,
    aula: viewAula,
    editor: viewEditor,
    trilha: viewTrilha,
    cargoEditor: viewCargoEditor,
    biblioteca: viewBiblioteca,
    docEditor: viewDocEditor,
    desenho: viewDesenho,
    macro: viewMacro,
  };
  const main = $("#main");
  main.innerHTML = (telas[ui.view] || viewOrganograma)();

  ligarEventos(main);
  if (ui.view === "editor") ligarEditor(main);
  if (ui.view === "cargoEditor") ligarCargoEditor(main);
  if (ui.view === "docEditor") ligarDocEditor(main);
  if (ui.view === "desenho") ligarDesenho(main);
  if (ui.view === "macro") ligarMacro(main);
  if (ui.view === "fluxo") requestAnimationFrame(desenharLigacoes);
  atualizarProgresso();
}

function atualizarProgresso() {
  const total = state.processos.length;
  const prontos = state.processos.filter(mapeado).length;
  const pct = total ? Math.round((prontos / total) * 100) : 0;
  $("#progressChip").innerHTML = `
    <span class="progress-track"><span class="progress-fill" style="width:${pct}%"></span></span>
    <span class="progress-label">${prontos} de ${total} processos prontos</span>
  `;
}

/* ---------------------------------------------------------------- organograma */

/* Quem está abaixo de quem — usado para recusar uma ligação que fecharia ciclo. */


function religarCargo(idFilho, idChefe) {
  const filho = cargo(idFilho);
  if (!filho || idFilho === idChefe) return;
  if (idChefe && descendeDe(idChefe, idFilho)) {
    alert(`"${cargo(idChefe).nome}" já está abaixo de "${filho.nome}". Isso fecharia um ciclo.`);
    return;
  }
  filho.reportaA = idChefe || null;
  ui.ligandoCargo = null;
  salvar(true);
  render();
}

function viewOrganograma() {
  const raizes = state.cargos.filter((c) => !c.reportaA || !cargo(c.reportaA));
  const ligando = ui.ligandoCargo ? cargo(ui.ligandoCargo) : null;

  return `
    <div class="page">
      <div class="page-head head-row">
        <div>
          <span class="eyebrow">Organograma</span>
          <h1>Quem é quem na Platina</h1>
          <p>Arraste um cargo para baixo de outro para mudar a quem ele responde. O ícone de corrente liga a partir do chefe.</p>
        </div>
        <div class="btn-row">
          <button class="btn" data-novo-cargo type="button">${icon("plus")} Novo cargo</button>
          <button class="btn btn-ghost" data-novo-setor type="button">Novo setor</button>
        </div>
      </div>

      ${ligando ? `<div class="filter-bar aviso">
        ${icon("link", 15)} Ligando a partir de <strong>${esc(ligando.nome)}</strong> — clique em quem responde a ele.
        <button class="btn btn-sm btn-ghost" data-cancelar-ligacao type="button" style="margin-left:auto">Cancelar</button>
      </div>` : ""}

      <div class="sector-strip">
        ${setoresPorCamada().map((s) => {
          const n = state.cargos.filter((c) => c.setorId === s.id).length;
          return `<button class="sector-pill" data-editar-setor="${s.id}" type="button" title="Editar setor e camada">
            <span class="swatch" style="background:${corSetor(s.id)}"></span>${esc(s.nome)}
            <span class="camada-tag c-${camadaDoSetor(s.id)}">${CAMADAS[camadaDoSetor(s.id)].rotulo}</span>
            <span>${n} cargo${n === 1 ? "" : "s"}</span>
          </button>`;
        }).join("")}
      </div>

      <div class="org-scroll">
        <div class="org-tree">
          <div class="org-root" data-solta-org="" title="Solte aqui para deixar o cargo no topo">
            <strong>${esc(state.empresa?.nome || "Empresa")}</strong>
            <small>${state.cargos.length} cargos · ${state.processos.length} processos</small>
          </div>
          ${raizes.length ? `<ul>${raizes.map((c) => noCargo(c, new Set())).join("")}</ul>` : '<div class="empty" style="margin-top:20px">Nenhum cargo cadastrado ainda.</div>'}
        </div>
      </div>

      <p class="hint" style="margin-top:12px">Arraste um cargo sobre outro para subordiná-lo, ou sobre a caixa da empresa para levá-lo ao topo. No celular, use o campo "Responde a" dentro do cargo.</p>
    </div>
  `;
}

/* `vistos` protege contra um ciclo que tenha entrado por importação de JSON. */
function noCargo(c, vistos) {
  if (vistos.has(c.id)) return "";
  vistos.add(c.id);

  const filhos = state.cargos.filter((f) => f.reportaA === c.id);
  const procs = processosDoCargo(c.id);
  const prontos = procs.filter(mapeado).length;
  const pct = procs.length ? Math.round((prontos / procs.length) * 100) : 0;

  const classes = [
    "org-no",
    ui.cargoSel === c.id ? "is-selected" : "",
    ui.ligandoCargo === c.id ? "is-ligando" : "",
    ui.ligandoCargo && ui.ligandoCargo !== c.id ? "is-alvo" : "",
  ].filter(Boolean).join(" ");

  return `
    <li>
      <div class="${classes}" data-org="${c.id}" draggable="true" style="border-top-color:${corSetor(c.setorId)}">
        <button class="org-corpo" data-cargo="${c.id}" type="button">
          <span class="org-sector">${esc(setor(c.setorId)?.nome || "sem setor")}</span>
          <strong>${esc(c.nome)}</strong>
          <span class="org-meta">${procs.length} processo${procs.length === 1 ? "" : "s"}${(c.trilha || []).length ? ` · ${c.trilha.length} treino${c.trilha.length === 1 ? "" : "s"}` : ""}</span>
          <span class="bar"><i style="width:${pct}%"></i></span>
        </button>
        <div class="org-acoes">
          <button class="no-acao" data-ligar-cargo="${c.id}" type="button" title="Ligar: escolher quem responde a este cargo" aria-label="Ligar">${icon("link", 14)}</button>
          <button class="no-acao" data-editar-cargo="${c.id}" type="button" title="Editar cargo e trilha" aria-label="Editar">${icon("edit", 14)}</button>
        </div>
      </div>
      ${filhos.length ? `<ul>${filhos.map((f) => noCargo(f, vistos)).join("")}</ul>` : ""}
    </li>
  `;
}

/* ---------------------------------------------------------------- mapa (fluxo macro) */

/* A coluna de cada processo nasce das ligações: quem vem depois anda uma casa
   para a direita.

   Retorno ("não aprovou, volta pro orçamento") é legítimo num mapa de processo,
   mas empurraria as colunas para sempre. Então marcamos as arestas de retorno
   com uma busca em profundidade e calculamos as colunas só no que sobra —
   a seta continua desenhada, ela apenas não conta para a posição. */


function viewFluxo() {
  const porSetor = ui.agrupar !== "fase";
  const grupos = porSetor ? setoresPorCamada() : state.fases;
  const chave = porSetor ? "setorId" : "faseId";
  const orfaos = state.processos.filter((p) => !grupos.some((g) => g.id === p[chave]));
  const c = ui.cargoSel ? cargo(ui.cargoSel) : null;
  const ligando = ui.ligando ? processo(ui.ligando) : null;
  const col = colunas();
  const totalColunas = Math.max(1, ...Object.values(col).map((n) => n + 1));

  return `
    <div class="page">
      <div class="page-head head-row">
        <div>
          <span class="eyebrow">Mapa da operação</span>
          <h1>Como o trabalho anda na empresa</h1>
          <p>Cada nó é um processo. Ligue um no outro para desenhar o caminho — as setas atravessam raias quando o trabalho troca de setor.</p>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" data-macro type="button">${icon("edit", 15)} Desenhar o macro</button>
          <button class="btn" data-contar type="button">${icon("ia", 15)} Contar um processo</button>
          <div class="chips">
            <button class="chip${porSetor ? " on" : ""}" data-agrupar="setor" type="button">Por setor</button>
            <button class="chip${porSetor ? "" : " on"}" data-agrupar="fase" type="button">Por fase</button>
          </div>
          <button class="btn btn-ghost" data-nova-raia type="button">${icon("plus", 15)} ${porSetor ? "Setor" : "Fase"}</button>
        </div>
      </div>

      ${ligando ? `<div class="filter-bar aviso">
        ${icon("link", 15)} Ligando <strong>${esc(ligando.nome)}</strong> — clique no processo que vem depois.
        <button class="btn btn-sm btn-ghost" data-cancelar-ligacao type="button" style="margin-left:auto">Cancelar</button>
      </div>` : ""}

      ${c && !ligando ? `<div class="filter-bar">
        <strong>${esc(c.nome)}</strong> — destacando os processos deste cargo
        <button class="btn btn-sm btn-ghost" data-limpar-cargo type="button" style="margin-left:auto">Limpar</button>
      </div>` : ""}

      <div class="mapa-wrap">
        <div class="mapa" id="mapa">
          <svg class="mapa-links" id="mapaLinks" aria-hidden="true">
            <defs>
              <marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill="var(--line-2)"></path>
              </marker>
              <marker id="setaForte" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill="var(--navy-2)"></path>
              </marker>
            </defs>
          </svg>
          ${grupos.map((g) => raia(g, chave, porSetor, null, col, totalColunas)).join("")}
          ${orfaos.length ? raia({ id: "", nome: porSetor ? "Sem setor" : "Sem fase" }, chave, porSetor, orfaos, col, totalColunas) : ""}
        </div>
      </div>

      ${elosFracos().length ? `<div class="filter-bar aviso" style="margin-top:14px">
        ${icon("link", 15)} <strong>${elosFracos().length} elo${elosFracos().length === 1 ? "" : "s"} sem declarar.</strong>
        ${esc(elosFracos().slice(0, 3).map((f) => `${f.nome} sem ${f.falta}`).join(" · "))}${elosFracos().length > 3 ? " …" : ""}
      </div>` : ""}

      <p class="hint" style="margin-top:12px">Visão de acompanhamento. Para desenhar o fluxo com decisões, use <strong>Desenhar o macro</strong>.</p>
    </div>
  `;
}

function raia(g, chave, porSetor, lista, col, totalColunas) {
  const procs = lista || state.processos.filter((p) => p[chave] === g.id);
  const prontos = procs.filter(mapeado).length;
  const cor = porSetor ? corSetor(g.id) : "var(--line-2)";
  const ultima = procs.length ? Math.max(...procs.map((p) => col[p.id] || 0)) : -1;

  return `
    <section class="raia" data-raia="${esc(g.id)}">
      <div class="raia-cabeca">
        <span class="raia-titulo" style="border-color:${cor}">
          ${g.id ? `<button class="raia-nome" data-renomear-raia="${esc(g.id)}" type="button">${esc(g.nome)}</button>` : `<span class="raia-nome">${esc(g.nome)}</span>`}
          <span class="muted">${procs.length ? `${prontos}/${procs.length}` : "vazia"}</span>
        </span>
      </div>
      <div class="raia-trilho" data-solta="${esc(g.id)}" style="grid-template-columns:repeat(${totalColunas + 1}, 210px)">
        ${procs.map((p) => no(p, col[p.id] || 0)).join("")}
        <button class="no-add" data-novo-processo="${esc(g.id)}" type="button" style="grid-column:${ultima + 2}">${icon("plus", 15)}<span>processo</span></button>
      </div>
    </section>
  `;
}

function no(p, coluna) {
  const dono = cargo(p.donoCargoId);
  const pronto = mapeado(p);
  const relacionado = ui.cargoSel && (p.cargosIds.includes(ui.cargoSel) || p.donoCargoId === ui.cargoSel);
  const classes = [
    "no",
    ui.cargoSel && !ui.ligando ? (relacionado ? "is-hit" : "is-dim") : "",
    ui.ligando === p.id ? "is-ligando" : "",
    ui.ligando && ui.ligando !== p.id ? "is-alvo" : "",
  ].filter(Boolean).join(" ");

  const pontos = (p.passos || []).slice(0, 8).map((s) => `<i class="t-${s.tipo}"></i>`).join("");

  return `
    <div class="${classes}" data-no="${p.id}" draggable="true" style="border-top-color:${corSetor(p.setorId)};grid-column:${coluna + 1}">
      <button class="no-corpo" data-abrir="${p.id}" type="button">
        <strong>${esc(p.nome)}</strong>
        <span class="no-meta">
          <span class="tag ${pronto ? "green" : "amber"}"><span class="tag-dot"></span>${pronto ? "pronto" : "em construção"}</span>
        </span>
        ${dono ? `<span class="no-dono">${esc(dono.nome)}</span>` : ""}
        ${pontos ? `<span class="step-dots">${pontos}</span>` : '<span class="no-dono">sem passos</span>'}
      </button>
      <div class="no-acoes">
        <button class="no-acao" data-ligar="${p.id}" type="button" title="Ligar ao próximo processo" aria-label="Ligar ao próximo processo">${icon("link", 14)}</button>
        <button class="no-acao" data-editar="${p.id}" type="button" title="Editar processo" aria-label="Editar processo">${icon("edit", 14)}</button>
      </div>
    </div>
  `;
}

/* As setas são desenhadas depois do layout, medindo a posição real de cada nó. */
function desenharLigacoes() {
  const mapa = $("#mapa");
  const svg = $("#mapaLinks");
  if (!mapa || !svg) return;

  const base = mapa.getBoundingClientRect();
  const largura = mapa.scrollWidth;
  const altura = mapa.scrollHeight;
  svg.setAttribute("width", largura);
  svg.setAttribute("height", altura);
  svg.setAttribute("viewBox", `0 0 ${largura} ${altura}`);

  const caixas = {};
  $$("[data-no]", mapa).forEach((n) => {
    const r = n.getBoundingClientRect();
    caixas[n.dataset.no] = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
  });

  const traços = [];
  nosMacro().forEach((p) => {
    (p.proximos || []).forEach(({ para: destinoId }) => {
      const a = caixas[p.id];
      const b = caixas[destinoId];
      if (!a || !b) return;

      const x1 = a.x + a.w;
      const y1 = a.y + a.h / 2;
      const x2 = b.x;
      const y2 = b.y + b.h / 2;
      const volta = x2 < x1;
      const puxada = volta ? Math.max(70, Math.abs(x1 - x2) * 0.35) : Math.max(34, (x2 - x1) * 0.45);
      const d = `M ${x1} ${y1} C ${x1 + puxada} ${y1}, ${x2 - puxada} ${y2}, ${x2} ${y2}`;

      const aceso = ui.cargoSel && ((p.cargosIds || []).includes(ui.cargoSel) || p.donoCargoId === ui.cargoSel);
      traços.push(`<path class="link-hit" d="${d}" data-de="${p.id}" data-para="${destinoId}"></path>`);
      traços.push(`<path class="link-linha${aceso ? " forte" : ""}" d="${d}" marker-end="url(#${aceso ? "setaForte" : "seta"})"></path>`);
    });
  });

  const defs = svg.querySelector("defs");
  svg.innerHTML = "";
  svg.appendChild(defs);
  svg.insertAdjacentHTML("beforeend", traços.join(""));

  $$(".link-hit", svg).forEach((linha) => linha.addEventListener("click", () => {
    const de = noMacro(linha.dataset.de);
    const para = noMacro(linha.dataset.para);
    const rotulo = (n) => n?.nome || n?.pergunta || "?";
    if (!de || !confirm(`Desfazer a ligação de "${rotulo(de)}" para "${rotulo(para)}"?`)) return;
    de.proximos = de.proximos.filter((x) => x.para !== linha.dataset.para);
    salvar(true);
    render();
  }));
}

function ligarProcessos(deId, paraId) {
  const de = processo(deId);
  if (!de || deId === paraId) return;
  de.proximos = de.proximos || [];
  if (!de.proximos.some((x) => x.para === paraId)) de.proximos.push({ para: paraId, rotulo: "" });
  ui.ligando = null;
  salvar(true);
  render();
}

/* Solta o nó arrastado na raia alvo, na posição do cursor. */
function soltarNo(processoId, raiaId, clienteX) {
  const p = processo(processoId);
  if (!p) return;
  const porSetor = ui.agrupar !== "fase";
  const chave = porSetor ? "setorId" : "faseId";
  if (raiaId) p[chave] = raiaId;

  const trilho = $(`[data-solta="${CSS.escape(raiaId)}"]`);
  const vizinhos = trilho ? $$("[data-no]", trilho).filter((n) => n.dataset.no !== processoId) : [];
  const antes = vizinhos.find((n) => {
    const r = n.getBoundingClientRect();
    return clienteX < r.left + r.width / 2;
  });

  state.processos = state.processos.filter((x) => x.id !== processoId);
  const alvo = antes ? state.processos.findIndex((x) => x.id === antes.dataset.no) : -1;
  if (alvo >= 0) state.processos.splice(alvo, 0, p);
  else state.processos.push(p);

  salvar(true);
  render();
}


/* ---------------------------------------------------------------- BPMN

   Traduz o modelo do CIP para a notação padrão. O desenho em si mora no
   bpmn.js — aqui só se decide o que é tarefa, o que é gateway e quem é raia. */

/* Um processo: raias por cargo, decisão vira gateway exclusivo com os dois
   caminhos desenhados, evidência vira tarefa com objeto de dados anexado. */
/* Passo sem título entra no desenho mesmo assim — quem desenha primeiro e
   escreve depois precisa ver a forma aparecer no instante em que a cria. */


/* O mapa: cada processo é um subprocesso colapsado; raia é setor ou fase. */


function blocoBpmn(modelo, vazio) {
  if (!modelo) return `<div class="empty">${vazio}</div>`;
  return bpmnDesenhar(modelo);
}

/* ---------------------------------------------------------------- desenhar

   O caminho inverso: a tela é a superfície de criação. Cada forma que entra no
   desenho é um passo criado; arrastar uma sobre a outra reordena a lista.
   Não existe estado paralelo — o desenho é a lista, vista de outro jeito. */



/* ---------------------------------------------------------------- macro em tela cheia

   O mesmo painel do processo, um nível acima: as peças são processos e
   decisões, as raias são setores. Criar um processo aqui já cria o card dele. */

function viewMacro() {
  const porSetor = ui.agrupar !== "fase";
  const sel = ui.macroSel ? noMacro(ui.macroSel) : null;
  const modelo = bpmnDoMapa(ui.agrupar !== "fase");
  const zoom = ui.zoomMacro || 1;
  const ligando = ui.ligando ? noMacro(ui.ligando) : null;

  return `
    <div class="desenho">
      <header class="desenho-topo">
        <button class="btn btn-sm btn-ghost" data-go="fluxo" type="button">${icon("back", 15)} Voltar</button>
        <strong class="desenho-nome">Macro · ${esc(state.empresa?.nome || "Empresa")}</strong>

        <div class="chips desenho-paleta">
          <button class="chip" data-add-macro="processo" type="button" title="Novo processo${sel ? " ligado ao selecionado" : ""}">${icon("plus", 13)} Processo</button>
          <button class="chip" data-add-macro="decisao" type="button" title="Nova decisão${sel ? " ligada ao selecionado" : ""}">${icon("plus", 13)} Decisão</button>
          <button class="chip" data-nova-raia type="button" title="Cria ${porSetor ? "um setor" : "uma fase"}, que vira uma raia">${icon("plus", 13)} Raia</button>
        </div>

        <div class="agrupador">
          <span class="hint">raias por</span>
          <div class="chips">
            <button class="chip${porSetor ? " on" : ""}" data-agrupar="setor" type="button">Setor</button>
            <button class="chip${porSetor ? "" : " on"}" data-agrupar="fase" type="button">Fase</button>
          </div>
        </div>

        <div class="desenho-zoom">
          <button class="icon-btn" data-zoom-macro="-1" type="button" aria-label="Diminuir">−</button>
          <span>${Math.round(zoom * 100)}%</span>
          <button class="icon-btn" data-zoom-macro="1" type="button" aria-label="Aumentar">+</button>
          <button class="btn btn-sm" data-zoom-macro="0" type="button">Ajustar</button>
        </div>
      </header>

      ${ligando ? `<div class="filter-bar aviso" style="margin:10px 18px 0">
        ${icon("link", 15)} Ligando <strong>${esc(ligando.nome || ligando.pergunta || "peça")}</strong> — clique no que vem depois.
        <button class="btn btn-sm btn-ghost" data-cancelar-ligacao type="button" style="margin-left:auto">Cancelar</button>
      </div>` : ""}

      <div class="desenho-corpo">
        <div class="desenho-tela" id="telaMacro">
          ${!nosMacro().length ? `<p class="hint desenho-dica">As raias já estão aqui. Use a paleta acima para colocar o primeiro processo dentro de uma delas.</p>` : ""}
          ${bpmnDesenhar(modelo, { interativo: true, selecionado: ui.macroSel, zoom })}
        </div>

        <aside class="desenho-lado">
          ${sel ? (ehDecisao(sel.id) ? inspetorDecisao(sel) : inspetorProcessoMacro(sel)) : `
            <div class="drawer-head"><h2>Nada selecionado</h2></div>
            <p class="sub">Clique numa peça para editar, ou use a paleta acima para criar a próxima.</p>
            <div class="note note-rule" style="margin-top:20px">
              <div class="block-label">Como montar</div>
              <p>Crie um processo, clique nele, e use <strong>Ligar</strong> para apontar o que vem depois. Se o caminho se divide, crie uma <strong>Decisão</strong> no meio e escreva o rótulo de cada saída — "aprovado", "reprovado".</p>
            </div>
            <div class="note note-why" style="margin-top:12px">
              <div class="block-label">A posição é automática</div>
              <p>Você não arrasta para posicionar. Ligou uma peça na outra, ela anda para a direita sozinha. Arrastar serve para mudar de raia.</p>
            </div>
          `}
        </aside>
      </div>
    </div>
  `;
}

function inspetorProcessoMacro(p) {
  return `
    <div class="drawer-head"><h2>${esc(p.nome)}</h2></div>
    <p class="sub">Processo · ${(p.passos || []).length} subprocesso${(p.passos || []).length === 1 ? "" : "s"}</p>

    <div class="btn-row" style="margin:14px 0 18px">
      <button class="btn btn-primary btn-sm" data-desenhar="${p.id}" type="button">${icon("edit", 15)} Detalhar por dentro</button>
      <button class="btn btn-sm" data-ligar-macro="${p.id}" type="button">${icon("link", 15)} Ligar</button>
    </div>

    <div class="stack">
      <div class="field">
        <label>Nome</label>
        <input data-m="nome" value="${esc(p.nome)}" />
      </div>
      <div class="field-grid">
        <div class="field">
          <label>Setor</label>
          <select data-m="setorId">${opcoes(state.setores, p.setorId)}</select>
        </div>
        <div class="field">
          <label>Fase</label>
          <select data-m="faseId">${opcoes(state.fases, p.faseId)}</select>
        </div>
      </div>
      <div class="field">
        <label>Dono do processo</label>
        <select data-m="donoCargoId">${opcoes(state.cargos, p.donoCargoId)}</select>
      </div>
      <div class="field">
        <label>O que chega <span class="hint">— a entrada</span></label>
        <input data-m="entrada" value="${esc(p.entrada || "")}" placeholder="Proposta aprovada" />
      </div>
      <div class="field">
        <label>O que sai <span class="hint">— a saída</span></label>
        <input data-m="saida" value="${esc(p.saida || "")}" placeholder="Pedido criado" />
      </div>
    </div>

    ${saidasDoNo(p)}

    <div class="btn-row" style="margin-top:20px">
      <button class="btn btn-sm btn-danger" data-remover-macro type="button">${icon("trash", 15)} Apagar processo</button>
    </div>
  `;
}

function inspetorDecisao(d) {
  return `
    <div class="drawer-head"><h2>Decisão</h2></div>
    <p class="sub">O caminho se divide aqui.</p>

    <div class="btn-row" style="margin:14px 0 18px">
      <button class="btn btn-sm" data-ligar-macro="${d.id}" type="button">${icon("link", 15)} Ligar uma saída</button>
    </div>

    <div class="stack">
      <div class="field">
        <label>A pergunta</label>
        <input data-m="pergunta" value="${esc(d.pergunta)}" placeholder="Aprovado?" />
      </div>
      <div class="field-grid">
        <div class="field">
          <label>Setor</label>
          <select data-m="setorId">${opcoes(state.setores, d.setorId)}</select>
        </div>
        <div class="field">
          <label>Fase</label>
          <select data-m="faseId">${opcoes(state.fases, d.faseId)}</select>
        </div>
      </div>
    </div>

    ${saidasDoNo(d)}

    <div class="btn-row" style="margin-top:20px">
      <button class="btn btn-sm btn-danger" data-remover-macro type="button">${icon("trash", 15)} Apagar decisão</button>
    </div>
  `;
}

function saidasDoNo(n) {
  const saidas = n.proximos || [];
  return `
    <div class="section-title"><h3>Saídas</h3><span class="line"></span><span class="muted">${saidas.length}</span></div>
    ${saidas.length ? `<div class="stack">
      ${saidas.map((x) => {
        const alvo = noMacro(x.para);
        return `
          <div class="saida-row" data-saida="${esc(x.para)}">
            <span class="saida-alvo">${esc(alvo?.nome || alvo?.pergunta || "?")}</span>
            <input data-saida-rotulo value="${esc(x.rotulo || "")}" placeholder="rótulo (sim, não…)" />
            <button class="btn btn-sm btn-ghost" data-remover-saida type="button" aria-label="Desfazer">${icon("trash", 15)}</button>
          </div>`;
      }).join("")}
    </div>` : '<p class="hint">Nenhuma. Use o botão Ligar acima.</p>'}
  `;
}

function ligarMacro(raiz) {
  const sel = ui.macroSel ? noMacro(ui.macroSel) : null;

  $$("[data-add-macro]", raiz).forEach((b) => b.addEventListener("click", () => {
    const porSetor = ui.agrupar !== "fase";
    const setorId = sel?.setorId || state.setores[0]?.id || "";
    const faseId = sel?.faseId || state.fases[0]?.id || "";
    let novo;

    if (b.dataset.addMacro === "decisao") {
      novo = { id: uid("d"), pergunta: "", setorId, faseId, proximos: [] };
      state.decisoes.push(novo);
    } else {
      novo = {
        id: uid("p"), nome: "Novo processo", faseId, setorId,
        donoCargoId: state.cargos[0]?.id || "", cargosIds: [], status: "rascunho",
        revisado: true, videoUrl: "", porque: "", seErrar: "",
        anexos: [], passos: [], perguntas: [], proximos: [],
      };
      state.processos.push(novo);
    }

    /* Nasce já ligado ao que estava selecionado — é assim que se desenha
       uma cadeia sem parar para ligar peça por peça. */
    if (sel) sel.proximos.push({ para: novo.id, rotulo: "" });

    ui.macroSel = novo.id;
    salvar(true);
    render();
    $("[data-m]")?.focus();
  }));

  $$("[data-zoom-macro]", raiz).forEach((b) => b.addEventListener("click", () => {
    const passo = Number(b.dataset.zoomMacro);
    if (passo === 0) {
      const tela = $("#telaMacro");
      const svg = $("#telaMacro svg");
      ui.zoomMacro = svg ? Math.min(1.6, Math.max(0.3, (tela.clientWidth - 40) / Number(svg.getAttribute("viewBox").split(" ")[2]))) : 1;
    } else {
      ui.zoomMacro = Math.min(2, Math.max(0.3, Number(((ui.zoomMacro || 1) + passo * 0.15).toFixed(2))));
    }
    render();
  }));

  $$("[data-ligar-macro]", raiz).forEach((b) => b.addEventListener("click", () => {
    ui.ligando = ui.ligando === b.dataset.ligarMacro ? null : b.dataset.ligarMacro;
    render();
  }));

  const tela = $("#telaMacro", raiz);
  if (tela) {
    const idDe = (alvo) => alvo?.closest("[data-bpmn-el]")?.dataset.bpmnEl || null;
    let origem = null;
    let x0 = 0;
    let y0 = 0;
    let arrastando = false;
    let acabou = false;

    tela.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      origem = idDe(e.target);
      x0 = e.clientX;
      y0 = e.clientY;
      arrastando = false;
    });

    tela.addEventListener("pointermove", (e) => {
      if (!origem) return;
      if (!arrastando && Math.hypot(e.clientX - x0, e.clientY - y0) > 6) {
        arrastando = true;
        tela.classList.add("arrastando-forma");
      }
    });

    /* Solta uma peça sobre outra raia: descobre a faixa pela altura do ponteiro,
       porque as formas ficam desenhadas por cima das raias. */
    tela.addEventListener("pointerup", (e) => {
      const de = origem;
      acabou = arrastando;
      origem = null;
      arrastando = false;
      tela.classList.remove("arrastando-forma");
      if (!acabou || !de) return;

      const peca = noMacro(de);
      if (!peca) return;

      const faixa = $$("[data-bpmn-faixa]", tela).find((g) => {
        const r = g.querySelector(".bpmn-faixa-area").getBoundingClientRect();
        return e.clientY >= r.top && e.clientY <= r.bottom;
      });
      if (!faixa) return;

      const destino = faixa.dataset.bpmnFaixa;
      if (!destino) return;
      const chave = ui.agrupar === "fase" ? "faseId" : "setorId";
      if (peca[chave] === destino) return;

      peca[chave] = destino;
      ui.macroSel = de;
      salvar(true);
      render();
    });

    tela.addEventListener("click", (e) => {
      if (acabou) { acabou = false; return; }
      const id = idDe(e.target);
      if (!id || !noMacro(id)) return;
      if (ui.ligando && ui.ligando !== id) {
        const de = noMacro(ui.ligando);
        if (de && !de.proximos.some((x) => x.para === id)) de.proximos.push({ para: id, rotulo: "" });
        ui.ligando = null;
        ui.macroSel = de?.id || id;
        salvar(true);
        return render();
      }
      ui.macroSel = id;
      render();
    });

    tela.addEventListener("dblclick", (e) => {
      const id = idDe(e.target);
      if (id && processo(id)) ir("desenho", { processoId: id, elSel: null });
    });
  }

  if (!sel) return;

  $$("[data-m]", raiz).forEach((campo) => {
    const evento = campo.tagName === "SELECT" ? "change" : "input";
    campo.addEventListener(evento, () => {
      sel[campo.dataset.m] = campo.value;
      salvar();
      if (evento === "change") render();
      else redesenharMacro();
    });
  });

  $$(".saida-row", raiz).forEach((linha) => {
    const saida = sel.proximos.find((x) => x.para === linha.dataset.saida);
    if (!saida) return;
    $("[data-saida-rotulo]", linha)?.addEventListener("input", (e) => {
      saida.rotulo = e.target.value;
      salvar();
      redesenharMacro();
    });
    $("[data-remover-saida]", linha)?.addEventListener("click", () => {
      sel.proximos = sel.proximos.filter((x) => x.para !== saida.para);
      salvar(true);
      render();
    });
  });

  $("[data-remover-macro]", raiz)?.addEventListener("click", () => {
    const nome = sel.nome || sel.pergunta || "esta peça";
    if (!confirm(`Apagar "${nome}"? As ligações que chegam nela também somem.`)) return;
    state.processos = state.processos.filter((x) => x.id !== sel.id);
    state.decisoes = state.decisoes.filter((x) => x.id !== sel.id);
    nosMacro().forEach((n) => { n.proximos = n.proximos.filter((x) => x.para !== sel.id); });
    ui.macroSel = null;
    salvar(true);
    render();
  });
}

let macroTimer = null;
function redesenharMacro() {
  clearTimeout(macroTimer);
  macroTimer = setTimeout(() => {
    const tela = $("#telaMacro");
    const modelo = bpmnDoMapa(ui.agrupar !== "fase");
    if (tela && modelo) tela.innerHTML = bpmnDesenhar(modelo, { interativo: true, selecionado: ui.macroSel, zoom: ui.zoomMacro || 1 });
  }, 450);
}

function viewDesenho() {
  const p = processo(ui.processoId);
  if (!p) return viewFluxo();

  const passos = p.passos || [];
  const sel = passos.find((s) => s.id === ui.elSel) || null;
  const modelo = bpmnDoProcesso(p);
  const zoom = ui.zoom || 1;

  return `
    <div class="desenho">
      <header class="desenho-topo">
        <button class="btn btn-sm btn-ghost" data-editar="${p.id}" type="button">${icon("back", 15)} Voltar ao processo</button>
        <strong class="desenho-nome">${esc(p.nome)}</strong>

        <div class="chips desenho-paleta">
          ${Object.entries(TIPOS).map(([chave, t]) => `
            <button class="chip" data-add-passo="${chave}" type="button" title="Adicionar ${t.rotulo.toLowerCase()}${sel ? " depois do selecionado" : " no fim"}">
              ${icon(chave === "decisao" ? "decisao" : chave === "evidencia" ? "evidencia" : chave === "aprovacao" ? "aprovacao" : "etapa", 14)} ${t.rotulo}
            </button>`).join("")}
        </div>

        <div class="desenho-zoom">
          <button class="icon-btn" data-zoom="-1" type="button" aria-label="Diminuir">−</button>
          <span>${Math.round(zoom * 100)}%</span>
          <button class="icon-btn" data-zoom="1" type="button" aria-label="Aumentar">+</button>
          <button class="btn btn-sm" data-zoom="0" type="button">Ajustar</button>
        </div>
      </header>

      <div class="desenho-corpo">
        <div class="desenho-tela" id="telaBpmn">
          ${modelo
            ? bpmnDesenhar(modelo, { interativo: true, selecionado: ui.elSel, zoom })
            : `<div class="empty desenho-vazio">
                 <strong>Comece pelo primeiro movimento.</strong>
                 <p>Use a paleta acima: cada forma que você adiciona vira um passo na lista do processo.</p>
               </div>`}
        </div>

        <aside class="desenho-lado">
          ${sel ? inspetorDesenho(p, sel, passos.indexOf(sel)) : `
            <div class="drawer-head"><h2>Nada selecionado</h2></div>
            <p class="sub">Clique numa forma do desenho para editar o passo, ou use a paleta acima para criar o próximo.</p>
            <div class="note note-rule" style="margin-top:20px">
              <div class="block-label">Como a ordem funciona</div>
              <p>As setas seguem a ordem dos passos. Arraste uma forma sobre outra para colocá-la antes daquela — a lista se reorganiza junto.</p>
            </div>
          `}
        </aside>
      </div>
    </div>
  `;
}

function inspetorDesenho(p, s, indice) {
  const total = (p.passos || []).length;
  return `
    <div class="drawer-head">
      <h2>Passo ${indice + 1} de ${total}</h2>
    </div>

    <div class="chips" style="margin:12px 0 16px">
      ${Object.entries(TIPOS).map(([chave, t]) => `<button class="chip${s.tipo === chave ? " on" : ""}" data-tipo-desenho="${chave}" type="button">${t.rotulo}</button>`).join("")}
    </div>

    <div class="stack">
      <div class="field">
        <label>O que fazer</label>
        <input data-d-passo="oQue" value="${esc(s.oQue)}" placeholder="Peça a foto da etiqueta" />
      </div>
      <div class="field">
        <label>Quem faz <span class="hint">— a raia</span></label>
        <select data-d-passo="cargoId">
          <option value="">— o dono do processo</option>
          ${state.cargos.map((c) => `<option value="${c.id}"${c.id === s.cargoId ? " selected" : ""}>${esc(c.nome)}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>Como fazer</label>
        <textarea data-d-passo="comoFazer" placeholder="O detalhe prático.">${esc(s.comoFazer)}</textarea>
      </div>

      ${s.tipo === "decisao" ? `
        <div class="field">
          <label>Se sim</label>
          <textarea data-d-passo="seSim" placeholder="Para onde vai o caminho do sim.">${esc(s.seSim || "")}</textarea>
        </div>
        <div class="field">
          <label>Se não <span class="hint">— vira um desvio no desenho</span></label>
          <textarea data-d-passo="seNao" placeholder="Para onde vai o caminho do não.">${esc(s.seNao || "")}</textarea>
        </div>` : ""}
    </div>

    <div class="btn-row" style="margin-top:16px">
      <button class="btn btn-sm" data-ia-desenho type="button">${icon("ia", 15)} IA completar este passo</button>
    </div>
    <p class="hint" style="margin-top:6px">Preenche o que estiver vazio — inclusive o porquê, a armadilha e a regra, que ficam no editor.</p>

    <div class="btn-row" style="margin-top:18px">
      ${indice > 0 ? '<button class="btn btn-sm" data-mover-desenho="-1" type="button">← Antes</button>' : ""}
      ${indice < total - 1 ? '<button class="btn btn-sm" data-mover-desenho="1" type="button">Depois →</button>' : ""}
      <button class="btn btn-sm btn-danger" data-remover-desenho type="button">${icon("trash", 15)} Remover</button>
    </div>

    <p class="hint" style="margin-top:18px">Por quê, armadilha, regra, foto e vídeo continuam no editor do processo — aqui fica o esqueleto do fluxo.</p>
  `;
}

/* Um passo só, completado pela IA. Usado no editor e na tela de desenho. */
async function completarPassoComIA(botao, p, s) {
  if (!s.oQue?.trim() && !s.comoFazer?.trim()) {
    alert('Escreva ao menos "o que fazer" antes — a IA precisa de um ponto de partida.');
    return false;
  }
  const entrada = `${textoDoProcesso(p)}\n\n---\n\nO passo a completar:\n${JSON.stringify(
    { tipo: s.tipo, oQue: s.oQue, comoFazer: s.comoFazer, porque: s.porque, armadilha: s.armadilha, regra: s.regra, seSim: s.seSim, seNao: s.seNao },
    null, 2,
  )}`;
  const sugestao = await comEspera(botao, () => chamarIA("passo", entrada, contextoBase()));
  if (!sugestao) return false;
  if (sugestao.cargoId && !s.cargoId && cargo(sugestao.cargoId)) s.cargoId = sugestao.cargoId;
  preencherVazios(s, sugestao, ["comoFazer", "porque", "armadilha", "regra", "seSim", "seNao"]);
  p.revisado = false;
  salvar(true);
  return true;
}

function ligarDesenho(raiz) {
  const p = processo(ui.processoId);
  if (!p) return;

  /* --- paleta: cada forma adicionada é um passo novo --- */
  $$("[data-add-passo]", raiz).forEach((b) => b.addEventListener("click", () => {
    const passo = novoPasso(b.dataset.addPasso);
    const atual = p.passos.findIndex((s) => s.id === ui.elSel);
    if (atual >= 0) p.passos.splice(atual + 1, 0, passo);
    else p.passos.push(passo);
    ui.elSel = passo.id;
    salvar(true);
    render();
    $('[data-d-passo="oQue"]')?.focus();
  }));

  /* --- zoom --- */
  $$("[data-zoom]", raiz).forEach((b) => b.addEventListener("click", () => {
    const passo = Number(b.dataset.zoom);
    if (passo === 0) {
      const tela = $("#telaBpmn");
      const svg = $("#telaBpmn svg");
      ui.zoom = svg ? Math.min(1.6, Math.max(0.35, (tela.clientWidth - 32) / Number(svg.getAttribute("viewBox").split(" ")[2]))) : 1;
    } else {
      ui.zoom = Math.min(2, Math.max(0.35, Number((ui.zoom + passo * 0.15).toFixed(2))));
    }
    render();
  }));

  /* --- clicar e arrastar, tudo delegado na tela ---
     Delegação, e não um ouvinte por forma: o SVG é reescrito enquanto se
     digita, e ouvintes por forma se acumulariam a cada redesenho. */
  const tela = $("#telaBpmn", raiz);
  if (tela) {
    const idDe = (alvo) => alvo?.closest("[data-bpmn-el]")?.dataset.bpmnEl.split("::")[0] || null;
    const sobOPonteiro = (e) => idDe(document.elementFromPoint(e.clientX, e.clientY));

    let origem = null;
    let inicioX = 0;
    let inicioY = 0;
    let arrastando = false;
    let acabouDeArrastar = false;

    tela.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      origem = idDe(e.target);
      inicioX = e.clientX;
      inicioY = e.clientY;
      arrastando = false;
    });

    tela.addEventListener("pointermove", (e) => {
      if (!origem) return;
      if (!arrastando && Math.hypot(e.clientX - inicioX, e.clientY - inicioY) > 6) {
        arrastando = true;
        tela.classList.add("arrastando-forma");
      }
      if (!arrastando) return;
      $$(".bpmn-alvo", tela).forEach((n) => n.classList.remove("recebendo"));
      const sob = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-bpmn-el]");
      if (sob && idDe(sob) !== origem) sob.classList.add("recebendo");
    });

    tela.addEventListener("pointerup", (e) => {
      const de = origem;
      const arrastou = arrastando;
      origem = null;
      arrastando = false;
      acabouDeArrastar = arrastou;
      tela.classList.remove("arrastando-forma");
      $$(".bpmn-alvo", tela).forEach((n) => n.classList.remove("recebendo"));
      if (!arrastou || !de) return;

      const para = sobOPonteiro(e);
      if (!para || para === de) return;

      const iDe = p.passos.findIndex((s) => s.id === de);
      if (iDe < 0) return;
      const [movido] = p.passos.splice(iDe, 1);
      const iPara = p.passos.findIndex((s) => s.id === para);
      p.passos.splice(iPara < 0 ? p.passos.length : iPara, 0, movido);

      ui.elSel = de;
      salvar(true);
      render();
    });

    tela.addEventListener("pointercancel", () => {
      origem = null;
      arrastando = false;
      tela.classList.remove("arrastando-forma");
    });

    tela.addEventListener("click", (e) => {
      if (acabouDeArrastar) { acabouDeArrastar = false; return; }
      const id = idDe(e.target);
      if (id) { ui.elSel = id; render(); }
    });

    tela.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const id = idDe(e.target);
      if (!id) return;
      e.preventDefault();
      ui.elSel = id;
      render();
    });
  }

  /* --- inspetor --- */
  const sel = p.passos.find((s) => s.id === ui.elSel);
  if (!sel) return;

  $$("[data-d-passo]", raiz).forEach((campo) => {
    const evento = campo.tagName === "SELECT" ? "change" : "input";
    campo.addEventListener(evento, () => {
      sel[campo.dataset.dPasso] = campo.value;
      salvar();
      redesenharTela();
    });
  });

  $$("[data-tipo-desenho]", raiz).forEach((chip) => chip.addEventListener("click", () => {
    sel.tipo = chip.dataset.tipoDesenho;
    salvar(true);
    render();
  }));

  $("[data-ia-desenho]", raiz)?.addEventListener("click", async (evento) => {
    if (await completarPassoComIA(evento.currentTarget, p, sel)) render();
  });

  $$("[data-mover-desenho]", raiz).forEach((b) => b.addEventListener("click", () => {
    const i = p.passos.indexOf(sel);
    const j = i + Number(b.dataset.moverDesenho);
    if (j < 0 || j >= p.passos.length) return;
    p.passos.splice(j, 0, p.passos.splice(i, 1)[0]);
    salvar(true);
    render();
  }));

  $("[data-remover-desenho]", raiz)?.addEventListener("click", () => {
    if (!confirm("Remover este passo do processo?")) return;
    p.passos = p.passos.filter((s) => s.id !== sel.id);
    ui.elSel = null;
    salvar(true);
    render();
  });
}

/* Redesenha só o SVG enquanto se digita, para o cursor não sair do campo. */
let telaTimer = null;
function redesenharTela() {
  clearTimeout(telaTimer);
  telaTimer = setTimeout(() => {
    const tela = $("#telaBpmn");
    const p = processo(ui.processoId);
    if (!tela || !p) return;
    const modelo = bpmnDoProcesso(p);
    if (!modelo) return;
    tela.innerHTML = bpmnDesenhar(modelo, { interativo: true, selecionado: ui.elSel, zoom: ui.zoom || 1 });
  }, 450);
}

/* ---------------------------------------------------------------- aula */

function viewAula() {
  const p = processo(ui.processoId);
  if (!p) return viewFluxo();

  const passos = p.passos || [];
  const total = passos.length + 2; // abertura + passos + fechamento
  const i = Math.max(0, Math.min(ui.passoIdx, total - 1));

  const trilho = Array.from({ length: total }, (_, n) => {
    const cls = n < i ? "done" : n === i ? "now" : "";
    return `<i class="${cls}"></i>`;
  }).join("");

  let corpo;
  if (i === 0) corpo = telaAbertura(p);
  else if (i <= passos.length) corpo = telaPasso(p, passos[i - 1], i, passos.length);
  else corpo = telaFinal(p);

  return `
    <div class="lesson">
      <div class="lesson-top">
        <button class="btn btn-sm btn-ghost" data-go="fluxo" type="button">${icon("back", 15)} Fluxo macro</button>
        <button class="btn btn-sm btn-ghost spacer" data-editar="${p.id}" type="button">${icon("edit", 15)} Editar</button>
      </div>
      <div class="rail">${trilho}</div>
      ${corpo}
      <div class="lesson-nav">
        ${i > 0 ? '<button class="btn" data-passo="-1" type="button">Anterior</button>' : ""}
        ${i < total - 1
          ? `<button class="btn btn-primary" data-passo="1" type="button">${i === 0 ? "Começar" : "Próximo passo"}</button>`
          : '<button class="btn btn-primary" data-go="fluxo" type="button">Concluir</button>'}
      </div>
    </div>
  `;
}

function telaAbertura(p) {
  const dono = cargo(p.donoCargoId);
  const envolvidos = p.cargosIds.map((id) => cargo(id)?.nome).filter(Boolean);
  const passos = p.passos || [];
  return `
    <div class="card">
      <div class="lesson-kicker">
        <span class="tag navy">${esc(fase(p.faseId)?.nome || "sem fase")}</span>
        <span class="counter">abertura</span>
      </div>
      <h2 class="step-title">${esc(p.nome)}</h2>
      ${envolvidos.length ? `<p class="step-sub">Quem executa: ${esc(envolvidos.join(", "))}${dono ? ` · dono do processo: ${esc(dono.nome)}` : ""}</p>` : ""}

      ${p.porque?.trim() ? `<div class="block">
        <div class="block-label">Por que esse processo existe</div>
        <p>${esc(p.porque)}</p>
      </div>` : ""}

      ${p.seErrar?.trim() ? `<div class="note note-trap">
        <div class="block-label">O que acontece quando sai errado</div>
        <p>${esc(p.seErrar)}</p>
      </div>` : ""}

      ${p.videoUrl?.trim() ? `<div class="block">
        <div class="block-label">Veja o processo inteiro em vídeo</div>
        ${video(p.videoUrl, "Assistir")}
      </div>` : ""}

      ${(p.anexos || []).length ? `<div class="block">
        <div class="block-label">Material que você vai usar</div>
        <div class="btn-row">
          ${p.anexos.map((a) => {
            const url = linkSeguro(a.url);
            return url
              ? `<a class="btn btn-sm link-btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${icon("link", 14)} ${esc(a.titulo || "anexo")}</a>`
              : `<span class="tag amber">${esc(a.titulo || "anexo")} — sem link ainda</span>`;
          }).join("")}
        </div>
      </div>` : ""}

      ${passos.length ? `<div class="block">
        <div class="block-label">O fluxo em BPMN 2.0</div>
        ${blocoBpmn(bpmnDoProcesso(p), "")}
      </div>` : ""}

      ${passos.length ? `<div class="block">
        <div class="block-label">O caminho inteiro — ${passos.length} passos</div>
        <div class="map-list">
          ${passos.map((s, n) => `
            <button class="map-item" data-ir-passo="${n + 1}" type="button">
              <span class="n">${n + 1}</span>
              <span>
                <strong>${esc(s.oQue || "passo sem título")}</strong><br>
                <span class="tag ${TIPOS[s.tipo]?.classe || ""}" style="margin-top:4px">${TIPOS[s.tipo]?.rotulo || "Etapa"}</span>
              </span>
            </button>
          `).join("")}
        </div>
      </div>` : '<div class="block"><div class="empty">Esse processo ainda não tem passos. Clique em Editar para escrever o primeiro.</div></div>'}
    </div>
  `;
}

function telaPasso(p, s, i, totalPassos) {
  const t = TIPOS[s.tipo] || TIPOS.etapa;
  return `
    <div class="card">
      <div class="lesson-kicker">
        <span class="tag ${t.classe}">${icon(s.tipo === "decisao" ? "decisao" : s.tipo === "evidencia" ? "evidencia" : s.tipo === "aprovacao" ? "aprovacao" : "etapa", 14)} ${t.rotulo}</span>
        <span class="counter">passo ${i} de ${totalPassos}</span>
      </div>

      <h2 class="step-title">${esc(s.oQue || "passo sem título")}</h2>
      ${s.comoFazer?.trim() ? `<p class="step-sub">${esc(s.comoFazer)}</p>` : ""}

      ${s.imagem
        ? `<div class="shot"><img src="${esc(s.imagem)}" alt="Exemplo real do passo ${i}"></div>`
        : (s.videoUrl?.trim() ? "" : '<div class="shot"><div class="shot-empty">Sem exemplo ainda. Um print, foto ou vídeo real aqui é o que faz esse passo grudar.</div></div>')}

      ${s.videoUrl?.trim() ? `<div class="block">
        <div class="block-label">Veja sendo feito</div>
        ${video(s.videoUrl, "Assistir")}
      </div>` : ""}

      ${s.tipo === "decisao" && (s.seSim?.trim() || s.seNao?.trim()) ? `<div class="forks">
        ${s.seSim?.trim() ? `<div class="fork yes"><strong>Se sim</strong><p>${esc(s.seSim)}</p></div>` : ""}
        ${s.seNao?.trim() ? `<div class="fork no"><strong>Se não</strong><p>${esc(s.seNao)}</p></div>` : ""}
      </div>` : ""}

      ${s.porque?.trim() ? `<div class="note note-why">
        <div class="block-label">Por quê</div>
        <p>${esc(s.porque)}</p>
      </div>` : ""}

      ${s.armadilha?.trim() ? `<div class="note note-trap">
        <div class="block-label">Onde todo mundo erra</div>
        <p>${esc(s.armadilha)}</p>
      </div>` : ""}

      ${s.regra?.trim() ? `<div class="note note-rule">
        <div class="block-label">A regra</div>
        <p>${esc(s.regra)}</p>
      </div>` : ""}
    </div>
  `;
}

function telaFinal(p) {
  const armadilhas = (p.passos || []).filter((s) => s.armadilha?.trim());
  const perguntas = p.perguntas || [];
  return `
    <div class="card">
      <div class="lesson-kicker"><span class="tag green">Fechamento</span></div>
      <h2 class="step-title">Antes de sair, guarde isso</h2>

      ${armadilhas.length ? `<div class="block">
        <div class="block-label">Os erros que mais custam caro</div>
        <div class="map-list">
          ${armadilhas.map((s) => `<div class="map-item" style="border-color:#f0cdd0;background:var(--red-bg)"><span style="color:var(--red)">${esc(s.armadilha)}</span></div>`).join("")}
        </div>
      </div>` : ""}

      ${perguntas.length ? `<div class="block">
        <div class="block-label">Teste você mesmo</div>
        <div class="quiz">
          ${perguntas.map((q) => `<details><summary>${esc(q.pergunta)}</summary><p>${esc(q.resposta)}</p></details>`).join("")}
        </div>
      </div>` : '<div class="block"><div class="empty">Sem perguntas de checagem ainda. Três boas perguntas de situação valem mais que dez páginas de texto.</div></div>'}
    </div>
  `;
}

/* ---------------------------------------------------------------- editor */

function viewEditor() {
  const p = processo(ui.processoId);
  if (!p) return viewFluxo();

  return `
    <div class="editor">
      <div class="lesson-top">
        <button class="btn btn-sm btn-ghost" data-ver-aula="${p.id}" type="button">${icon("back", 15)} Ver como aula</button>
        <span class="spacer"></span>
        <button class="btn btn-sm btn-danger" data-apagar-processo="${p.id}" type="button">${icon("trash", 15)} Apagar processo</button>
      </div>

      ${p.revisado === false ? `<div class="note note-trap" style="margin-bottom:18px">
        <div class="block-label">Rascunho da IA — ainda não revisado</div>
        <p>Confira cada passo, principalmente prazo, valor e qualquer coisa que dependa de norma técnica. Enquanto não for revisado, este processo não conta como pronto.</p>
        <div class="btn-row" style="margin-top:12px">
          <button class="btn btn-sm" data-revisar="${p.id}" type="button">${icon("ok", 15)} Revisei — pode contar como pronto</button>
        </div>
      </div>` : ""}

      <div class="stack">
        <div class="field">
          <label for="e-nome">Nome do processo</label>
          <input id="e-nome" data-p="nome" value="${esc(p.nome)}" />
        </div>

        <div class="field-grid">
          <div class="field">
            <label for="e-fase">Fase do fluxo</label>
            <select id="e-fase" data-p="faseId">${opcoes(state.fases, p.faseId)}</select>
          </div>
          <div class="field">
            <label for="e-setor">Setor</label>
            <select id="e-setor" data-p="setorId">${opcoes(state.setores, p.setorId)}</select>
          </div>
          <div class="field">
            <label for="e-dono">Dono do processo</label>
            <select id="e-dono" data-p="donoCargoId">${opcoes(state.cargos, p.donoCargoId)}</select>
          </div>
        </div>

        <div class="field">
          <label>Quem executa</label>
          <div class="chips">
            ${state.cargos.map((c) => `<button class="chip${p.cargosIds.includes(c.id) ? " on" : ""}" data-toggle-cargo="${c.id}" type="button">${esc(c.nome)}</button>`).join("")}
          </div>
        </div>

        <div class="field-grid">
          <div class="field">
            <label for="e-entrada">O que chega <span class="hint">— a entrada</span></label>
            <input id="e-entrada" data-p="entrada" value="${esc(p.entrada || "")}" placeholder="Proposta aprovada pelo cliente" />
          </div>
          <div class="field">
            <label for="e-saida">O que sai <span class="hint">— a saída</span></label>
            <input id="e-saida" data-p="saida" value="${esc(p.saida || "")}" placeholder="Pedido criado no sistema" />
          </div>
        </div>

        <div class="field">
          <label for="e-porque">Por que esse processo existe</label>
          <textarea id="e-porque" data-p="porque" placeholder="O que ele protege, o que ele garante. Fale como você explicaria pro seu filho.">${esc(p.porque)}</textarea>
        </div>

        <div class="field">
          <label for="e-erro">O que acontece quando sai errado</label>
          <textarea id="e-erro" data-p="seErrar" placeholder="O prejuízo concreto. É isso que faz a pessoa levar a sério.">${esc(p.seErrar)}</textarea>
        </div>

        <div class="field">
          <label for="e-video">Vídeo do processo inteiro <span class="hint">— link do YouTube, opcional</span></label>
          <input id="e-video" data-p="videoUrl" value="${esc(p.videoUrl || "")}" placeholder="https://www.youtube.com/watch?v=..." />
        </div>
      </div>

      <div class="section-title"><h3>Material de apoio</h3><span class="line"></span></div>
      <p class="hint">Modelo, planilha, tabela de preço — o que a pessoa precisa abrir enquanto executa.</p>
      <div class="stack" style="margin-top:12px">
        ${(p.anexos || []).map((a) => `
          <div class="anexo-row" data-anexo-id="${a.id}">
            <input data-a="titulo" value="${esc(a.titulo)}" placeholder="Nome do material" />
            <input data-a="url" value="${esc(a.url || "")}" placeholder="https://..." />
            <button class="btn btn-sm btn-ghost" data-remover-anexo type="button" aria-label="Remover">${icon("trash", 15)}</button>
          </div>`).join("") || '<div class="empty">Nenhum material vinculado.</div>'}
      </div>
      <div class="btn-row" style="margin-top:12px">
        <button class="btn" data-novo-anexo type="button">${icon("plus")} Novo material</button>
      </div>

      ${(p.passos || []).length ? `
        <div class="section-title">
          <h3>Fluxograma BPMN 2.0</h3><span class="line"></span>
          <button class="btn btn-sm" data-desenhar="${p.id}" type="button">${icon("edit", 15)} Desenhar em tela cheia</button>
        </div>
        <p class="hint">Desenhado a partir dos passos — e você também pode fazer o contrário: desenhe na tela cheia e os passos aparecem aqui.</p>
        <div id="bpmnEditor">${blocoBpmn(bpmnDoProcesso(p), "")}</div>
      ` : `
        <div class="section-title"><h3>Fluxograma BPMN 2.0</h3><span class="line"></span></div>
        <div class="empty">
          Sem passos ainda. Escreva abaixo, ou
          <button class="btn btn-sm" data-desenhar="${p.id}" type="button" style="margin-left:6px">${icon("edit", 15)} desenhe o fluxo</button>
          e os passos aparecem sozinhos.
        </div>
      `}

      <div class="section-title"><h3>Os passos</h3><span class="line"></span><span style="color:var(--ink-3);font-size:13px">${(p.passos || []).length}</span></div>

      <div id="passosLista">
        ${(p.passos || []).map((s, i) => editorPasso(s, i, p.passos.length)).join("") || '<div class="empty">Nenhum passo ainda. Comece pelo primeiro movimento que a pessoa faz.</div>'}
      </div>
      <div class="btn-row" style="margin-top:12px">
        <button class="btn" data-novo-passo type="button">${icon("plus")} Novo passo</button>
      </div>

      <div class="section-title"><h3>Perguntas de checagem</h3><span class="line"></span></div>
      <div id="perguntasLista" class="stack">
        ${(p.perguntas || []).map(editorPergunta).join("") || '<div class="empty">Três perguntas de situação no fim da aula valem mais que dez páginas de texto.</div>'}
      </div>
      <div class="btn-row" style="margin-top:12px">
        <button class="btn" data-nova-pergunta type="button">${icon("plus")} Nova pergunta</button>
        <button class="btn" data-ia-perguntas type="button">${icon("ia", 15)} IA escrever 3 perguntas</button>
      </div>
    </div>
  `;
}

function opcoes(lista, atual) {
  return lista.map((item) => `<option value="${esc(item.id)}"${item.id === atual ? " selected" : ""}>${esc(item.nome)}</option>`).join("");
}

function editorPasso(s, i, total) {
  return `
    <div class="step-editor" style="border-left-color:${TIPOS[s.tipo]?.cor || "var(--line-2)"}" data-passo-id="${s.id}">
      <div class="step-editor-head">
        <span class="num">${i + 1}</span>
        <div class="chips">
          ${Object.entries(TIPOS).map(([chave, t]) => `<button class="chip${s.tipo === chave ? " on" : ""}" data-tipo="${chave}" type="button">${t.rotulo}</button>`).join("")}
        </div>
        <span class="spacer"></span>
        <button class="btn btn-sm btn-ghost" data-ia-passo type="button" title="IA preenche só os campos vazios deste passo">${icon("ia", 15)}</button>
        ${i > 0 ? `<button class="btn btn-sm btn-ghost" data-mover="-1" type="button" aria-label="Subir">${icon("up", 15)}</button>` : ""}
        ${i < total - 1 ? `<button class="btn btn-sm btn-ghost" data-mover="1" type="button" aria-label="Descer">${icon("down", 15)}</button>` : ""}
        <button class="btn btn-sm btn-ghost" data-remover-passo type="button" aria-label="Remover">${icon("trash", 15)}</button>
      </div>

      <div class="stack">
        <div class="field-grid">
          <div class="field">
            <label>O que fazer</label>
            <input data-s="oQue" value="${esc(s.oQue)}" placeholder="Uma frase, verbo na frente. Ex: Peça a foto da etiqueta." />
          </div>
          <div class="field">
            <label>Quem faz <span class="hint">— a raia no BPMN</span></label>
            <select data-s="cargoId">
              <option value="">— o dono do processo</option>
              ${state.cargos.map((c) => `<option value="${c.id}"${c.id === s.cargoId ? " selected" : ""}>${esc(c.nome)}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="field">
          <label>Como fazer</label>
          <textarea data-s="comoFazer" placeholder="O detalhe prático. A ordem, as palavras, a ferramenta.">${esc(s.comoFazer)}</textarea>
        </div>

        ${s.tipo === "decisao" ? `
          <div class="field-grid">
            <div class="field">
              <label>Se sim</label>
              <textarea data-s="seSim" placeholder="Para onde vai o caminho do sim.">${esc(s.seSim || "")}</textarea>
            </div>
            <div class="field">
              <label>Se não</label>
              <textarea data-s="seNao" placeholder="Para onde vai o caminho do não.">${esc(s.seNao || "")}</textarea>
            </div>
          </div>` : ""}

        <div class="field">
          <label>Exemplo real (print ou foto)</label>
          <div class="thumb">
            ${s.imagem ? `<img src="${esc(s.imagem)}" alt="Exemplo do passo ${i + 1}">` : ""}
            <label class="btn btn-sm file-label">${s.imagem ? "Trocar" : "Escolher imagem"}<input type="file" accept="image/*" data-imagem></label>
            ${s.imagem ? '<button class="btn btn-sm btn-ghost" data-remover-imagem type="button">Remover</button>' : ""}
          </div>
        </div>

        <div class="field">
          <label>Vídeo deste passo <span class="hint">— link do YouTube, opcional</span></label>
          <input data-s="videoUrl" value="${esc(s.videoUrl || "")}" placeholder="https://www.youtube.com/watch?v=..." />
        </div>

        <div class="field">
          <label>Por quê</label>
          <textarea data-s="porque" placeholder="A razão. É o que faz a pessoa lembrar quando estiver sozinha em campo.">${esc(s.porque)}</textarea>
        </div>
        <div class="field">
          <label>Onde todo mundo erra</label>
          <textarea data-s="armadilha" placeholder="O erro que você já viu acontecer. Seja específico.">${esc(s.armadilha)}</textarea>
        </div>
        <div class="field">
          <label>A regra</label>
          <textarea data-s="regra" placeholder="O inegociável, ou quando parar e chamar o supervisor.">${esc(s.regra)}</textarea>
        </div>
      </div>
    </div>
  `;
}

function editorPergunta(q) {
  return `
    <div class="step-editor" data-pergunta-id="${q.id}">
      <div class="step-editor-head">
        <span class="num">situação</span>
        <span class="spacer"></span>
        <button class="btn btn-sm btn-ghost" data-remover-pergunta type="button" aria-label="Remover">${icon("trash", 15)}</button>
      </div>
      <div class="stack">
        <div class="field">
          <label>A situação</label>
          <input data-q="pergunta" value="${esc(q.pergunta)}" placeholder="Chegou um cliente pedindo X. O que você faz?" />
        </div>
        <div class="field">
          <label>A resposta certa</label>
          <textarea data-q="resposta" placeholder="O que a pessoa deveria fazer, e por quê.">${esc(q.resposta)}</textarea>
        </div>
      </div>
    </div>
  `;
}

/* ---------------------------------------------------------------- trilha do cargo */

function viewTrilha() {
  const c = cargo(ui.cargoSel);
  if (!c) return viewOrganograma();

  const chefe = cargo(c.reportaA);
  const lidera = state.cargos.filter((x) => x.reportaA === c.id);
  const procs = processosDoCargo(c.id);
  const trilha = c.trilha || [];
  const obrigatorios = trilha.filter((t) => t.obrigatorio).length;

  return `
    <div class="lesson">
      <div class="lesson-top">
        <button class="btn btn-sm btn-ghost" data-go="organograma" type="button">${icon("back", 15)} Organograma</button>
        <button class="btn btn-sm btn-ghost spacer" data-editar-cargo="${c.id}" type="button">${icon("edit", 15)} Editar cargo e trilha</button>
      </div>

      <div class="page-head">
        <span class="eyebrow">Trilha de conhecimento</span>
        <h1>${esc(c.nome)}</h1>
        <div class="btn-row" style="margin-top:10px">
          <span class="tag" style="background:${corSetor(c.setorId)}1a;color:${corSetor(c.setorId)}">${esc(setor(c.setorId)?.nome || "sem setor")}</span>
          ${chefe ? `<span class="tag">responde a ${esc(chefe.nome)}</span>` : '<span class="tag">topo da hierarquia</span>'}
          ${lidera.length ? `<span class="tag">lidera ${esc(lidera.map((x) => x.nome).join(", "))}</span>` : ""}
        </div>
      </div>

      <div class="card">
        ${c.missao?.trim() ? `<div class="block" style="margin-top:0">
          <div class="block-label">Por que esse cargo existe</div>
          <p>${esc(c.missao)}</p>
        </div>` : ""}

        ${linhas(c.expectativas).length ? `<div class="block">
          <div class="block-label">O que se espera de quem ocupa</div>
          <ul class="lista">${linhas(c.expectativas).map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
        </div>` : ""}

        ${linhas(c.conhecimentos).length ? `<div class="block">
          <div class="block-label">O que você precisa dominar</div>
          <ul class="lista">${linhas(c.conhecimentos).map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
        </div>` : ""}

        ${!c.missao?.trim() && !linhas(c.expectativas).length && !linhas(c.conhecimentos).length
          ? '<div class="empty">Esse cargo ainda não tem missão nem expectativas escritas. Clique em editar para começar.</div>' : ""}
      </div>

      <div class="section-title"><h3>Processos obrigatórios</h3><span class="line"></span><span class="muted">${procs.length}</span></div>
      <p class="hint">Essa lista se monta sozinha: todo processo que marca este cargo em "quem executa" aparece aqui.</p>
      ${procs.length ? `<div class="stack" style="margin-top:12px">
        ${procs.map((p) => `
          <button class="proc-card" style="border-left-color:${corSetor(p.setorId)}" data-processo="${p.id}" type="button">
            <strong>${esc(p.nome)}</strong>
            <span class="proc-meta">
              <span class="tag ${mapeado(p) ? "green" : "amber"}"><span class="tag-dot"></span>${mapeado(p) ? "pronto" : "em construção"}</span>
              <span>${esc(fase(p.faseId)?.nome || "sem fase")}</span>
              <span>${(p.passos || []).length} subprocessos</span>
              ${faltando(p).length ? `<span class="tag red">falta ${esc(faltando(p).join(", "))}</span>` : ""}
            </span>
          </button>`).join("")}
      </div>` : '<div class="empty">Nenhum processo vincula este cargo ainda. Marque o cargo em "quem executa" dentro de um processo.</div>'}

      <div class="section-title"><h3>Treinamentos</h3><span class="line"></span><span class="muted">${obrigatorios ? `${obrigatorios} obrigatório${obrigatorios === 1 ? "" : "s"}` : trilha.length}</span></div>
      ${trilha.length ? `<div class="stack" style="margin-top:12px">${trilha.map(itemTrilha).join("")}</div>`
        : '<div class="empty">Sem treinamento cadastrado. Vídeo do YouTube, curso, leitura ou prática acompanhada entram aqui.</div>'}
    </div>
  `;
}

function itemTrilha(t) {
  const tipo = TIPOS_TRILHA[t.tipo] || TIPOS_TRILHA.leitura;
  const doc = t.tipo === "documento" ? documento(t.documentoId) : null;
  const url = linkSeguro(t.url);
  return `
    <div class="learn-item">
      <div class="learn-head">
        <span class="tag ${tipo.classe}">${icon(t.tipo, 14)} ${tipo.rotulo}</span>
        ${t.obrigatorio ? '<span class="tag red">obrigatório</span>' : ""}
        ${t.duracao?.trim() ? `<span class="muted">${esc(t.duracao)}</span>` : ""}
      </div>
      <h3>${esc(t.titulo || "sem título")}</h3>
      ${t.nota?.trim() ? `<p class="muted">${esc(t.nota)}</p>` : ""}
      ${t.tipo === "video" ? video(t.url) : ""}
      ${t.tipo !== "video" && url ? `<a class="btn btn-sm link-btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${icon("link", 14)} Abrir</a>` : ""}
      ${doc ? `<button class="btn btn-sm link-btn" data-doc="${doc.id}" type="button">${icon("documento", 14)} ${esc(doc.titulo)}</button>` : ""}
    </div>
  `;
}

function viewCargoEditor() {
  const c = cargo(ui.cargoSel);
  if (!c) return viewOrganograma();

  return `
    <div class="editor">
      <div class="lesson-top">
        <button class="btn btn-sm btn-ghost" data-cargo="${c.id}" type="button">${icon("back", 15)} Ver a trilha</button>
        <span class="spacer"></span>
        <button class="btn btn-sm btn-danger" data-apagar-cargo type="button">${icon("trash", 15)} Apagar cargo</button>
      </div>

      <div class="stack">
        <div class="field">
          <label for="c-nome">Nome do cargo</label>
          <input id="c-nome" data-c="nome" value="${esc(c.nome)}" />
        </div>

        <div class="field-grid">
          <div class="field">
            <label for="c-setor">Setor</label>
            <select id="c-setor" data-c="setorId">${opcoes(state.setores, c.setorId)}</select>
          </div>
          <div class="field">
            <label for="c-chefe">Responde a</label>
            <select id="c-chefe" data-c="reportaA">
              <option value="">— ninguém (topo)</option>
              ${state.cargos.filter((x) => x.id !== c.id).map((x) => `<option value="${x.id}"${x.id === c.reportaA ? " selected" : ""}>${esc(x.nome)}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field">
          <label for="c-missao">Por que esse cargo existe</label>
          <textarea id="c-missao" data-c="missao" placeholder="Uma frase. Se sumisse amanhã, o que deixaria de acontecer?">${esc(c.missao)}</textarea>
        </div>

        <div class="field">
          <label for="c-exp">O que se espera de quem ocupa <span class="hint">— uma por linha</span></label>
          <textarea id="c-exp" data-c="expectativas" placeholder="Responder rápido, orçar com evidência...&#10;Registrar tudo...&#10;Escalar exceção antes de prometer...">${esc(c.expectativas)}</textarea>
        </div>

        <div class="field">
          <label for="c-conh">O que precisa dominar <span class="hint">— um tema por linha</span></label>
          <textarea id="c-conh" data-c="conhecimentos" placeholder="Tipos de extintor e classe de fogo&#10;Regras comerciais&#10;Atendimento no WhatsApp">${esc(c.conhecimentos)}</textarea>
        </div>

        <div class="btn-row">
          <button class="btn" data-ia-cargo type="button">${icon("ia", 15)} IA descrever este cargo</button>
          <span class="hint" style="align-self:center">preenche só o que está vazio, a partir dos processos que ele executa</span>
        </div>
      </div>

      <div class="section-title"><h3>Treinamentos</h3><span class="line"></span><span class="muted">${(c.trilha || []).length}</span></div>
      <p class="hint">Os processos obrigatórios não entram aqui — eles vêm sozinhos do vínculo com o processo.</p>

      <div style="margin-top:12px">
        ${(c.trilha || []).map(editorTrilha).join("") || '<div class="empty">Nenhum treinamento ainda.</div>'}
      </div>
      <div class="btn-row" style="margin-top:12px">
        <button class="btn" data-novo-treino type="button">${icon("plus")} Novo treinamento</button>
        <button class="btn" data-ia-trilha type="button">${icon("ia", 15)} IA sugerir treinamentos</button>
      </div>
    </div>
  `;
}

function editorTrilha(t) {
  return `
    <div class="step-editor" data-trilha-id="${t.id}">
      <div class="step-editor-head">
        <div class="chips">
          ${Object.entries(TIPOS_TRILHA).map(([chave, meta]) => `<button class="chip${t.tipo === chave ? " on" : ""}" data-tipo-trilha="${chave}" type="button">${meta.rotulo}</button>`).join("")}
        </div>
        <span class="spacer"></span>
        <button class="btn btn-sm btn-ghost" data-remover-treino type="button" aria-label="Remover">${icon("trash", 15)}</button>
      </div>

      <div class="stack">
        <div class="field">
          <label>Título</label>
          <input data-t="titulo" value="${esc(t.titulo)}" placeholder="Classes de fogo e tipos de extintor" />
        </div>

        ${t.tipo === "documento" ? `
        <div class="field">
          <label>Qual documento</label>
          <select data-t="documentoId">
            <option value="">— escolha na biblioteca</option>
            ${state.documentos.map((d) => `<option value="${d.id}"${d.id === t.documentoId ? " selected" : ""}>${esc(d.titulo)}</option>`).join("")}
          </select>
        </div>` : `
        <div class="field">
          <label>Link ${t.tipo === "video" ? "do YouTube" : "(opcional)"}</label>
          <input data-t="url" value="${esc(t.url || "")}" placeholder="${t.tipo === "video" ? "https://www.youtube.com/watch?v=..." : "https://..."}" />
        </div>`}

        <div class="field-grid">
          <div class="field">
            <label>Duração estimada</label>
            <input data-t="duracao" value="${esc(t.duracao || "")}" placeholder="30 min, 1 semana..." />
          </div>
          <div class="field">
            <label>Cobrança</label>
            <div class="chips">
              <button class="chip${t.obrigatorio ? " on" : ""}" data-obrigatorio type="button">${t.obrigatorio ? "Obrigatório" : "Opcional"}</button>
            </div>
          </div>
        </div>

        <div class="field">
          <label>Observação</label>
          <textarea data-t="nota" placeholder="Quando fazer, o que observar, o que cobrar depois.">${esc(t.nota || "")}</textarea>
        </div>
      </div>
    </div>
  `;
}

function ligarCargoEditor(raiz) {
  const c = cargo(ui.cargoSel);
  if (!c) return;

  $$("[data-c]", raiz).forEach((campo) => {
    const evento = campo.tagName === "SELECT" ? "change" : "input";
    campo.addEventListener(evento, () => {
      const chave = campo.dataset.c;

      /* Mesma trava do arrastar: sem isso, escolher aqui um chefe que já está
         abaixo deste cargo fecha um ciclo e a árvore fica sem raiz. */
      if (chave === "reportaA") {
        const alvo = campo.value || null;
        if (alvo && (alvo === c.id || descendeDe(alvo, c.id))) {
          alert(`"${cargo(alvo).nome}" já está abaixo de "${c.nome}". Isso deixaria o organograma sem topo.`);
          campo.value = c.reportaA || "";
          return;
        }
        c.reportaA = alvo;
        salvar(true);
        render();
        return;
      }

      c[chave] = campo.value;
      salvar(chave === "setorId");
    });
  });

  $$(".step-editor[data-trilha-id]", raiz).forEach((bloco) => {
    const t = c.trilha.find((x) => x.id === bloco.dataset.trilhaId);
    if (!t) return;

    $$("[data-t]", bloco).forEach((campo) => {
      const evento = campo.tagName === "SELECT" ? "change" : "input";
      campo.addEventListener(evento, () => { t[campo.dataset.t] = campo.value; salvar(); });
    });

    $$("[data-tipo-trilha]", bloco).forEach((chip) => chip.addEventListener("click", () => {
      t.tipo = chip.dataset.tipoTrilha;
      salvar(true);
      render();
    }));

    $("[data-obrigatorio]", bloco)?.addEventListener("click", () => {
      t.obrigatorio = !t.obrigatorio;
      salvar(true);
      render();
    });

    $("[data-remover-treino]", bloco)?.addEventListener("click", () => {
      if (!confirm("Remover este treinamento?")) return;
      c.trilha = c.trilha.filter((x) => x.id !== t.id);
      salvar(true);
      render();
    });
  });

  const textoDoCargo = () => {
    const procs = processosDoCargo(c.id).map((p) => `- ${p.nome} (${fase(p.faseId)?.nome || "sem fase"})`).join("\n");
    return [
      `Cargo: ${c.nome}`,
      `Setor: ${setor(c.setorId)?.nome || "—"}`,
      cargo(c.reportaA) ? `Responde a: ${cargo(c.reportaA).nome}` : "Topo da hierarquia",
      c.missao ? `Missão já escrita: ${c.missao}` : "",
      c.conhecimentos ? `Conhecimentos já escritos:\n${c.conhecimentos}` : "",
      procs ? `\nProcessos que ele executa:\n${procs}` : "\nAinda não tem processo vinculado.",
    ].filter(Boolean).join("\n");
  };

  $("[data-ia-cargo]", raiz)?.addEventListener("click", async (evento) => {
    const sugestao = await comEspera(evento.currentTarget, () => chamarIA("cargo", textoDoCargo(), contextoBase()));
    if (!sugestao) return;
    if (sugestao.missao && !c.missao?.trim()) c.missao = sugestao.missao;
    if (!c.expectativas?.trim()) c.expectativas = (sugestao.expectativas || []).join("\n");
    if (!c.conhecimentos?.trim()) c.conhecimentos = (sugestao.conhecimentos || []).join("\n");
    salvar(true);
    render();
  });

  $("[data-ia-trilha]", raiz)?.addEventListener("click", async (evento) => {
    const resultado = await comEspera(evento.currentTarget, () => chamarIA("trilha", textoDoCargo(), contextoBase()));
    if (!resultado) return;
    c.trilha = [
      ...(c.trilha || []),
      ...(resultado.trilha || []).map((t) => ({
        id: uid("t"),
        tipo: TIPOS_TRILHA[t.tipo] ? t.tipo : "leitura",
        titulo: t.titulo || "",
        url: "",
        duracao: t.duracao || "",
        obrigatorio: !!t.obrigatorio,
        nota: t.nota || "",
        documentoId: "",
      })),
    ];
    salvar(true);
    render();
  });

  $("[data-novo-treino]", raiz)?.addEventListener("click", () => {
    c.trilha = c.trilha || [];
    c.trilha.push({ id: uid("t"), tipo: "video", titulo: "", url: "", duracao: "", obrigatorio: true, nota: "", documentoId: "" });
    salvar(true);
    render();
  });

  $("[data-apagar-cargo]", raiz)?.addEventListener("click", () => {
    if (!confirm(`Apagar o cargo "${c.nome}"? Quem responde a ele passa a responder ao chefe dele.`)) return;
    state.cargos.filter((x) => x.reportaA === c.id).forEach((x) => { x.reportaA = c.reportaA; });
    state.cargos = state.cargos.filter((x) => x.id !== c.id);
    state.processos.forEach((p) => {
      p.cargosIds = p.cargosIds.filter((id) => id !== c.id);
      if (p.donoCargoId === c.id) p.donoCargoId = "";
    });
    salvar(true);
    ir("organograma", { cargoSel: null });
  });
}

/* ---------------------------------------------------------------- biblioteca */

function viewBiblioteca() {
  return `
    <div class="page">
      <div class="page-head head-row">
        <div>
          <span class="eyebrow">Biblioteca</span>
          <h1>RH, regras e políticas</h1>
          <p>Regimento interno, política comercial, manuais. O que vale para a empresa inteira e não cabe dentro de um processo específico.</p>
        </div>
        <button class="btn" data-novo-doc type="button">${icon("plus")} Novo documento</button>
      </div>

      ${state.documentos.length ? `<div class="doc-grid">
        ${state.documentos.map((d) => `
          <button class="doc-card" data-doc="${d.id}" type="button">
            <div class="btn-row">
              <span class="tag red">${esc(d.categoria || "geral")}</span>
              <span class="tag">${esc(d.escopo || "empresa")}</span>
            </div>
            <h3>${esc(d.titulo)}</h3>
            <p>${esc(d.resumo)}</p>
            <div class="btn-row">
              ${linkSeguro(d.url) ? `<span class="tag navy">${icon("link", 13)} tem link</span>` : '<span class="tag amber">sem arquivo</span>'}
              ${youtubeId(d.videoUrl) ? `<span class="tag navy">${icon("video", 13)} tem vídeo</span>` : ""}
            </div>
          </button>`).join("")}
      </div>` : '<div class="empty">Nenhum documento ainda. O regimento interno costuma ser o primeiro.</div>'}
    </div>
  `;
}

function viewDocEditor() {
  const d = documento(ui.docId);
  if (!d) return viewBiblioteca();

  const url = linkSeguro(d.url);
  return `
    <div class="editor">
      <div class="lesson-top">
        <button class="btn btn-sm btn-ghost" data-go="biblioteca" type="button">${icon("back", 15)} Biblioteca</button>
        <span class="spacer"></span>
        <button class="btn btn-sm btn-danger" data-apagar-doc type="button">${icon("trash", 15)} Apagar</button>
      </div>

      <div class="stack">
        <div class="field">
          <label for="d-titulo">Título</label>
          <input id="d-titulo" data-d="titulo" value="${esc(d.titulo)}" />
        </div>
        <div class="field-grid">
          <div class="field">
            <label for="d-cat">Categoria</label>
            <input id="d-cat" data-d="categoria" value="${esc(d.categoria)}" placeholder="RH, Comercial, Técnico..." />
          </div>
          <div class="field">
            <label for="d-esc">Vale para</label>
            <input id="d-esc" data-d="escopo" value="${esc(d.escopo)}" placeholder="Empresa inteira, só o comercial..." />
          </div>
        </div>
        <div class="field">
          <label for="d-res">Do que trata</label>
          <textarea id="d-res" data-d="resumo" placeholder="Em duas linhas: o que esse documento resolve.">${esc(d.resumo)}</textarea>
        </div>
        <div class="btn-row">
          <button class="btn" data-ia-doc type="button">${icon("ia", 15)} IA descrever pelo título</button>
        </div>
        <div class="field">
          <label for="d-url">Link do arquivo <span class="hint">— Google Drive, OneDrive, Dropbox</span></label>
          <input id="d-url" data-d="url" value="${esc(d.url || "")}" placeholder="https://..." />
        </div>
        <div class="field">
          <label for="d-video">Vídeo explicando <span class="hint">— link do YouTube, opcional</span></label>
          <input id="d-video" data-d="videoUrl" value="${esc(d.videoUrl || "")}" placeholder="https://www.youtube.com/watch?v=..." />
        </div>
      </div>

      ${url || youtubeId(d.videoUrl) ? `<div class="section-title"><h3>Prévia</h3><span class="line"></span></div>
        <div class="card">
          ${url ? `<a class="btn link-btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${icon("link", 15)} Abrir o documento</a>` : ""}
          ${video(d.videoUrl)}
        </div>` : ""}
    </div>
  `;
}

function ligarDocEditor(raiz) {
  const d = documento(ui.docId);
  if (!d) return;

  $$("[data-d]", raiz).forEach((campo) => campo.addEventListener("input", () => {
    d[campo.dataset.d] = campo.value;
    salvar();
  }));

  $("[data-ia-doc]", raiz)?.addEventListener("click", async (evento) => {
    if (!d.titulo?.trim()) return alert("Escreva o título antes.");
    const entrada = `Documento: ${d.titulo}\nCategoria atual: ${d.categoria || "—"}\nVale para: ${d.escopo || "—"}`;
    const sugestao = await comEspera(evento.currentTarget, () => chamarIA("documento", entrada, contextoBase()));
    if (!sugestao) return;
    preencherVazios(d, sugestao, ["resumo"]);
    if (sugestao.categoria && (!d.categoria || d.categoria === "Geral")) d.categoria = sugestao.categoria;
    if (sugestao.escopo && !d.escopo?.trim()) d.escopo = sugestao.escopo;
    salvar(true);
    render();
  });

  $("[data-apagar-doc]", raiz)?.addEventListener("click", () => {
    if (!confirm(`Apagar "${d.titulo}"?`)) return;
    state.documentos = state.documentos.filter((x) => x.id !== d.id);
    state.cargos.forEach((c) => (c.trilha || []).forEach((t) => { if (t.documentoId === d.id) t.documentoId = ""; }));
    salvar(true);
    ir("biblioteca");
  });
}

function novoDocumento() {
  const d = { id: uid("d"), titulo: "Novo documento", categoria: "Geral", escopo: "Empresa inteira", resumo: "", url: "", videoUrl: "" };
  state.documentos.push(d);
  salvar(true);
  ir("docEditor", { docId: d.id });
}

/* ---------------------------------------------------------------- IA: telas */

function abrirContarProcesso() {
  abrirDrawer(`
    <div class="drawer-head">
      <h2>Conte o processo</h2>
      <button class="icon-btn" data-fechar type="button" aria-label="Fechar">${icon("close")}</button>
    </div>
    <p class="sub">Escreva como você explicaria para alguém que entrou ontem. Pode sair desorganizado — a IA organiza em passos.</p>

    <div class="field" style="margin-top:16px">
      <label for="iaTexto">O que acontece</label>
      <textarea id="iaTexto" style="min-height:190px" placeholder="Quando chega pedido de recarga no zap, o vendedor tem que pedir foto da etiqueta antes de falar preço, senão a gente orça errado e come a margem. Se pedir desconto acima de 10%, passa pro supervisor..."></textarea>
    </div>

    <div class="btn-row" style="margin-top:14px">
      <button class="btn btn-primary" id="iaGerar" type="button">${icon("ia", 15)} Gerar rascunho</button>
    </div>

    <div class="note note-rule" style="margin-top:20px">
      <div class="block-label">O que a IA não faz</div>
      <p>Ela não inventa prazo, valor, percentual nem norma técnica. O que você não disser fica em branco esperando você. O rascunho entra como <strong>não revisado</strong> e não conta como pronto até você conferir.</p>
    </div>
  `);

  $("#iaGerar", drawer).addEventListener("click", async (evento) => {
    const texto = $("#iaTexto", drawer).value.trim();
    if (!texto) return $("#iaTexto", drawer).focus();

    const rascunho = await comEspera(evento.currentTarget, () => chamarIA("processo", texto, contextoBase()));
    if (!rascunho) return;

    const existe = (lista, id) => lista.some((x) => x.id === id);
    const p = {
      id: uid("p"),
      nome: rascunho.nome || "Processo sem nome",
      setorId: existe(state.setores, rascunho.setorId) ? rascunho.setorId : state.setores[0]?.id || "",
      faseId: existe(state.fases, rascunho.faseId) ? rascunho.faseId : state.fases[0]?.id || "",
      donoCargoId: existe(state.cargos, rascunho.donoCargoId) ? rascunho.donoCargoId : state.cargos[0]?.id || "",
      cargosIds: (rascunho.cargosIds || []).filter((id) => existe(state.cargos, id)),
      status: "rascunho",
      revisado: false,
      videoUrl: "",
      porque: rascunho.porque || "",
      seErrar: rascunho.seErrar || "",
      anexos: [],
      proximos: [],
      passos: (rascunho.passos || []).map((s) => ({
        id: uid("ps"),
        tipo: TIPOS[s.tipo] ? s.tipo : "etapa",
        cargoId: existe(state.cargos, s.cargoId) ? s.cargoId : "",
        oQue: s.oQue || "",
        comoFazer: s.comoFazer || "",
        porque: s.porque || "",
        armadilha: s.armadilha || "",
        regra: s.regra || "",
        imagem: "",
        videoUrl: "",
        seSim: s.seSim || "",
        seNao: s.seNao || "",
      })),
      perguntas: (rascunho.perguntas || []).map((q) => ({ id: uid("q"), pergunta: q.pergunta || "", resposta: q.resposta || "" })),
    };

    state.processos.push(p);
    salvar(true);
    fecharDrawer();
    ir("editor", { processoId: p.id });
  });
}



/* ---------------------------------------------------------------- eventos */

function ligarEventos(raiz) {
  $$("[data-go]", raiz).forEach((b) => b.addEventListener("click", () => ir(b.dataset.go)));

  $$("[data-cargo]", raiz).forEach((b) => b.addEventListener("click", () => {
    if (ui.ligandoCargo) return religarCargo(b.dataset.cargo, ui.ligandoCargo);
    ir("trilha", { cargoSel: b.dataset.cargo });
  }));

  $$("[data-ligar-cargo]", raiz).forEach((b) => b.addEventListener("click", () => {
    ui.ligandoCargo = ui.ligandoCargo === b.dataset.ligarCargo ? null : b.dataset.ligarCargo;
    render();
  }));

  $$("[data-org]", raiz).forEach((node) => {
    node.addEventListener("dragstart", (e) => {
      ui.arrastandoCargo = node.dataset.org;
      node.classList.add("arrastando");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", node.dataset.org);
      e.stopPropagation();
    });
    node.addEventListener("dragend", () => {
      ui.arrastandoCargo = null;
      node.classList.remove("arrastando");
      $$(".recebendo").forEach((n) => n.classList.remove("recebendo"));
    });
  });

  $$("[data-org], [data-solta-org]", raiz).forEach((alvo) => {
    const idAlvo = alvo.dataset.org || "";
    alvo.addEventListener("dragover", (e) => {
      if (!ui.arrastandoCargo || ui.arrastandoCargo === idAlvo) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";
      alvo.classList.add("recebendo");
    });
    alvo.addEventListener("dragleave", () => alvo.classList.remove("recebendo"));
    alvo.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      alvo.classList.remove("recebendo");
      const id = ui.arrastandoCargo || e.dataTransfer.getData("text/plain");
      if (id) religarCargo(id, idAlvo);
    });
  });
  $$("[data-editar-cargo]", raiz).forEach((b) => b.addEventListener("click", () => ir("cargoEditor", { cargoSel: b.dataset.editarCargo })));
  $$("[data-editar-setor]", raiz).forEach((b) => b.addEventListener("click", () => abrirDrawerSetor(b.dataset.editarSetor)));
  $$("[data-doc]", raiz).forEach((b) => b.addEventListener("click", () => ir("docEditor", { docId: b.dataset.doc })));

  $$("[data-processo]", raiz).forEach((b) => b.addEventListener("click", () => abrirAula(b.dataset.processo)));
  $$("[data-editar]", raiz).forEach((b) => b.addEventListener("click", () => ir("editor", { processoId: b.dataset.editar })));
  $$("[data-ver-aula]", raiz).forEach((b) => b.addEventListener("click", () => abrirAula(b.dataset.verAula)));
  $$("[data-desenhar]", raiz).forEach((b) => b.addEventListener("click", () => ir("desenho", { processoId: b.dataset.desenhar, elSel: null })));

  /* --- mapa --- */

  $$("[data-abrir]", raiz).forEach((b) => b.addEventListener("click", () => {
    if (ui.ligando) return ligarProcessos(ui.ligando, b.dataset.abrir);
    abrirAula(b.dataset.abrir);
  }));

  $$("[data-ligar]", raiz).forEach((b) => b.addEventListener("click", () => {
    ui.ligando = ui.ligando === b.dataset.ligar ? null : b.dataset.ligar;
    render();
  }));

  $("[data-cancelar-ligacao]", raiz)?.addEventListener("click", () => {
    ui.ligando = null;
    ui.ligandoCargo = null;
    render();
  });

  $$("[data-agrupar]", raiz).forEach((b) => b.addEventListener("click", () => {
    ui.agrupar = b.dataset.agrupar;
    ui.ligando = null;
    render();
  }));

  $("[data-nova-raia]", raiz)?.addEventListener("click", () => (ui.agrupar === "fase" ? novaFase() : novoSetor()));

  $$("[data-renomear-raia]", raiz).forEach((b) => b.addEventListener("click", () => {
    const lista = ui.agrupar === "fase" ? state.fases : state.setores;
    const item = lista.find((x) => x.id === b.dataset.renomearRaia);
    if (!item) return;
    const nome = prompt("Novo nome:", item.nome);
    if (!nome?.trim()) return;
    item.nome = nome.trim();
    salvar(true);
    render();
  }));

  $$("[data-no]", raiz).forEach((node) => {
    node.addEventListener("dragstart", (e) => {
      ui.arrastando = node.dataset.no;
      node.classList.add("arrastando");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", node.dataset.no);
    });
    node.addEventListener("dragend", () => {
      ui.arrastando = null;
      node.classList.remove("arrastando");
      $$(".raia-trilho").forEach((t) => t.classList.remove("recebendo"));
    });
  });

  $$("[data-solta]", raiz).forEach((trilho) => {
    trilho.addEventListener("dragover", (e) => {
      if (!ui.arrastando) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      trilho.classList.add("recebendo");
    });
    trilho.addEventListener("dragleave", () => trilho.classList.remove("recebendo"));
    trilho.addEventListener("drop", (e) => {
      e.preventDefault();
      trilho.classList.remove("recebendo");
      const id = ui.arrastando || e.dataTransfer.getData("text/plain");
      if (id) soltarNo(id, trilho.dataset.solta, e.clientX);
    });
  });

  $$("[data-passo]", raiz).forEach((b) => b.addEventListener("click", () => {
    ui.passoIdx += Number(b.dataset.passo);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }));
  $$("[data-ir-passo]", raiz).forEach((b) => b.addEventListener("click", () => {
    ui.passoIdx = Number(b.dataset.irPasso);
    render();
    window.scrollTo({ top: 0 });
  }));

  const limpar = $("[data-limpar-cargo]", raiz);
  if (limpar) limpar.addEventListener("click", () => { ui.cargoSel = null; render(); });

  $$("[data-novo-processo]", raiz).forEach((b) => b.addEventListener("click", () => novoProcesso(b.dataset.novoProcesso)));
  const nc = $("[data-novo-cargo]", raiz);
  if (nc) nc.addEventListener("click", novoCargo);
  const nd = $("[data-novo-doc]", raiz);
  if (nd) nd.addEventListener("click", novoDocumento);
  $("[data-macro]", raiz)?.addEventListener("click", () => ir("macro"));
  const contar = $("[data-contar]", raiz);
  if (contar) contar.addEventListener("click", abrirContarProcesso);
}

/* ---------------------------------------------------------------- editor: ligação sem re-render */

/* O diagrama acompanha a digitação sem re-renderizar a tela — se a tela
   inteira re-renderizasse, o cursor pularia para fora do campo. */
let bpmnTimer = null;
function redesenharBpmnEditor() {
  clearTimeout(bpmnTimer);
  bpmnTimer = setTimeout(() => {
    const alvo = $("#bpmnEditor");
    const p = processo(ui.processoId);
    if (alvo && p) alvo.innerHTML = blocoBpmn(bpmnDoProcesso(p), "");
  }, 500);
}

function ligarEditor(raiz) {
  const p = processo(ui.processoId);
  if (!p) return;

  $$("[data-p]", raiz).forEach((campo) => {
    campo.addEventListener("input", () => {
      p[campo.dataset.p] = campo.value;
      salvar();
      if (campo.dataset.p === "setorId") render();
    });
  });

  $$("[data-toggle-cargo]", raiz).forEach((chip) => chip.addEventListener("click", () => {
    const id = chip.dataset.toggleCargo;
    p.cargosIds = p.cargosIds.includes(id) ? p.cargosIds.filter((x) => x !== id) : [...p.cargosIds, id];
    chip.classList.toggle("on");
    salvar(true);
  }));

  $$(".step-editor[data-passo-id]", raiz).forEach((bloco) => {
    const s = p.passos.find((x) => x.id === bloco.dataset.passoId);
    if (!s) return;

    $$("[data-s]", bloco).forEach((campo) => {
      const evento = campo.tagName === "SELECT" ? "change" : "input";
      campo.addEventListener(evento, () => {
        s[campo.dataset.s] = campo.value;
        salvar();
        redesenharBpmnEditor();
      });
    });

    $$("[data-tipo]", bloco).forEach((chip) => chip.addEventListener("click", () => {
      s.tipo = chip.dataset.tipo;
      salvar(true);
      render();
    }));

    const mover = $$("[data-mover]", bloco);
    mover.forEach((b) => b.addEventListener("click", () => {
      const i = p.passos.indexOf(s);
      const j = i + Number(b.dataset.mover);
      if (j < 0 || j >= p.passos.length) return;
      p.passos.splice(j, 0, p.passos.splice(i, 1)[0]);
      salvar(true);
      render();
    }));

    const remover = $("[data-remover-passo]", bloco);
    if (remover) remover.addEventListener("click", () => {
      if (!confirm("Remover este passo?")) return;
      p.passos = p.passos.filter((x) => x.id !== s.id);
      salvar(true);
      render();
    });

    const arquivo = $("[data-imagem]", bloco);
    if (arquivo) arquivo.addEventListener("change", async (ev) => {
      const [file] = ev.target.files;
      if (!file) return;
      s.imagem = await comprimirImagem(file);
      salvar(true);
      render();
    });

    const semImagem = $("[data-remover-imagem]", bloco);
    if (semImagem) semImagem.addEventListener("click", () => {
      s.imagem = "";
      salvar(true);
      render();
    });

    $("[data-ia-passo]", bloco)?.addEventListener("click", async (evento) => {
      if (await completarPassoComIA(evento.currentTarget, p, s)) render();
    });
  });

  $$(".step-editor[data-pergunta-id]", raiz).forEach((bloco) => {
    const q = (p.perguntas || []).find((x) => x.id === bloco.dataset.perguntaId);
    if (!q) return;
    $$("[data-q]", bloco).forEach((campo) => campo.addEventListener("input", () => {
      q[campo.dataset.q] = campo.value;
      salvar();
    }));
    const rem = $("[data-remover-pergunta]", bloco);
    if (rem) rem.addEventListener("click", () => {
      p.perguntas = p.perguntas.filter((x) => x.id !== q.id);
      salvar(true);
      render();
    });
  });

  $$(".anexo-row", raiz).forEach((linha) => {
    const a = (p.anexos || []).find((x) => x.id === linha.dataset.anexoId);
    if (!a) return;
    $$("[data-a]", linha).forEach((campo) => campo.addEventListener("input", () => {
      a[campo.dataset.a] = campo.value;
      salvar();
    }));
    $("[data-remover-anexo]", linha)?.addEventListener("click", () => {
      p.anexos = p.anexos.filter((x) => x.id !== a.id);
      salvar(true);
      render();
    });
  });

  $("[data-novo-anexo]", raiz)?.addEventListener("click", () => {
    p.anexos = p.anexos || [];
    p.anexos.push({ id: uid("a"), titulo: "", url: "" });
    salvar(true);
    render();
  });

  const novoPasso = $("[data-novo-passo]", raiz);
  if (novoPasso) novoPasso.addEventListener("click", () => {
    p.passos = p.passos || [];
    p.passos.push({ id: uid("ps"), tipo: "etapa", cargoId: "", oQue: "", comoFazer: "", porque: "", armadilha: "", regra: "", imagem: "", videoUrl: "", seSim: "", seNao: "" });
    salvar(true);
    render();
    const blocos = $$(".step-editor[data-passo-id]");
    blocos[blocos.length - 1]?.querySelector("input")?.focus();
  });

  const novaPergunta = $("[data-nova-pergunta]", raiz);
  if (novaPergunta) novaPergunta.addEventListener("click", () => {
    p.perguntas = p.perguntas || [];
    p.perguntas.push({ id: uid("q"), pergunta: "", resposta: "" });
    salvar(true);
    render();
  });

  $("[data-ia-perguntas]", raiz)?.addEventListener("click", async (evento) => {
    if (!(p.passos || []).length) return alert("Escreva os passos antes — as perguntas saem deles.");
    const resultado = await comEspera(evento.currentTarget, () => chamarIA("perguntas", textoDoProcesso(p), contextoBase()));
    if (!resultado) return;
    p.perguntas = [
      ...(p.perguntas || []),
      ...(resultado.perguntas || []).map((q) => ({ id: uid("q"), pergunta: q.pergunta || "", resposta: q.resposta || "" })),
    ];
    p.revisado = false;
    salvar(true);
    render();
  });

  $("[data-revisar]", raiz)?.addEventListener("click", () => {
    p.revisado = true;
    salvar(true);
    render();
  });

  const apagar = $("[data-apagar-processo]", raiz);
  if (apagar) apagar.addEventListener("click", () => {
    if (!confirm(`Apagar "${p.nome}"? Não dá pra desfazer.`)) return;
    state.processos = state.processos.filter((x) => x.id !== p.id);
    nosMacro().forEach((x) => { x.proximos = (x.proximos || []).filter((s) => s.para !== p.id); });
    salvar(true);
    ir("fluxo");
  });
}

/* Reduz a imagem antes de guardar: o localStorage tem uns 5 MB no total. */
function comprimirImagem(file, larguraMax = 1000) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, larguraMax / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => resolve("");
      img.src = reader.result;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

/* ---------------------------------------------------------------- criação */

function novoProcesso(raiaId) {
  const porSetor = ui.agrupar !== "fase";
  const p = {
    id: uid("p"),
    nome: "Novo processo",
    faseId: (porSetor ? "" : raiaId) || state.fases[0]?.id || "",
    setorId: (porSetor ? raiaId : "") || state.setores[0]?.id || "",
    donoCargoId: state.cargos[0]?.id || "",
    cargosIds: ui.cargoSel ? [ui.cargoSel] : [],
    status: "rascunho",
    videoUrl: "",
    porque: "",
    seErrar: "",
    anexos: [],
    passos: [],
    perguntas: [],
    proximos: [],
  };
  state.processos.push(p);
  salvar(true);
  ir("editor", { processoId: p.id });
}

function novoCargo() {
  const nome = prompt("Nome do cargo:");
  if (!nome?.trim()) return;
  const c = {
    id: uid("c"),
    setorId: state.setores[0]?.id || "",
    nome: nome.trim(),
    reportaA: state.cargos[0]?.id || null,
    missao: "",
    expectativas: "",
    conhecimentos: "",
    trilha: [],
  };
  state.cargos.push(c);
  salvar(true);
  ir("cargoEditor", { cargoSel: c.id });
}

function novoSetor() {
  const nome = prompt("Nome do setor:");
  if (!nome?.trim()) return;
  state.setores.push({ id: uid("s"), nome: nome.trim() });
  salvar(true);
  render();
}

function novaFase() {
  const nome = prompt("Nome da fase (ex: Cobrar):");
  if (!nome?.trim()) return;
  state.fases.push({ id: uid("f"), nome: nome.trim() });
  salvar(true);
  render();
}

/* ---------------------------------------------------------------- drawer */

const drawer = $("#drawer");
const scrim = $("#scrim");
scrim.addEventListener("click", fecharDrawer);
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (ui.ligando || ui.ligandoCargo) {
    ui.ligando = null;
    ui.ligandoCargo = null;
    render();
    return;
  }
  fecharDrawer();
});

let redesenhoTimer = null;
window.addEventListener("resize", () => {
  if (ui.view !== "fluxo") return;
  clearTimeout(redesenhoTimer);
  redesenhoTimer = setTimeout(desenharLigacoes, 120);
});

function fecharDrawer() {
  drawer.hidden = true;
  scrim.hidden = true;
}

function abrirDrawerSetor(setorId) {
  const s = setor(setorId);
  if (!s) return;
  const cargos = state.cargos.filter((c) => c.setorId === s.id).length;
  const procs = state.processos.filter((p) => p.setorId === s.id).length;

  abrirDrawer(`
    <div class="drawer-head">
      <h2>${esc(s.nome)}</h2>
      <button class="icon-btn" data-fechar type="button" aria-label="Fechar">${icon("close")}</button>
    </div>
    <p class="sub">${cargos} cargo${cargos === 1 ? "" : "s"} · ${procs} processo${procs === 1 ? "" : "s"}</p>

    <div class="field" style="margin-top:16px">
      <label for="s-nome">Nome</label>
      <input id="s-nome" value="${esc(s.nome)}" />
    </div>

    <div class="field" style="margin-top:14px">
      <label>Camada da arquitetura</label>
      <div class="chips">
        ${Object.entries(CAMADAS).map(([chave, c]) => `
          <button class="chip${camadaDoSetor(s.id) === chave ? " on" : ""}" data-camada="${chave}" type="button">${c.rotulo}</button>
        `).join("")}
      </div>
      <p class="hint" style="margin-top:8px">${esc(CAMADAS[camadaDoSetor(s.id)].ajuda)}</p>
    </div>

    <div class="note note-why" style="margin-top:18px">
      <div class="block-label">Por que classificar</div>
      <p>Os processos deste setor herdam esta camada — não se marca duas vezes. No macro, as raias saem nesta ordem: estratégico em cima, principal no meio, apoio embaixo.</p>
    </div>

    <div class="btn-row" style="margin-top:20px">
      <button class="btn btn-sm btn-danger" data-apagar-setor type="button">${icon("trash", 15)} Apagar setor</button>
    </div>
  `);

  $("#s-nome", drawer).addEventListener("input", (e) => { s.nome = e.target.value; salvar(); });

  $$("[data-camada]", drawer).forEach((b) => b.addEventListener("click", () => {
    s.camada = b.dataset.camada;
    salvar(true);
    render();
    abrirDrawerSetor(s.id);
  }));

  $("[data-apagar-setor]", drawer).addEventListener("click", () => {
    if (cargos || procs) {
      return alert(`"${s.nome}" ainda tem ${cargos} cargo(s) e ${procs} processo(s). Mova-os antes de apagar.`);
    }
    if (!confirm(`Apagar o setor "${s.nome}"?`)) return;
    state.setores = state.setores.filter((x) => x.id !== s.id);
    salvar(true);
    fecharDrawer();
    render();
  });
}

function abrirDrawer(html) {
  drawer.innerHTML = html;
  drawer.hidden = false;
  scrim.hidden = false;
  $("[data-fechar]", drawer)?.addEventListener("click", fecharDrawer);
}


/* ---------------------------------------------------------------- dados do projeto */

$("#openData").innerHTML = icon("data");
$("#openData").addEventListener("click", () => {
  const kb = Math.round(JSON.stringify(state).length / 1024);
  abrirDrawer(`
    <div class="drawer-head">
      <h2>Dados do projeto</h2>
      <button class="icon-btn" data-fechar type="button" aria-label="Fechar">${icon("close")}</button>
    </div>
    <p class="sub">Enquanto não existe banco, tudo vive neste navegador. Exporte o JSON de vez em quando — é o seu backup.</p>

    <div class="section-title"><h3>Espaço usado</h3><span class="line"></span></div>
    <p class="sub">${kb} KB de aproximadamente 5.000 KB. As imagens são o que mais pesa.</p>

    <div class="btn-row" style="margin-top:18px">
      <button class="btn" data-exportar type="button">Exportar JSON</button>
      <label class="btn file-label">Importar JSON<input type="file" accept="application/json,.json" data-importar></label>
    </div>

    <div class="section-title"><h3>Recomeçar</h3><span class="line"></span></div>
    <div class="btn-row">
      <button class="btn btn-danger btn-sm" data-zerar type="button">Apagar tudo e começar vazio</button>
      <button class="btn btn-ghost btn-sm" data-exemplo type="button">Restaurar setores e cargos</button>
    </div>
  `);

  $("[data-exportar]", drawer).addEventListener("click", exportar);
  $("[data-importar]", drawer).addEventListener("change", importar);
  $("[data-zerar]", drawer).addEventListener("click", () => {
    if (!confirm("Isso apaga setores, cargos, processos, decisões e documentos deste navegador. Exportou o JSON antes?")) return;
    state = { ...estadoVazio(), empresa: state.empresa, fases: semente().fases };
    ui.cargoSel = null;
    ui.macroSel = null;
    salvar(true);
    fecharDrawer();
    ir("organograma");
  });
  $("[data-exemplo]", drawer).addEventListener("click", () => {
    if (!confirm("Substituir tudo pelo esqueleto inicial (4 setores, 5 cargos, 6 fases)?")) return;
    state = semente();
    ui.cargoSel = null;
    salvar(true);
    fecharDrawer();
    ir("organograma");
  });
});

function exportar() {
  const payload = JSON.stringify({
    projeto: { nome: "CIP", empresa: state.empresa?.nome, versao: "1.0-fase1", exportadoEm: new Date().toISOString() },
    dados: state,
  }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `cip-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importar(evento) {
  const [file] = evento.target.files;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const bruto = JSON.parse(reader.result);
      const dados = bruto?.dados || bruto;
      if (!valido(dados)) throw new Error("Esse arquivo não tem o formato da CIP.");
      /* Passa pela mesma normalização do carregamento: um backup antigo pode
         não ter `decisoes`, `documentos` ou as saídas no formato novo. */
      state = normalizar(dados);
      ui.cargoSel = null;
      salvar(true);
      fecharDrawer();
      ir("organograma");
    } catch (erro) {
      alert(erro.message || "Não foi possível ler esse arquivo.");
    }
  };
  reader.readAsText(file);
}

/* ---------------------------------------------------------------- start */

if (ZEROU) {
  const aviso = document.createElement("div");
  aviso.className = "filter-bar";
  aviso.style.cssText = "margin:12px 18px 0";
  aviso.innerHTML = `
    ${icon("ok", 15)} <strong>Base zerada.</strong> Sobraram só os setores, cargos e fases — nenhum processo, decisão ou documento.
    ${localStorage.getItem(CHAVE_ANTERIOR) ? '<button class="btn btn-sm btn-ghost" id="baixarAnterior" type="button" style="margin-left:auto">Baixar o que foi apagado</button>' : ""}
  `;
  document.querySelector("#main").before(aviso);
  aviso.querySelector("#baixarAnterior")?.addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([localStorage.getItem(CHAVE_ANTERIOR)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `cip-antes-de-zerar-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
}

if (MODO_SEGURO) {
  const aviso = document.createElement("div");
  aviso.className = "filter-bar aviso";
  aviso.style.cssText = "margin:12px 18px 0";
  aviso.innerHTML = `
    ${icon("ia", 15)} <strong>Modo seguro.</strong> O app abriu vazio e não vai gravar nada por cima do que está salvo.
    <button class="btn btn-sm" id="baixarBruto" type="button" style="margin-left:auto">Baixar o que está salvo</button>
    <a class="btn btn-sm btn-ghost link-btn" href="./index.html">Sair do modo seguro</a>
  `;
  document.querySelector("#main").before(aviso);
  aviso.querySelector("#baixarBruto").addEventListener("click", baixarBrutoSalvo);
}

/* A topbar vive fora do #main, então é ligada uma vez só. */
$$("[data-go]", document.querySelector(".topbar")).forEach((b) =>
  b.addEventListener("click", () => ir(b.dataset.go))
);

/* ---------------------------------------------------------------- nuvem: login e sincronia */

function marcarEstado(tipo, detalhe = "") {
  const alvo = $("#estadoNuvem");
  if (!alvo) return;
  const agora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const textos = {
    salvo: `salvo às ${agora}`,
    salvando: "salvando…",
    erro: `não salvou — ${detalhe}`,
    offline: "sem conexão",
  };
  alvo.textContent = textos[tipo] || "";
  alvo.className = `estado-nuvem ${tipo}`;
  alvo.title = detalhe || "";
}

/* Uma mudança feita por outra pessoa. A regra: peça que você não está editando
   entra sozinha; a que você está editando vira aviso, para não arrancar o
   texto de baixo do seu cursor. */
let mudancasPendentes = [];

function digitandoAgora() {
  const a = document.activeElement;
  return !!a && ["INPUT", "TEXTAREA", "SELECT"].includes(a.tagName);
}



function aplicarMudancaRemota(m) {
  const editandoEsta =
    (ui.view === "editor" || ui.view === "desenho") && m.peca === `p:${ui.processoId}`;

  if (editandoEsta || digitandoAgora()) {
    mudancasPendentes.push(m);
    marcarEstado("salvo");
    mostrarAvisoDeMudanca();
    return;
  }

  aplicarNoEstado(m);
  normalizar(state);
  render();
}

function mostrarAvisoDeMudanca() {
  let faixa = $("#avisoRemoto");
  if (!faixa) {
    faixa = document.createElement("div");
    faixa.id = "avisoRemoto";
    faixa.className = "aviso-remoto";
    document.body.appendChild(faixa);
  }
  faixa.innerHTML = `
    ${icon("ia", 15)} Outra pessoa mudou ${mudancasPendentes.length === 1 ? "uma peça" : `${mudancasPendentes.length} peças`}.
    <button class="btn btn-sm" id="aplicarRemoto" type="button">Atualizar a tela</button>
  `;
  faixa.hidden = false;
  faixa.querySelector("#aplicarRemoto").addEventListener("click", () => {
    mudancasPendentes.forEach(aplicarNoEstado);
    mudancasPendentes = [];
    normalizar(state);
    faixa.hidden = true;
    render();
  });
}

function mostrarPresenca(outros) {
  const alvo = $("#presenca");
  if (!alvo) return;
  if (!outros.length) {
    alvo.hidden = true;
    return;
  }
  alvo.hidden = false;
  alvo.textContent = outros.map((p) => p.nome).join(", ") + (outros.length === 1 ? " online" : " online");
  alvo.title = outros.map((p) => `${p.nome} — ${p.onde}`).join("\n");
}

const irOriginal = ir;
ir = function (view, extras = {}) {
  irOriginal(view, extras);
  if (quemEstaLogado()) anunciarPresenca(view, mostrarPresenca);
};

/* Autenticado é autenticado. Se o que falhar for o carregamento, a sincronia ou
   a presença, o certo é entrar assim mesmo e dizer o que quebrou — não devolver
   a pessoa para a tela de login sem explicação, que foi o que eu fiz antes. */
async function entrarNoApp() {
  document.body.classList.remove("deslogado");
  $("#portao").hidden = true;
  marcarEstado("salvando");

  const falhas = [];
  const tentar = async (etapa, tarefa) => {
    try {
      await tarefa();
    } catch (erro) {
      console.error(`[CIP] falhou em "${etapa}":`, erro);
      falhas.push(`${etapa}: ${textoDoErro(erro)}`);
    }
  };

  await tentar("carregar do servidor", async () => { state = await baixarTudo(); });
  await tentar("desenhar a tela", () => render());
  await tentar("ligar a sincronia", () => ouvirMudancas(aplicarMudancaRemota));
  await tentar("anunciar presença", () => anunciarPresenca(ui.view, mostrarPresenca));

  if (falhas.length) {
    marcarEstado("erro", falhas.join(" · "));
    avisarFalha(falhas);
  } else {
    marcarEstado("salvo");
  }
}

/* Erro pode chegar como Error, string ou objeto do Supabase. Nunca deixe virar
   "undefined" — mensagem vazia foi o que escondeu o problema. */
function textoDoErro(erro) {
  if (!erro) return "erro sem descrição";
  if (typeof erro === "string") return erro;
  return erro.message || erro.error_description || erro.error || JSON.stringify(erro).slice(0, 200);
}

function avisarFalha(falhas) {
  let faixa = $("#falhaNuvem");
  if (!faixa) {
    faixa = document.createElement("div");
    faixa.id = "falhaNuvem";
    faixa.className = "filter-bar aviso";
    faixa.style.cssText = "margin:12px 18px 0";
    $("#main").before(faixa);
  }
  faixa.innerHTML = `
    <strong>Entrou, mas algo não funcionou.</strong> ${esc(falhas.join(" · "))}
    <button class="btn btn-sm btn-ghost" id="tentarDeNovo" type="button" style="margin-left:auto">Tentar de novo</button>
  `;
  faixa.hidden = false;
  faixa.querySelector("#tentarDeNovo").addEventListener("click", () => {
    faixa.remove();
    entrarNoApp();
  });
}

function mostrarPortao(mensagem = "") {
  document.body.classList.add("deslogado");
  $("#portao").hidden = false;
  const erro = $("#portaoErro");
  const texto = String(mensagem || "").trim();
  erro.hidden = !texto;
  erro.textContent = texto;
  $("#entrarEmail").focus();
}

$("#formEntrar").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const botao = $("#botaoEntrar");
  const antes = botao.textContent;
  botao.disabled = true;
  botao.textContent = "entrando…";
  $("#portaoErro").hidden = true;
  try {
    await entrar($("#entrarEmail").value.trim(), $("#entrarSenha").value);
    $("#entrarSenha").value = "";
    await entrarNoApp();
  } catch (erro) {
    console.error("[CIP] falhou ao entrar:", erro);
    mostrarPortao(textoDoErro(erro));
  } finally {
    botao.disabled = false;
    botao.textContent = antes;
  }
});

$("#sairBotao").addEventListener("click", async () => {
  if (!confirm("Sair da sua conta neste navegador?")) return;
  pararDeOuvir();
  await sair();
  mostrarPortao();
});

$("#esqueciSenha").addEventListener("click", async () => {
  const email = $("#entrarEmail").value.trim();
  if (!email) return mostrarPortao("Escreva o e-mail acima primeiro.");
  try {
    await recuperarSenha(email);
    mostrarPortao(`Se ${email} tiver conta, o link de troca de senha chegou por e-mail. Veja também o spam.`);
  } catch (erro) {
    mostrarPortao(erro.message);
  }
});

(async function iniciar() {
  const carimbo = $("#carimboVersao");
  if (carimbo) carimbo.textContent = VERSAO;
  console.log(`[CIP] ${VERSAO} carregado · supabase=${typeof supabase !== "undefined"}`);

  if (MODO_SEGURO) return render();
  document.body.classList.add("deslogado");
  const user = await sessaoAtual();
  if (user) await entrarNoApp();
  else mostrarPortao();
})();
