"use client";

import { useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import RepoForm from "@/components/RepoForm";
import TemplateEditor from "@/components/TemplateEditor";
import ReadmePreview from "@/components/ReadmePreview";
import { parseRepoUrl } from "@/lib/github";
import { TEMPLATES } from "@/lib/templates";
import type { RepoContext } from "@/lib/types";

export default function Home() {
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

      if (!res.ok || !res.body) {
        let message = `Generation failed (${res.status})`;
        try {
          const json = await res.json();
          if (json.error) message = json.error;
        } catch {
          // non-JSON error body
        }
        throw new Error(message);
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
      setIsGenerating(false);
      abortRef.current = null;
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
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Forge a perfect README from any GitHub repository
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Readme Forge pulls real repository metadata, detects your tech stack, and uses
            Llama 3.3 on Groq to write documentation that fits your template exactly.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-5">
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
            <TemplateEditor
              templateId={templateId}
              onTemplateIdChange={handleTemplateIdChange}
              template={template}
              onTemplateChange={setTemplate}
            />
          </div>

          <div className="lg:col-span-7">
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
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/80 py-6">
        <p className="text-center text-xs text-slate-500">
          Built with Next.js 15, Tailwind CSS, and Groq&apos;s Llama 3.3 70B.
        </p>
      </footer>
    </div>
  );
}