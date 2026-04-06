import React from 'react';

// PUBLIC_INTERFACE
export function Toggle({ id, label, checked, onChange, description }) {
  /** Accessible toggle switch component (checkbox under the hood). */
  return (
    <div className="field">
      <div className="fieldRow">
        <div className="fieldText">
          <label className="fieldLabel" htmlFor={id}>
            {label}
          </label>
          {description ? <div className="fieldHelp">{description}</div> : null}
        </div>

        <div className="switchWrap">
          <input
            id={id}
            className="switchInput"
            type="checkbox"
            role="switch"
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
          />
          <span aria-hidden="true" className="switchTrack">
            <span className="switchThumb" />
          </span>
        </div>
      </div>
    </div>
  );
}
