import React from "react";
import { X } from "lucide-react";

interface DetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function DetailsDrawer({ isOpen, onClose, title, children }: DetailsDrawerProps) {
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity duration-300 dark:bg-black/60 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={`relative z-10 w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl transition-all duration-300 ease-in-out dark:border dark:border-zinc-800 dark:bg-[#0B0F19] ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          {children}
        </div>
      </div>
    </div>
  );
}
