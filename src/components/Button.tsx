import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  icon,
  children,
  className,
  ...props
}) => {
  const base =
    "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    primary:
      "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg",
    secondary:
      "bg-slate-800 text-white hover:bg-slate-900 shadow-sm hover:shadow-md",
    outline:
      "border border-slate-300 text-slate-700 bg-white hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
  };

  return (
    <button
      className={clsx(base, variants[variant], className)}
      {...props}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </button>
  );
};
