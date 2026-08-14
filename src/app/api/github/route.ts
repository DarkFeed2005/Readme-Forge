import { NextRequest, NextResponse } from "next/server";
import { parseRepoUrl } from "@/lib/github";
import type { FileEntry, RepoContext, RepoInfo } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const GITHUB_API = "https://api.github.com";
const MAX_TREE_ENTRIES = 3000;
const MAX_MANIFEST_FILES = 8;
const MAX_MANIFEST_SIZE = 200_000;
const MAX_MANIFEST_CHARS = 8000;

const MANIFEST_LANGUAGE: Record<string, string> = {
  "package.json": "Node.js",
  "package-lock.json": "Node.js",
  "pnpm-lock.yaml": "Node.js",
  "yarn.lock": "Node.js",
  "bun.lockb": "Bun",
  "go.mod": "Go",
  "Cargo.toml": "Rust",
  "Cargo.lock": "Rust",
  "requirements.txt": "Python",
  "pyproject.toml": "Python",
  "setup.py": "Python",
  "Pipfile": "Python",
  "pom.xml": "Java (Maven)",
  "build.gradle": "Java (Gradle)",
  "build.gradle.kts": "Java (Gradle)",
  "build.sbt": "Scala (sbt)",
  "composer.json": "PHP",
  "Gemfile": "Ruby",
  "pubspec.yaml": "Dart",
  "mix.exs": "Elixir",
  "Package.swift": "Swift",
  "Podfile": "Ruby (CocoaPods)",
  "Cartfile": "Swift (Carthage)",
  "shard.yml": "Crystal",
  "deno.json": "Deno",
  "deno.jsonc": "Deno",
};

