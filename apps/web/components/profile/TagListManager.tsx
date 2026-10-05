"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";

interface TagListManagerProps {
  label: string;
  description?: string;
  helperText?: string;
  items?: string[];
  tags?: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  badgeVariant?: "default" | "accent" | "emerald" | "amber" | "rose" | "neutral";
  maxCharLength?: number;
}

export function TagListManager({
  label,
  description,
  helperText,
  items,
  tags,
  onChange,
  placeholder = "Add an item and press Enter...",
  maxItems = 15,
  badgeVariant = "default",
  maxCharLength = 100,
}: TagListManagerProps) {
  const currentItems = tags ?? items ?? [];
  const currentDesc = helperText ?? description;
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    setError(null);
    const trimmed = inputValue.trim();

    if (!trimmed) return;

    if (trimmed.length > maxCharLength) {
      setError(`Item cannot exceed ${maxCharLength} characters.`);
      return;
    }

    if (currentItems.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setError("Item already added.");
      return;
    }

    if (currentItems.length >= maxItems) {
      setError(`Maximum of ${maxItems} items reached.`);
      return;
    }

    onChange([...currentItems, trimmed]);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(currentItems.filter((_, idx) => idx !== indexToRemove));
    setError(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label}
        </label>
        <span className="text-[10px] text-slate-500 font-mono">
          {currentItems.length}/{maxItems}
        </span>
      </div>

      {currentDesc && (
        <p className="text-xs text-slate-400 leading-relaxed">{currentDesc}</p>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={currentItems.length >= maxItems}
          aria-label={label}
          className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-900/60 border border-cine-border text-white placeholder-slate-500 focus:outline-none focus:border-cine-accent focus:ring-1 focus:ring-cine-accent transition-colors disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim() || currentItems.length >= maxItems}
          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
          aria-label={`Add ${label}`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {error && (
        <p className="text-[11px] text-rose-400 font-medium">{error}</p>
      )}

      {/* Tag Chips List */}
      <div
        className="flex flex-wrap gap-1.5 pt-1 min-h-[32px] items-center"
        role="list"
        aria-label={`${label} list`}
      >
        {currentItems.length === 0 ? (
          <span className="text-[11px] text-slate-500 italic">No entries yet.</span>
        ) : (
          currentItems.map((item, idx) => (
            <span
              key={`${item}-${idx}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 shadow-sm"
              role="listitem"
            >
              <span className="max-w-[200px] truncate">{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-slate-400 hover:text-rose-400 focus:outline-none p-0.5 rounded-full hover:bg-slate-700/60 transition-colors"
                aria-label={`Remove ${item}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
