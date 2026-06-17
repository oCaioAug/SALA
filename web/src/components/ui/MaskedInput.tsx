"use client";

import React from "react";

import { Input } from "@/components/ui/Input";

type MaskedInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> & {
  label?: string;
  error?: string;
  value: string;
  onValueChange: (value: string) => void;
  format: (value: string) => string;
  inputClassName?: string;
};

export function MaskedInput({
  label,
  error,
  value,
  onValueChange,
  format,
  type = "text",
  inputMode = "numeric",
  inputClassName,
  className,
  ...props
}: MaskedInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(format(e.target.value));
  };

  if (inputClassName) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-slate-300">{label}</label>
        )}
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={handleChange}
          className={inputClassName}
          {...props}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <Input
      label={label}
      error={error}
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={handleChange}
      className={className}
      {...props}
    />
  );
}
