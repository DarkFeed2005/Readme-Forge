export interface ParsedRepoUrl {
  owner: string;
  repo: string;
}

export function parseRepoUrl(input: string): ParsedRepoUrl | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "github.com") return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/, "");

  const validName = /^[A-Za-z0-9_.-]+$/;
  if (!validName.test(owner) || !validName.test(repo)) return null;
  if (owner.startsWith(".") || owner.startsWith("-")) return null;
  if (repo.startsWith(".") || repo.startsWith("-")) return null;

  return { owner, repo };
}