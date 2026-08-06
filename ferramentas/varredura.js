/* Varredura de telas do CIP.  Uso:  node ferramentas/varredura.js

   Acha a classe de defeito que os testes não pegam e o olho não vê: botão
   desenhado que ninguém escuta, e handler que escuta algo que já não existe.

   Nasceu de um relato do Eric — "não encontrei a opção de inserir setor". O
   botão estava lá, na tela do organograma, sem nenhum `addEventListener`. Não
   quebrava nada, não gerava erro no console, não falhava teste: só não fazia
   nada quando clicado. Some quando alguém remove a tela que o ligava e deixa
   o botão de outra para trás.

   Roda em segundos e não instala nada. */

const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(raiz, "app.js"), "utf8");

/* Atributos que carregam dado para o código ler depois, e que nunca são alvo
   de clique. Não entram na conta. */
const SO_DADO = new Set([
  "bpmn-el", "bpmn-faixa", "bpmn-alca", "bpmn-abrir", "largura", "curto",
  "doc-ligado", "saida", "saida-passo", "anexo-id", "passo-id", "pergunta-id", "indicador-id",
]);

const desenhados = new Set();
for (const m of src.matchAll(/\bdata-([a-z0-9-]+)\s*=\s*"/g)) desenhados.add(m[1]);
for (const m of src.matchAll(/\bdata-([a-z0-9-]+)(?=[\s>])/g)) desenhados.add(m[1]);

const escutados = new Set();
for (const m of src.matchAll(/\[data-([a-z0-9-]+)[\]=]/g)) escutados.add(m[1]);

const fora = (a, b) => [...a].filter((x) => !b.has(x) && !SO_DADO.has(x)).sort();
const mortos = fora(desenhados, escutados);
const orfaos = fora(escutados, desenhados);

const linha = (s) => console.log("  " + s);
console.log("\nBotões desenhados que ninguém escuta:");
mortos.length ? mortos.forEach((x) => linha(`✕ data-${x}`)) : linha("nenhum");

console.log("\nHandlers que escutam algo que não existe:");
orfaos.length ? orfaos.forEach((x) => linha(`✕ [data-${x}]`)) : linha("nenhum");

console.log(`\n${desenhados.size} atributos desenhados · ${escutados.size} escutados\n`);
process.exit(mortos.length || orfaos.length ? 1 : 0);
