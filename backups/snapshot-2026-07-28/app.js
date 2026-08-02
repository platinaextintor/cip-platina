const STORAGE_KEY = "cip.platina.v2.workspace";

const starterState = {
  sectors: [
    { id: "comercial", name: "Comercial", description: "Atendimento, orçamento, negociação e relacionamento com clientes." },
    { id: "tecnica", name: "Técnica", description: "Inspeção, manutenção, evidências e execução em campo." },
    { id: "gestao", name: "Gestão", description: "Direção, supervisão, governança e padrões da empresa." },
  ],
  roles: [
    {
      id: "vendedor",
      sectorId: "comercial",
      name: "Vendedor",
      purpose: "Converter oportunidades seguindo as regras comerciais oficiais.",
      expectations: "Dominar atendimento, orçamento, follow-up, regras de pagamento e registro de informações.",
    },
    {
      id: "tecnico",
      sectorId: "tecnica",
      name: "Técnico de Extintores",
      purpose: "Executar serviços com segurança, evidência e padrão técnico.",
      expectations: "Conhecer procedimentos técnicos, segurança, registro fotográfico e conduta no cliente.",
    },
    {
      id: "supervisor",
      sectorId: "gestao",
      name: "Supervisor Operacional",
      purpose: "Manter o padrão vivo, revisar processos e orientar a equipe.",
      expectations: "Aprovar mudanças, acompanhar trilhas e garantir execução do processo oficial.",
    },
  ],
  processes: [
    {
      id: "orcamento-recarga",
      sectorId: "comercial",
      name: "Orçamento de recarga pelo WhatsApp",
      ownerRoleId: "supervisor",
      roleIds: ["vendedor", "supervisor"],
      status: "Rascunho",
      summary: "Padrão para receber pedidos de recarga, coletar evidências e enviar proposta.",
      details:
        "O vendedor deve coletar dados, fotos da etiqueta, quantidade e necessidade antes de prometer valores, prazos ou condições especiais.",
      videoUrl: "",
      documentRefs: "Modelo de orçamento.pdf\nChecklist de atendimento.docx",
      steps: [
        { title: "Receber contato", type: "etapa", owner: "Vendedor", detail: "Localizar cliente ou abrir cadastro." },
        { title: "Pedir evidências", type: "evidência", owner: "Vendedor", detail: "Solicitar foto da etiqueta, quantidade e cidade." },
        { title: "Enviar proposta", type: "etapa", owner: "Vendedor", detail: "Usar modelo oficial e registrar follow-up." },
        { title: "Aprovar exceção", type: "aprovação", owner: "Supervisor", detail: "Desconto, prazo especial ou condição fora do padrão." },
      ],
    },
    {
      id: "inspecao-campo",
      sectorId: "tecnica",
      name: "Inspeção técnica em campo",
      ownerRoleId: "supervisor",
      roleIds: ["tecnico", "supervisor"],
      status: "Rascunho",
      summary: "Roteiro de visita para conferir validade, lacre, acesso, sinalização e evidências.",
      details: "Antes de sair, o técnico confere OS, ferramentas e EPIs. Toda inconformidade deve ter registro claro.",
      videoUrl: "",
      documentRefs: "Checklist de EPI.pdf",
      steps: [
        { title: "Preparar visita", type: "etapa", owner: "Técnico", detail: "Separar OS, ferramentas e EPIs." },
        { title: "Conferir local", type: "etapa", owner: "Técnico", detail: "Validar responsável e área autorizada." },
        { title: "Registrar evidências", type: "evidência", owner: "Técnico", detail: "Anexar fotos e observações na OS." },
      ],
    },
  ],
  tracks: [
    {
      id: "trilha-vendedor",
      roleId: "vendedor",
      knowledge: "Atendimento, negociação, follow-up, regras comerciais e uso correto dos processos.",
      modules: "Integração Platina\nPadrão de atendimento\nRegras comerciais\nTeste de entendimento",
      courses: "Atendimento ao cliente | https://www.youtube.com/results?search_query=atendimento+ao+cliente\nFollow-up comercial | https://www.youtube.com/results?search_query=follow+up+comercial",
      documents: "Regimento comercial.pdf",
    },
    {
      id: "trilha-tecnico",
      roleId: "tecnico",
      knowledge: "Segurança, inspeção, evidências, manutenção, atendimento em campo e registro de serviço.",
      modules: "Integração Platina\nSegurança em campo\nInspeção técnica\nRegistro de evidências",
      courses: "NR 23 | https://www.youtube.com/results?search_query=NR+23\nSegurança no trabalho | https://www.youtube.com/results?search_query=segurança+no+trabalho",
      documents: "Manual técnico inicial.pdf",
    },
  ],
  documents: [
    {
      id: "regimento-interno",
      title: "Regimento interno",
      category: "RH",
      scope: "Empresa",
      text: "Regras gerais de conduta, responsabilidades, horários, postura, comunicação e funcionamento interno.",
      videoUrl: "",
      files: "Regimento interno.pdf",
    },
  ],
  announcements: [
    {
      id: "condicao-pagamento",
      title: "Nova condição de faturamento comercial",
      target: "Comercial e financeiro",
      text: "Pedidos acima de X valor podem seguir faturamento 30/60/90/120 mediante aprovação.",
      relatedProcessId: "orcamento-recarga",
      status: "Rascunho",
    },
  ],
};

