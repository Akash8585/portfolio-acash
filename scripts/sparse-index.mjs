/**
 * Builds a sparse retrieval index (no vectors) so the chat can answer
 * from the portfolio notes before `npm run gen` downloads an embedding model.
 */
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "src", "data");
const read = (file) => JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));

const profile = read("profile.json");
const { career } = read("career.json");
const { education } = read("education.json");
const { projects } = read("projects.json");
const { socials } = read("socials.json");
const name = profile.shortName;

const cards = [];
const add = (content, metadata) => cards.push({ content, metadata, embedding: [] });

add(
  [
    `About ${profile.name}: ${profile.headline}`,
    ...profile.summary,
    `Based in ${profile.location}. Website: ${profile.site}. Resume: ${profile.resume}. Email: ${profile.email}.`,
    `Areas of focus: ${profile.focus.join("; ")}.`,
  ].join("\n"),
  { source: "/", type: "profile", title: `About ${name}` },
);

add(
  [`Technical skills of ${name}:`, ...profile.skills.map((s) => `${s.group}: ${s.items.join(", ")}.`)].join("\n"),
  { source: "/", type: "skills", title: "Skills" },
);

add(
  [
    `Open source: ${name} is a ${profile.openSource.role.toLowerCase()} of ${profile.openSource.name} since ${profile.openSource.start}.`,
    profile.openSource.description.join(" "),
    `Repository: ${profile.openSource.href}`,
  ].join("\n"),
  { source: "/experience", type: "opensource", title: `${profile.openSource.role} of ${profile.openSource.name}` },
);

add(
  [`Achievements of ${name}:`, ...profile.achievements.map((a) => `${a.title}. ${a.detail}`)].join("\n"),
  { source: "/", type: "achievements", title: "Achievements" },
);

for (const f of profile.faq) {
  add(`Question: ${f.q}\nAnswer: ${f.a}`, { source: "/", type: "faq", title: f.q });
}

for (const c of career) {
  add(
    [
      `${name} at ${c.name}: ${c.title}, ${c.start} to ${c.end ?? "present"}${c.location ? ` (${c.location})` : ""}.`,
      c.description?.join(" ") ?? "",
      c.tech?.length ? `Technologies: ${c.tech.join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    { source: "/experience", type: "experience", title: `${c.title} at ${c.name}` },
  );
}

for (const e of education) {
  add(
    [
      `Education: ${name} studied ${e.title} at ${e.name}. ${e.start}.`,
      e.description?.join(" ") ?? "",
      `Institute: ${e.href}`,
    ]
      .filter(Boolean)
      .join("\n"),
    { source: "/experience", type: "education", title: `${e.title} at ${e.name}` },
  );
}

for (const p of projects) {
  const links = p.links.map((l) => `${l.name}: ${l.href}`).join(", ");
  add(
    [`Project: ${p.name}. ${p.description}`, `Tech: ${p.tags.join(", ")}.`, links ? `Links: ${links}.` : ""]
      .filter(Boolean)
      .join("\n"),
    { source: "/projects", type: "project", title: p.name },
  );
}

add(
  `Contact and social links for ${name}: ${socials.map((s) => `${s.name} (${s.href})`).join(", ")}. Contact form: /contact. Resume: ${profile.resume}.`,
  { source: "/contact", type: "socials", title: "Contact and socials" },
);

fs.writeFileSync(path.join(dataDir, "embeddings.json"), JSON.stringify(cards));
console.log(`Wrote ${cards.length} cards`);
