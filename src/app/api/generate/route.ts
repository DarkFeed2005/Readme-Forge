import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import type { RepoContext } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const PRIMARY_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";

const MAX_TREE_ENTRIES = 120;
const MAX_TREE_DEPTH = 3;
const MAX_TREE_CHARS = 1500;
const MAX_DEPS_PER_LIST = 50;

const PACKAGE_KEYS = [
  "name",
  "version",
  "description",
  "private",
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "engines",
] as const;

const SYSTEM_PROMPT = `You are an expert technical writer producing rich, enterprise-grade README.md documentation for open-source software.

You will receive: a GitHub repo URL, repository metadata and file tree (JSON), key manifest file contents (JSON), a detected tech stack and feature list, and a Markdown README template that may contain {{PLACEHOLDER}} tokens.

Strict rules:
1. Output ONLY valid Markdown, starting directly with the template's H1 header. Never wrap the response in triple backticks; no code fences around the whole output, no JSON, no commentary, no preamble or postamble.
2. Preserve the template's exact structure: every heading, subsection, and its order. Do not rename, remove, or reorder sections, do not add new top-level sections, and do not append extra content after the template's final section.
3. Rich overviews: keep an engaging title with an emoji, followed by a bold single-sentence blockquote summary (> **...**). Expand "Why {Project}?" with 2-3 detailed paragraphs on purpose, architecture, and design choices.
4. Skillicons headers: whenever a tech-stack icon row is requested (e.g. {{tech_stack_icons}}), emit a centered HTML row — <p align="center"> with <img src="https://skillicons.dev/icons?i=slug1,slug2" width="50"/> — using comma-separated slugs only for technologies proven by the detected stack or manifest files.
5. Features: NEVER a flat bullet list. Group them into categorized emoji sub-sections such as "### 🎯 Core Features", "### 📦 Storage & Architecture", "### 🎨 UI/UX", "### 🔧 Technical Highlights", with a bold lead-in for each item. Only include features supported by the context.
6. Installation & setup: comprehensive and step-by-step — git clone of the repo, dependency installation with exact commands matching the detected stack, environment/database configuration (e.g. .env, connection strings, migrations) where evident, and run commands.
7. Project structure: render the file tree inside a plain text code block (\`\`\`text ... \`\`\`) using tree glyphs (├──, └──, │).
8. shields.io badges must use real repo data (license, language, stars, forks) and the real owner/repo in the URLs.
9. Never invent facts: no fake links, contributors, screenshots, versions, or features. Unknown details get an honest generic fallback.
10. Placeholder glossary: {{repo_name}} display name; {{short_description}} one-sentence summary; {{tech_stack_icons}} comma-separated skillicons slugs (no spaces); {{tech_stack_list}} formatted technology list; {{core_feature_N}} core feature bullets; {{tech_highlight_N}} architecture/technical highlights; {{repo_url}} repository URL; {{file_tree}} directory tree inside \`\`\`text; {{repo_owner}} GitHub username.

Output the completed README Markdown and nothing else.`;

function isPackageJson(path: string): boolean {
  return path.split("/").pop()?.toLowerCase() === "package.json";
}

function slimPackageJson(raw: string): string {
  try {
    const pkg = JSON.parse(raw);
    if (typeof pkg !== "object" || pkg === null) return raw.slice(0, 3000);
    const slim: Record<string, unknown> = {};
    for (const key of PACKAGE_KEYS) {
      if (pkg[key] !== undefined) slim[key] = pkg[key];
    }
    for (const depKey of ["dependencies", "devDependencies", "peerDependencies"]) {
      const deps = pkg[depKey];
      if (deps && typeof deps === "object") {
        const entries = Object.entries(deps as Record<string, string>);
        if (entries.length > MAX_DEPS_PER_LIST) {
          slim[depKey] = Object.fromEntries(entries.slice(0, MAX_DEPS_PER_LIST));
          (slim as Record<string, Record<string, unknown>>)[depKey].__truncated =
            `${entries.length - MAX_DEPS_PER_LIST} more omitted`;
        }
      }
    }
    return JSON.stringify(slim).slice(0, 2500);
  } catch {
    return raw.slice(0, 3000);
  }
}

function compactTreeForPrompt(tree: RepoContext["tree"]): RepoContext["tree"] {
  const out: RepoContext["tree"] = [];
  let chars = 0;
  for (const entry of tree) {
    if (entry.path.split("/").length > MAX_TREE_DEPTH) continue;
    out.push(entry);
    chars += entry.path.length + 32;
    if (out.length >= MAX_TREE_ENTRIES || chars >= MAX_TREE_CHARS) break;
  }
  return out;
}