let state = loadState();
let currentView = "mapa";
let selected = { type: "company", id: "platina" };

const viewButtons = document.querySelectorAll("[data-view]");
const viewPanels = document.querySelectorAll("[data-view-panel]");
const saveStateNode = document.querySelector("#saveState");
const mapCanvas = document.querySelector("#mapCanvas");
const processModule = document.querySelector("#processModule");
const roleModule = document.querySelector("#roleModule");
const documentModule = document.querySelector("#documentModule");
const announcementModule = document.querySelector("#announcementModule");
const inspectorTitle = document.querySelector("#inspectorTitle");
const inspectorSubtitle = document.querySelector("#inspectorSubtitle");
const inspectorBody = document.querySelector("#inspectorBody");

document.querySelector("#addSector").addEventListener("click", () => createSector());
document.querySelector("#addRole").addEventListener("click", () => createRole());
document.querySelector("#addProcess").addEventListener("click", () => createProcess());
document.querySelector("#addDocument").addEventListener("click", () => createDocument());
document.querySelector("#addAnnouncement").addEventListener("click", () => createAnnouncement());
document.querySelector("#resetWorkspace").addEventListener("click", resetWorkspace);
document.querySelector("#aiCreateProcess").addEventListener("click", createProcessFromAi);

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentView = button.dataset.view;
    render();
  });
});

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : structuredClone(starterState);
  } catch {
    return structuredClone(starterState);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  saveStateNode.textContent = `salvo localmente às ${time}`;
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSector(id) {
  return state.sectors.find((sector) => sector.id === id);
}

function getRole(id) {
  return state.roles.find((role) => role.id === id);
}

function getProcess(id) {
  return state.processes.find((process) => process.id === id);
}

function getTrackForRole(roleId) {
  let track = state.tracks.find((item) => item.roleId === roleId);
  if (!track) {
    track = {
      id: uid("trilha"),
      roleId,
      knowledge: "",
      modules: "Integração Platina\nProcessos obrigatórios\nValidação final",
      courses: "",
      documents: "",
    };
    state.tracks.push(track);
    persist();
  }
  return track;
}

function processesForRole(roleId) {
  return state.processes.filter((process) => process.roleIds.includes(roleId));
}

function setSelected(type, id) {
  selected = { type, id };
  render();
}

function switchView(view) {
  currentView = view;
  render();
}

function render() {
  viewButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.view === currentView));
  viewPanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.viewPanel === currentView));
  renderStats();
  renderMap();
  renderProcesses();
  renderRoles();
  renderDocuments();
  renderAnnouncements();
  renderInspector();
}

function renderStats() {
  document.querySelector("#statSectors").textContent = state.sectors.length;
  document.querySelector("#statRoles").textContent = state.roles.length;
  document.querySelector("#statProcesses").textContent = state.processes.length;
  document.querySelector("#statDocs").textContent = state.documents.length;
}

