"use client";

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  hint?: string;
  unit?: string;
  placeholder?: string;
  type?: "text" | "password";
  wide?: boolean;
}

export function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  unit,
  placeholder,
  type = "text",
  wide = false,
}: FieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`field ${wide ? "field--wide" : ""}`}>
      <label className="field__label" htmlFor={id}>
        <span>{label}</span>
        {unit ? <span className="field__unit">{unit}</span> : null}
      </label>
      <input
        id={id}
        className={`field__input ${error ? "field__input--invalid" : ""}`}
        type={type}
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <span className="field__error" id={`${id}-error`}>
          {error}
        </span>
      ) : hint ? (
        <span className="field__hint" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
