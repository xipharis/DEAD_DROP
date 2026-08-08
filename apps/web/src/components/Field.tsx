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
    <div className={`flex flex-col gap-1.5 min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
      <label className="paper-label" htmlFor={id}>
        <span>{label}</span>
        {unit ? <span className="text-[rgba(35,24,18,0.38)] tracking-[0.06em]">{unit}</span> : null}
      </label>
      <input
        id={id}
        className={`paper-input ${error ? "paper-input--invalid" : ""}`}
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
        <span className="font-mono text-[10px] tracking-[0.04em] text-[#B42318]" id={`${id}-error`}>
          {error}
        </span>
      ) : hint ? (
        <span
          className="font-mono text-[10px] tracking-[0.04em] text-[rgba(35,24,18,0.52)]"
          id={`${id}-hint`}
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
}
