import React, { useState } from 'react';
import {
  Box, Inline, Text, Button, xcss
} from '@forge/react';
import { DupBadge, OriginBadge } from './StatusBadge';
import { ValidatedNameInput }    from './ValidatedNameInput';
import type { Candidate, EventOrigin } from './types';

const rowBase = xcss({
  padding: 'space.075',
  borderRadius: 'border.radius',
  cursor: 'pointer',
  ':hover': { backgroundColor: 'color.background.neutral.hovered' },
});
const rowSelected = xcss({
  backgroundColor: 'color.background.selected',
  ':hover': { backgroundColor: 'color.background.selected.hovered' },
});
const rowSkipped = xcss({
  opacity: '0.4',
  cursor: 'default',
  ':hover': { backgroundColor: 'transparent' },
});
const codeStyle = xcss({
  fontFamily: 'font.family.code',
  fontSize: '12px',
  flex: '1',
  wordBreak: 'break-all',
  textDecoration: 'line-through',
});
const codeActiveStyle = xcss({
  fontFamily: 'font.family.code',
  fontSize: '12px',
  flex: '1',
  wordBreak: 'break-all',
});

interface CandidateRowProps {
  candidate: Candidate;
  isSelected: boolean;
  isSkipped: boolean;
  onSelect: () => void;
  onEdit: (updated: Candidate) => void;
  onSkip: () => void;
  onUnskip: () => void;
}

export function CandidateRow({
  candidate, isSelected, isSkipped,
  onSelect, onEdit, onSkip, onUnskip,
}: CandidateRowProps) {
  const [editing, setEditing] = useState(false);

  function handleEditConfirm(name: string, origin: EventOrigin) {
    onEdit({ ...candidate, name, origin, status: 'CHECKING', matchedEvent: undefined });
    setEditing(false);
  }

  // ── Editing state ──────────────────────────────────────────────────────
  if (editing) {
    return (
      <Box xcss={xcss({ padding: 'space.075' })}>
        <ValidatedNameInput
          initialValue={candidate.name}
          origin="Edited"
          confirmLabel="Apply edit"
          onConfirm={handleEditConfirm}
          onCancel={() => setEditing(false)}
        />
      </Box>
    );
  }

  // ── Skipped state ──────────────────────────────────────────────────────
  if (isSkipped) {
    return (
      <Box xcss={[rowBase, rowSkipped]}>
        <Inline space="space.075" alignBlock="center" spread="space-between">
          <Inline space="space.075" alignBlock="center" grow="fill">
            <Text color="color.text.subtlest">—</Text>
            <Text xcss={codeStyle} color="color.text.subtlest">{candidate.name}</Text>
            <Text size="small" color="color.text.subtlest">Skipped</Text>
          </Inline>
          <Button
            appearance="subtle"
            spacing="compact"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onUnskip(); }}
          >
            Undo
          </Button>
        </Inline>
      </Box>
    );
  }

  // ── Normal state ───────────────────────────────────────────────────────
  return (
    <Box xcss={[rowBase, isSelected ? rowSelected : undefined]} onClick={onSelect}>
      <Inline space="space.075" alignBlock="center" spread="space-between">
        <Inline space="space.075" alignBlock="center" grow="fill">
          <Text color={isSelected ? 'color.text.selected' : 'color.text.subtlest'}>
            {isSelected ? '●' : '○'}
          </Text>
          <Text xcss={codeActiveStyle}>{candidate.name}</Text>
          <OriginBadge origin={candidate.origin} />
          <DupBadge status={candidate.status} matchedEvent={candidate.matchedEvent} />
        </Inline>

        <Inline space="space.050">
          <Button
            appearance="subtle"
            spacing="compact"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditing(true); }}
          >
            Edit
          </Button>
          <Button
            appearance="subtle"
            spacing="compact"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onSkip(); }}
          >
            Skip
          </Button>
        </Inline>
      </Inline>
    </Box>
  );
}
