import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { Budget } from "./ratelimit";

/**
 * Chat providers behind one interface.
 *
 * Groq and Gemini both expose OpenAI-compatible endpoints, so a single client
 * class covers all three. Each provider carries a request budget that mirrors
 * its free-tier quota; when a budget is exhausted the route falls back to the
 * next provider in the chain instead of surfacing a 429 to the visitor.
 */

export type ProviderId = "openrouter" | "groq" | "gemini" | "openai";

export const PROVIDER_IDS: ProviderId[] = ["openrouter", "groq", "gemini", "openai"];

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  model: string;
  configured: boolean;
  /** Milliseconds until the provider can be used again, 0 if available now. */
  retryAfterMs: number;
}

interface ProviderConfig {
  id: ProviderId;
  label: string;
  baseURL: string;
  apiKeyEnv: string;
  modelEnv: string;
  defaultModel: string;
  rpmEnv: string;
  rpdEnv: string;
  defaultRpm: number;
  defaultRpd: number;
}

const CONFIGS: Record<ProviderId, ProviderConfig> = {
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKeyEnv: "OPENROUTER_API_KEY",
    modelEnv: "OPENROUTER_MODEL",
    defaultModel: "poolside/laguna-s-2.1:free",
    rpmEnv: "OPENROUTER_RPM",
    rpdEnv: "OPENROUTER_RPD",
    defaultRpm: 16,
    defaultRpd: 200,
  },
  groq: {
    id: "groq",
    label: "Groq",
    baseURL: "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
    modelEnv: "GROQ_MODEL",
    defaultModel: "openai/gpt-oss-120b",
    rpmEnv: "GROQ_RPM",
    rpdEnv: "GROQ_RPD",
    defaultRpm: 28,
    defaultRpd: 12_000,
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    apiKeyEnv: "GEMINI_API_KEY",
    modelEnv: "GEMINI_MODEL",
    defaultModel: "gemini-2.5-flash",
    rpmEnv: "GEMINI_RPM",
    rpdEnv: "GEMINI_RPD",
    defaultRpm: 8,
    defaultRpd: 200,
  },
  openai: {
    id: "openai",
    label: "ChatGPT",
    baseURL: "https://api.openai.com/v1",
    apiKeyEnv: "OPENAI_API_KEY",
    modelEnv: "OPENAI_MODEL",
    defaultModel: "gpt-4.1-mini",
    rpmEnv: "OPENAI_RPM",
    rpdEnv: "OPENAI_RPD",
    defaultRpm: 3,
    defaultRpd: 200,
  },
};

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const budgets = new Map<ProviderId, Budget>();

function budgetFor(id: ProviderId): Budget {
  let b = budgets.get(id);
  if (!b) {
    const c = CONFIGS[id];
    b = new Budget(id, envInt(c.rpmEnv, c.defaultRpm), envInt(c.rpdEnv, c.defaultRpd));
    budgets.set(id, b);
  }
  return b;
}

export function isConfigured(id: ProviderId): boolean {
  return Boolean(process.env[CONFIGS[id].apiKeyEnv]);
}

export function modelFor(id: ProviderId): string {
  return process.env[CONFIGS[id].modelEnv] || CONFIGS[id].defaultModel;
}

/** Free models tried, in order, when OpenRouter's first choice fails or rambles. */
const OPENROUTER_FREE_MODELS = [
  "poolside/laguna-s-2.1:free",
  "google/gemma-4-31b-it:free",
  "qwen/qwen3.8-27b:free",
  "openrouter/free",
];

function modelsToTry(id: ProviderId): string[] {
  const chosen = modelFor(id);
  if (id !== "openrouter") return [chosen];
  return [chosen, ...OPENROUTER_FREE_MODELS.filter((model) => model !== chosen)];
}

function answerLooksUnusable(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 24) return true;
  if (/thinking process|analyze user input|check rules|formulate response|\bdraft:/i.test(trimmed)) {
    return true;
  }
  const closed = /[.!?)"'\]]$/.test(trimmed);
  return !closed && trimmed.length > 180;
}

export function providerInfo(): ProviderInfo[] {
  return PROVIDER_IDS.map((id) => ({
    id,
    label: CONFIGS[id].label,
    model: modelFor(id),
    configured: isConfigured(id),
    retryAfterMs: isConfigured(id) ? budgetFor(id).snapshot().retryAfterMs : 0,
  }));
}

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && (PROVIDER_IDS as string[]).includes(value);
}

/**
 * Order in which providers are tried. The visitor's choice goes first; Groq
 * (fast, generous quota) is the safety net; the rest fill in behind.
 */
export function fallbackChain(preferred: ProviderId | "auto"): ProviderId[] {
  const configured = PROVIDER_IDS.filter(isConfigured);
  if (preferred === "auto") return configured;
  const rest = configured.filter((id) => id !== preferred);
  const groqFirst = rest.includes("groq")
    ? ["groq" as ProviderId, ...rest.filter((id) => id !== "groq")]
    : rest;
  return isConfigured(preferred) ? [preferred, ...groqFirst] : groqFirst;
}

