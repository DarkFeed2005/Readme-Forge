import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import type { RepoContext } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are an elite technical documentation writer specializing in open-source software READMEs. You generate documentation that is accurate, precise, and professional.

You will be given:
1. A GitHub repository URL.
2. Repository metadata and file tree (JSON) fetched from the GitHub API.
3. Contents of key manifest/configuration files (JSON), such as package.json, go.mod, Cargo.toml, or requirements.txt.
4. A detected tech stack and feature list.
5. A README template written in Markdown that may contain {{PLACEHOLDER}} tokens.

Your ONLY task is to produce the final README.md by strictly filling in the template. Follow these rules without exception:

- Output ONLY valid Markdown. No code fences around the output, no JSON, no YAML, no explanations, no preamble, and no postamble.
- Preserve the template's exact structure: every heading, section, and the overall layout. Do not rename, remove, or reorder sections, and do not add new top-level sections.
- Fill every {{placeholder}} token with precise, high-quality content derived exclusively from the provided repository context. Replace the token itself with real content; never keep the {{ }} notation.
- Installation and usage instructions MUST match the repository's actual tech stack, with exact commands where the manifest files make them evident (e.g. npm install / yarn / pnpm for Node.js, go mod tidy + go build for Go, cargo build for Rust, pip install -r requirements.txt for Python).
- For the badge row, generate standard shields.io badges that match the real repository: license, language, stars, forks, and a reference to the repo's URL. Use the real owner/repo names in badge image URLs.
- NEVER invent facts: no fake links, contributors, screenshots, demo URLs, package versions, or features not supported by the provided context. If something is genuinely unknown, write an honest generic description instead of fabricating details.
- Keep the tone professional, concise, and consistent with the template's style.
- If a {{placeholder}} corresponds to a section with little contextual data, still include the section with the best reasonable content available from context.

Remember: output the completed README Markdown and nothing else.`;

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
  for (const [path, content] of Object.entries(context.fileContents)) {
    if (path.includes("/")) continue;
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