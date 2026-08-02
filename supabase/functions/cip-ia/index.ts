import Anthropic from "npm:@anthropic-ai/sdk";

/* Edge Function do CIP — a chave da Anthropic vive aqui, nunca no navegador.
   O navegador manda o que o gestor contou; volta o rascunho estruturado.

   Implantada no projeto Supabase "CIP Platina" (zxbjluzxmucpzvgwtkns) com o
   nome `cip-ia` e verify_jwt ligado. Este arquivo é a cópia versionada do que
   está lá — ao mexer, reimplante. */

const MODELO = "claude-opus-5";

/* Só as origens onde o CIP roda hoje. Enquanto não existe login, a chave
   pública do Supabase é o único portão; restringir a origem tira o abuso
   casual de quem apenas copiou o endereço da função. */
const ORIGENS = [
  "http://localhost:8777",
  "http://127.0.0.1:8777",
  "null", // arquivo aberto direto do disco (file://)
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
   acidental que chamaria a IA sem parar. Cota real só com banco, na Fase 3. */
const JANELA_MS = 60_000;
const TETO_POR_JANELA = 12;
const batidas: number[] = [];

function excedeuOTeto() {
  const agora = Date.now();
  while (batidas.length && agora - batidas[0] > JANELA_MS) batidas.shift();
  if (batidas.length >= TETO_POR_JANELA) return true;
  batidas.push(agora);
  return false;
}

const SISTEMA = `Você é um especialista em processos ajudando o gestor da Platina Extintores, uma empresa de extintores de incêndio, a transformar o que ele sabe de cabeça em processo escrito e ensinável.

Como você escreve:
- Português do Brasil, direto, na voz de quem explica para um colega que entrou ontem.
- "O que fazer" é uma frase curta começando por verbo: "Peça a foto da etiqueta", não "É necessário solicitar a foto".
- "Como fazer" é o detalhe prático: a ordem, as palavras, a ferramenta.
- "Por quê" é a razão que faz a pessoa lembrar quando estiver sozinha em campo.
- "A armadilha" é o erro concreto que acontece na prática, não um risco genérico.
- "A regra" é o inegociável, ou o momento de parar e chamar o supervisor.
- Passo do tipo decisão sempre traz os dois caminhos preenchidos.

O limite mais importante:
Você NÃO inventa número, prazo, valor, percentual, norma técnica nem exigência legal. Extintor mal recarregado mata gente, e um prazo errado escrito como se fosse oficial é pior que um campo vazio. Se o gestor não disse, deixe o campo em branco — a tela mostra o espaço para ele preencher. Nunca preencha um vazio com algo plausível.

Você também não inventa nome de documento, sistema, modelo ou link que o gestor não tenha mencionado.

Tudo que você escreve é rascunho. O gestor revisa antes de publicar.`;

const PASSO = {
  type: "object",
  additionalProperties: false,
  required: ["tipo", "cargoId", "oQue", "comoFazer", "porque", "armadilha", "regra", "seSim", "seNao"],
  properties: {
    tipo: { type: "string", enum: ["etapa", "decisao", "evidencia", "aprovacao"] },
    cargoId: { type: "string", description: "Id do cargo que executa este passo, entre os ids do contexto. Vazio se o relato não deixar claro." },
    oQue: { type: "string", description: "Uma frase, verbo no início." },
    comoFazer: { type: "string" },
    porque: { type: "string" },
    armadilha: { type: "string", description: "O erro concreto. Vazio se não souber." },
    regra: { type: "string", description: "O inegociável. Vazio se não houver." },
    seSim: { type: "string", description: "Só para tipo decisao. Vazio nos outros." },
    seNao: { type: "string", description: "Só para tipo decisao. Vazio nos outros." },
  },
};

const PERGUNTA = {
  type: "object",
  additionalProperties: false,
  required: ["pergunta", "resposta"],
  properties: {
    pergunta: { type: "string", description: "Uma cena real: o que chega e o que a pessoa faz." },
    resposta: { type: "string" },
  },
};

const RECEITAS: Record<string, { instrucao: string; schema: unknown }> = {
  processo: {
    instrucao: `Transforme o relato do gestor em um processo do CIP.

Use exclusivamente os ids de setor, fase e cargo que aparecem no contexto — nunca invente um id.
O dono do processo é quem aprova exceção ou responde por ele; em geral um cargo de supervisão.
Quebre em 3 a 8 passos, na ordem em que acontecem de verdade.
Condição no relato ("se o cliente pedir desconto acima de X") vira passo do tipo decisao ou aprovacao.
Evidência exigida (foto, comprovante, assinatura) vira passo do tipo evidencia.
Atribua o cargoId de cada passo a quem realmente executa aquele passo — é isso que separa as raias do fluxograma e mostra a passagem de bastão entre cargos. Se o relato não disser quem faz, deixe vazio.
Escreva 3 perguntas de situação para o fim da aula.`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["nome", "setorId", "faseId", "donoCargoId", "cargosIds", "porque", "seErrar", "passos", "perguntas"],
      properties: {
        nome: { type: "string", description: "Curto e reconhecível pela equipe." },
        setorId: { type: "string", description: "Um dos ids de setor do contexto." },
        faseId: { type: "string", description: "Um dos ids de fase do contexto." },
        donoCargoId: { type: "string", description: "Um dos ids de cargo do contexto." },
        cargosIds: { type: "array", items: { type: "string" }, description: "Ids dos cargos que executam." },
        porque: { type: "string", description: "Por que o processo existe." },
        seErrar: { type: "string", description: "O prejuízo concreto quando sai errado." },
        passos: { type: "array", items: PASSO },
        perguntas: { type: "array", items: PERGUNTA },
      },
    },
  },

  passo: {
    instrucao: `Complete um passo que o gestor começou a escrever.

Devolva os campos do passo. Onde já houver texto, melhore sem trocar o sentido; onde estiver vazio, escreva.
Se o passo for uma decisão, preencha os dois caminhos.
Não invente prazo, valor nem norma que não esteja no contexto.`,
    schema: PASSO,
  },

  perguntas: {
    instrucao: `Escreva 3 perguntas de situação sobre este processo, para o fim da aula.

Cada pergunta descreve uma cena concreta que acontece de verdade nesse trabalho — não pergunte a definição de nada.
A resposta diz o que a pessoa deve fazer e por quê, em duas ou três frases.`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["perguntas"],
      properties: { perguntas: { type: "array", items: PERGUNTA } },
    },
  },

  cargo: {
    instrucao: `Descreva um cargo da empresa a partir do nome dele, do setor e dos processos que ele executa.

Missão: uma frase — se esse cargo sumisse amanhã, o que deixaria de acontecer.
Expectativas: 3 a 5 comportamentos esperados de quem ocupa, cada um em uma linha.
Conhecimentos: 3 a 6 temas que a pessoa precisa dominar, cada um em uma linha curta.`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["missao", "expectativas", "conhecimentos"],
      properties: {
        missao: { type: "string" },
        expectativas: { type: "array", items: { type: "string" } },
        conhecimentos: { type: "array", items: { type: "string" } },
      },
    },
  },

  trilha: {
    instrucao: `Sugira treinamentos para este cargo, a partir do que ele precisa dominar e dos processos que executa.

Entre 3 e 6 itens. Tipos possíveis: video, curso, leitura, pratica, documento.
NUNCA invente link — deixe url sempre vazio, o gestor cola o link que ele aprovar.
Marque como obrigatório o que ninguém deveria executar o trabalho sem ter feito.
Duração é uma estimativa curta ("30 min", "1 semana") ou vazio.`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["trilha"],
      properties: {
        trilha: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["tipo", "titulo", "duracao", "obrigatorio", "nota"],
            properties: {
              tipo: { type: "string", enum: ["video", "curso", "leitura", "pratica", "documento"] },
              titulo: { type: "string" },
              duracao: { type: "string" },
              obrigatorio: { type: "boolean" },
              nota: { type: "string", description: "Quando fazer, o que observar." },
            },
          },
        },
      },
    },
  },

  documento: {
    instrucao: `Descreva um documento da biblioteca da empresa a partir do título.

Resumo: duas linhas dizendo do que trata e para que serve.
Categoria: uma palavra (RH, Comercial, Técnico, Segurança, Financeiro...).
Escopo: para quem vale.`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["resumo", "categoria", "escopo"],
      properties: {
        resumo: { type: "string" },
        categoria: { type: "string" },
        escopo: { type: "string" },
      },
    },
  },
};

