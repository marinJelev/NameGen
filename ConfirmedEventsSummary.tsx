import React from 'react';
import {
  Box, Stack, Inline, Text, xcss
} from '@forge/react';
import type { ConfirmedEvent } from './types';

const panelStyle = xcss({
  borderWidth: 'border.width',
  borderStyle: 'solid',
  borderColor: 'color.border',
  borderRadius: 'border.radius.200',
  backgroundColor: 'elevation.surface',
  marginTop: 'space.150',
});
const headerStyle = xcss({
  padding: 'space.100 space.150',
  borderBottomWidth: 'border.width',
  borderBottomStyle: 'solid',
  borderBottomColor: 'color.border.subtle',
});
const bodyStyle = xcss({ padding: 'space.100 space.150' });
const itemStyle = xcss({
  paddingTop: 'space.075',
  paddingBottom: 'space.075',
  borderBottomWidth: 'border.width',
  borderBottomStyle: 'solid',
  borderBottomColor: 'color.border.subtle',
  ':last-child': { borderBottomWidth: '0' },
});
const codeStyle = xcss({ fontFamily: 'font.family.code', fontSize: '12px', fontWeight: 'font.weight.semibold' });
const countStyle = xcss({
  backgroundColor: 'color.background.neutral',
  borderRadius: 'border.radius',
  padding: 'space.025 space.075',
  fontSize: '11px',
  fontWeight: 'font.weight.semibold',
});

interface ConfirmedEventsSummaryProps {
  events: ConfirmedEvent[];
}

export function ConfirmedEventsSummary({ events }: ConfirmedEventsSummaryProps) {
  return (
    <Box xcss={panelStyle}>
      <Box xcss={headerStyle}>
        <Inline space="space.075" alignBlock="center" spread="space-between">
          <Text size="small" weight="medium" color="color.text.subtle">Confirmed events</Text>
          <Text xcss={countStyle}>{events.length}</Text>
        </Inline>
      </Box>

      <Box xcss={bodyStyle}>
        {events.length === 0 ? (
          <Text size="small" color="color.text.subtlest">No events confirmed yet on this Story.</Text>
        ) : (
          <Stack space="space.0">
            {events.map((ev, i) => (
              <Box key={`${ev.eventName}-${i}`} xcss={itemStyle}>
                <Stack space="space.025">
                  <Text xcss={codeStyle}>{ev.eventName}</Text>
                  <Text size="small" color="color.text.subtlest">
                    {ev.actionLabel} · {ev.origin} · {ev.date}
                  </Text>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