function isRetryableGroqError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const status = (err as { status?: unknown }).status;
  if (typeof status === "number" && (status === 429 || status === 413)) return true;
  const message = err instanceof Error ? err.message : String(err);
  return /rate|token|too large|tpm/i.test(message);
}

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function rateLimitError(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { "Retry-After": "30" } },
  );
}

export async function POST(req: NextRequest) {
  let body: {
    repoUrl?: string;
    context?: RepoContext;
    template?: string;
    apiKey?: string;
  };

  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body", 400);
  }

  const { repoUrl, context, template, apiKey } = body;

  if (!repoUrl || !context || !context.repo || !template) {
    return error("Missing required fields: repoUrl, context, and template are required.", 400);
  }

  const key = apiKey?.trim() || process.env.GROQ_API_KEY;
  if (!key) {
    return error(
      "No Groq API key available. Provide one in the API Key field or set GROQ_API_KEY in your server environment.",
      400,
    );
  }

  const compactTree = compactTreeForPrompt(context.tree);

  const compactFiles: Record<string, string> = {};
  const LOCKFILES = /(package-lock|pnpm-lock|yarn\.lock|bun\.lockb|Cargo\.lock|go\.sum|composer\.lock|Gemfile\.lock|poetry\.lock)$/i;
  for (const [path, content] of Object.entries(context.fileContents)) {
    if (path.includes("/") || LOCKFILES.test(path)) continue;
    compactFiles[path] = isPackageJson(path) ? slimPackageJson(content) : content.slice(0, 3000);
    if (Object.keys(compactFiles).length >= 3) break;
  }

  const userPrompt = `Target repository: ${repoUrl}

## Repository metadata
${JSON.stringify(context.repo, null, 2)}

## File tree (depth ≤ ${MAX_TREE_DEPTH}, ${compactTree.length} entries, trimmed)
${JSON.stringify(compactTree, null, 2)}

## Key file contents
${JSON.stringify(compactFiles, null, 2)}

## Detected tech stack
${context.techStack.join(", ") || "Not detected"}

## Detected features
${context.features.join(", ") || "Not detected"}

## README template to fill (fill every {{placeholder}} with real content)
${template}`;

  const abortController = new AbortController();
  const groq = new Groq({ apiKey: key });

  const createCompletion = (model: string) =>
    groq.chat.completions.create(
      {
        model,
        temperature: 0.3,
        max_tokens: 4096,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      },
      { signal: abortController.signal },
    );

  let completion: Awaited<ReturnType<typeof createCompletion>>;
  let usedModel = PRIMARY_MODEL;
  try {
    completion = await createCompletion(PRIMARY_MODEL);
  } catch (err) {
    if (isRetryableGroqError(err)) {
      console.warn(
        `Groq ${PRIMARY_MODEL} rate limited, falling back to ${FALLBACK_MODEL}:`,
        err instanceof Error ? err.message : err,
      );
      usedModel = FALLBACK_MODEL;
      try {
        completion = await createCompletion(FALLBACK_MODEL);
      } catch (fallbackErr) {
        console.error("Groq fallback request also failed:", fallbackErr);
        const message =
          fallbackErr instanceof Error ? fallbackErr.message : "Failed to start generation.";
        if (/too large|tokens per minute|rate_limit/i.test(message)) {
          return rateLimitError(
            "The prompt exceeds your Groq account's token limit (TPM). Use a smaller repository or a higher-tier Groq API key. To retry, wait for the rate limit window to reset.",
          );
        }
        return error(`Groq API error: ${message}`, 502);
      }
    } else {
      console.error("Groq request failed:", err);
      const message =
        err instanceof Error ? err.message : "Failed to start generation.";
      if (/too large|tokens per minute|rate_limit/i.test(message)) {
        return rateLimitError(
          "The prompt exceeds your Groq account's token limit (TPM). Use a smaller repository or a higher-tier Groq API key. To retry, wait for the rate limit window to reset.",
        );
      }
      return error(`Groq API error: ${message}`, 502);
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            controller.enqueue(encoder.encode(delta));
          }
        }
        controller.close();
      } catch (err) {
        console.error("Groq generation failed:", err);
        try {
          controller.error(err instanceof Error ? err : new Error("Generation failed"));
        } catch {
          // stream already cancelled or closed by the client
        }
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "X-Generation-Model": usedModel,
    },
  });
}