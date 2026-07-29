import React from "react";
import { MessageSquareText } from "lucide-react";

interface EditableScriptProps {
  script: string;
  onChange: (script: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function EditableScript({ script, onChange, error, disabled = false }: EditableScriptProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#111827] dark:text-zinc-100">
        <MessageSquareText className="h-3.5 w-3.5" />
        Agent Script <span className="text-red-500">*</span>
      </label>
      
      <div className={`relative rounded-xl border bg-white p-1 transition-shadow dark:bg-zinc-900 ${error ? 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]' : 'border-zinc-200 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500/20 dark:border-zinc-700'}`}>
        <textarea
          value={script}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Hello {{customer_name}}, this is CallingGen AI..."
          className="w-full resize-y min-h-[150px] max-h-[400px] bg-transparent px-3 py-2.5 text-sm leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed dark:text-zinc-100 dark:placeholder:text-zinc-500 overflow-y-auto custom-scrollbar"
        />
        <div className="flex justify-end px-2 py-1">
          <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
            {script.length} characters
          </span>
        </div>
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