function renderMap() {
  mapCanvas.innerHTML = `
    <button class="company-node ${selected.type === "company" ? "is-selected" : ""}" data-select-type="company" data-select-id="platina" type="button">
      <span>CIP</span>
      <strong>Platina Extintores</strong>
      <small>${state.sectors.length} setores · ${state.roles.length} cargos · ${state.processes.length} processos</small>
    </button>
    <div class="sector-board">
      ${state.sectors.map(renderSectorPanel).join("")}
    </div>
  `;
  bindSelection(mapCanvas);
}

function renderSectorPanel(sector) {
  const roles = state.roles.filter((role) => role.sectorId === sector.id);
  const processes = state.processes.filter((process) => process.sectorId === sector.id);
  return `
    <section class="sector-panel">
      <header>
        <button class="node-card ${selected.type === "sector" && selected.id === sector.id ? "is-selected" : ""}" data-select-type="sector" data-select-id="${sector.id}" type="button">
          <strong>${escapeHtml(sector.name)}</strong>
          <span>${escapeHtml(sector.description || "Sem descrição")}</span>
        </button>
      </header>

      <div class="lane-title">Cargos</div>
      <div class="node-stack">
        ${roles.length ? roles.map(renderRoleNode).join("") : '<div class="empty-state">Nenhum cargo neste setor.</div>'}
      </div>

      <div class="lane-title">Processos vinculados</div>
      <div class="node-stack">
        ${processes.length ? processes.map(renderProcessNode).join("") : '<div class="empty-state">Nenhum processo neste setor.</div>'}
      </div>
    </section>
  `;
}

function renderRoleNode(role) {
  const linkedProcesses = processesForRole(role.id);
  const track = getTrackForRole(role.id);
  const courses = lines(track.courses).length;
  return `
    <button class="node-card role ${selected.type === "role" && selected.id === role.id ? "is-selected" : ""}" data-select-type="role" data-select-id="${role.id}" type="button">
      <strong>${escapeHtml(role.name)}</strong>
      <span>${linkedProcesses.length} processos · ${courses} cursos externos</span>
      <small>clique para editar cargo e trilha</small>
    </button>
  `;
}

function renderProcessNode(process) {
  return `
    <button class="node-card process ${selected.type === "process" && selected.id === process.id ? "is-selected" : ""}" data-select-type="process" data-select-id="${process.id}" type="button">
      <strong>${escapeHtml(process.name)}</strong>
      <span>${process.roleIds.map((id) => getRole(id)?.name).filter(Boolean).join(", ") || "sem cargo vinculado"}</span>
      <small>${escapeHtml(process.status)}</small>
    </button>
  `;
}

function renderProcesses() {
  processModule.innerHTML = state.processes.length
    ? state.processes.map((process) => {
        const roleTags = process.roleIds.map((id) => `<span class="tag">${escapeHtml(getRole(id)?.name || id)}</span>`).join("");
        return `
          <button class="module-card" data-select-type="process" data-select-id="${process.id}" type="button">
            <div class="tag-row">
              <span class="tag green">${escapeHtml(getSector(process.sectorId)?.name || "Sem setor")}</span>
              <span class="tag amber">${escapeHtml(process.status)}</span>
            </div>
            <h3>${escapeHtml(process.name)}</h3>
            <p>${escapeHtml(process.summary)}</p>
            <div class="tag-row">${roleTags || '<span class="tag red">sem cargo</span>'}</div>
            <div class="flow-preview">${renderMiniFlow(process.steps)}</div>
          </button>
        `;
      }).join("")
    : '<div class="empty-state">Nenhum processo cadastrado.</div>';
  bindSelection(processModule);
}

