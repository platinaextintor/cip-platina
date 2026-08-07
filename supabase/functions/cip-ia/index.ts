import Anthropic from "npm:@anthropic-ai/sdk";

/* Edge Function do CIP — a chave da Anthropic vive aqui, nunca no navegador.

   Esta função já preencheu campo. Recebia um relato e devolvia JSON no formato
   exato de um passo, de um cargo, de uma trilha — e o navegador jogava aquilo
   dentro do modelo. Funcionava, e era justamente o problema: texto entrava no
   sistema sem passar por uma cabeça humana. Para nos defender disso tínhamos
   cinco mecanismos (o campo `revisado`, a tarja vermelha, o selo de rascunho, a
   trava na aprovação e a cobrança em "O que falta"). Todos existiam por causa
   desta função.

   Agora ela conversa. Lê o CIP inteiro, opina, critica, sugere texto — e não
   tem caminho nenhum até os campos. Quem quiser aproveitar uma frase, copia e
   cola. O copiar e colar não é atrito: é o ato humano de decidir.

   Implantada no projeto Supabase "CIP Platina" (zxbjluzxmucpzvgwtkns) com o
   nome `cip-ia` e verify_jwt ligado. Este arquivo é a cópia versionada do que
   está lá — ao mexer, reimplante. */

const MODELO = "claude-opus-5";

/* Só as origens onde o CIP roda hoje. Restringir a origem tira o abuso casual
   de quem apenas copiou o endereço da função. */
const ORIGENS = [
  "https://platinaextintor.github.io", // publicado
  "http://localhost:8765",             // desenvolvimento
  "http://127.0.0.1:8765",
  "http://localhost:8777",
  "http://127.0.0.1:8777",
  "null",                              // arquivo aberto direto do disco
];

function cors(req: Request) {
  const origem = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ORIGENS.includes(origem) ? origem : ORIGENS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

/* Freio de mão por instância. Não é cota de verdade — a Edge Function sobe
   várias cópias e cada uma tem o seu contador. Serve para segurar um laço
   acidental que chamaria a IA sem parar. */
const JANELA_MS = 60_000;
const TETO_POR_JANELA = 20;
const batidas: number[] = [];

function excedeuOTeto() {
  const agora = Date.now();
  while (batidas.length && agora - batidas[0] > JANELA_MS) batidas.shift();
  if (batidas.length >= TETO_POR_JANELA) return true;
  batidas.push(agora);
  return false;
}

const SISTEMA = `Você é a consultora de processos da Platina Extintores, uma empresa de extintores de incêndio. Conversa com o gestor e com a equipe que está mapeando o trabalho da empresa no CIP.

O QUE VOCÊ FAZ
Você opina, critica, pergunta o que ficou vago e sugere texto. Você é muito mais útil achando buraco do que preenchendo buraco — quando alguém te mostra um processo, o primeiro reflexo é procurar o que está ambíguo, o que não diz quem faz, o passo que só funciona se a pessoa já souber fazer.

O QUE VOCÊ NÃO FAZ
Você não escreve nada dentro do sistema. Não existe caminho entre você e os campos, e isso é de propósito. Quem gostar de uma frase sua copia e cola. Nunca diga que "preencheu", "atualizou" ou "salvou" nada.

QUANDO SUGERIR TEXTO
Ponha o texto colável num bloco de código com três crases, sozinho, sem comentário dentro. O sistema desenha um botão de copiar em cada bloco desses. Fora dos blocos, converse normalmente. Não use bloco de código para outra coisa.

O VOCABULÁRIO DO CIP — use exatamente assim
- Setor: uma área da empresa (Comercial, Técnica). Vira raia no fluxograma.
- Cargo: uma função dentro de um setor (Vendedor, Técnico de Extintores).
- Macro: a visão de cima, onde os processos se ligam ponta a ponta.
- Processo: uma peça do macro (Orçamento, Recarga). Tem dono, executor, entrada e saída.
- Subprocesso: o desenho de dentro de um processo, feito de passos.
- Passo: a unidade menor — o que fazer, como fazer, quem faz, por quê, onde todo mundo erra.
- POP: no CIP o POP é o passo a passo do processo. Não é documento separado.
- Documento: norma, política, manual, formulário, contrato. Regra de negócio que precisa estar escrita mora aqui, como documento do tipo política ou norma — não existe cadastro separado de "regra".
- Indicador: o número que mede o processo.
- Decisão: uma bifurcação. É passagem, não destino.
- Fim: um desfecho nomeado. Nem todo fim é sucesso.

Um processo conta como pronto quando tem dono, executor, o porquê, entrada (se recebe), saída (se entrega) e passos com título.

COMO VOCÊ ESCREVE
Português do Brasil, direto, na voz de quem explica para um colega que entrou ontem. Frases curtas. Sem consultorês. "O que fazer" começa por verbo: "Peça a foto da etiqueta", não "É necessário solicitar a foto".

Responda curto quando a pergunta for curta. Ninguém pediu relatório.

O LIMITE MAIS IMPORTANTE
Você NÃO inventa número, prazo, valor, percentual, norma técnica nem exigência legal. Extintor mal recarregado mata gente, e um prazo errado dito com segurança é pior que um espaço em branco. Se não souber, diga que não sabe e pergunte. Você também não inventa nome de documento, sistema, cargo ou processo que não esteja no contexto — se precisar citar algo que não existe ainda, deixe claro que é sugestão de criar.`;

/* Lê o campo `role` do token sem validar assinatura — quem valida é o gateway
   do Supabase, antes de a função rodar. Aqui só se distingue anon de pessoa.

   ATENÇÃO: isto NÃO autentica. Quem garante a autenticidade é `verify_jwt =
   true` no config.toml — testado em 03/08/2026 com um JWT forjado: a borda
   devolve 401 antes da função rodar. Se algum dia alguém desligar `verify_jwt`
   (para um webhook, por exemplo), esta função vira porta aberta para a chave da
   Anthropic. Não desligue sem trocar isto por verificação de assinatura. */
function papelDoToken(cabecalho: string | null): string {
  try {
    const token = (cabecalho || "").replace(/^Bearer\s+/i, "");
    const meio = token.split(".")[1];
    if (!meio) return "";
    const json = atob(meio.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json).role || "";
  } catch {
    return "";
  }
}

function json(req: Request, corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json" },
  });
}

