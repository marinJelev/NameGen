import React, { useState } from 'react';
import {
  Box, Stack, Inline, Text, Button, Lozenge, xcss
} from '@forge/react';
import { invoke }             from '@forge/bridge';
import { CandidateRow }       from './CandidateRow';
import { ValidatedNameInput } from './ValidatedNameInput';
import { ConfirmModal }        from './ConfirmModal';
import { OriginBadge }         from './StatusBadge';
import type { ActionGroupWithStatus, Candidate, EventOrigin } from './types';

// ── Styles ─────────────────────────────────────────────────────────────────
const groupStyle = xcss({
  borderWidth: 'border.width',
  borderStyle: 'solid',
  borderColor: 'color.border',
  borderRadius: 'border.radius.200',
  backgroundColor: 'elevation.surface',
});
const groupSkippedStyle = xcss({
  borderWidth: 'border.width',
  borderStyle: 'solid',
  borderColor: 'color.border.subtle',
  borderRadius: 'border.radius.200',
  backgroundColor: 'color.background.neutral.subtle',
  opacity: '0.65',
});
const headerStyle = xcss({
  padding: 'space.150',
  cursor: 'pointer',
  ':hover': { backgroundColor: 'color.background.neutral.hovered' },
});
const bodyStyle = xcss({ padding: 'space.100' });
const dividerStyle = xcss({
  borderTopWidth: 'border.width',
  borderTopStyle: 'solid',
  borderTopColor: 'color.border.subtle',
  marginTop: 'space.100',
  paddingTop: 'space.100',
});
const confirmedRowStyle = xcss({
  padding: 'space.100 space.150',
  fontFamily: 'font.family.code',
  fontSize: '13px',
  color: 'color.text.success',
});
const skippedGroupBodyStyle = xcss({
  padding: 'space.075 space.150 space.100',
});

// ── Props ──────────────────────────────────────────────────────────────────
interface ActionGroupProps {
  group: ActionGroupWithStatus;
  groupIndex: number;
  issueKey: string;
  onConfirmed: (groupIndex: number, candidate: Candidate) => void;
  onGroupSkipped: (groupIndex: number) => void;
  onGroupUnskipped: (groupIndex: number) => void;
}

