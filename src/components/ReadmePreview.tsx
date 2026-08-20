"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertTriangle,
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  Loader2,
  Sparkles,
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
    <section className="panel flex h-full min-h-[70vh] flex-col overflow-hidden lg:min-h-0">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/60 p-1">
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              tab === "preview"
                ? "bg-purple-500/15 text-purple-300"
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
              tab === "code" ? "bg-purple-500/15 text-purple-300" : "text-slate-400 hover:text-slate-200"
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
        <AnimatePresence mode="wait" initial={false}>
          {tab === "preview" ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="h-full"
            >
              {hasContent ? (
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
                <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-purple-400 align-middle" />
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6">
              <div className="w-full max-w-lg rounded-2xl border-2 border-dashed border-slate-700/60 p-8 text-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative mx-auto mb-6 h-20 w-20"
                >
                  <motion.div
                    aria-hidden
                    animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.12, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-purple-500/25 blur-2xl"
                  />
                  <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-purple-400/30 bg-slate-900/90 shadow-lg shadow-purple-500/10">
                    <Sparkles className="h-8 w-8 text-purple-300" />
                  </div>
                </motion.div>
                <h3 className="text-base font-semibold text-white">Your README will appear here</h3>
                <p className="mt-1.5 text-xs text-slate-400">
                  Streamed live from OpenRouter — three steps to get going.
                </p>
                <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 transition duration-200 hover:border-purple-500/30">
                    <span className="step-badge">1</span>
                    <p className="mt-2 text-xs font-semibold text-slate-200">Paste a repo URL</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      Fetch live metadata, file tree &amp; stack
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 transition duration-200 hover:border-purple-500/30">
                    <span className="step-badge">2</span>
                    <p className="mt-2 text-xs font-semibold text-slate-200">Choose a template</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      Or paste your own structure
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 transition duration-200 hover:border-purple-500/30">
                    <span className="step-badge">3</span>
                    <p className="mt-2 text-xs font-semibold text-slate-200">Generate &amp; export</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      Copy or download README.md
                    </p>
                  </div>
                </div>
              </div>
            </div>
            )}
            </motion.div>
        ) : (
          <motion.div
            key="code"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="h-full"
          >
          <textarea
            readOnly
            value={markdown}
            spellCheck={false}
            className="h-full min-h-[50vh] w-full resize-none bg-slate-950/40 p-5 font-mono text-xs leading-relaxed text-slate-300 outline-none"
            placeholder="Generated Markdown will appear here…"
          />
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      <footer className="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          {isStreaming ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-purple-400" />
              <span className="text-purple-400">Streaming from Llama 3.3 70B…</span>
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