function renderRoles() {
  roleModule.innerHTML = state.roles.length
    ? state.roles.map((role) => {
        const track = getTrackForRole(role.id);
        const processNodes = processesForRole(role.id)
          .map((process) => `<span class="flow-node">${escapeHtml(process.name)}</span>`)
          .join('<span class="arrow"></span>');
        const courseNodes = lines(track.courses)
          .map((course) => `<span class="flow-node">${escapeHtml(course.split("|")[0].trim())}</span>`)
          .join('<span class="arrow"></span>');
        return `
          <button class="module-card" data-select-type="role" data-select-id="${role.id}" type="button">
            <div class="tag-row"><span class="tag">${escapeHtml(getSector(role.sectorId)?.name || "Sem setor")}</span></div>
            <h3>${escapeHtml(role.name)}</h3>
            <p>${escapeHtml(role.expectations)}</p>
            <div class="lane-title">Processos obrigatórios</div>
            <div class="track-flow">${processNodes || '<span class="flow-node">Nenhum processo vinculado</span>'}</div>
            <div class="lane-title">Cursos externos</div>
            <div class="track-flow">${courseNodes || '<span class="flow-node">Nenhum curso cadastrado</span>'}</div>
          </button>
        `;
      }).join("")
    : '<div class="empty-state">Nenhum cargo cadastrado.</div>';
  bindSelection(roleModule);
}

function renderDocuments() {
  documentModule.innerHTML = state.documents.length
    ? state.documents.map((doc) => `
        <button class="module-card" data-select-type="document" data-select-id="${doc.id}" type="button">
          <div class="tag-row"><span class="tag red">${escapeHtml(doc.category)}</span><span class="tag">${escapeHtml(doc.scope)}</span></div>
          <h3>${escapeHtml(doc.title)}</h3>
          <p>${escapeHtml(doc.text)}</p>
          <div class="tag-row">${lines(doc.files).map((file) => `<span class="tag">${escapeHtml(file)}</span>`).join("")}</div>
        </button>
      `).join("")
    : '<div class="empty-state">Nenhum documento cadastrado.</div>';
  bindSelection(documentModule);
}

function renderAnnouncements() {
  announcementModule.innerHTML = state.announcements.length
    ? state.announcements.map((item) => `
        <button class="module-card" data-select-type="announcement" data-select-id="${item.id}" type="button">
          <div class="tag-row"><span class="tag amber">${escapeHtml(item.status)}</span><span class="tag">${escapeHtml(item.target)}</span></div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.text)}</p>
          <div class="flow-preview">
            <span class="flow-node">Alteração</span><span class="arrow"></span>
            <span class="flow-node">Alerta</span><span class="arrow"></span>
            <span class="flow-node">Confirmação</span>
          </div>
        </button>
      `).join("")
    : '<div class="empty-state">Nenhum comunicado cadastrado.</div>';
  bindSelection(announcementModule);
}

function renderMiniFlow(steps) {
  if (!steps?.length) return '<span class="flow-node">Sem etapas</span>';
  return steps
    .slice(0, 4)
    .map((step) => `<span class="flow-node">${escapeHtml(step.title)}</span>`)
    .join('<span class="arrow"></span>');
}

function bindSelection(root) {
  root.querySelectorAll("[data-select-type]").forEach((node) => {
    node.addEventListener("click", () => setSelected(node.dataset.selectType, node.dataset.selectId));
  });
}

function renderInspector() {
  if (selected.type === "company") return renderCompanyInspector();
  if (selected.type === "sector") return renderSectorInspector(getSector(selected.id));
  if (selected.type === "role") return renderRoleInspector(getRole(selected.id));
  if (selected.type === "process") return renderProcessInspector(getProcess(selected.id));
  if (selected.type === "document") return renderDocumentInspector(state.documents.find((item) => item.id === selected.id));
  if (selected.type === "announcement") return renderAnnouncementInspector(state.announcements.find((item) => item.id === selected.id));
}

function renderCompanyInspector() {
  inspectorTitle.textContent = "CIP Platina Extintores";
  inspectorSubtitle.textContent = "Mapa central da operação. Crie peças à esquerda e edite qualquer nó ao clicar.";
  inspectorBody.innerHTML = `
    <div class="form-grid">
      <div class="empty-state">
        Use o canvas para montar a empresa. O primeiro passo é cadastrar setores e cargos; depois crie processos e vincule os cargos envolvidos.
      </div>
      <button class="secondary-action" type="button" data-view-jump="cargos">Ver cargos e trilhas</button>
      <button class="secondary-action" type="button" data-view-jump="processos">Ver processos</button>
    </div>
  `;
  bindInspectorButtons();
}

