import React, { useState } from 'react';
import {
  ModalDialog, ModalHeader, ModalTitle, ModalBody, ModalFooter,
  Button, Box, Text, Inline, Stack, Checkbox, xcss
} from '@forge/react';
import type { Candidate } from './types';

const codeBoxStyle = xcss({
  backgroundColor: 'color.background.neutral',
  borderRadius: 'border.radius',
  padding: 'space.100',
  fontFamily: 'font.family.code',
  fontSize: '13px',
});
const dupWarningStyle = xcss({
  backgroundColor: 'color.background.danger',
  borderRadius: 'border.radius',
  padding: 'space.100',
  color: 'color.text.danger',
});

interface ConfirmModalProps {
  candidate: Candidate;
  actionLabel: string;
  onConfirm: (candidate: Candidate) => void;
  onClose: () => void;
}

export function ConfirmModal({ candidate, actionLabel, onConfirm, onClose }: ConfirmModalProps) {
  const [dupAcknowledged, setDupAcknowledged] = useState(false);
  const isDuplicate = candidate.status === 'DUPLICATE';
  const canConfirm  = !isDuplicate || dupAcknowledged;

  return (
    <ModalDialog onClose={onClose} width="medium">
      <ModalHeader>
        <ModalTitle>Confirm event name</ModalTitle>
      </ModalHeader>

      <ModalBody>
        <Stack space="space.150">
          <Box xcss={codeBoxStyle}>
            <Text>{candidate.name}</Text>
          </Box>

          <Stack space="space.050">
            <Inline space="space.100">
              <Text size="small" color="color.text.subtlest">Action:</Text>
              <Text size="small">{actionLabel}</Text>
            </Inline>
            <Inline space="space.100">
              <Text size="small" color="color.text.subtlest">Origin:</Text>
              <Text size="small">{candidate.origin}</Text>
            </Inline>
          </Stack>

          {isDuplicate && (
            <Stack space="space.100">
              <Box xcss={dupWarningStyle}>
                <Text size="small">
                  This name already exists in PostHog as '{candidate.matchedEvent}'.
                  Confirming will create a duplicate event.
                </Text>
              </Box>
              <Checkbox
                label="I understand this is a duplicate and want to proceed"
                isChecked={dupAcknowledged}
                onChange={() => setDupAcknowledged(v => !v)}
              />
            </Stack>
          )}
        </Stack>
      </ModalBody>

      <ModalFooter>
        <Button appearance="subtle" onClick={onClose}>Cancel</Button>
        <Button
          appearance="primary"
          isDisabled={!canConfirm}
          onClick={() => onConfirm(candidate)}
        >
          Confirm
        </Button>
      </ModalFooter>
    </ModalDialog>
  );
}
