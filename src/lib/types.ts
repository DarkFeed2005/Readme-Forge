export interface RepoInfo {
  name: string;
  fullName: string;
  description: string | null;
  owner: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  topics: string[];
  license: string | null;
  defaultBranch: string;
  htmlUrl: string;
  homepage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface FileEntry {
  name: string;
  path: string;
  type: "blob" | "tree";
  size: number;
  url?: string;
}

export interface RepoContext {
  repo: RepoInfo;
  tree: FileEntry[];
  fileContents: Record<string, string>;
  techStack: string[];
  features: string[];
}