import React, { useId, useMemo } from 'react';

function toNumberOrEmpty(value) {
  if (value === '' || value === null || value === undefined) return '';
  const n = Number(value);
  return Number.isFinite(n) ? n : '';
}

function parseNumberInputValue(raw) {
  // Keep the field controllable while enforcing numeric values to consumers.
  // For <input type="number">, an empty string is a valid "no value" state during editing.
  if (raw === '') return '';
  const n = Number(raw);
  return Number.isFinite(n) ? n : '';
}

// PUBLIC_INTERFACE
export function NumberField({
  id: idProp,
  label,
  value,
  onChange,
  min,
  step,
  inputMode = 'numeric',
  helpText,
}) {
  /** Accessible number input field with consistent styling. Emits numbers (or empty string) via onChange. */
  const autoId = useId();
  const id = idProp || autoId;

  const displayValue = useMemo(() => toNumberOrEmpty(value), [value]);

  return (
    <div className="field">
      <label className="fieldLabel" htmlFor={id}>
        {label}
      </label>
      {helpText ? (
        <div id={`${id}-help`} className="fieldHelp">
          {helpText}
        </div>
      ) : null}
      <input
        id={id}
        className="input"
        type="number"
        inputMode={inputMode}
        value={displayValue}
        min={min}
        step={step}
        aria-describedby={helpText ? `${id}-help` : undefined}
        onChange={(e) => onChange?.(parseNumberInputValue(e.target.value))}
      />
    </div>
  );
}
