import React from 'react';
import {
  Box, Stack, Inline, Text, Textfield, Button,
  xcss
} from '@forge/react';
import { useValidatedInput } from './useValidatedInput';
import { useAutocomplete }   from './useAutocomplete';
import { DupBadge }          from './StatusBadge';
import type { Candidate, EventOrigin } from './types';

const codeStyle = xcss({ fontFamily: 'font.family.code', fontSize: '12px' });
const suggestionListStyle = xcss({
  borderWidth: 'border.width',
  borderStyle: 'solid',
  borderColor: 'color.border',
  borderRadius: 'border.radius',
  backgroundColor: 'elevation.surface.overlay',
  marginTop: 'space.050',
});
const suggestionItemStyle = xcss({
  padding: 'space.100',
  cursor: 'pointer',
  ':hover': { backgroundColor: 'color.background.neutral.hovered' },
});
const warningStyle = xcss({ color: 'color.text.warning' });
const errorStyle   = xcss({ color: 'color.text.danger' });

interface ValidatedNameInputProps {
  initialValue?: string;
  placeholder?: string;
  onConfirm: (name: string, origin: EventOrigin) => void;
  onCancel?: () => void;
  confirmLabel?: string;
  origin: EventOrigin;
  showCancel?: boolean;
}

export function ValidatedNameInput({
  initialValue = '',
  placeholder = 'category:object_action',
  onConfirm,
  onCancel,
  confirmLabel = 'Apply',
  origin,
  showCancel = true,
}: ValidatedNameInputProps) {
  const { value, setValue, validation, reset } = useValidatedInput(initialValue);
  const { autocomplete, selectSuggestion, dismiss } = useAutocomplete(value);

  const canConfirm =
    value.length > 0 &&
    !validation.formatError &&
    !validation.isValidating &&
    validation.dupStatus !== 'CHECKING';

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm(value, origin);
    reset();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && canConfirm) handleConfirm();
    if (e.key === 'Escape') { dismiss(); onCancel?.(); }
  }

  return (
    <Stack space="space.075">
      {/* Input + autocomplete */}
      <Box>
        <Textfield
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          isInvalid={!!validation.formatError}
          autoFocus
        />

        {/* Autocomplete dropdown */}
        {autocomplete.open && (
          <Box xcss={suggestionListStyle}>
            {autocomplete.suggestions.map(s => (
              <Box
                key={s.name}
                xcss={suggestionItemStyle}
                onClick={() => selectSuggestion(s.name, setValue)}
              >
                <Inline space="space.100" alignBlock="center" spread="space-between">
                  <Inline space="space.075" alignBlock="center">
                    <Text xcss={codeStyle}>{s.name}</Text>
                    <Text size="small" color="color.text.subtlest">{s.domain}</Text>
                  </Inline>
                  <Text size="small" color="color.text.subtlest">{s.description}</Text>
                </Inline>
              </Box>
            ))}
            <Box xcss={suggestionItemStyle}>
              <Text size="small" color="color.link">+ Suggest a new category</Text>
            </Box>
          </Box>
        )}
      </Box>

      {/* Unrecognised category warning */}
      {autocomplete.unknownCategory && (
        <Text size="small" xcss={warningStyle}>
          Unrecognised category
          {autocomplete.nearestCategory ? ` — did you mean '${autocomplete.nearestCategory}'?` : ' — are you sure?'}
        </Text>
      )}

      {/* Format error */}
      {validation.formatError && value && (
        <Text size="small" xcss={errorStyle}>{validation.formatMessage}</Text>
      )}

      {/* Live duplicate badge */}
      {!validation.formatError && value && (
        <DupBadge status={validation.dupStatus} matchedEvent={validation.matchedEvent} />
      )}

      {/* Action buttons */}
      {value && (
        <Inline space="space.075">
          {showCancel && (
            <Button appearance="subtle" onClick={() => { onCancel?.(); reset(); }}>
              Cancel
            </Button>
          )}
          <Button
            appearance="primary"
            isDisabled={!canConfirm}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </Inline>
      )}
    </Stack>
  );
}
