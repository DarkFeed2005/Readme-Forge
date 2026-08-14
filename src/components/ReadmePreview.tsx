"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertTriangle,
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  FileCode2,
  Loader2,
  Square,
} from "lucide-react";

interface ReadmePreviewProps {
  markdown: string;
  isStreaming: boolean;
  error: string | null;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onCancel: () => void;
}

type Tab = "preview" | "code";

export default function ReadmePreview({
  markdown,
  isStreaming,
  error,
  copied,
  onCopy,
  onDownload,
  onCancel,
}: ReadmePreviewProps) {
  const [tab, setTab] = useState<Tab>("preview");
  const hasContent = markdown.trim().length > 0;
  const wordCount = hasContent ? markdown.trim().split(/\s+/).filter(Boolean).length : 0;

  useEffect(() => {
    if (isStreaming) setTab("preview");
  }, [isStreaming]);

  return (
    <section className="flex h-full min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl shadow-black/20 lg:min-h-0">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/60 p-1">
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              tab === "preview"
                ? "bg-indigo-500/15 text-indigo-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => setTab("code")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              tab === "code" ? "bg-indigo-500/15 text-indigo-300" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Markdown
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isStreaming && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
            >
              <Square className="h-3 w-3" />
              Stop
            </button>
          )}
          <button
            type="button"
            onClick={onCopy}
            disabled={!hasContent || isStreaming}
            className="btn-secondary"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={!hasContent || isStreaming}
            className="btn-secondary"
          >
            <Download className="h-3.5 w-3.5" />
            Download README.md
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-2 border-b border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {tab === "preview" ? (
          hasContent ? (
            <div className="markdown-body p-5 sm:p-7">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ node, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" />
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
              {isStreaming && (
                <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-indigo-400 align-middle" />
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/60">
                <FileCode2 className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-300">Your README will appear here</p>
              <p className="max-w-xs text-xs leading-relaxed text-slate-500">
                Paste a GitHub repository URL, fetch its metadata, then hit Generate. The result
                streams in live.
              </p>
            </div>
          )
        ) : (
          <textarea
            readOnly
            value={markdown}
            spellCheck={false}
            className="h-full min-h-[50vh] w-full resize-none bg-slate-950/40 p-5 font-mono text-xs leading-relaxed text-slate-300 outline-none"
            placeholder="Generated Markdown will appear here…"
          />
        )}
      </div>

      <footer className="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          {isStreaming ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
              <span className="text-indigo-400">Streaming from Llama 3.3 70B…</span>
            </>
          ) : (
            <span>{hasContent ? "Ready" : "Idle"}</span>
          )}
        </span>
        {wordCount > 0 && <span>{wordCount} words · {markdown.length} chars</span>}
      </footer>
    </section>
  );
}