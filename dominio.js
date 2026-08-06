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

/* O que a biblioteca guarda — e, por consequência, o que ela NÃO guarda.

   Decisão do Eric em 03/08/2026: no CIP o POP é o passo a passo do processo.
   Ele já tem o que fazer, como fazer, quem faz, por quê, onde se erra, a regra
   e a evidência. Um POP em Word ao lado disso seria uma segunda verdade sobre
   o mesmo trabalho, e no dia que a regra mudar uma das duas fica para trás.

   Então a biblioteca é para o que o CIP NÃO consegue deduzir: o que vem de
   fora. A lista é fechada de propósito — campo livre vira bagunça em três
   meses, com "Técnico", "técnica" e "Téc." significando a mesma coisa. */
const TIPOS_DOCUMENTO = {
  norma: { rotulo: "Norma técnica", ajuda: "ABNT, Corpo de Bombeiros, exigência legal. Vem de fora e você não escreve — cumpre." },
  manual: { rotulo: "Manual do fabricante", ajuda: "Ficha técnica, manual de equipamento, especificação de peça." },
  formulario: { rotulo: "Formulário ou checklist", ajuda: "O papel que alguém preenche durante o trabalho." },
  contrato: { rotulo: "Contrato ou modelo", ajuda: "Contrato, proposta padrão, termo que a empresa usa." },
  laudo: { rotulo: "Laudo ou certificado", ajuda: "A prova emitida: laudo, certificado, ART, relatório assinado." },
  politica: { rotulo: "Política ou regimento", ajuda: "A regra da casa escrita em prosa — o que vem antes do processo." },
  treinamento: { rotulo: "Material de treinamento", ajuda: "Apostila, apresentação, vídeo usado para ensinar." },
  outro: { rotulo: "Outro", ajuda: "Ainda não se encaixou em nenhum. Se muitos caírem aqui, falta um tipo." },
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
    decisoes: [],
    fins: [],
    documentos: [],
    sistemas: [],
    indicadores: [],
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
  };
}

function valido(dados) {
  const listas = ["setores", "cargos", "processos"];
  return !!dados && listas.every((chave) => Array.isArray(dados[chave]));
}

function normalizarSaidas(bruto) {
  return (Array.isArray(bruto) ? bruto : [])
    .map((x) => (typeof x === "string" ? { para: x, rotulo: "" } : { para: x?.para || "", rotulo: x?.rotulo || "" }))
    .filter((x) => x.para);
}

/* Id é chave, não texto: entra em atributo HTML, em seletor CSS e em
   comparação. Quando nasce de uid() é seguro por construção — mas ele também
   pode vir de um .bpmn ou de um JSON importado, e aí é texto de estranho.

   Um id como `a" onmouseover="alert(1)` sai do atributo e vira código na tela
   de quem abrir o processo — e, com a sincronia ao vivo, na tela dos outros
   dois também. Escapar em cada uso seria trinta lugares para acertar e um para
   esquecer; a porta é aqui, onde todo estado entra. */
const ID_SEGURO = /^[A-Za-z0-9_:.-]{1,120}$/;

function sanearIds(dados) {
  const listas = ["setores", "cargos", "processos", "decisoes", "fins", "documentos", "sistemas", "indicadores"];
  const trocas = new Map();

  const registrar = (obj) => {
    if (!obj || typeof obj.id !== "string" || ID_SEGURO.test(obj.id)) return;
    if (!trocas.has(obj.id)) trocas.set(obj.id, uid("x"));
  };

  listas.forEach((k) => (dados[k] || []).forEach(registrar));
  (dados.processos || []).forEach((p) => (p.passos || []).forEach(registrar));
  (dados.cargos || []).forEach((c) => (c.trilha || []).forEach(registrar));
  if (!trocas.size) return dados;

  /* Troca por valor em toda a árvore: id é string opaca, então qualquer campo
     que contenha exatamente o id velho é uma referência a ele. Assim nenhuma
     ligação se perde, inclusive as que eu ainda não escrevi. */
  const trocar = (no) => {
    if (typeof no === "string") return trocas.get(no) ?? no;
    if (Array.isArray(no)) return no.map(trocar);
    if (no && typeof no === "object") {
      Object.keys(no).forEach((k) => { no[k] = trocar(no[k]); });
    }
    return no;
  };
  return trocar(dados);
}

