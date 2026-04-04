import Resolver from '@forge/resolver';
import type {
  JiraIssue, EventOrigin, ActionGroup, ActionGroupWithStatus
} from '../types';
import { runPipeline, regenerate }      from './pipeline';
import { checkAll, checkOne }           from './duplicateChecker';
import { validateFormat, FORMAT_MESSAGES } from './validator';
import { getSuggestions, isCanonical, getNearestCanonical } from './autocomplete';
import { hydrateConfirmedEvents }       from './summaryHydrator';
import { postConfirmedEvent }           from './jiraWriter';
import { logConfirm, logSkip, logRegeneration } from './instrumentationLogger';
import { api, route, storage }               from '@forge/api';

const resolver = new Resolver();

// ── Fetch Jira issue fields ────────────────────────────────────────────────
async function fetchIssue(issueKey: string): Promise<JiraIssue> {
  const res  = await api.asUser().requestJira(
    route`/rest/api/3/issue/${issueKey}?fields=summary,description,issuetype,labels,components`
  );
  const data = await res.json() as {
    key: string;
    fields: {
      summary: string;
      description: { content: { content: { text: string }[] }[] } | null;
      issuetype: { name: string };
      labels: string[];
      components: { name: string }[];
    };
  };

  // Extract plain text from ADF description
  const description = data.fields.description
    ? data.fields.description.content
        .flatMap(b => b.content ?? [])
        .map(i => i.text ?? '')
        .join(' ')
        .slice(0, 1000)
    : null;

  return {
    key:        data.key,
    summary:    data.fields.summary,
    description,
    issueType:  data.fields.issuetype.name,
    labels:     data.fields.labels,
    components: data.fields.components.map(c => c.name),
  };
}

// ── scanAndGenerate ────────────────────────────────────────────────────────
resolver.define('scanAndGenerate', async ({ payload, context }) => {
  const { issueKey } = payload as { issueKey: string };
  try {
    const issue = await fetchIssue(issueKey);

    // Story-level gate
    if (issue.issueType !== 'Story') {
      return { error: 'NOT_A_STORY', issueType: issue.issueType };
    }

    const [rawActions, confirmed] = await Promise.all([
      runPipeline(issue),
      hydrateConfirmedEvents(issueKey),
    ]);

    const actions = await checkAll(rawActions as ActionGroup[]);
    return { actions, confirmed };
  } catch (err) {
    console.error('[NameGen] scanAndGenerate error:', err);
    return { error: 'SCAN_FAILED', message: (err as Error).message };
  }
});

// ── validateName ──────────────────────────────────────────────────────────
resolver.define('validateName', async ({ payload }) => {
  const { name } = payload as { name: string };
  const error    = validateFormat(name);
  return {
    valid:   error === null,
    error,
    message: error ? FORMAT_MESSAGES[error] : null,
  };
});

// ── checkDuplicate ────────────────────────────────────────────────────────
resolver.define('checkDuplicate', async ({ payload }) => {
  const { name } = payload as { name: string };
  try {
    return await checkOne(name);
  } catch {
    return { status: 'CHECKING', error: 'POSTHOG_UNAVAILABLE' };
  }
});

// ── getAutocompleteSuggestions ────────────────────────────────────────────
resolver.define('getAutocompleteSuggestions', async ({ payload }) => {
  const { prefix } = payload as { prefix: string };
  const suggestions = getSuggestions(prefix);

  // If prefix contains colon, check if typed category is canonical
  const colonIdx       = prefix.indexOf(':');
  const typedCategory  = colonIdx !== -1 ? prefix.slice(0, colonIdx) : null;
  const unknownCategory =
    typedCategory !== null && !isCanonical(typedCategory);
  const nearestCategory =
    unknownCategory ? getNearestCanonical(typedCategory ?? '') : null;

  return { suggestions, unknownCategory, nearestCategory };
});

// ── confirmEvent ──────────────────────────────────────────────────────────
resolver.define('confirmEvent', async ({ payload, context }) => {
  const { issueKey, eventName, actionLabel, origin } =
    payload as { issueKey: string; eventName: string; actionLabel: string; origin: EventOrigin };
  const userId = context.accountId ?? 'unknown';

  try {
    await postConfirmedEvent(issueKey, eventName, actionLabel, origin, userId);
    await logConfirm(eventName, origin, issueKey, userId);
    const date = new Date().toISOString().split('T')[0];
    return { success: true, date, confirmedBy: userId };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
});

// ── logSkip ───────────────────────────────────────────────────────────────
resolver.define('logSkip', async ({ payload, context }) => {
  const { issueKey } = payload as { issueKey: string };
  const userId       = context.accountId ?? 'unknown';
  await logSkip(issueKey, userId);
  return { success: true };
});

// ── regenerateCandidates ──────────────────────────────────────────────────
resolver.define('regenerateCandidates', async ({ payload, context }) => {
  const { issueKey, actionLabel, previousCandidates } =
    payload as { issueKey: string; actionLabel: string; previousCandidates: string[] };
  const userId = context.accountId ?? 'unknown';

  try {
    const issue      = await fetchIssue(issueKey);
    const newNames   = await regenerate(issue, actionLabel, previousCandidates);
    const candidates = await Promise.all(
      newNames.map(async name => {
        const dup = await checkOne(name);
        return { name, ...dup, origin: 'AI-generated' as EventOrigin };
      })
    );
    await logRegeneration(actionLabel, issueKey, userId);
    return { candidates };
  } catch (err) {
    return { error: (err as Error).message };
  }
});

// ── logCandidateSkip ──────────────────────────────────────────────────────
resolver.define('logCandidateSkip', async ({ payload, context }) => {
  const { issueKey, actionLabel, candidateName } =
    payload as { issueKey: string; actionLabel: string; candidateName: string };
  const userId = context.accountId ?? 'unknown';
  const key    = `namegen:log:skip_candidate:${issueKey}:${Date.now()}`;
  try {
    await storage.set(key, {
      type: 'skip_candidate', issueKey, actionLabel, candidateName,
      userId, timestamp: new Date().toISOString(),
    });
  } catch { /* non-fatal */ }
  return { success: true };
});

// ── logGroupSkip ──────────────────────────────────────────────────────────
resolver.define('logGroupSkip', async ({ payload, context }) => {
  const { issueKey, actionLabel } =
    payload as { issueKey: string; actionLabel: string };
  const userId = context.accountId ?? 'unknown';
  const key    = `namegen:log:skip_group:${issueKey}:${Date.now()}`;
  try {
    await storage.set(key, {
      type: 'skip_group', issueKey, actionLabel,
      userId, timestamp: new Date().toISOString(),
    });
  } catch { /* non-fatal */ }
  return { success: true };
});
resolver.define('hydrateConfirmedEvents', async ({ payload }) => {
  const { issueKey } = payload as { issueKey: string };
  try {
    const confirmed = await hydrateConfirmedEvents(issueKey);
    return { confirmed };
  } catch {
    return { confirmed: [], error: 'HYDRATION_FAILED' };
  }
});

export const handler = resolver.getDefinitions();
