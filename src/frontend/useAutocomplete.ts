import { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import type { CategorySuggestion } from './types';

export interface AutocompleteState {
  suggestions: CategorySuggestion[];
  open: boolean;
  unknownCategory: boolean;
  nearestCategory: string | null;
}

export function useAutocomplete(inputValue: string): {
  autocomplete: AutocompleteState;
  selectSuggestion: (categoryName: string, onChange: (v: string) => void) => void;
  dismiss: () => void;
} {
  const [autocomplete, setAutocomplete] = useState<AutocompleteState>({
    suggestions: [],
    open: false,
    unknownCategory: false,
    nearestCategory: null,
  });

  useEffect(() => {
    const colonIdx = inputValue.indexOf(':');

    if (colonIdx !== -1) {
      // Colon already typed — check if category is canonical
      const typedCategory = inputValue.slice(0, colonIdx);
      invoke<{ suggestions: CategorySuggestion[]; unknownCategory: boolean; nearestCategory: string | null }>(
        'getAutocompleteSuggestions',
        { prefix: typedCategory }
      ).then(r => {
        setAutocomplete({ suggestions: [], open: false, unknownCategory: r.unknownCategory, nearestCategory: r.nearestCategory });
      }).catch(() => {});
      return;
    }

    if (!inputValue) {
      setAutocomplete({ suggestions: [], open: false, unknownCategory: false, nearestCategory: null });
      return;
    }

    invoke<{ suggestions: CategorySuggestion[]; unknownCategory: boolean; nearestCategory: string | null }>(
      'getAutocompleteSuggestions',
      { prefix: inputValue }
    ).then(r => {
      setAutocomplete({
        suggestions: r.suggestions,
        open: r.suggestions.length > 0,
        unknownCategory: false,
        nearestCategory: null,
      });
    }).catch(() => {});
  }, [inputValue]);

  function selectSuggestion(categoryName: string, onChange: (v: string) => void) {
    const newVal = categoryName + ':';
    onChange(newVal);
    setAutocomplete(s => ({ ...s, open: false }));
  }

  function dismiss() {
    setAutocomplete(s => ({ ...s, open: false }));
  }

  return { autocomplete, selectSuggestion, dismiss };
}