// ── Component ──────────────────────────────────────────────────────────────
export function ActionGroup({
  group, groupIndex, issueKey,
  onConfirmed, onGroupSkipped, onGroupUnskipped,
}: ActionGroupProps) {
  const [open,          setOpen]          = useState(true);
  const [candidates,    setCandidates]    = useState<Candidate[]>(group.candidates);
  const [skippedCandidates, setSkippedCandidates] = useState<Set<number>>(new Set());
  const [groupSkipped,  setGroupSkipped]  = useState(false);
  const [selected,      setSelected]      = useState<number | undefined>();
  const [confirming,    setConfirming]    = useState<Candidate | null>(null);
  const [showCustom,    setShowCustom]    = useState(false);
  const [regenerating,  setRegenerating]  = useState(false);

  const isDone = !!group.confirmed;

  // ── Candidate-level skip ────────────────────────────────────────────────
  function skipCandidate(ci: number) {
    setSkippedCandidates(prev => new Set([...prev, ci]));
    if (selected === ci) setSelected(undefined);
    // Log to backend (fire-and-forget)
    invoke('logCandidateSkip', {
      issueKey,
      actionLabel: group.label,
      candidateName: candidates[ci].name,
    }).catch(() => {});
  }

  function unskipCandidate(ci: number) {
    setSkippedCandidates(prev => { const n = new Set(prev); n.delete(ci); return n; });
  }

  // ── Group-level skip ────────────────────────────────────────────────────
  function skipGroup() {
    setGroupSkipped(true);
    setSelected(undefined);
    invoke('logGroupSkip', { issueKey, actionLabel: group.label }).catch(() => {});
    onGroupSkipped(groupIndex);
  }

  function unskipGroup() {
    setGroupSkipped(false);
    onGroupUnskipped(groupIndex);
  }

  // ── Regen ───────────────────────────────────────────────────────────────
  async function handleRegen() {
    setRegenerating(true);
    try {
      const result = await invoke<{ candidates?: Candidate[]; error?: string }>(
        'regenerateCandidates',
        { issueKey, actionLabel: group.label, previousCandidates: candidates.map(c => c.name) }
      );
      if (result.candidates) {
        setCandidates(result.candidates);
        setSelected(undefined);
        setSkippedCandidates(new Set()); // reset candidate skips on regen
      }
    } finally {
      setRegenerating(false);
    }
  }

  function handleCandidateEdit(ci: number, updated: Candidate) {
    const next = [...candidates];
    next[ci] = updated;
    setCandidates(next);
    setSelected(ci);
  }

  function handleCustomConfirm(name: string, origin: EventOrigin) {
    setConfirming({ name, origin, status: 'UNIQUE' });
    setShowCustom(false);
  }

  function handleModalConfirm(candidate: Candidate) {
    setConfirming(null);
    onConfirmed(groupIndex, candidate);
  }

  const selCandidate = selected !== undefined ? candidates[selected] : undefined;
  const activeCount  = candidates.filter((_, i) => !skippedCandidates.has(i)).length;

  // ── DONE state ──────────────────────────────────────────────────────────
  if (isDone) {
    return (
      <Box xcss={groupStyle}>
        <Box xcss={headerStyle} onClick={() => setOpen(o => !o)}>
          <Inline space="space.100" alignBlock="center" spread="space-between">
            <Inline space="space.075" alignBlock="center">
              <Text color="color.text.success">✓</Text>
              <Text size="small" color="color.text.subtle" weight="medium">{group.label}</Text>
            </Inline>
            <Lozenge appearance="success">DONE</Lozenge>
          </Inline>
        </Box>
        {open && group.confirmed && (
          <Box xcss={confirmedRowStyle}>
            <Inline space="space.075" alignBlock="center">
              <Text>{group.confirmed.name}</Text>
              <OriginBadge origin={group.confirmed.origin} />
            </Inline>
          </Box>
        )}
      </Box>
    );
  }

  // ── GROUP SKIPPED state ─────────────────────────────────────────────────
  if (groupSkipped) {
    return (
      <Box xcss={groupSkippedStyle}>
        <Box xcss={headerStyle} onClick={() => setOpen(o => !o)}>
          <Inline space="space.075" alignBlock="center" spread="space-between">
            <Inline space="space.075" alignBlock="center">
              <Text color="color.text.subtlest">—</Text>
              <Text size="small" color="color.text.subtle" weight="medium"
                style={{ textDecoration: 'line-through' }}>
                {group.label}
              </Text>
            </Inline>
            <Inline space="space.075" alignBlock="center">
              <Lozenge appearance="default">SKIPPED</Lozenge>
              <Button appearance="subtle" spacing="compact" onClick={(e: React.MouseEvent) => {
                e.stopPropagation(); unskipGroup();
              }}>
                Undo
              </Button>
            </Inline>
          </Inline>
        </Box>
        {open && (
          <Box xcss={skippedGroupBodyStyle}>
            <Text size="small" color="color.text.subtlest">
              This action group was skipped. Click Undo to restore it.
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  // ── ACTIVE state ────────────────────────────────────────────────────────
  return (
    <>
      <Box xcss={groupStyle}>
        {/* Header */}
        <Box xcss={headerStyle} onClick={() => setOpen(o => !o)}>
          <Inline space="space.075" alignBlock="center" spread="space-between">
            <Inline space="space.075" alignBlock="center">
              <Text color="color.text.brand">◆</Text>
              <Text size="small" weight="medium">{group.label}</Text>
              {skippedCandidates.size > 0 && (
                <Text size="small" color="color.text.subtlest">
                  ({activeCount} of {candidates.length} active)
                </Text>
              )}
            </Inline>
            <Inline space="space.075" alignBlock="center">
              {/* Group-level skip button */}
              <Button
                appearance="subtle"
                spacing="compact"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); skipGroup(); }}
              >
                Skip action
              </Button>
              <Text size="small" color="color.text.subtlest">{open ? '▲' : '▼'}</Text>
            </Inline>
          </Inline>
        </Box>

        {/* Body */}
        {open && (
          <Box xcss={bodyStyle}>
            <Stack space="space.050">

              {/* Candidate rows */}
              {candidates.map((c, ci) => (
                <CandidateRow
                  key={`${c.name}-${ci}`}
                  candidate={c}
                  isSelected={selected === ci}
                  isSkipped={skippedCandidates.has(ci)}
                  onSelect={() => {
                    if (!skippedCandidates.has(ci))
                      setSelected(selected === ci ? undefined : ci);
                  }}
                  onEdit={(updated) => handleCandidateEdit(ci, updated)}
                  onSkip={() => skipCandidate(ci)}
                  onUnskip={() => unskipCandidate(ci)}
                />
              ))}

              {/* Regen + Confirm strip */}
              <Inline space="space.075" alignBlock="center">
                <Button
                  appearance="subtle"
                  spacing="compact"
                  isLoading={regenerating}
                  onClick={handleRegen}
                >
                  ↺ Regenerate
                </Button>
                {selCandidate && !skippedCandidates.has(selected!) && (
                  <Button
                    appearance="primary"
                    spacing="compact"
                    onClick={() => setConfirming(selCandidate)}
                  >
                    Confirm '{selCandidate.name}'
                  </Button>
                )}
              </Inline>

              {/* Custom event */}
              <Box xcss={dividerStyle}>
                {!showCustom ? (
                  <Button appearance="subtle" spacing="compact" onClick={() => setShowCustom(true)}>
                    + Add custom event
                  </Button>
                ) : (
                  <Stack space="space.075">
                    <Text size="small" color="color.text.subtlest">Custom event name</Text>
                    <ValidatedNameInput
                      origin="Custom"
                      confirmLabel="Add custom event"
                      onConfirm={handleCustomConfirm}
                      onCancel={() => setShowCustom(false)}
                    />
                  </Stack>
                )}
              </Box>

            </Stack>
          </Box>
        )}
      </Box>

      {/* Confirm modal */}
      {confirming && (
        <ConfirmModal
          candidate={confirming}
          actionLabel={group.label}
          onConfirm={handleModalConfirm}
          onClose={() => setConfirming(null)}
        />
      )}
    </>
  );
}
