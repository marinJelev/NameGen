import React, { useState } from 'react';
import {
  Box, Stack, Text, Button, Inline,
  ModalDialog, ModalHeader, ModalTitle, ModalBody, ModalFooter,
  xcss
} from '@forge/react';

const skippedBoxStyle = xcss({
  borderWidth: 'border.width',
  borderStyle: 'solid',
  borderColor: 'color.border',
  borderRadius: 'border.radius.200',
  backgroundColor: 'elevation.surface',
  padding: 'space.200',
  textAlign: 'center',
});

interface SkipButtonProps {
  onSkip: () => void;
}

export function SkipButton({ onSkip }: SkipButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button appearance="subtle" spacing="compact" onClick={() => setShowModal(true)}>
        Not applicable
      </Button>

      {showModal && (
        <ModalDialog onClose={() => setShowModal(false)} width="small">
          <ModalHeader>
            <ModalTitle>Mark as not applicable?</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <Text>
              Mark this Story as having no analytics events to track.
              No Jira comment will be posted.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button appearance="subtle" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              appearance="primary"
              onClick={() => { setShowModal(false); onSkip(); }}
            >
              Mark as not applicable
            </Button>
          </ModalFooter>
        </ModalDialog>
      )}
    </>
  );
}

interface SkippedStateProps {
  onUndo: () => void;
}

export function SkippedState({ onUndo }: SkippedStateProps) {
  return (
    <Box xcss={skippedBoxStyle}>
      <Stack space="space.100" alignItems="center">
        <Text color="color.text.subtle">
          Marked as not applicable — no analytics events for this Story.
        </Text>
        <Button appearance="subtle" spacing="compact" onClick={onUndo}>
          Undo
        </Button>
      </Stack>
    </Box>
  );
}
