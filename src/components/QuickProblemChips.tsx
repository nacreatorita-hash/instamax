import React from 'react';
import { quickProblemSuggestions } from '../lib/smart-request';

export const QuickProblemChips = ({ onPick }: { onPick: (text: string) => void }) => (
  <div className="flex flex-wrap gap-2">
    {quickProblemSuggestions.map(suggestion => (
      <button
        key={suggestion}
        type="button"
        onClick={() => onPick(suggestion)}
        className="rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
      >
        {suggestion}
      </button>
    ))}
  </div>
);
