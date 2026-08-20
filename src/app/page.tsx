"use client";

import { useEffect, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import Navbar from "@/components/Navbar";
import Loader from "@/components/Loader";
import RepoForm from "@/components/RepoForm";
import TemplateEditor from "@/components/TemplateEditor";
import ReadmePreview from "@/components/ReadmePreview";
import { parseRepoUrl } from "@/lib/github";
import { TEMPLATES } from "@/lib/templates";
import type { RepoContext } from "@/lib/types";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const columnVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const panelVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function Home() {
  const [preloaderFading, setPreloaderFading] = useState(false);
  const [preloaderVisible, setPreloaderVisible] = useState(true);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPreloaderFading(true), 1100);
    const removeTimer = setTimeout(() => setPreloaderVisible(false), 1700);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  const [repoUrl, setRepoUrl] = useState("");
  const [context, setContext] = useState<RepoContext | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [template, setTemplate] = useState(TEMPLATES[0].content);

  const [apiKey, setApiKey] = useState("");
  const [generated, setGenerated] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const handleFetch = async () => {
    if (isFetching || isGenerating) return;

    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      setFetchError("Invalid GitHub repository URL. Use the format https://github.com/owner/repo");
      return;
    }

    setIsFetching(true);
    setFetchError(null);
    setGenerateError(null);

    try {
      const res = await fetch(`/api/github?url=${encodeURIComponent(repoUrl.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `Failed to fetch repository metadata (${res.status})`);
      }
      setContext(data as RepoContext);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch repository metadata.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleGenerate = async () => {
    if (!context) {
      setGenerateError("Fetch repository metadata first, then generate.");
      return;
    }
    if (isGenerating) return;

    setGenerated("");
    setGenerateError(null);
    setIsGenerating(true);
    setCopied(false);

    const controller = new AbortController();
    abortRef.current = controller;

    let willAutoRetry = false;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          context,
          template,
          apiKey: apiKey.trim() || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let message = `Generation failed (${res.status})`;
        try {
          const json = await res.json();
          if (json.error) message = json.error;
        } catch {
          // non-JSON error body
        }

        if (res.status === 429) {
          willAutoRetry = true;
          let retryDelay = 10;
          const retryAfter = res.headers.get("retry-after");
          if (retryAfter) {
            const parsed = parseInt(retryAfter, 10);
            if (!Number.isNaN(parsed) && parsed > 0) {
              retryDelay = Math.min(Math.max(parsed, 5), 30);
            }
          }
          setGenerateError(`Rate limit reached. Retrying automatically in ${retryDelay} seconds…`);
          retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null;
            void handleGenerate();
          }, retryDelay * 1000);
          return;
        }

        throw new Error(message);
      }

      if (!res.body) {
        throw new Error("Generation failed (empty response body).");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setGenerated(accumulated);
      }
      accumulated += decoder.decode();
      setGenerated(accumulated);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setGenerateError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      if (!willAutoRetry) {
        setIsGenerating(false);
        abortRef.current = null;
      }
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const handleCopy = async () => {
    if (!generated.trim()) return;
    try {
      await navigator.clipboard.writeText(generated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = generated;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!generated.trim()) return;
    const blob = new Blob([generated], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "README.md";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleTemplateIdChange = (id: string) => {
    setTemplateId(id);
    const next = TEMPLATES.find((t) => t.id === id);
    if (next) setTemplate(next.content);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {preloaderVisible && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 transition-opacity duration-500 ${
            preloaderFading ? "opacity-0" : "opacity-100"
          }`}
          aria-hidden={preloaderFading}
        >
          <Loader />
        </div>
      )}

      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative mb-10 pt-2"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 left-1/2 h-56 w-[40rem] max-w-full -translate-x-1/2 rounded-full bg-purple-600/10 blur-3xl"
          />
          <h1 className="relative bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-200 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            Forge a perfect README from any GitHub repository
          </h1>
          <p className="relative mt-3 max-w-2xl text-sm text-slate-400">
            Readme Forge pulls real repository metadata, detects your tech stack, and uses
            OpenRouter to write documentation that fits your template exactly.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6 lg:grid-cols-12"
        >
          <motion.div variants={columnVariants} className="flex flex-col gap-6 lg:col-span-5">
            <motion.div variants={panelVariants}>
              <RepoForm
              repoUrl={repoUrl}
              onRepoUrlChange={setRepoUrl}
              onFetch={handleFetch}
              isFetching={isFetching}
              fetchError={fetchError}
              context={context}
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              />
            </motion.div>
            <motion.div variants={panelVariants}>
              <TemplateEditor
              templateId={templateId}
              onTemplateIdChange={handleTemplateIdChange}
              template={template}
              onTemplateChange={setTemplate}
              />
            </motion.div>
          </motion.div>

          <motion.div variants={panelVariants} className="lg:col-span-7">
            <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
              <ReadmePreview
                markdown={generated}
                isStreaming={isGenerating}
                error={generateError}
                copied={copied}
                onCopy={handleCopy}
                onDownload={handleDownload}
                onCancel={handleCancel}
              />
            </div>
          </motion.div>
        </motion.div>
      </main>

      <footer className="border-t border-slate-800/80 py-6">
        <p className="text-center text-xs text-slate-500">
          2026 Readme-Forge. All rights reserved. -KpolitX.
        </p>
      </footer>
    </div>
  );
}