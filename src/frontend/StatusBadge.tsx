import React from 'react';
import { Badge, Inline, Text } from '@forge/react';
import type { DuplicateStatus, EventOrigin } from './types';

interface DupBadgeProps {
  status: DuplicateStatus;
  matchedEvent?: string;
}

export function DupBadge({ status, matchedEvent }: DupBadgeProps) {
  const appearances: Record<DuplicateStatus, 'added' | 'moved' | 'removed' | 'default'> = {
    UNIQUE:    'added',
    SIMILAR:   'moved',
    DUPLICATE: 'removed',
    CHECKING:  'default',
  };

  const labels: Record<DuplicateStatus, string> = {
    UNIQUE:    'UNIQUE',
    SIMILAR:   'SIMILAR',
    DUPLICATE: 'DUPLICATE',
    CHECKING:  'CHECKING…',
  };

  return (
    <Inline space="space.050" alignBlock="center">
      <Badge appearance={appearances[status]}>{labels[status]}</Badge>
      {(status === 'SIMILAR' || status === 'DUPLICATE') && matchedEvent && (
        <Text size="small" color="color.text.subtlest">· {matchedEvent}</Text>
      )}
    </Inline>
  );
}

interface OriginBadgeProps {
  origin: EventOrigin;
}

export function OriginBadge({ origin }: OriginBadgeProps) {
  if (origin === 'AI-generated') return null;

  const appearances: Partial<Record<EventOrigin, 'added' | 'moved' | 'removed' | 'default'>> = {
    'Edited': 'moved',
    'Custom': 'added',
  };

  return (
    <Badge appearance={appearances[origin] ?? 'default'}>{origin}</Badge>
  );
}
