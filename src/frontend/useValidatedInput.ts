import { useState, useEffect, useRef } from 'react';
import { invoke } from '@forge/bridge';
import type { DuplicateStatus, FormatError } from './types';

const DEBOUNCE_MS = 400;

export interface ValidationState {
  formatError: FormatError;
  formatMessage: string | null;
  dupStatus: DuplicateStatus;
  matchedEvent: string | undefined;
  isValidating: boolean;
}

export function useValidatedInput(initialValue = ''): {
  value: string;
  setValue: (v: string) => void;
  validation: ValidationState;
  reset: () => void;
} {
  const [value, setValue] = useState(initialValue);
  const [validation, setValidation] = useState<ValidationState>({
    formatError: null,
    formatMessage: null,
    dupStatus: 'CHECKING',
    matchedEvent: undefined,
    isValidating: false,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!value) {
      setValidation({ formatError: null, formatMessage: null, dupStatus: 'CHECKING', matchedEvent: undefined, isValidating: false });
      return;
    }

    setValidation(v => ({ ...v, isValidating: true, dupStatus: 'CHECKING' }));

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      // Step 1: format check
      const fmtResult = await invoke<{ valid: boolean; error: FormatError; message: string | null }>('validateName', { name: value });

      if (fmtResult.error) {
        setValidation({
          formatError: fmtResult.error,
          formatMessage: fmtResult.message,
          dupStatus: 'CHECKING',
          matchedEvent: undefined,
          isValidating: false,
        });
        return;
      }

      // Step 2: duplicate check (only if format passes)
      try {
        const dupResult = await invoke<{ status: DuplicateStatus; matchedEvent?: string }>('checkDuplicate', { name: value });
        setValidation({
          formatError: null,
          formatMessage: null,
          dupStatus: dupResult.status,
          matchedEvent: dupResult.matchedEvent,
          isValidating: false,
        });
      } catch {
        // PostHog unavailable — show warning but don't block
        setValidation({
          formatError: null,
          formatMessage: null,
          dupStatus: 'UNIQUE',
          matchedEvent: undefined,
          isValidating: false,
        });
      }
    }, DEBOUNCE_MS);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value]);

  function reset() {
    setValue('');
    setValidation({ formatError: null, formatMessage: null, dupStatus: 'CHECKING', matchedEvent: undefined, isValidating: false });
  }

  return { value, setValue, validation, reset };
}