function renderSectorInspector(sector) {
  if (!sector) return renderCompanyInspector();
  inspectorTitle.textContent = sector.name;
  inspectorSubtitle.textContent = "Setor da empresa. Ele agrupa cargos e processos.";
  inspectorBody.innerHTML = `
    <form class="form-grid" id="sectorForm">
      ${field("Nome do setor", "name", sector.name)}
      ${textareaField("Descrição", "description", sector.description)}
      <div class="button-row">
        <button class="primary-action" type="submit">Salvar setor</button>
        <button class="danger-action" type="button" data-delete="sector">Excluir</button>
      </div>
    </form>
  `;
  document.querySelector("#sectorForm").addEventListener("submit", (event) => {
    event.preventDefault();
    sector.name = formValue("name");
    sector.description = formValue("description");
    persist();
    render();
  });
  bindDelete("sector", sector.id);
}

function renderRoleInspector(role) {
  if (!role) return renderCompanyInspector();
  const track = getTrackForRole(role.id);
  inspectorTitle.textContent = role.name;
  inspectorSubtitle.textContent = "Cargo da empresa, processos obrigatórios e trilha de conhecimento.";
  inspectorBody.innerHTML = `
    <form class="form-grid" id="roleForm">
      ${field("Nome do cargo", "name", role.name)}
      ${selectField("Setor", "sectorId", state.sectors.map((sector) => [sector.id, sector.name]), role.sectorId)}
      ${textareaField("Objetivo do cargo", "purpose", role.purpose)}
      ${textareaField("Expectativas e responsabilidades", "expectations", role.expectations)}
      <div class="lane-title">Processos que este cargo participa</div>
      <div class="track-flow">${processesForRole(role.id).map((process) => `<span class="flow-node">${escapeHtml(process.name)}</span>`).join('<span class="arrow"></span>') || '<span class="flow-node">Nenhum processo vinculado</span>'}</div>
      <div class="lane-title">Trilha de conhecimento</div>
      ${textareaField("Conhecimento necessário", "knowledge", track.knowledge || "")}
      ${textareaField("Módulos internos", "modules", track.modules || "")}
      ${textareaField("Cursos externos (Nome | link)", "courses", track.courses || "")}
      ${textareaField("Documentos da trilha", "documents", track.documents || "")}
      <div class="button-row">
        <button class="primary-action" type="submit">Salvar cargo e trilha</button>
        <button class="danger-action" type="button" data-delete="role">Excluir</button>
      </div>
    </form>
  `;
  document.querySelector("#roleForm").addEventListener("submit", (event) => {
    event.preventDefault();
    role.name = formValue("name");
    role.sectorId = formValue("sectorId");
    role.purpose = formValue("purpose");
    role.expectations = formValue("expectations");
    track.knowledge = formValue("knowledge");
    track.modules = formValue("modules");
    track.courses = formValue("courses");
    track.documents = formValue("documents");
    persist();
    render();
  });
  bindDelete("role", role.id);
}

