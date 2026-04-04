export interface JiraIssue {
  key: string;
  summary: string;
  description: string | null;
  issueType: string;
  labels: string[];
  components: string[];
}

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

export interface ActionGroup {
  label: string;
  candidates: string[];
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
}

export interface LogEntry {
  type: 'confirm' | 'skip' | 'regeneration' | 'skip_candidate' | 'skip_group';
  issueKey: string;
  userId: string;
  timestamp: string;
  eventName?: string;
  origin?: EventOrigin;
  actionLabel?: string;
  candidateName?: string;
}