function normalizar(dados) {
  dados = sanearIds(dados);
  dados.empresa = dados.empresa || { nome: "Empresa" };
  dados.documentos = Array.isArray(dados.documentos) ? dados.documentos : [];
  dados.documentos.forEach((doc) => {
    doc.titulo = doc.titulo || "";
    doc.resumo = doc.resumo || "";
    doc.escopo = doc.escopo || "";
    if (TIPOS_DOCUMENTO[doc.categoria]) return;

    /* O campo era texto livre. O que dá para reconhecer vira tipo; o resto cai
       em "outro" — e, se for descrição de a-quem-serve e não de o-que-é, migra
       para o escopo, que é onde essa informação sempre deveria ter morado. */
    const bruto = String(doc.categoria || "").trim();
    const chave = bruto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const acha = (...termos) => termos.some((t) => chave.includes(t));

    doc.categoria =
      acha("norma", "nbr", "abnt", "bombeiro", "legal", "nr-", "nr ") ? "norma"
      : acha("manual", "fabricante", "ficha tec", "especific") ? "manual"
      : acha("formul", "checklist", "check-list", "planilha") ? "formulario"
      : acha("contrato", "proposta", "termo", "modelo") ? "contrato"
      : acha("laudo", "certific", "art", "relatorio") ? "laudo"
      : acha("politic", "regiment", "regra", "manual da empresa") ? "politica"
      : acha("treinamento", "apostila", "curso", "aula") ? "treinamento"
      : acha("pop", "procedimento", "instrucao") ? "outro"   // POP virou o passo a passo
      : "outro";

    if (doc.categoria === "outro" && bruto && !/^geral$/i.test(bruto) && !doc.escopo.trim()) {
      doc.escopo = bruto;
    }
  });
  dados.decisoes = Array.isArray(dados.decisoes) ? dados.decisoes : [];

  dados.sistemas = Array.isArray(dados.sistemas) ? dados.sistemas : [];
  dados.sistemas.forEach((s) => {
    s.nome = s.nome || "";
    s.descricao = s.descricao || "";
    s.url = s.url || "";
    s.critico = !!s.critico;
  });

  /* A regra de negócio saiu do sistema. Ela chegou a ser objeto próprio, com
     código RN-000 e catálogo na Biblioteca, e a intenção era boa: "pedido acima
     de 10 mil pode ser faturado em 30/60/90/120" vale no Comercial ao orçar e no
     Financeiro ao aprovar, então não pertence a um processo só.

     O que derrubou não foi a ideia, foi a duplicidade na cabeça de quem usa:
     norma, política e contrato já moram em Documento, e quem procura "a regra
     do faturamento" não sabe qual das duas gavetas abrir. Uma gaveta só erra
     menos que duas gavetas certas. Regra que precisa ser escrita vira Documento
     do tipo política ou norma, ligado ao processo.

     Base antiga perde os vestígios aqui, e não em cada tela. */
  delete dados.regras;
  (dados.processos || []).forEach((p) => (p.passos || []).forEach((s) => {
    delete s.regraIds;
    delete s.regra;
  }));

  /* O indicador fecha a ponte com o Bloco 9: sem número definido na modelagem,
     a Inteligência não tem o que medir. Mora fora do processo pelo mesmo motivo
     da regra — "prazo médio de entrega" é do Comercial e da Logística ao mesmo
     tempo, e cada um mediria de um jeito. */
  dados.indicadores = Array.isArray(dados.indicadores) ? dados.indicadores : [];
  dados.indicadores.forEach((i) => {
    i.nome = i.nome || "";
    i.pergunta = i.pergunta || "";
    i.unidade = DIRECOES[i.unidade] ? i.unidade : "numero";
    i.direcao = DIRECOES_BOAS.includes(i.direcao) ? i.direcao : "maior";
    i.meta = typeof i.meta === "number" ? i.meta : (i.meta === "" || i.meta == null ? null : Number(i.meta));
    if (!Number.isFinite(i.meta)) i.meta = null;
    i.frequencia = FREQUENCIAS[i.frequencia] ? i.frequencia : "mensal";
    i.processoIds = (Array.isArray(i.processoIds) ? i.processoIds : [])
      .filter((id) => (dados.processos || []).some((p) => p.id === id));
  });

  /* A fase saiu do projeto em 03/08/2026. Era uma segunda maneira de agrupar o
     mesmo mapa, e ninguém usava as duas — o setor já responde "de quem é o
     trabalho". Duas formas de agrupar significavam manter duas classificações
     em dia; na prática, uma sempre ficava para trás. */
  delete dados.fases;
  (dados.processos || []).forEach((p) => delete p.faseId);
  (dados.decisoes || []).forEach((x) => delete x.faseId);
  (dados.fins || []).forEach((x) => delete x.faseId);

  /* Chefe apagado sobe o subordinado para a raiz, em vez de deixá-lo pendurado
     num id que não existe — a árvore precisa continuar desenhável. */
  dados.cargos.forEach((c) => {
    if (c.reportaA && !dados.cargos.some((x) => x.id === c.reportaA)) c.reportaA = null;
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
    f.proximos = [];
  });

  dados.decisoes.forEach((d) => {
    d.tipo = TIPOS_DECISAO[d.tipo] ? d.tipo : "exclusivo";
    d.pergunta = d.pergunta || "";
    d.setorId = d.setorId || "";
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
    p.videoUrl = p.videoUrl || "";
    p.passos.forEach((s) => { s.videoUrl = s.videoUrl || ""; });
    p.proximos = normalizarSaidas(p.proximos);
    p.entrada = p.entrada || "";
    p.saida = p.saida || "";
    p.revisado = p.revisado !== false;

    /* RACI completo. R e A já existiam com outros nomes — quem executa e o dono.
       Faltavam C e I, que são justamente os que ninguém lembra de avisar. */
    const existeCargo = (id) => !!id && dados.cargos.some((c) => c.id === id);
    const cargosVivos = (ids) => (Array.isArray(ids) ? ids : []).filter(existeCargo);
    p.cargosIds = cargosVivos(p.cargosIds);
    p.consultadosIds = cargosVivos(p.consultadosIds);
    p.informadosIds = cargosVivos(p.informadosIds);

    /* Dono apagado precisa virar SEM dono, não dono fantasma. A trava de
       aprovação testa se o campo está vazio; um id que aponta para ninguém
       passa por ela e o processo é aprovado sem ninguém para responder. */
    if (!existeCargo(p.donoCargoId)) p.donoCargoId = "";

    /* A aprovação carrega nome, data e a ASSINATURA do conteúdo aprovado. Sem
       a assinatura, "aprovado" vira selo eterno: alguém aprova, outro edita, e
       o carimbo continua lá dizendo que está tudo certo. */
    if (p.aprovacao && typeof p.aprovacao === "object") {
      p.aprovacao.nome = p.aprovacao.nome || "";
      p.aprovacao.em = p.aprovacao.em || "";
      p.aprovacao.assinatura = p.aprovacao.assinatura || "";
    } else {
      p.aprovacao = null;
    }

    /* O "material de apoio" do processo era anexo digitado à mão — título e link
       soltos, sem nenhuma ligação com a biblioteca. Documento cadastrado não
       aparecia no processo, e anexo do processo não virava documento: duas
       listas de arquivo na mesma empresa, nenhuma sabendo da outra.

       Agora o processo APONTA para documentos. O anexo antigo vira documento de
       verdade, e títulos iguais viram um só — que é o mesmo ganho da regra. */
    if (Array.isArray(p.anexos) && p.anexos.length) {
      p.documentoIds = Array.isArray(p.documentoIds) ? p.documentoIds : [];
      p.anexos.forEach((a) => {
        const titulo = String(a?.titulo || "").trim();
        const url = String(a?.url || "").trim();
        if (!titulo && !url) return;
        const nome = titulo || url;
        let doc = dados.documentos.find((x) => x.titulo.trim() === nome && (x.url || "") === url);
        if (!doc) {
          doc = { id: uid("d"), titulo: nome, categoria: "outro", escopo: "", resumo: "", url, videoUrl: "" };
          dados.documentos.push(doc);
        }
        if (!p.documentoIds.includes(doc.id)) p.documentoIds.push(doc.id);
      });
    }
    delete p.anexos;
    p.documentoIds = (Array.isArray(p.documentoIds) ? p.documentoIds : [])
      .filter((id) => dados.documentos.some((x) => x.id === id));

    p.historico = (Array.isArray(p.historico) ? p.historico : [])
      .filter((h) => h && h.em)
      .slice(-50); // o histórico é de governança, não é log: cabe em uma tela
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
            oQue: texto, comoFazer: "", porque: "", armadilha: "",
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
      /* Quem faz o passo define a raia do desenho. Cargo apagado deixaria uma
         raia de ninguém — e a resposta certa é "sem responsável", não um id
         que não existe. */
      s.cargoId = existeCargo(s.cargoId) ? s.cargoId : "";
      /* Setor do passo: a resposta grossa de "quem faz", para quando o cargo
         ainda não existe. Setor apagado limpa, como tudo o mais. */
      s.setorId = dados.setores.some((x) => x.id === s.setorId) ? s.setorId : "";
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

/* A assinatura do que foi aprovado. Não é criptografia — é só o suficiente para
   perceber que o conteúdo mudou depois do carimbo. Cobre o que a aprovação
   realmente aprova: o que se faz, em que ordem, em que sistema e por quem. */
function assinaturaDoProcesso(p) {
  const partes = [
    p.nome, p.porque, p.entrada, p.saida, p.donoCargoId,
    (p.cargosIds || []).join(","),
    ...(p.passos || []).map((s) => [
      s.tipo, s.oQue, s.comoFazer, s.porque, s.armadilha,
      (s.sistemaIds || []).join("+"), s.cargoId,
      (s.proximos || []).map((x) => `${x.para}:${x.rotulo}`).join(">"),
    ].join("|")),
  ].join("~");

  let h = 5381;
  for (let i = 0; i < partes.length; i++) h = ((h << 5) + h + partes.charCodeAt(i)) >>> 0;
  return `${h.toString(36)}-${partes.length.toString(36)}`;
}

/* Três estados, e o do meio é o que faltava: aprovado mas alterado depois.
   Chamar isso de "vigente" seria mentir; chamar de "rascunho" apagaria o
   trabalho de quem aprovou. */
function situacaoDoProcesso(p) {
  if (!p?.aprovacao) return "rascunho";
  return p.aprovacao.assinatura === assinaturaDoProcesso(p) ? "vigente" : "mudou";
}

const SITUACOES = {
  rascunho: { rotulo: "rascunho", classe: "amber", ajuda: "Ainda não foi aprovado por ninguém." },
  vigente: { rotulo: "vigente", classe: "green", ajuda: "Aprovado, e não mudou desde então." },
  mudou: { rotulo: "mudou desde a aprovação", classe: "red", ajuda: "Foi aprovado, mas alguém editou depois. Precisa de nova aprovação." },
};

/* O que impede de aprovar. Devolve o motivo, não um booleano: quem clica precisa
   saber o que falta, não só que não pode.

   A trava principal veio de uma auditoria externa em 03/08/2026, depois que a
   IA rascunhou 51 passos: "o risco agora não é falta de estrutura, é alguém
   aprovar rápido demais conteúdo plausível mas não confirmado". Estava certo —
   dava para aprovar um rascunho de IA em dois cliques sem nunca ter lido. */
function porQueNaoPodeAprovar(p, st = state) {
  return (faltaParaAprovar(p, st)[0] || "");
}

/* O CRITÉRIO OFICIAL DE PROCESSO PRONTO, num lugar só.

   Antes eram dois, e discordavam: dava para aprovar um processo de 2 passos e
   o contador continuar dizendo que não estava pronto, porque `mapeado()` exigia
   3. O ensaio geral pegou isso na primeira rodada. Duas definições de "pronto"
   é como cada pessoa passa a ter a sua.

   Agora só existe esta lista, e ela é cobrada no único momento que importa: a
   aprovação. Depois de aprovado, pronto é pronto.

   O número mínimo de passos saiu. Era palpite de quando não havia aprovação —
   um jeito de adivinhar se alguém tinha mesmo preenchido. Hoje existe sinal de
   verdade: uma pessoa com nome disse que está certo. Se o processo tem dois
   passos e o dono aprovou, ele tem dois passos. */
function faltaParaAprovar(p, st = state) {
  if (!p) return ["processo não encontrado"];
  const faltas = [];
  const recebe = [...st.processos, ...st.decisoes].some((n) => (n.proximos || []).some((x) => x.para === p.id));
  const entrega = (p.proximos || []).length > 0;

  if (p.revisado === false) faltas.push("este texto foi escrito pela IA e ninguém revisou ainda");
  if (!(p.passos || []).length) faltas.push("não há passos escritos");
  else if ((p.passos || []).some((s) => !s.oQue?.trim())) faltas.push("há passo sem título");
  if (!p.donoCargoId) faltas.push("sem dono, não há quem responda pela aprovação");
  if (!(p.cargosIds || []).length) faltas.push("sem ninguém marcado como quem executa");
  if (!p.porque?.trim()) faltas.push("não diz por que o processo existe");
  if (recebe && !p.entrada?.trim()) faltas.push("recebe de outra peça mas não diz o que recebe");
  if (entrega && !p.saida?.trim()) faltas.push("entrega para outra peça mas não diz o que entrega");
  return faltas;
}

/* Revisar e aprovar são atos diferentes, e de propósito. Revisar é dizer "li e
   está certo"; aprovar é assumir publicamente que o processo é esse. Colapsar
   os dois num clique é o que transforma rascunho em verdade sem ninguém ler. */
function marcarRevisado(p, nome, quando = new Date().toISOString()) {
  if (!p || p.revisado !== false) return p;
  p.revisado = true;
  registrar(p, quando, nome, "revisou o rascunho da IA");
  return p;
}

/* Aprovar é um ato com nome e data — é isso que separa governança de checkbox. */
function aprovarProcesso(p, nome, quando = new Date().toISOString()) {
  const impedimento = porQueNaoPodeAprovar(p);
  if (impedimento) return { ok: false, motivo: impedimento };
  p.aprovacao = { nome: nome || "alguém", em: quando, assinatura: assinaturaDoProcesso(p) };
  p.status = "vigente";
  registrar(p, quando, nome, "aprovou");
  return { ok: true, processo: p };
}

function retirarAprovacao(p, nome, quando = new Date().toISOString()) {
  p.aprovacao = null;
  p.status = "rascunho";
  registrar(p, quando, nome, "tirou a aprovação");
  return p;
}

function registrar(p, em, quem, acao, detalhe = "") {
  p.historico = [...(p.historico || []), { em, quem: quem || "alguém", acao, detalhe }].slice(-50);
}

/* RACI só vale se alguém for responsabilizável. Sem A, "todo mundo aprova" —
   que é o mesmo que ninguém. E o cargo que executa não se consulta a si mesmo. */
function problemasDeRaci(p, st = state) {
  const problemas = [];
  if (!p.donoCargoId) problemas.push("Sem dono: ninguém responde por este processo.");
  if (!(p.cargosIds || []).length) problemas.push("Ninguém marcado como quem executa.");
  const executa = new Set(p.cargosIds || []);
  const repetidos = (p.consultadosIds || []).filter((id) => executa.has(id));
  repetidos.forEach((id) => {
    const c = st.cargos.find((x) => x.id === id);
    problemas.push(`${c?.nome || "Um cargo"} executa e é consultado ao mesmo tempo — escolha um.`);
  });
  return problemas;
}

/* Quem precisa ser avisado quando este processo mudar: quem executa, quem é
   consultado, quem é informado e o dono. Derivado, nunca guardado. */
function quemAvisar(p, st = state) {
  const ids = [...new Set([p.donoCargoId, ...(p.cargosIds || []), ...(p.consultadosIds || []), ...(p.informadosIds || [])])];
  return ids.filter(Boolean).map((id) => st.cargos.find((c) => c.id === id)).filter(Boolean);
}

/* O que mudou de regra e ainda não foi reaprovado. É a lista que o gestor abre
   na segunda de manhã. */
function processosQuePedemAtencao(st = state) {
  return st.processos.filter((p) => situacaoDoProcesso(p) === "mudou");
}

/* Pronto é aprovado e não mexido depois. Nada além disso — o que faz um
   processo poder ser aprovado está em faltaParaAprovar(), e é lá que se cobra. */
function mapeado(p) {
  return situacaoDoProcesso(p) === "vigente";
}

/* O que impede este processo de ficar pronto, curto, para caber num cartão. */
function faltando(p, st = state) {
  const faltas = faltaParaAprovar(p, st).map((x) => x
    .replace("este texto foi escrito pela IA e ninguém revisou ainda", "revisão")
    .replace("não há passos escritos", "os passos")
    .replace("há passo sem título", "título em algum passo")
    .replace("sem dono, não há quem responda pela aprovação", "dono")
    .replace("sem ninguém marcado como quem executa", "quem executa")
    .replace("não diz por que o processo existe", "por que existe")
    .replace("recebe de outra peça mas não diz o que recebe", "entrada")
    .replace("entrega para outra peça mas não diz o que entrega", "saída"));
  if (!faltas.length && situacaoDoProcesso(p) !== "vigente") faltas.push("aprovação");
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

  /* A raia é quem faz — e "quem faz" tem duas alturas de resposta.

     A fina é o cargo. A grossa é o setor, para quando ainda não se sabe qual
     cargo, ou quando o setor nem tem cargo cadastrado. O macro do Eric tem 10
     setores e 5 cargos: sem a resposta grossa, um passo que depende do
     Financeiro simplesmente não tinha onde ficar, e o subprocesso ficava preso
     no setor do processo — que é justamente o que ele não é.

     A ordem importa: cargo ganha do setor, porque é mais preciso. */
  const faixaDe = (s) => {
    if (s.cargoId && cargo(s.cargoId)) return `c:${s.cargoId}`;
    if (s.setorId && setor(s.setorId)) return `s:${s.setorId}`;
    return p.donoCargoId && cargo(p.donoCargoId) ? `c:${p.donoCargoId}` : "";
  };

  const idsFaixa = [];
  passos.forEach((s) => {
    const id = faixaDe(s);
    if (!idsFaixa.includes(id)) idsFaixa.push(id);
  });
  if (!idsFaixa.length) idsFaixa.push("");

  const faixas = idsFaixa.map((id) => {
    const [tipo, alvo] = id.split(":");
    if (tipo === "c") return { id, nome: cargo(alvo)?.nome || "Sem responsável", cor: corSetor(cargo(alvo)?.setorId) };
    if (tipo === "s") return { id, nome: setor(alvo)?.nome || "Sem setor", cor: corSetor(alvo) };
    return { id, nome: "Sem responsável", cor: "" };
  });

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

  const grupos = setoresPorCamada();
  const chave = "setorId";
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
    faixas.push({ id: "", nome: "Sem setor", cor: "" });
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
    setorId: "",
    oQue: "",
    comoFazer: "",
    porque: "",
    armadilha: "",
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
    `Setor: ${setor(p.setorId)?.nome || "—"}`,
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
  const lista = { p: "processos", d: "decisoes", doc: "documentos", sis: "sistemas", ind: "indicadores" }[prefixo];
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


const processo = (id) => state.processos.find((p) => p.id === id);

const sistema = (id) => state.sistemas.find((s) => s.id === id);
const indicador = (id) => state.indicadores.find((i) => i.id === id);
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
/* A seta e a saída dizem coisas diferentes, e é por isso que as duas existem:
   a seta diz PARA QUEM vai, a saída diz O QUE vai. Duas peças podem apontar
   para o mesmo lugar entregando coisas diferentes.

   Mas há redundância de verdade num ponto: a entrada de B costuma ser
   exatamente a saída de A. Digitar as duas é copiar à mão o que o sistema já
   sabe. Aqui ele oferece — não preenche sozinho, porque às vezes é mesmo
   diferente, e inventar seria pior que perguntar. */
function entradasSugeridas(p, st = state) {
  if (!p) return [];
  const vindoDe = [];
  st.processos.forEach((a) => {
    if (a.id === p.id) return;
    if ((a.proximos || []).some((x) => x.para === p.id) && a.saida?.trim()) {
      vindoDe.push({ de: a.nome, texto: a.saida.trim() });
    }
  });

  /* Quem chega por uma decisão herda a saída de quem entrou nela — o losango
     não transforma o que passa, só escolhe o caminho. */
  st.decisoes.forEach((dec) => {
    if (!(dec.proximos || []).some((x) => x.para === p.id)) return;
    st.processos.forEach((a) => {
      if ((a.proximos || []).some((x) => x.para === dec.id) && a.saida?.trim()) {
        vindoDe.push({ de: `${a.nome} → ${dec.pergunta || "decisão"}`, texto: a.saida.trim() });
      }
    });
  });

  const vistos = new Set();
  return vindoDe.filter((x) => !vistos.has(x.texto) && vistos.add(x.texto));
}

/* Para quem este processo entrega. Serve de contexto ao escrever a saída:
   você está escrevendo o que ELES vão receber. */
function quemRecebeDe(p, st = state) {
  /* A decisão é passagem, não destino: quem recebe de verdade é o que está do
     outro lado dela — e o outro lado pode ser um processo OU um fim nomeado. */
  const nomeDe = (id) => {
    const proc = st.processos.find((n) => n.id === id);
    if (proc) return proc.nome;
    const fim = st.fins.find((n) => n.id === id);
    return fim ? fim.nome : "";
  };

  const nomes = [];
  (p?.proximos || []).forEach((x) => {
    const direto = nomeDe(x.para);
    if (direto) return nomes.push(direto);
    const dec = st.decisoes.find((n) => n.id === x.para);
    if (dec) (dec.proximos || []).forEach((y) => {
      const atras = nomeDe(y.para);
      if (atras) nomes.push(atras);
    });
  });
  return [...new Set(nomes)].filter(Boolean);
}

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

const DIRECOES = {
  numero: { rotulo: "número", sufixo: "" },
  percentual: { rotulo: "percentual", sufixo: "%" },
  dias: { rotulo: "dias", sufixo: " d" },
  horas: { rotulo: "horas", sufixo: " h" },
  reais: { rotulo: "reais", sufixo: "" },
};
const DIRECOES_BOAS = ["maior", "menor"];
const FREQUENCIAS = {
  diaria: { rotulo: "por dia" },
  semanal: { rotulo: "por semana" },
  mensal: { rotulo: "por mês" },
  trimestral: { rotulo: "por trimestre" },
};

/* O indicador é do processo, mas guardado do lado do indicador — porque um
   número costuma medir mais de um processo, e o contrário é raro. */
function indicadoresDoProcesso(processoId, st = state) {
  return st.indicadores.filter((i) => (i.processoIds || []).includes(processoId));
}

/* Processo vigente sem nenhum número é processo que ninguém sabe se vai bem.
   Não é erro — é a lista do que medir a seguir. */
function processosSemIndicador(st = state) {
  return st.processos.filter((p) => situacaoDoProcesso(p) === "vigente" && !indicadoresDoProcesso(p.id, st).length);
}

/* Como o número aparece escrito. Meta sem unidade e sem direção é número solto:
   "15" não diz se 20 é bom ou ruim. */
function metaEscrita(i) {
  if (i?.meta == null) return "sem meta";
  const sufixo = DIRECOES[i.unidade]?.sufixo ?? "";
  const valor = i.unidade === "reais" ? `R$ ${i.meta}` : `${i.meta}${sufixo}`;
  return `${i.direcao === "maior" ? "no mínimo" : "no máximo"} ${valor}`;
}

/* Os documentos que um processo usa. Referência, não cópia. */
function documentosDoProcesso(p, st = state) {
  return (p?.documentoIds || []).map((id) => st.documentos.find((d) => d.id === id)).filter(Boolean);
}

/* A pergunta inversa do documento — e ela tem duas metades, porque documento
   serve para executar E para ensinar: quais processos o usam, e quais cargos
   o têm na trilha. */
function ondeApareceODocumento(docId, st = state) {
  return {
    processos: st.processos.filter((p) => (p.documentoIds || []).includes(docId)),
    cargos: st.cargos.filter((c) => (c.trilha || []).some((t) => t.documentoId === docId)),
  };
}

function documentosSemUso(st = state) {
  return st.documentos.filter((d) => {
    const onde = ondeApareceODocumento(d.id, st);
    return !onde.processos.length && !onde.cargos.length;
  });
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

   NÃO EXISTE BOTÃO PARA ISSO NA TELA, de propósito. O import substitui o fluxo
   macro inteiro; um clique errado num seletor de arquivo apagaria o trabalho de
   três pessoas. Carregar arquivo de fora é operação de uma vez só, feita fora
   do app — e o que fica aqui é a regra de tradução, testada, para quem for
   fazer essa carga saber exatamente o que ela faz.

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

/* XML aceita aspas simples e duplas. Lendo só as duplas, um elemento escrito
   com simples fica sem id e é descartado em silêncio — some do mapa sem
   ninguém saber. Achado numa auditoria de segurança, testando com aspas
   simples de propósito. */
function bpmnAtributo(trecho, nome) {
  const m = trecho.match(new RegExp(`\\s${nome}\\s*=\\s*("([^"]*)"|'([^']*)')`));
  if (!m) return "";
  return bpmnDesescapar(m[2] !== undefined ? m[2] : m[3]);
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
      id, nome: nome || "Sem nome", setorId: setorDoNo[id] || "",
      donoCargoId: "", cargosIds: [], status: "rascunho", revisado: true,
      videoUrl: "", entrada: "", saida: "", porque: "", seErrar: "",
      documentoIds: [], passos: [], perguntas: [], proximos: [],
    });
    conhecido[id] = "processo";
  })));

  [["exclusiveGateway", "exclusivo"], ["inclusiveGateway", "inclusivo"], ["parallelGateway", "inclusivo"], ["eventBasedGateway", "exclusivo"]]
    .forEach(([tag, tipo]) => bpmnAchar(texto, tag).forEach(({ attrs }) => registrar(attrs, (id, nome) => {
      if (tag === "parallelGateway") avisos.push(`"${nome || id}" é um gateway paralelo; virou inclusivo — o CIP não separa os dois.`);
      decisoes.push({ id, tipo, pergunta: nome || "", setorId: setorDoNo[id] || "", proximos: [] });
      conhecido[id] = "decisao";
    })));

  bpmnAchar(texto, "endEvent").forEach(({ attrs }) => registrar(attrs, (id, nome) => {
    fins.push({ id, nome: nome || "Fim", setorId: setorDoNo[id] || "", proximos: [] });
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

/* ------------------------------------------------------------- o que falta

   Uma auditoria externa apontou o essencial em 03/08/2026: a arquitetura
   representa a empresa, mas a empresa ainda não está dentro dela. Os 16
   processos importados eram casca — sem passos, sem entrada, sem saída, sem
   dono, sem executor, nenhum aprovado.

   Achar isso exigia abrir peça por peça. A lista abaixo é a resposta: uma
   função que percorre o modelo e devolve o que falta, com o caminho para
   consertar. Não inventa cobrança nova — junta as que já existiam espalhadas
   (elo fraco, sistema sem uso, processo sem indicador) e completa as que
   faltavam.

   `peso` ordena por consequência, não por gosto:
   1 quebra o fluxo · 2 impede responsabilizar · 3 deixa o processo oco · 4 sobra solta */
function pendencias(st = state) {
  const lista = [];
  const põe = (peso, tipo, titulo, detalhe, ir) => lista.push({ peso, tipo, titulo, detalhe, ir });

  const temEntrada = new Set();
  [...st.processos, ...st.decisoes].forEach((n) => (n.proximos || []).forEach((x) => temEntrada.add(x.para)));

  st.processos.forEach((p) => {
    const abre = { view: "editor", extras: { processoId: p.id } };
    const entrega = (p.proximos || []).length > 0;

    if (entrega && !p.saida?.trim()) põe(1, "elo", p.nome, "entrega para outra peça mas não diz o que entrega", abre);
    if (temEntrada.has(p.id) && !p.entrada?.trim()) põe(1, "elo", p.nome, "recebe de outra peça mas não diz o que recebe", abre);
    if (!p.donoCargoId) põe(2, "dono", p.nome, "ninguém responde por este processo", abre);
    if (!(p.cargosIds || []).length) põe(2, "executor", p.nome, "nenhum cargo marcado como quem executa", abre);
    if (!(p.passos || []).length) põe(3, "passos", p.nome, "o subprocesso está vazio — a ficha existe, o trabalho não está descrito", abre);
    else if (!p.porque?.trim()) põe(3, "porque", p.nome, "não diz por que existe", abre);

    const grossos = (p.passos || []).filter((s) => !s.cargoId && s.setorId).length;
    if (grossos) põe(4, "quem faz", p.nome, `${grossos} passo${grossos === 1 ? " diz" : "s dizem"} o setor mas não qual cargo executa`, abre);

    if (p.revisado === false) põe(2, "revisao", p.nome, "escrito pela IA e ainda não revisado por ninguém — não pode ser aprovado assim", abre);
    if (situacaoDoProcesso(p) === "mudou") põe(2, "aprovacao", p.nome, "mudou depois de aprovado e ninguém aprovou de novo", abre);
    if (situacaoDoProcesso(p) === "vigente" && !indicadoresDoProcesso(p.id, st).length) {
      põe(4, "indicador", p.nome, "está vigente mas ninguém mede", abre);
    }
  });

  st.cargos.forEach((c) => {
    const abre = { view: "trilha", extras: { cargoSel: c.id } };
    const processos = st.processos.filter((p) => (p.cargosIds || []).includes(c.id) || p.donoCargoId === c.id);
    if (!processos.length) põe(2, "cargo", c.nome, "não aparece em nenhum processo — a trilha dele nasce vazia", abre);
    else if (!c.missao?.trim()) põe(3, "cargo", c.nome, "sem missão escrita", abre);
    else if (!(c.trilha || []).length) põe(4, "cargo", c.nome, "sem nenhum treinamento na trilha", abre);
  });

  st.sistemas.forEach((s) => {
    if (s.critico && !ondeApareceOSistema(s.id, st).length) {
      põe(4, "sistema", s.nome, "marcado como crítico e nenhum passo declara usar", { view: "sistemaEditor", extras: { sistemaId: s.id } });
    }
  });

  /* Documento vazio E sem uso geraria duas linhas para o mesmo objeto. A falta
     de conteúdo é o problema mais fundo — resolvida ela, a de uso aparece. */
  documentosSemUso(st)
    .filter((d) => d.url?.trim() || d.videoUrl?.trim() || d.resumo?.trim())
    .forEach((d) => {
      põe(4, "documento", d.titulo || "sem título", "não está ligado a nenhum processo nem à trilha de nenhum cargo", { view: "docEditor", extras: { docId: d.id } });
    });

  st.documentos.forEach((d) => {
    if (!d.url?.trim() && !d.videoUrl?.trim() && !d.resumo?.trim()) {
      põe(4, "documento", d.titulo || "sem título", "não tem arquivo, vídeo nem resumo — é um nome sem conteúdo", { view: "docEditor", extras: { docId: d.id } });
    }
  });

  return lista.sort((a, b) => a.peso - b.peso || a.titulo.localeCompare(b.titulo, "pt-BR"));
}

const PESOS = {
  1: { rotulo: "Quebra a cadeia", ajuda: "Sem isso não dá para dizer o que passa de um processo para o outro — e é disso que dependem impacto, indicador e IA.", classe: "red" },
  2: { rotulo: "Ninguém responde", ajuda: "Sem dono, executor ou aprovação em dia, o processo não é de ninguém.", classe: "red" },
  3: { rotulo: "Ficha oca", ajuda: "A casca existe, o trabalho não está descrito. É o que dá ilusão de documentação.", classe: "amber" },
  4: { rotulo: "Sobrou solto", ajuda: "Cadastrado mas sem uso. Ou falta ligar, ou não deveria existir.", classe: "amber" },
};

/* Quanto do Bloco 1 está de pé, em números que não dependem de opinião. */
function retratoDoBloco1(st = state) {
  const p = st.processos;
  const conta = (fn) => p.filter(fn).length;
  return {
    processos: p.length,
    comPassos: conta((x) => (x.passos || []).length),
    comEntradaESaida: conta((x) => x.entrada?.trim() && x.saida?.trim()),
    comDono: conta((x) => x.donoCargoId),
    comExecutor: conta((x) => (x.cargosIds || []).length),
    vigentes: conta((x) => situacaoDoProcesso(x) === "vigente"),
    comIndicador: conta((x) => indicadoresDoProcesso(x.id, st).length),
    cargosLigados: st.cargos.filter((c) => p.some((x) => (x.cargosIds || []).includes(c.id) || x.donoCargoId === c.id)).length,
    cargos: st.cargos.length,
  };
}
