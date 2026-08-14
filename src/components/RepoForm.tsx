import { useState } from "react";
import {
  AlertTriangle,
  Code2,
  ExternalLink,
  Eye,
  EyeOff,
  GitFork,
  KeyRound,
  Loader2,
  RefreshCw,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";
import type { RepoContext } from "@/lib/types";

interface RepoFormProps {
  repoUrl: string;
  onRepoUrlChange: (value: string) => void;
  onFetch: () => void;
  isFetching: boolean;
  fetchError: string | null;
  context: RepoContext | null;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function StepBadge({ label }: { label: string }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-bold text-indigo-400">
      {label}
    </span>
  );
}

export default function RepoForm({
  repoUrl,
  onRepoUrlChange,
  onFetch,
  isFetching,
  fetchError,
  context,
  apiKey,
  onApiKeyChange,
  onGenerate,
  isGenerating,
}: RepoFormProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-xl shadow-black/20">
      <div className="mb-4 flex items-center gap-3">
        <StepBadge label="1" />
        <h2 className="text-sm font-semibold text-white">Source Repository</h2>
      </div>

      <label htmlFor="repo-url" className="mb-1.5 block text-xs font-medium text-slate-400">
        GitHub Repository URL
      </label>
      <div className="flex gap-2">
        <input
          id="repo-url"
          type="text"
          value={repoUrl}
          onChange={(e) => onRepoUrlChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onFetch();
          }}
          placeholder="https://github.com/owner/repo"
          className="input-base flex-1"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={onFetch}
          disabled={isFetching || isGenerating}
          className="btn-primary shrink-0"
        >
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {isFetching ? "Fetching" : "Fetch"}
        </button>
      </div>

      {fetchError && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {context && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center gap-2">
            <a
              href={context.repo.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="truncate font-semibold text-indigo-400 transition hover:text-indigo-300 hover:underline"
            >
              {context.repo.fullName}
            </a>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          </div>
          {context.repo.description && (
            <p className="mt-1 line-clamp-2 text-xs text-slate-400">{context.repo.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300">
              <Star className="h-3 w-3 text-amber-400" />
              {formatCount(context.repo.stars)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300">
              <GitFork className="h-3 w-3 text-sky-400" />
              {formatCount(context.repo.forks)}
            </span>
            {context.repo.language && (
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300">
                <Code2 className="h-3 w-3 text-emerald-400" />
                {context.repo.language}
              </span>
            )}
            {context.repo.license && (
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300">
                <Tag className="h-3 w-3 text-violet-400" />
                {context.repo.license}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {context.techStack.slice(0, 6).map((tech) => (
              <span key={tech} className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-300">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="my-5 border-t border-slate-800" />

      <div className="mb-4 flex items-center gap-3">
        <StepBadge label="2" />
        <h2 className="text-sm font-semibold text-white">API Key</h2>
      </div>
      <div className="relative">
        <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type={showKey ? "text" : "password"}
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="gsk_... (optional, falls back to server key)"
          className="input-base pl-9 pr-10"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShowKey((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
          aria-label={showKey ? "Hide API key" : "Show API key"}
        >
          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-slate-500">
        Optional. Leave blank to use the GROQ_API_KEY configured on the server.
      </p>

      <button
        type="button"
        onClick={onGenerate}
        disabled={!context || isFetching || isGenerating}
        className="btn-generate mt-5 w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating README…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate README
          </>
        )}
      </button>
    </section>
  );
}