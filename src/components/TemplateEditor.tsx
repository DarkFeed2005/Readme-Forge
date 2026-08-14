import { FileCode2, RotateCcw, LayoutTemplate } from "lucide-react";
import { TEMPLATES, getTemplateById } from "@/lib/templates";

interface TemplateEditorProps {
  templateId: string;
  onTemplateIdChange: (id: string) => void;
  template: string;
  onTemplateChange: (value: string) => void;
}

export default function TemplateEditor({
  templateId,
  onTemplateIdChange,
  template,
  onTemplateChange,
}: TemplateEditorProps) {
  const selected = getTemplateById(templateId);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-xl shadow-black/20">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-bold text-indigo-400">
          3
        </span>
        <h2 className="text-sm font-semibold text-white">README Template</h2>
      </div>

      <label htmlFor="template-select" className="mb-1.5 block text-xs font-medium text-slate-400">
        Template style
      </label>
      <div className="relative">
        <LayoutTemplate className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <select
          id="template-select"
          value={templateId}
          onChange={(e) => onTemplateIdChange(e.target.value)}
          className="input-base appearance-none pl-9 pr-8"
        >
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-1.5 text-[11px] text-slate-500">{selected.description}</p>

      <label htmlFor="template-editor" className="mb-1.5 mt-4 block text-xs font-medium text-slate-400">
        Template source
      </label>
      <textarea
        id="template-editor"
        value={template}
        onChange={(e) => onTemplateChange(e.target.value)}
        rows={16}
        spellCheck={false}
        className="input-base min-h-72 resize-y font-mono text-xs leading-relaxed"
        placeholder="Paste or edit your custom README template here…"
      />

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onTemplateChange(selected.content)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-700 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to default
        </button>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <FileCode2 className="h-3.5 w-3.5" />
          {template.length} chars
        </span>
      </div>
    </section>
  );
}