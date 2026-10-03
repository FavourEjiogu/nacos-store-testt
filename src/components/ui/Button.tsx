import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-bold uppercase transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      primary: "bg-black text-white hover:bg-black/90",
      secondary: "bg-bg-subtle text-text-main border-2 border-transparent hover:border-border-strong",
      outline: "bg-transparent border-2 border-border-strong text-text-main hover:bg-bg-subtle",
      ghost: "bg-transparent text-text-main hover:bg-bg-subtle",
      danger: "bg-red-600 text-white hover:bg-red-700",
    };

    const sizes = {
      sm: "h-10 px-4 text-xs",
      md: "h-12 px-6 text-sm",
      lg: "h-14 px-10 text-base",
      icon: "h-12 w-12",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