function renderProcessInspector(process) {
  if (!process) return renderCompanyInspector();
  inspectorTitle.textContent = process.name;
  inspectorSubtitle.textContent = "Processo oficial com cargos envolvidos, fluxograma, regra escrita e materiais.";
  inspectorBody.innerHTML = `
    <form class="form-grid" id="processForm">
      ${field("Nome do processo", "name", process.name)}
      ${selectField("Setor", "sectorId", state.sectors.map((sector) => [sector.id, sector.name]), process.sectorId)}
      ${selectField("Dono do processo", "ownerRoleId", state.roles.map((role) => [role.id, role.name]), process.ownerRoleId)}
      ${selectField("Status", "status", [["Rascunho", "Rascunho"], ["Em revisão", "Em revisão"], ["Publicado", "Publicado"]], process.status)}
      <div class="field">
        <span>Cargos envolvidos</span>
        <div class="checkbox-grid">
          ${state.roles.map((role) => `
            <label class="check-card">
              <input type="checkbox" name="roleIds" value="${role.id}" ${process.roleIds.includes(role.id) ? "checked" : ""} />
              <span>${escapeHtml(role.name)}<small>${escapeHtml(getSector(role.sectorId)?.name || "")}</small></span>
            </label>
          `).join("")}
        </div>
      </div>
      ${textareaField("Resumo", "summary", process.summary)}
      ${textareaField("Regra / texto completo", "details", process.details)}
      ${field("Link de vídeo", "videoUrl", process.videoUrl)}
      ${textareaField("Documentos / anexos", "documentRefs", process.documentRefs)}
      ${textareaField("Etapas do fluxograma (Título | tipo | responsável | detalhe)", "steps", stringifySteps(process.steps))}
      <div class="button-row">
        <button class="primary-action" type="submit">Salvar processo</button>
        <button class="secondary-action" type="button" id="suggestSteps">IA sugerir etapas</button>
        <button class="danger-action" type="button" data-delete="process">Excluir</button>
      </div>
    </form>
  `;
  document.querySelector("#processForm").addEventListener("submit", (event) => {
    event.preventDefault();
    process.name = formValue("name");
    process.sectorId = formValue("sectorId");
    process.ownerRoleId = formValue("ownerRoleId");
    process.status = formValue("status");
    process.roleIds = Array.from(document.querySelectorAll('input[name="roleIds"]:checked')).map((item) => item.value);
    process.summary = formValue("summary");
    process.details = formValue("details");
    process.videoUrl = formValue("videoUrl");
    process.documentRefs = formValue("documentRefs");
    process.steps = parseSteps(formValue("steps"));
    persist();
    render();
  });
  document.querySelector("#suggestSteps").addEventListener("click", () => {
    const base = process.summary || process.name;
    document.querySelector('[name="steps"]').value = [
      `Objetivo | etapa | Dono do processo | ${base}`,
      "Executar rotina | etapa | Cargo responsável | Descrever execução padrão",
      "Existe exceção? | decisão | Supervisor | Avaliar preço, prazo, risco ou regra fora do padrão",
      "Registrar evidência | evidência | Executor | Anexar documento, foto, observação ou comprovante",
      "Publicar padrão | aprovação | Gestor | Validar e transformar em processo oficial",
    ].join("\n");
  });
  bindDelete("process", process.id);
}

function renderDocumentInspector(doc) {
  if (!doc) return renderCompanyInspector();
  inspectorTitle.textContent = doc.title;
  inspectorSubtitle.textContent = "Documento geral, política, regimento ou material de apoio.";
  inspectorBody.innerHTML = `
    <form class="form-grid" id="docForm">
      ${field("Título", "title", doc.title)}
      ${field("Categoria", "category", doc.category)}
      ${field("Escopo", "scope", doc.scope)}
      ${textareaField("Texto / descrição", "text", doc.text)}
      ${field("Link de vídeo", "videoUrl", doc.videoUrl)}
      ${textareaField("Arquivos", "files", doc.files)}
      <div class="button-row">
        <button class="primary-action" type="submit">Salvar documento</button>
        <button class="danger-action" type="button" data-delete="document">Excluir</button>
      </div>
    </form>
  `;
  document.querySelector("#docForm").addEventListener("submit", (event) => {
    event.preventDefault();
    doc.title = formValue("title");
    doc.category = formValue("category");
    doc.scope = formValue("scope");
    doc.text = formValue("text");
    doc.videoUrl = formValue("videoUrl");
    doc.files = formValue("files");
    persist();
    render();
  });
  bindDelete("document", doc.id);
}

