// Shared frontend types — mirrors src/types/index.ts but for UI Kit 2

export type DuplicateStatus = 'UNIQUE' | 'DUPLICATE' | 'SIMILAR' | 'CHECKING';
export type EventOrigin     = 'AI-generated' | 'Edited' | 'Custom';
export type FormatError =
  | 'MISSING_COLON'
  | 'INVALID_SNAKE_CASE'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'INVALID_CHARACTERS'
  | 'MISSING_ACTION_TOKEN'
  | null;

export interface Candidate {
  name: string;
  status: DuplicateStatus;
  matchedEvent?: string;
  origin: EventOrigin;
  formatError?: FormatError;
}

export interface ActionGroupWithStatus {
  label: string;
  candidates: Candidate[];
  confirmed?: Candidate;
}

export interface ConfirmedEvent {
  eventName: string;
  actionLabel: string;
  origin: EventOrigin;
  confirmedBy: string;
  date: string;
  commentId: string;
}

export interface CategorySuggestion {
  name: string;
  domain: string;
  description: string;
}

export interface ScanResult {
  actions: ActionGroupWithStatus[];
  confirmed: ConfirmedEvent[];
  error?: string;
}

// Panel view states
export type PanelPhase =
  | 'scanning'
  | 'results'
  | 'empty'
  | 'skipped'
  | 'error';

// Skip granularity
export type SkipLevel = 'candidate' | 'group';

export interface SkipLogEntry {
  level: SkipLevel;
  issueKey: string;
  actionLabel: string;
  candidateName?: string; // only for candidate-level skips
}
