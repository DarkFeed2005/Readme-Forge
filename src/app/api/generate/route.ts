import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import type { RepoContext } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL = "llama-3.3-70b-versatile";

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

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
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

  const compactTree = context.tree
    .slice(0, 120)
    .map(({ name, path, type, size }) => ({ name, path, type, size }));

  const compactFiles: Record<string, string> = {};
  const LOCKFILES = /(package-lock|pnpm-lock|yarn\.lock|bun\.lockb|Cargo\.lock|go\.sum|composer\.lock|Gemfile\.lock|poetry\.lock)$/i;
  for (const [path, content] of Object.entries(context.fileContents)) {
    if (path.includes("/") || LOCKFILES.test(path)) continue;
    compactFiles[path] = content.slice(0, 3000);
    if (Object.keys(compactFiles).length >= 3) break;
  }

  const userPrompt = `Target repository: ${repoUrl}

## Repository metadata
${JSON.stringify(context.repo, null, 2)}

## File tree (first ${compactTree.length} entries)
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

  let completion: Awaited<ReturnType<typeof groq.chat.completions.create>>;
  try {
    completion = await groq.chat.completions.create(
      {
        model: MODEL,
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
  } catch (err) {
    console.error("Groq request failed:", err);
    const message =
      err instanceof Error ? err.message : "Failed to start generation.";
    if (/too large|tokens per minute|rate_limit/i.test(message)) {
      return error(
        "The prompt exceeds your Groq account's token limit (TPM). Use a smaller repository or a higher-tier Groq API key. To retry, wait for the rate limit window to reset.",
        429,
      );
    }
    return error(`Groq API error: ${message}`, 502);
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
        controller.error(err instanceof Error ? err : new Error("Generation failed"));
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
    },
  });
}