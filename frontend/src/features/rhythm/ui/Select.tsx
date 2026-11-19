import type { ReactElement } from 'react';

export interface Choice {
  readonly value: string;
  readonly label: string;
}

export function Select({
  label,
  value,
  choices,
  onPick,
}: {
  readonly label: string;
  readonly value: string;
  readonly choices: readonly Choice[];
  readonly onPick: (value: string) => void;
}): ReactElement {
  return (
    <label className="field">
      {label}
      <select
        value={value}
        onChange={(event) => {
          onPick(event.target.value);
        }}
      >
        {choices.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </select>
    </label>
  );
}