function json(req: Request, corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { erro: "Use POST." }, 405);

  const chave = Deno.env.get("ANTHROPIC_API_KEY");
  if (!chave) {
    return json(req, { erro: "A variável ANTHROPIC_API_KEY não está configurada nos secrets do projeto Supabase." }, 500);
  }

  if (excedeuOTeto()) {
    return json(req, { erro: "Muitas chamadas seguidas. Espere um minuto e tente de novo." }, 429);
  }

  let corpo: { acao?: string; entrada?: string; contexto?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return json(req, { erro: "Corpo da requisição não é JSON válido." }, 400);
  }

  const receita = RECEITAS[String(corpo.acao ?? "")];
  if (!receita) return json(req, { erro: `Ação desconhecida: ${corpo.acao}` }, 400);

  const entrada = String(corpo.entrada ?? "").trim();
  if (!entrada) return json(req, { erro: "Nada foi escrito." }, 400);
  if (entrada.length > 20000) return json(req, { erro: "Texto longo demais. Quebre em partes menores." }, 400);

  const contexto = corpo.contexto ? JSON.stringify(corpo.contexto).slice(0, 40000) : "";

  const cliente = new Anthropic({ apiKey: chave });

  try {
    const resposta = await cliente.messages.create({
      model: MODELO,
      max_tokens: 16000,
      system: `${SISTEMA}\n\n---\n\n${receita.instrucao}`,
      output_config: { format: { type: "json_schema", schema: receita.schema } },
      messages: [
        {
          role: "user",
          content: contexto
            ? `Contexto atual do CIP (use os ids daqui):\n${contexto}\n\n---\n\nO que o gestor contou:\n${entrada}`
            : `O que o gestor contou:\n${entrada}`,
        },
      ],
    });

    if (resposta.stop_reason === "refusal") {
      return json(req, { erro: "A IA recusou esse pedido. Reescreva o relato e tente de novo." }, 422);
    }

    const bloco = resposta.content.find((b) => b.type === "text");
    if (!bloco || bloco.type !== "text") {
      return json(req, { erro: "A IA não devolveu conteúdo." }, 502);
    }

    let dados: unknown;
    try {
      dados = JSON.parse(bloco.text);
    } catch {
      return json(req, { erro: "A IA devolveu algo fora do formato esperado.", bruto: bloco.text.slice(0, 500) }, 502);
    }

    return json(req, { dados, uso: resposta.usage });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Falha ao falar com a IA.";
    return json(req, { erro: mensagem }, 502);
  }
});