function renderAnnouncementInspector(item) {
  if (!item) return renderCompanyInspector();
  inspectorTitle.textContent = item.title;
  inspectorSubtitle.textContent = "Comunicado de mudança ou alerta oficial.";
  inspectorBody.innerHTML = `
    <form class="form-grid" id="announcementForm">
      ${field("Título", "title", item.title)}
      ${field("Público alvo", "target", item.target)}
      ${textareaField("Mensagem", "text", item.text)}
      ${selectField("Processo relacionado", "relatedProcessId", [["", "Nenhum"], ...state.processes.map((process) => [process.id, process.name])], item.relatedProcessId)}
      ${selectField("Status", "status", [["Rascunho", "Rascunho"], ["Publicado", "Publicado"], ["Arquivado", "Arquivado"]], item.status)}
      <div class="button-row">
        <button class="primary-action" type="submit">Salvar comunicado</button>
        <button class="danger-action" type="button" data-delete="announcement">Excluir</button>
      </div>
    </form>
  `;
  document.querySelector("#announcementForm").addEventListener("submit", (event) => {
    event.preventDefault();
    item.title = formValue("title");
    item.target = formValue("target");
    item.text = formValue("text");
    item.relatedProcessId = formValue("relatedProcessId");
    item.status = formValue("status");
    persist();
    render();
  });
  bindDelete("announcement", item.id);
}

function field(label, name, value = "") {
  return `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" value="${escapeHtml(value)}" /></div>`;
}

function textareaField(label, name, value = "") {
  return `<div class="field"><label for="${name}">${label}</label><textarea id="${name}" name="${name}">${escapeHtml(value)}</textarea></div>`;
}

function selectField(label, name, options, selectedValue = "") {
  return `
    <div class="field">
      <label for="${name}">${label}</label>
      <select id="${name}" name="${name}">
        ${options.map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
      </select>
    </div>
  `;
}

function formValue(name) {
  return document.querySelector(`[name="${name}"]`)?.value?.trim() || "";
}

function lines(text = "") {
  return String(text).split("\n").map((line) => line.trim()).filter(Boolean);
}

function stringifySteps(steps = []) {
  return steps.map((step) => `${step.title} | ${step.type || "etapa"} | ${step.owner || ""} | ${step.detail || ""}`).join("\n");
}

function parseSteps(text) {
  return lines(text).map((line) => {
    const [title = "Etapa", type = "etapa", owner = "", detail = ""] = line.split("|").map((part) => part.trim());
    return { title, type, owner, detail };
  });
}

function bindInspectorButtons() {
  inspectorBody.querySelectorAll("[data-view-jump]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.viewJump));
  });
}

function bindDelete(type, id) {
  const button = inspectorBody.querySelector(`[data-delete="${type}"]`);
  if (!button) return;
  button.addEventListener("click", () => {
    if (type === "sector") {
      state.sectors = state.sectors.filter((item) => item.id !== id);
      state.roles.forEach((role) => {
        if (role.sectorId === id) role.sectorId = state.sectors[0]?.id || "";
      });
      state.processes.forEach((process) => {
        if (process.sectorId === id) process.sectorId = state.sectors[0]?.id || "";
      });
    }
    if (type === "role") {
      state.roles = state.roles.filter((item) => item.id !== id);
      state.tracks = state.tracks.filter((item) => item.roleId !== id);
      state.processes.forEach((process) => {
        process.roleIds = process.roleIds.filter((roleId) => roleId !== id);
      });
    }
    if (type === "process") state.processes = state.processes.filter((item) => item.id !== id);
    if (type === "document") state.documents = state.documents.filter((item) => item.id !== id);
    if (type === "announcement") state.announcements = state.announcements.filter((item) => item.id !== id);
    selected = { type: "company", id: "platina" };
    persist();
    render();
  });
}

function createSector() {
  const sector = { id: uid("setor"), name: "Novo setor", description: "Descreva a função deste setor." };
  state.sectors.push(sector);
  selected = { type: "sector", id: sector.id };
  persist();
  render();
}

function createRole() {
  const sector = ensureSector();
  const role = {
    id: uid("cargo"),
    sectorId: sector.id,
    name: "Novo cargo",
    purpose: "Defina o objetivo do cargo.",
    expectations: "Liste responsabilidades, padrões e expectativas.",
  };
  state.roles.push(role);
  state.tracks.push({
    id: uid("trilha"),
    roleId: role.id,
    knowledge: "",
    modules: "Integração Platina\nProcessos obrigatórios\nValidação final",
    courses: "",
    documents: "",
  });
  selected = { type: "role", id: role.id };
  persist();
  render();
}