const TECH_SIGNALS: Array<{ re: RegExp; label: string }> = [
  { re: /"typescript"|@typescript-eslint|ts-jest/, label: "TypeScript" },
  { re: /"react"|react-dom|react-native/, label: "React" },
  { re: /"next"|next\.js|"next-env/, label: "Next.js" },
  { re: /"vue"|vue-router|"nuxt/, label: "Vue.js" },
  { re: /"svelte"|sveltekit/, label: "Svelte" },
  { re: /"tailwindcss"/, label: "Tailwind CSS" },
  { re: /"prisma"/, label: "Prisma ORM" },
  { re: /"mongoose"/, label: "MongoDB (Mongoose)" },
  { re: /postgres|"pg"\b|pg-promise/, label: "PostgreSQL" },
  { re: /"mysql"/, label: "MySQL" },
  { re: /"redis"/, label: "Redis" },
  { re: /sqlite3|better-sqlite3|"sqlite"/, label: "SQLite" },
  { re: /"express"/, label: "Express.js" },
  { re: /"fastify"/, label: "Fastify" },
  { re: /"nestjs"|@nestjs\//, label: "NestJS" },
  { re: /"django"/, label: "Django" },
  { re: /"fastapi"/, label: "FastAPI" },
  { re: /"flask"/, label: "Flask" },
  { re: /"jwt"/, label: "JWT" },
  { re: /oauth/, label: "OAuth" },
  { re: /"graphql"/, label: "GraphQL" },
  { re: /"axios"/, label: "Axios" },
  { re: /"zod"/, label: "Zod" },
  { re: /"jest"/, label: "Jest (testing)" },
  { re: /"vitest"/, label: "Vitest (testing)" },
  { re: /"cypress"/, label: "Cypress (e2e)" },
  { re: /"playwright"/, label: "Playwright (e2e)" },
  { re: /"eslint"/, label: "ESLint" },
  { re: /"prettier"/, label: "Prettier" },
  { re: /"docker"/, label: "Docker" },
  { re: /"kubernetes"/, label: "Kubernetes" },
  { re: /"grpc"/, label: "gRPC" },
  { re: /websocket/, label: "WebSockets" },
  { re: /"kafka"/, label: "Apache Kafka" },
  { re: /"elasticsearch"/, label: "Elasticsearch" },
  { re: /"openai"/, label: "OpenAI API" },
  { re: /"groq-sdk"|@groq-sdk/, label: "Groq API" },
  { re: /"stripe"/, label: "Stripe (payments)" },
];

const FEATURE_SIGNALS: Array<{ re: RegExp; label: string }> = [
  { re: /^Dockerfile/, label: "Docker containerization" },
  { re: /docker-compose/, label: "Docker Compose" },
  { re: /^\.github\/workflows/, label: "CI/CD via GitHub Actions" },
  { re: /\.gitlab-ci/, label: "CI/CD via GitLab" },
  { re: /^\.circleci/, label: "CI/CD via CircleCI" },
  { re: /^\.travis/, label: "CI via Travis" },
  { re: /^Makefile$/, label: "Make build system" },
  { re: /^helm\//, label: "Helm charts" },
  { re: /kustomization/, label: "Kubernetes (Kustomize)" },
  { re: /^\.github\/ISSUE_TEMPLATE/, label: "Issue templates" },
  { re: /^\.github\/PULL_REQUEST_TEMPLATE/, label: "PR templates" },
  { re: /^docs\//, label: "Documentation (docs/)" },
  { re: /^examples?\//, label: "Examples directory" },
  { re: /^scripts\//, label: "Utility scripts" },
  { re: /^tests?\//, label: "Automated test suite" },
  { re: /^e2e/, label: "End-to-end tests" },
  { re: /i18n|locales?|translations/, label: "i18n / localization" },
  { re: /\.env\.example$/, label: "Environment config template" },
];

const CONTENT_FEATURE_SIGNALS: Array<{ re: RegExp; label: string }> = [
  { re: /"cli"|commander|yargs|argparse|"click"/, label: "Command-line interface" },
  { re: /passport|"jwt"|"oauth|auth0|firebase-auth/, label: "Authentication" },
  { re: /"bcrypt"|"argon2/, label: "Secure password hashing" },
  { re: /"socket\.io"/, label: "Realtime via Socket.IO" },
  { re: /puppeteer|"playwright"/, label: "Browser automation" },
  { re: /"cheerio"|jsdom|beautifulsoup/, label: "Web scraping" },
  { re: /migration|migrate\b/, label: "Database migrations" },
  { re: /express-rate-limit|"throttle"/, label: "Rate limiting" },
  { re: /"swagger"|openapi|"apidoc"/, label: "API documentation (OpenAPI)" },
];

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function titleCase(topic: string): string {
  return topic
    .split(/[-_]/)
    .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function detectTechStack(tree: FileEntry[], fileContents: Record<string, string>, repo: RepoInfo): string[] {
  const stack = new Set<string>();
  const paths = new Set(tree.map((e) => e.path.toLowerCase()));

  for (const [fileName, language] of Object.entries(MANIFEST_LANGUAGE)) {
    const lower = fileName.toLowerCase();
    for (const p of paths) {
      if (p === lower || p.endsWith(`/${lower}`)) {
        stack.add(language);
        break;
      }
    }
  }
  if ([...paths].some((p) => p.endsWith(".csproj"))) stack.add("C# (.NET)");

  const joined = Object.values(fileContents).join("\n").toLowerCase();
  for (const { re, label } of TECH_SIGNALS) {
    if (re.test(joined)) stack.add(label);
  }

  if (repo.language) stack.add(repo.language);
  return [...stack];
}

function detectFeatures(tree: FileEntry[], fileContents: Record<string, string>, repo: RepoInfo): string[] {
  const features = new Set<string>();
  const joined = Object.values(fileContents).join("\n").toLowerCase();

  for (const topic of repo.topics) {
    if (!/^(ai|ml|bot|app|tool|library|framework|sdk|api|cli|web|mobile|game|data|devops|security|automation)$/i.test(topic)) {
      features.add(titleCase(topic));
    }
  }

  for (const entry of tree) {
    for (const { re, label } of FEATURE_SIGNALS) {
      if (re.test(entry.path)) {
        features.add(label);
        break;
      }
    }
  }

  for (const { re, label } of CONTENT_FEATURE_SIGNALS) {
    if (re.test(joined)) features.add(label);
  }

  return [...features];
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return error("Missing required query parameter: url", 400);

  const parsed = parseRepoUrl(url);
  if (!parsed) {
    return error("Invalid GitHub repository URL. Expected format: https://github.com/owner/repo", 400);
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "readme-forge",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const repoRes = await fetch(`${GITHUB_API}/repos/${parsed.owner}/${parsed.repo}`, {
      headers,
      cache: "no-store",
    });

    if (repoRes.status === 404) {
      return error(
        `Repository "${parsed.owner}/${parsed.repo}" not found. It may be private, renamed, or may not exist.`,
        404,
      );
    }
    if (repoRes.status === 403) {
      return error(
        "GitHub API rate limit exceeded. Wait a moment and retry, or set a GITHUB_TOKEN in your server environment.",
        403,
      );
    }
    if (!repoRes.ok) {
      return error(`GitHub API error: ${repoRes.status} ${repoRes.statusText}`, 502);
    }

    const data = await repoRes.json();
    const repo: RepoInfo = {
      name: data.name ?? parsed.repo,
      fullName: data.full_name ?? `${parsed.owner}/${parsed.repo}`,
      description: data.description ?? null,
      owner: data.owner?.login ?? parsed.owner,
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      openIssues: data.open_issues_count ?? 0,
      language: data.language ?? null,
      topics: Array.isArray(data.topics) ? data.topics.slice(0, 20) : [],
      license: data.license?.spdx_id ?? null,
      defaultBranch: data.default_branch ?? "main",
      htmlUrl: data.html_url ?? url,
      homepage: data.homepage || null,
      createdAt: data.created_at ?? null,
      updatedAt: data.updated_at ?? null,
    };

    const branch = encodeURIComponent(repo.defaultBranch);
    const treeRes = await fetch(`${GITHUB_API}/repos/${parsed.owner}/${parsed.repo}/git/trees/${branch}?recursive=1`, {
      headers,
      cache: "no-store",
    });

    let tree: FileEntry[] = [];
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      tree = (treeData.tree ?? [])
        .filter((entry: { type?: string }) => entry.type === "blob" || entry.type === "tree")
        .slice(0, MAX_TREE_ENTRIES)
        .map((entry: { path?: string; type?: string; size?: number; url?: string }) => {
          const path = entry.path ?? "";
          return {
            name: path.split("/").pop() ?? path,
            path,
            type: entry.type === "tree" ? ("tree" as const) : ("blob" as const),
            size: entry.size ?? 0,
            url: entry.url,
          };
        });
    }

    const candidates: FileEntry[] = [];
    const seen = new Set<string>();
    for (const entry of tree) {
      if (entry.type !== "blob") continue;
      const base = entry.name.toLowerCase();
      const isManifest = base.endsWith(".csproj") || MANIFEST_LANGUAGE[base] !== undefined;
      if (!isManifest || seen.has(entry.path)) continue;
      seen.add(entry.path);
      candidates.push(entry);
    }
    candidates.sort((a, b) => a.path.split("/").length - b.path.split("/").length);

    const fileContents: Record<string, string> = {};
    await Promise.all(
      candidates.slice(0, MAX_MANIFEST_FILES).map(async (entry) => {
        try {
          if (entry.size > MAX_MANIFEST_SIZE || !entry.url) return;
          const blobRes = await fetch(entry.url, { headers, cache: "no-store" });
          if (!blobRes.ok) return;
          const blob = await blobRes.json();
          if (!blob.content || blob.encoding !== "base64") return;
          const text = Buffer.from(blob.content, "base64").toString("utf-8");
          fileContents[entry.path] = text.slice(0, MAX_MANIFEST_CHARS);
        } catch {
          // ignore individual manifest fetch failures
        }
      }),
    );

    const context: RepoContext = {
      repo,
      tree,
      fileContents,
      techStack: detectTechStack(tree, fileContents, repo),
      features: detectFeatures(tree, fileContents, repo),
    };

    return NextResponse.json(context);
  } catch (err) {
    console.error("GitHub metadata fetch failed:", err);
    return error("Failed to reach the GitHub API. Check your connection and try again.", 502);
  }
}