import React, { useEffect, useState, useCallback } from 'react';
import { invoke }              from '@forge/bridge';
import { useProductContext }   from '@forge/react';
import {
  Box, Stack, Inline, Text, Button,
  SectionMessage, Spinner, Lozenge,
  xcss
} from '@forge/react';

import { ActionGroup }              from './ActionGroup';
import { ConfirmedEventsSummary }   from './ConfirmedEventsSummary';
import { CustomEventInput }         from './CustomEventInput';
import { SkipButton, SkippedState } from './SkipButton';
import type {
  ActionGroupWithStatus, Candidate,
  ConfirmedEvent, PanelPhase, ScanResult
} from './types';

const panelStyle = xcss({
  padding: 'space.150',
  maxWidth: '420px',
});
const headerStyle = xcss({
  borderBottomWidth: 'border.width',
  borderBottomStyle: 'solid',
  borderBottomColor: 'color.border.subtle',
  paddingBottom: 'space.100',
  marginBottom: 'space.150',
});
const logoStyle = xcss({
  fontWeight: 'font.weight.bold',
  color: 'color.text.brand',
  fontSize: '15px',
});

export default function App() {
  const ctx      = useProductContext();
  const issueKey = ctx?.platformContext?.issueKey ?? 'UNKNOWN';

  const [phase,     setPhase]     = useState<PanelPhase>('scanning');
  const [actions,   setActions]   = useState<ActionGroupWithStatus[]>([]);
  const [confirmed, setConfirmed] = useState<ConfirmedEvent[]>([]);
  const [skipped,   setSkipped]   = useState(false);
  const [posthogDown, setPosthogDown] = useState(false);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);

  const scan = useCallback(async () => {
    setPhase('scanning');
    setErrorMsg(null);

    const result = await invoke<ScanResult & { error?: string }>('scanAndGenerate', { issueKey });

    if (result.error === 'NOT_A_STORY') {
      // Panel should not appear on non-Story tickets — manifest filter handles this,
      // but handle gracefully just in case
      setPhase('error');
      setErrorMsg('NameGen is only available on Jira Story tickets.');
      return;
    }

    if (result.error) {
      setPhase('error');
      setErrorMsg('Scanning failed. Please try again.');
      return;
    }

    if (!result.actions || result.actions.length === 0) {
      setPhase('empty');
    } else {
      setPhase('results');
    }

    setActions(result.actions ?? []);
    setConfirmed(result.confirmed ?? []);
  }, [issueKey]);

  useEffect(() => { scan(); }, [scan]);

  function handleGroupConfirmed(groupIndex: number, candidate: Candidate) {
    // Mark the action group as confirmed
    setActions(prev => prev.map((g, i) =>
      i === groupIndex ? { ...g, confirmed: candidate } : g
    ));

    // Add to confirmed summary
    const today = new Date().toISOString().split('T')[0];
    setConfirmed(prev => [...prev, {
      eventName:   candidate.name,
      actionLabel: actions[groupIndex].label,
      origin:      candidate.origin,
      confirmedBy: ctx?.accountId ?? 'unknown',
      date:        today,
      commentId:   '',  // will be set server-side; panel reads from summary hydration on next open
    }]);
  }

  function handleCustomConfirmed(candidate: Candidate) {
    const today = new Date().toISOString().split('T')[0];
    setConfirmed(prev => [...prev, {
      eventName:   candidate.name,
      actionLabel: 'Custom event',
      origin:      candidate.origin,
      confirmedBy: ctx?.accountId ?? 'unknown',
      date:        today,
      commentId:   '',
    }]);
  }

  function handleSkip() {
    invoke('logSkip', { issueKey }).catch(() => {});
    setSkipped(true);
  }

  function handleUndoSkip() {
    setSkipped(false);
  }

  const [skippedGroups, setSkippedGroups] = useState<Set<number>>(new Set());

  function handleGroupSkipped(gi: number) {
    setSkippedGroups(prev => new Set([...prev, gi]));
  }
  function handleGroupUnskipped(gi: number) {
    setSkippedGroups(prev => { const n = new Set(prev); n.delete(gi); return n; });
  }

  const pendingCount = actions.filter((a, i) => !a.confirmed && !skippedGroups.has(i)).length;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Box xcss={panelStyle}>
      <Stack space="space.150">

        {/* Header */}
        <Box xcss={headerStyle}>
          <Inline spread="space-between" alignBlock="center">
            <Inline space="space.075" alignBlock="center">
              <Text xcss={logoStyle}>NameGen</Text>
              <Lozenge appearance="success">Story</Lozenge>
            </Inline>
            {!skipped && phase === 'results' && (
              <SkipButton onSkip={handleSkip} />
            )}
          </Inline>
        </Box>

        {/* PostHog unavailable warning */}
        {posthogDown && (
          <SectionMessage appearance="warning" title="PostHog unavailable">
            <Text>Uniqueness checking is paused. Proceed with caution.</Text>
          </SectionMessage>
        )}

        {/* ── SCANNING ── */}
        {phase === 'scanning' && (
          <Inline space="space.100" alignBlock="center">
            <Spinner size="small" />
            <Text size="small" color="color.text.subtle">
              Scanning Story for trackable events…
            </Text>
          </Inline>
        )}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <SectionMessage appearance="error" title="Error">
            <Stack space="space.100">
              <Text>{errorMsg}</Text>
              <Button appearance="primary" onClick={scan}>Try again</Button>
            </Stack>
          </SectionMessage>
        )}

        {/* ── EMPTY ── */}
        {phase === 'empty' && (
          <SectionMessage appearance="information" title="No trackable actions detected">
            <Stack space="space.100">
              <Text>
                No user-facing interactions were found in this Story.
                You can still add custom events below, or mark it as not applicable.
              </Text>
              <Inline space="space.075">
                <Button appearance="subtle" onClick={scan}>Re-scan</Button>
                <SkipButton onSkip={handleSkip} />
              </Inline>
            </Stack>
          </SectionMessage>
        )}

        {/* ── SKIPPED ── */}
        {skipped && (
          <SkippedState onUndo={handleUndoSkip} />
        )}

        {/* ── RESULTS ── */}
        {phase === 'results' && !skipped && (
          <Stack space="space.100">

            {/* Section label */}
            <Inline spread="space-between" alignBlock="center">
              <Text size="small" color="color.text.subtlest" weight="bold">
                DETECTED ACTIONS
              </Text>
              <Text size="small" color="color.text.subtlest">
                {pendingCount} pending
              </Text>
            </Inline>

            {/* Action groups */}
            {actions.map((group, gi) => (
              <ActionGroup
                key={`${group.label}-${gi}`}
                group={group}
                groupIndex={gi}
                issueKey={issueKey}
                onConfirmed={handleGroupConfirmed}
                onGroupSkipped={handleGroupSkipped}
                onGroupUnskipped={handleGroupUnskipped}
              />
            ))}

            {/* Re-scan */}
            <Button appearance="subtle" spacing="compact" onClick={scan}>
              ↺ Re-scan Story
            </Button>

          </Stack>
        )}

        {/* ── CUSTOM EVENTS (always visible when results loaded and not skipped) ── */}
        {(phase === 'results' || phase === 'empty') && !skipped && (
          <CustomEventInput
            issueKey={issueKey}
            onConfirmed={handleCustomConfirmed}
          />
        )}

        {/* ── CONFIRMED EVENTS SUMMARY (always visible) ── */}
        {phase !== 'scanning' && (
          <ConfirmedEventsSummary events={confirmed} />
        )}

      </Stack>
    </Box>
  );
}
