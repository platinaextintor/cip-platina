/* A camada de nuvem do CIP.

   O que o app sabe é um objeto `state`. O que o banco guarda são peças — uma
   linha para a estrutura da empresa, uma por processo, uma por decisão, uma por
   documento. Este arquivo traduz entre os dois e cuida de login, gravação e
   sincronia ao vivo.

   Repartir em peças não é capricho: com três pessoas editando, um documento
   único faria a última gravação apagar o trabalho das outras duas. */

const NUVEM = {
  url: "https://zxbjluzxmucpzvgwtkns.supabase.co",
  chave: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4YmpsdXp4bXVjcHp2Z3d0a25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNTU2MjgsImV4cCI6MjEwMDgzMTYyOH0.2R4zTbSupwt7n3i5PMciG_paRmJNuV9L4QW3qVVlcHk",
};

/* Identifica esta aba. O Realtime devolve as próprias gravações; sem isso, o
   autor reagiria ao próprio evento e a tela piscaria a cada tecla. */
const SESSAO = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

let sb = null;
let usuarioAtual = null;

/* Espelho do que está gravado, por peça. A gravação compara com isto e só
   manda para o banco o que realmente mudou. */
const sombra = new Map();

function nuvemPronta() {
  if (sb) return sb;
  if (typeof supabase === "undefined") return null;
  sb = supabase.createClient(NUVEM.url, NUVEM.chave, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return sb;
}

/* ---------------------------------------------------------------- login */

async function sessaoAtual() {
  const cliente = nuvemPronta();
  if (!cliente) return null;
  const { data } = await cliente.auth.getSession();
  usuarioAtual = data?.session?.user ?? null;
  return usuarioAtual;
}

async function entrar(email, senha) {
  const cliente = nuvemPronta();
  if (!cliente) throw new Error("A biblioteca do Supabase não carregou. Verifique a conexão.");
  const { data, error } = await cliente.auth.signInWithPassword({ email, password: senha });
  if (error) throw new Error(traduzErroDeLogin(error.message));
  usuarioAtual = data.user;
  return usuarioAtual;
}

async function sair() {
  const cliente = nuvemPronta();
  if (cliente) await cliente.auth.signOut();
  usuarioAtual = null;
  sombra.clear();
}

async function recuperarSenha(email) {
  const cliente = nuvemPronta();
  if (!cliente) throw new Error("A biblioteca do Supabase não carregou.");
  const { error } = await cliente.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}${location.pathname}`,
  });
  if (error) throw new Error(error.message);
}

/* As mensagens do Supabase vêm em inglês e técnicas demais para quem só quer
   entrar no sistema. */
function traduzErroDeLogin(bruto) {
  const m = String(bruto || "").toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Este e-mail ainda não foi confirmado. Procure o convite na caixa de entrada ou no spam.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas seguidas. Espere um minuto.";
  if (m.includes("failed to fetch")) return "Sem conexão com o servidor.";
  return bruto;
}

function quemEstaLogado() {
  return usuarioAtual;
}

/* O token de quem está logado. A função de IA passou a exigir isto em vez da
   chave pública — com o repositório público, a chave está à vista de todos, e
   sem essa troca qualquer um poderia gastar os créditos da Platina. */
async function tokenDoUsuario() {
  const cliente = nuvemPronta();
  if (!cliente) return null;
  const { data } = await cliente.auth.getSession();
  return data?.session?.access_token || null;
}

function nomeDoUsuario(user = usuarioAtual) {
  if (!user) return "";
  return user.user_metadata?.nome || user.email?.split("@")[0] || "alguém";
}

/* ---------------------------------------------------------------- tradução */

/* O que este cliente sabe escrever. Serve de trava: o que não está aqui,
   ele não apaga. Sai de pecasDoEstado com um estado de exemplo para as duas
   listas nunca saírem de sincronia. */
const TIPOS_QUE_SEI_ESCREVER = new Set(["estrutura", "processo", "decisao", "fim", "documento", "sistema", "regra", "indicador"]);

function pecasDoEstado(st) {
  const pecas = [
    {
      id: "estrutura",
      tipo: "estrutura",
      dados: { empresa: st.empresa, setores: st.setores, cargos: st.cargos },
    },
  ];
  (st.processos || []).forEach((p) => pecas.push({ id: `p:${p.id}`, tipo: "processo", dados: p }));
  (st.decisoes || []).forEach((d) => pecas.push({ id: `d:${d.id}`, tipo: "decisao", dados: d }));
  (st.fins || []).forEach((f) => pecas.push({ id: `f:${f.id}`, tipo: "fim", dados: f }));
  (st.documentos || []).forEach((d) => pecas.push({ id: `doc:${d.id}`, tipo: "documento", dados: d }));
  (st.sistemas || []).forEach((s) => pecas.push({ id: `sis:${s.id}`, tipo: "sistema", dados: s }));
  (st.regras || []).forEach((r) => pecas.push({ id: `r:${r.id}`, tipo: "regra", dados: r }));
  (st.indicadores || []).forEach((i) => pecas.push({ id: `ind:${i.id}`, tipo: "indicador", dados: i }));
  return pecas;
}

function estadoDePecas(linhas) {
  const base = estadoVazio();
  linhas.forEach((l) => {
    if (l.tipo === "estrutura") Object.assign(base, l.dados || {});
    else if (l.tipo === "processo") base.processos.push(l.dados);
    else if (l.tipo === "decisao") base.decisoes.push(l.dados);
    else if (l.tipo === "fim") base.fins.push(l.dados);
    else if (l.tipo === "documento") base.documentos.push(l.dados);
    else if (l.tipo === "sistema") base.sistemas.push(l.dados);
    else if (l.tipo === "regra") base.regras.push(l.dados);
    else if (l.tipo === "indicador") base.indicadores.push(l.dados);
  });
  return normalizar(base);
}

/* ---------------------------------------------------------------- ler e gravar */

async function baixarTudo() {
  const cliente = nuvemPronta();
  const { data, error } = await cliente.from("pecas").select("id, tipo, dados, versao");
  if (error) throw new Error(error.message);

  sombra.clear();
  (data || []).forEach((l) => sombra.set(l.id, { json: JSON.stringify(l.dados), versao: l.versao, tipo: l.tipo }));

  /* Banco vazio na primeira vez: sobe o esqueleto em vez de deixar a tela nua. */
  if (!data || !data.length) {
    const inicial = semente();
    await subirTudo(inicial);
    return inicial;
  }
  return estadoDePecas(data);
}

async function subirTudo(st) {
  const cliente = nuvemPronta();
  const pecas = pecasDoEstado(st).map((p) => ({ ...p, sessao: SESSAO }));
  const { error } = await cliente.from("pecas").upsert(pecas);
  if (error) throw new Error(error.message);
  pecasDoEstado(st).forEach((p) => sombra.set(p.id, { json: JSON.stringify(p.dados), versao: null }));
}

/* Grava só o que mudou desde a última gravação. Devolve o que foi tocado, para
   a tela poder dizer "salvo" sem mentir. */
async function gravarMudancas(st) {
  const cliente = nuvemPronta();
  if (!cliente || !usuarioAtual) return { gravadas: 0, apagadas: 0 };

  const atuais = pecasDoEstado(st);
  const idsAtuais = new Set(atuais.map((p) => p.id));

  const mudadas = atuais.filter((p) => sombra.get(p.id)?.json !== JSON.stringify(p.dados));

  /* Uma peça só é considerada apagada se este cliente sabe produzir peças do
     tipo dela. Sem isso, uma aba com código velho lê uma linha que não entende,
     não a devolve em pecasDoEstado, conclui que sumiu e APAGA — e o trabalho de
     quem está com a versão nova morre em silêncio. Aconteceu comigo: os fins
     nomeados ficaram no banco antes de nuvem.js saber lê-los. */
  const sumidas = [...sombra.entries()]
    .filter(([id, peca]) => !idsAtuais.has(id) && TIPOS_QUE_SEI_ESCREVER.has(peca.tipo))
    .map(([id]) => id);

  if (mudadas.length) {
    const { error } = await cliente
      .from("pecas")
      .upsert(mudadas.map((p) => ({ ...p, sessao: SESSAO })));
    if (error) throw new Error(error.message);
    mudadas.forEach((p) => sombra.set(p.id, { json: JSON.stringify(p.dados), versao: null }));
  }

  if (sumidas.length) {
    const { error } = await cliente.from("pecas").delete().in("id", sumidas);
    if (error) throw new Error(error.message);
    sumidas.forEach((id) => sombra.delete(id));
  }

  return { gravadas: mudadas.length, apagadas: sumidas.length };
}

/* ---------------------------------------------------------------- ao vivo */

let canal = null;

/* `aoMudar` recebe { peca, acao, dados, deQuem }. Quem decide o que fazer com
   isso é o app — aqui só se filtra o eco da própria aba. */
function ouvirMudancas(aoMudar) {
  const cliente = nuvemPronta();
  if (!cliente) return;
  if (canal) cliente.removeChannel(canal);

  canal = cliente
    .channel("pecas-ao-vivo")
    .on("postgres_changes", { event: "*", schema: "public", table: "pecas" }, (evento) => {
      /* No DELETE a linha vem em `old`. E `new` chega como objeto VAZIO, não
         nulo — então `new ?? old` nunca cairia para o `old`. */
      const linha = (evento.eventType === "DELETE" ? evento.old : evento.new) || {};
      if (!linha.id) return;
      if (linha.sessao === SESSAO) return; // eco da própria gravação

      if (evento.eventType === "DELETE") {
        sombra.delete(linha.id);
      } else {
        sombra.set(linha.id, { json: JSON.stringify(linha.dados), versao: linha.versao });
      }

      aoMudar({
        peca: linha.id,
        acao: evento.eventType,
        tipo: linha.tipo,
        dados: linha.dados,
      });
    })
    .subscribe();

  return canal;
}

function pararDeOuvir() {
  const cliente = nuvemPronta();
  if (cliente && canal) cliente.removeChannel(canal);
  canal = null;
}

/* ---------------------------------------------------------------- presença */

/* Quem está online e em que tela. Com três pessoas, ver "Vinicius está no
   Orçamento" evita o encontro antes que ele vire conflito. */
let canalPresenca = null;

function anunciarPresenca(onde, aoMudarPresenca) {
  const cliente = nuvemPronta();
  if (!cliente || !usuarioAtual) return;

  if (!canalPresenca) {
    canalPresenca = cliente.channel("quem-esta-aqui", { config: { presence: { key: SESSAO } } });
    canalPresenca
      .on("presence", { event: "sync" }, () => {
        const todos = Object.values(canalPresenca.presenceState()).flat();
        aoMudarPresenca(todos.filter((p) => p.sessao !== SESSAO));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await canalPresenca.track({ sessao: SESSAO, nome: nomeDoUsuario(), onde });
        }
      });
    return;
  }
  canalPresenca.track({ sessao: SESSAO, nome: nomeDoUsuario(), onde });
}
