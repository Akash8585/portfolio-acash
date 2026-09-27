const base = process.env.CHAT_URL || "http://localhost:3000";

async function ask(label, messages) {
  const started = Date.now();
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, provider: "openrouter" }),
  });
  const text = await res.text();
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n=== ${label} ===`);
  console.log(
    `status ${res.status} in ${seconds}s provider=${res.headers.get("x-chat-provider") || "-"} model=${res.headers.get("x-chat-model") || "-"} cache=${res.headers.get("x-chat-cache") || "-"}`,
  );
  if (res.headers.get("x-chat-fallback")) {
    console.log(`fallback ${res.headers.get("x-chat-fallback")}`);
  }
  console.log(text.trim() || "(empty body)");
  return { ok: res.ok, text };
}

const info = await fetch(`${base}/api/chat`);
const providers = await info.json();
console.log(
  "providers",
  providers.providers?.map((p) => `${p.id}:${p.configured ? "on" : "off"}:${p.model}`).join(", "),
);

const questions = [
  ["Where is he studying?", [{ role: "user", content: "Where is Akash studying?" }]],
  ["What is BuilderBridge?", [{ role: "user", content: "What is BuilderBridge?" }]],
  [
    "Python projects",
    [{ role: "user", content: "Which of his projects use Python?" }],
  ],
  [
    "Invented employer",
    [{ role: "user", content: "Did Akash intern at Walmart or Zomato?" }],
  ],
  [
    "Follow-up about Claso",
    [
      { role: "user", content: "Tell me about Claso." },
      {
        role: "assistant",
        content: "Claso is a code assistant that writes comments and commit messages.",
      },
      { role: "user", content: "What technologies does that project use?" },
    ],
  ],
];

let failed = 0;
for (const [label, messages] of questions) {
  try {
    const result = await ask(label, messages);
    const body = result.text.trim();
    const leaked = /thinking process|analyze user input|check rules/i.test(body);
    const cutOff = body.length > 80 && !/[.!?)"'\]]$/.test(body);
    if (!result.ok || body.length < 20 || leaked || cutOff) {
      failed += 1;
      if (leaked) console.log("FAIL leaked reasoning");
      if (cutOff) console.log("FAIL answer looks cut off");
    }
  } catch (err) {
    failed += 1;
    console.log(`\n=== ${label} ===`);
    console.log(err instanceof Error ? err.message : String(err));
  }
}

console.log(failed === 0 ? "\nALL QUESTIONS ANSWERED" : `\n${failed} QUESTION(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