function createProcess() {
  const sector = ensureSector();
  const role = ensureRole();
  const process = {
    id: uid("processo"),
    sectorId: sector.id,
    name: "Novo processo",
    ownerRoleId: role.id,
    roleIds: [role.id],
    status: "Rascunho",
    summary: "Descreva o objetivo deste processo.",
    details: "Escreva a regra ou procedimento completo.",
    videoUrl: "",
    documentRefs: "",
    steps: [{ title: "Início", type: "etapa", owner: "Responsável", detail: "Descreva a primeira etapa." }],
  };
  state.processes.push(process);
  selected = { type: "process", id: process.id };
  currentView = "processos";
  persist();
  render();
}

function createDocument() {
  const doc = {
    id: uid("doc"),
    title: "Novo documento",
    category: "Geral",
    scope: "Empresa",
    text: "Descreva o documento.",
    videoUrl: "",
    files: "",
  };
  state.documents.push(doc);
  selected = { type: "document", id: doc.id };
  currentView = "documentos";
  persist();
  render();
}

function createAnnouncement() {
  const item = {
    id: uid("comunicado"),
    title: "Novo comunicado",
    target: "Equipe",
    text: "Descreva a mudança ou aviso.",
    relatedProcessId: "",
    status: "Rascunho",
  };
  state.announcements.push(item);
  selected = { type: "announcement", id: item.id };
  currentView = "comunicados";
  persist();
  render();
}

function createProcessFromAi() {
  const sector = ensureSector();
  const role = ensureRole();
  const prompt = document.querySelector("#aiPrompt").value.trim();
  const base = prompt || "Nova rotina informada";
  const process = {
    id: uid("processo"),
    sectorId: sector.id,
    name: base.slice(0, 58),
    ownerRoleId: role.id,
    roleIds: [role.id],
    status: "Rascunho",
    summary: base,
    details: "Rascunho criado pela IA. Revise, ajuste cargos envolvidos e publique quando estiver correto.",
    videoUrl: "",
    documentRefs: "",
    steps: [
      { title: "Objetivo", type: "etapa", owner: "Gestor", detail: base },
      { title: "Executar rotina", type: "etapa", owner: "Cargo responsável", detail: "Descrever execução padrão." },
      { title: "Existe exceção?", type: "decisão", owner: "Supervisor", detail: "Avaliar regra fora do padrão." },
      { title: "Registrar evidência", type: "evidência", owner: "Executor", detail: "Anexar prova, documento ou observação." },
      { title: "Publicar padrão", type: "aprovação", owner: "Gestor", detail: "Validar e transformar em processo oficial." },
    ],
  };
  state.processes.push(process);
  selected = { type: "process", id: process.id };
  currentView = "processos";
  persist();
  render();
}

function resetWorkspace() {
  state = { sectors: [], roles: [], processes: [], tracks: [], documents: [], announcements: [] };
  selected = { type: "company", id: "platina" };
  currentView = "mapa";
  persist();
  render();
}

function ensureSector() {
  if (state.sectors.length) return state.sectors[0];
  const sector = { id: uid("setor"), name: "Novo setor", description: "Primeiro setor da empresa." };
  state.sectors.push(sector);
  return sector;
}

function ensureRole() {
  if (state.roles.length) return state.roles[0];
  const sector = ensureSector();
  const role = {
    id: uid("cargo"),
    sectorId: sector.id,
    name: "Novo cargo",
    purpose: "Defina o objetivo do cargo.",
    expectations: "Liste responsabilidades, padrões e expectativas.",
  };
  state.roles.push(role);
  state.tracks.push({
    id: uid("trilha"),
    roleId: role.id,
    knowledge: "",
    modules: "Integração Platina\nProcessos obrigatórios\nValidação final",
    courses: "",
    documents: "",
  });
  return role;
}

render();