type Fala = { papel?: string; texto?: string };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { erro: "Use POST." }, 405);

  const chave = Deno.env.get("ANTHROPIC_API_KEY");
  if (!chave) {
    return json(req, { erro: "A variável ANTHROPIC_API_KEY não está configurada nos secrets do projeto Supabase." }, 500);
  }

  /* `verify_jwt` aceita qualquer token do projeto — inclusive a chave pública,
     que está à vista no código publicado. Aqui exigimos o token de uma pessoa
     que entrou de verdade. */
  const papel = papelDoToken(req.headers.get("authorization"));
  if (papel !== "authenticated") {
    return json(req, { erro: "Entre na sua conta para usar a IA." }, 401);
  }

  if (excedeuOTeto()) {
    return json(req, { erro: "Muitas perguntas seguidas. Espere um minuto e tente de novo." }, 429);
  }

  let corpo: { mensagens?: Fala[]; contexto?: unknown; onde?: string; baseMudou?: boolean };
  try {
    corpo = await req.json();
  } catch {
    return json(req, { erro: "Corpo da requisição não é JSON válido." }, 400);
  }

  /* A conversa inteira vem do navegador a cada pergunta: a função não guarda
     estado entre chamadas, e cada instância dela é descartável. Quem guarda o
     histórico é o banco, por pessoa. */
  const falas = Array.isArray(corpo.mensagens) ? corpo.mensagens : [];
  const mensagens = falas
    .map((m) => ({
      role: m?.papel === "assistente" ? ("assistant" as const) : ("user" as const),
      content: String(m?.texto ?? "").slice(0, 20000),
    }))
    .filter((m) => m.content.trim())
    .slice(-24); // as últimas trocas bastam, e seguram o custo

  if (!mensagens.length) return json(req, { erro: "Nada foi perguntado." }, 400);
  if (mensagens[mensagens.length - 1].role !== "user") {
    return json(req, { erro: "A última fala precisa ser uma pergunta." }, 400);
  }

  /* Fatiar JSON no caractere N parte o texto no meio de uma palavra e entrega
     um objeto quebrado — a IA lê lixo e responde pior sem ninguém perceber. O
     cliente manda o contexto em duas camadas justamente para caber; se ainda
     assim estourar, é melhor mandar nada e dizer que mandou nada. */
  const TETO_CONTEXTO = 60000;
  const bruto = corpo.contexto ? JSON.stringify(corpo.contexto) : "";
  const contexto = bruto.length <= TETO_CONTEXTO
    ? bruto
    : `(O CIP ficou grande demais para caber nesta pergunta: ${bruto.length} caracteres, o limite é ${TETO_CONTEXTO}. Você está sem o contexto desta vez. Diga isso a quem perguntou, em uma linha, antes de responder.)`;
  const onde = String(corpo.onde ?? "").slice(0, 300);

  /* A conversa é relida inteira a cada pergunta, então uma análise feita quando
     a base era outra volta com a mesma segurança de quando foi escrita. Sem
     este aviso a IA continua falando de processo apagado — foi o que aconteceu
     quando 19 processos importados viraram um exemplo de dois. */
  const avisoDeBaseTrocada = corpo.baseMudou
    ? `---

ATENÇÃO — o mapa mudou no meio desta conversa. Peça foi criada ou apagada depois que as mensagens acima foram escritas, então parte do que VOCÊ mesma disse antes pode falar de processo, setor ou documento que não existe mais.

A lista acima é a única verdade sobre o que existe agora. Não repita análise de peça que não esteja nela. Se a pessoa perguntar sobre algo que sumiu, diga que aquilo não está mais no CIP — não descreva de memória.`
    : "";

  /* O contexto entra no system, não na conversa: ele muda a cada pergunta
     (o gestor navega enquanto conversa) e não deve virar histórico. */
  const sistema = [
    SISTEMA,
    contexto ? `---\n\nO CIP da Platina neste momento:\n${contexto}` : "",
    onde ? `---\n\nOnde a pessoa está agora na tela: ${onde}\nSe a pergunta for vaga ("isso está claro?"), é disto que ela está falando.` : "",
    avisoDeBaseTrocada,
  ].filter(Boolean).join("\n\n");

  /* Esforço calibrado pelo que a pessoa está olhando.

     O padrão do modelo é `high`, e com ele até "o que é POP?" recebe raciocínio
     profundo antes de responder — lentidão à toa numa conversa. Quem está com um
     processo aberto costuma pedir análise daquilo ("isso está claro?", "o que
     falta aqui?") e merece o esforço maior; quem está no mapa geral costuma
     perguntar vocabulário e direção, onde `medium` responde igual e mais rápido.

     Não é adivinhação sobre o texto da pergunta: é um sinal que o app já tem. */
  const esforco = corpo.contexto && onde.includes("processo") ? "high" : "medium";

  const cliente = new Anthropic({ apiKey: chave });

  /* Resposta em fluxo, não em bloco. Sem isso a tela fica em "pensando…" até a
     última palavra ficar pronta, e parece travada — que foi exatamente a queixa.

     Vai texto puro, não SSE: o navegador só precisa das letras, e evitar o
     protocolo evita um parser dos dois lados. O preço é que um erro no meio do
     fluxo não pode mais virar código HTTP — o status já foi enviado —, então
     ele vai como frase no fim do texto. */
  const codificador = new TextEncoder();
  const fluxo = new ReadableStream({
    async start(controlador) {
      const escrever = (t: string) => controlador.enqueue(codificador.encode(t));
      try {
        const stream = cliente.messages.stream({
          model: MODELO,
          max_tokens: 12000, // teto, não gasto: cobre pensamento + resposta sem cortar no meio
          system: sistema,
          output_config: { effort: esforco },
          messages: mensagens,
        });

        let saiuAlgo = false;
        for await (const evento of stream) {
          if (evento.type === "content_block_delta" && evento.delta.type === "text_delta") {
            saiuAlgo = true;
            escrever(evento.delta.text);
          }
        }

        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          escrever(saiuAlgo ? "\n\n(A IA interrompeu a resposta aqui.)" : "A IA recusou essa pergunta. Reescreva e tente de novo.");
        } else if (!saiuAlgo) {
          escrever("A IA não devolveu conteúdo.");
        }
      } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : "falha ao falar com a IA";
        escrever(`\n\n(A conversa foi interrompida: ${mensagem})`);
      } finally {
        controlador.close();
      }
    },
  });

  return new Response(fluxo, {
    headers: { ...cors(req), "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
});