/* ------------------------------------------------------------------ */
/* Client                                                              */
/* ------------------------------------------------------------------ */

const clients = new Map<ProviderId, OpenAI>();

async function clientFor(id: ProviderId): Promise<OpenAI> {
  let c = clients.get(id);
  if (c) return c;
  const cfg = CONFIGS[id];
  const options: ConstructorParameters<typeof OpenAI>[0] = {
    apiKey: process.env[cfg.apiKeyEnv],
    baseURL: cfg.baseURL,
    maxRetries: 1,
    timeout: 45_000,
  };
  if (id === "openrouter") {
    options.defaultHeaders = {
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "Akash Kumar Prasad",
    };
  }
  // Honour a corporate proxy when one is configured; no-op elsewhere.
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (proxyUrl) {
    const { HttpsProxyAgent } = await import("https-proxy-agent");
    options.httpAgent = new HttpsProxyAgent(proxyUrl);
  }
  c = new OpenAI(options);
  clients.set(id, c);
  return c;
}

export class ProviderUnavailable extends Error {
  constructor(
    public readonly provider: ProviderId,
    public readonly reason: "budget" | "rate_limited" | "error",
    message: string,
  ) {
    super(message);
  }
}

export interface StreamRequest {
  messages: ChatCompletionMessageParam[];
  maxTokens: number;
  temperature: number;
  signal?: AbortSignal;
}

/**
 * Open a streaming completion on one provider. Throws `ProviderUnavailable`
 * when the local budget is exhausted or upstream rejects the call, so the
 * caller can move down the fallback chain before any bytes reach the client.
 */
export async function streamCompletion(
  id: ProviderId,
  req: StreamRequest,
): Promise<{ model: string; stream: AsyncIterable<string> }> {
  const budget = budgetFor(id);
  if (!budget.tryConsume()) {
    const snap = budget.snapshot();
    throw new ProviderUnavailable(
      id,
      "budget",
      `${id} budget exhausted (${snap.minuteUsed}/${snap.minuteLimit} per minute, ${snap.dayUsed}/${snap.dayLimit} per day)`,
    );
  }

  const client = await clientFor(id);
  const failures: string[] = [];
  let lastText = "";

  for (const model of modelsToTry(id)) {
    try {
      const stream = await client.chat.completions.create(
        {
          model,
          messages: req.messages,
          temperature: req.temperature,
          max_tokens: req.maxTokens,
          stream: true,
          // Reasoning models spend tokens thinking before they answer. A short
          // grounded answer does not need that, so keep the effort low.
          ...(isReasoningModel(model) ? { reasoning_effort: "low" as const } : {}),
        },
        { signal: req.signal },
      );

      let text = "";
      for await (const chunk of stream) {
        const piece = chunk.choices?.[0]?.delta?.content;
        if (piece) text += piece;
      }
      lastText = text;
      if (id === "openrouter" && answerLooksUnusable(text)) {
        failures.push(`${model}: unusable answer`);
        continue;
      }
      return {
        model,
        stream: (async function* () {
          if (text) yield text;
        })(),
      };
    } catch (err) {
      const status = (err as { status?: number })?.status;
      const message = err instanceof Error ? err.message : String(err);
      failures.push(`${model}: ${status ?? "error"}`);
      if (id !== "openrouter") {
        budget.refund();
        if (status === 429 || /quota|rate.?limit|resource.?exhausted/i.test(message)) {
          const retryAfter = parseRetryAfter(err);
          budget.cooldown(retryAfter);
          throw new ProviderUnavailable(id, "rate_limited", `${id} rate limited: ${message}`);
        }
        throw new ProviderUnavailable(id, "error", `${id} failed: ${message}`);
      }
    }
  }

  if (lastText.trim()) {
    return {
      model: modelFor(id),
      stream: (async function* () {
        yield lastText;
      })(),
    };
  }

  budget.refund();
  throw new ProviderUnavailable(
    id,
    "error",
    `${id} failed: ${failures.join("; ") || "no answer"}`,
  );
}

function isReasoningModel(model: string): boolean {
  return /gpt-oss|qwen3|deepseek-r1|^o[1-9]|gpt-5/i.test(model);
}

function parseRetryAfter(err: unknown): number {
  const headers = (err as { headers?: Record<string, string> })?.headers;
  const raw = headers?.["retry-after"];
  const seconds = raw ? parseFloat(raw) : NaN;
  if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds * 1000, 300_000);
  const msg = err instanceof Error ? err.message : "";
  const m = /retry in ([\d.]+)s/i.exec(msg);
  if (m) return Math.min(parseFloat(m[1]) * 1000, 300_000);
  return 60_000;
}
