/**
 * Live GitHub numbers, fetched on the server and cached for an hour.
 * Every call degrades gracefully: the merged count falls back to the
 * resume's figure, everything else to an empty result the UI hides.
 */

export const GITHUB_USER = "Akash8585";

/** Shown when the public profile cannot be loaded. */
export const PUBLIC_REPO_FALLBACK = 36;

const REVALIDATE = 3600;

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "akash-portfolio",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, next: { revalidate: REVALIDATE } });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ */
/* Merged PRs into other people's repositories                         */
/* ------------------------------------------------------------------ */

export interface MergedPrCount {
  count: number;
  live: boolean;
}

export async function getPublicRepoCount(): Promise<MergedPrCount> {
  const url = `https://api.github.com/users/${GITHUB_USER}`;
  try {
    const data = await getJson<{ public_repos?: number }>(url, { headers: headers() });
    if (typeof data.public_repos !== "number") throw new Error("Unexpected payload");
    return { count: data.public_repos, live: true };
  } catch (err) {
    console.warn("Public repo count unavailable, using fallback:", err);
    return { count: PUBLIC_REPO_FALLBACK, live: false };
  }
}

/* ------------------------------------------------------------------ */
/* Contribution calendar                                               */
/* ------------------------------------------------------------------ */

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface Contributions {
  total: number;
  days: ContributionDay[];
}

/**
 * The public contribution graph, via a small proxy that scrapes it, so no
 * token is needed. Returns null when unreachable; the UI hides the graph.
 */
export async function getContributions(): Promise<Contributions | null> {
  const url = `https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`;
  try {
    const data = await getJson<{
      total?: Record<string, number>;
      contributions?: ContributionDay[];
    }>(url, { headers: { "User-Agent": "akash-portfolio" } });
    if (!Array.isArray(data.contributions)) throw new Error("Unexpected payload");
    const total = data.total?.lastYear ?? data.contributions.reduce((s, d) => s + d.count, 0);
    return { total, days: data.contributions };
  } catch (err) {
    console.warn("Contribution graph unavailable:", err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Pull requests into other people's repositories                  */
/* ------------------------------------------------------------------ */

export type PrState = "merged" | "open" | "closed";

export interface PullRequest {
  title: string;
  repo: string; // owner/name
  url: string;
  number: number;
  updatedAt: string;
}

export interface PrBucket {
  total: number;
  items: PullRequest[];
}

export type PullRequests = Record<PrState, PrBucket>;

const PR_QUERIES: Record<PrState, string> = {
  merged: `is:pr+is:merged+-user:${GITHUB_USER}`,
  open: `is:pr+is:open+-user:${GITHUB_USER}`,
  closed: `is:pr+is:closed+is:unmerged+-user:${GITHUB_USER}`,
};

interface SearchItem {
  title: string;
  html_url: string;
  number: number;
  updated_at: string;
  repository_url: string;
}

async function searchPrs(state: PrState, perPage: number): Promise<PrBucket | null> {
  const url = `https://api.github.com/search/issues?q=${PR_QUERIES[state]}+author:${GITHUB_USER}&per_page=${perPage}&sort=updated`;
  try {
    const data = await getJson<{ total_count?: number; items?: SearchItem[] }>(url, {
      headers: headers(),
    });
    if (typeof data.total_count !== "number" || !Array.isArray(data.items)) {
      throw new Error("Unexpected payload");
    }
    return {
      total: data.total_count,
      items: data.items.map((i) => ({
        title: i.title,
        repo: i.repository_url.split("/repos/")[1] ?? "",
        url: i.html_url,
        number: i.number,
        updatedAt: i.updated_at,
      })),
    };
  } catch (err) {
    console.warn(`PR search (${state}) unavailable:`, err);
    return null;
  }
}

/** Every state, or null when none of the searches came back. */
export async function getPullRequests(perPage = 6): Promise<PullRequests | null> {
  const [merged, open, closed] = await Promise.all([
    searchPrs("merged", perPage),
    searchPrs("open", perPage),
    searchPrs("closed", perPage),
  ]);
  if (!merged && !open && !closed) return null;
  const empty: PrBucket = { total: 0, items: [] };
  return { merged: merged ?? empty, open: open ?? empty, closed: closed ?? empty };
}

/** "3 days ago" style, computed on the server so it is stable in the HTML. */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.35, "w"],
    [12, "mo"],
  ];
  let v = s;
  let label = "s";
  for (const [div, next] of units) {
    if (v < div) break;
    v /= div;
    label = next;
  }
  if (label === "s") return "just now";
  return `${Math.floor(v)}${label} ago`;
}
