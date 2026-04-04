import React, { useState } from 'react';
import {
  Box, Stack, Text, Button, xcss
} from '@forge/react';
import { ValidatedNameInput } from './ValidatedNameInput';
import { ConfirmModal }        from './ConfirmModal';
import type { Candidate, EventOrigin } from './types';

const sectionStyle = xcss({
  borderWidth: 'border.width',
  borderStyle: 'solid',
  borderColor: 'color.border',
  borderRadius: 'border.radius.200',
  backgroundColor: 'elevation.surface',
  padding: 'space.150',
});

interface CustomEventInputProps {
  issueKey: string;
  onConfirmed: (candidate: Candidate) => void;
}

export function CustomEventInput({ issueKey, onConfirmed }: CustomEventInputProps) {
  const [open, setOpen]         = useState(false);
  const [confirming, setConfirming] = useState<Candidate | null>(null);

  function handleConfirm(name: string, origin: EventOrigin) {
    setConfirming({ name, origin, status: 'UNIQUE' });
  }

  function handleModalConfirm(candidate: Candidate) {
    setConfirming(null);
    setOpen(false);
    onConfirmed(candidate);
  }

  return (
    <>
      <Box xcss={sectionStyle}>
        {!open ? (
          <Button appearance="subtle" onClick={() => setOpen(true)}>
            + Add new event outside action groups
          </Button>
        ) : (
          <Stack space="space.100">
            <Text size="small" color="color.text.subtle" weight="medium">
              New custom event
            </Text>
            <ValidatedNameInput
              origin="Custom"
              confirmLabel="Add event"
              onConfirm={handleConfirm}
              onCancel={() => setOpen(false)}
            />
          </Stack>
        )}
      </Box>

      {confirming && (
        <ConfirmModal
          candidate={confirming}
          actionLabel="Custom event (no action group)"
          onConfirm={handleModalConfirm}
          onClose={() => setConfirming(null)}
        />
      )}
    </>
  );
}
