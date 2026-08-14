import Link from "next/link";
import { Github, Hammer } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 transition group-hover:shadow-indigo-500/40">
            <Hammer className="h-5 w-5 text-white" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-white">
              Readme <span className="text-indigo-400">Forge</span>
            </span>
            <span className="text-[11px] text-slate-400">AI-powered README generator</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-400 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Llama 3.3 70B · Groq
          </span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 transition hover:border-slate-700 hover:text-white"
            aria-label="GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
      </div>
    </header>
  );
}