import React from "react";

const baseClass =
  "w-full rounded-md border border-surface-300 px-3 py-2 text-sm text-surface-900 bg-white outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-surface-50 disabled:text-surface-400 disabled:cursor-not-allowed placeholder:text-surface-400";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
};

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string;
};

export function Input({ className = "", ...props }: InputProps) {
  return <input className={`${baseClass} ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select className={`${baseClass} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", rows = 3, ...props }: TextareaProps) {
  return (
    <textarea
      className={`${baseClass} resize-none ${className}`}
      rows={rows}
      {...props}
    />
  );
}
