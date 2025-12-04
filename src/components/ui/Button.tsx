// src/components/ui/Button.tsx
import { type ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "outline"
    | "ghost"
    | "exExcel"
    | "exPdf";
  size?: "xsm" | "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:transform active:scale-95";

    const variants = {
      // Ajustado: usa color primario y hover/ring coherente
      ghost: "bg-transparent text-primary hover:bg-primary/10 focus-visible:ring-primary", 
      exExcel:
        "bg-success-200 text-success-500 hover:bg-success-300 focus-visible:ring-success-300",
      exPdf:
        "bg-amaranth-200 text-amaranth-500 hover:bg-amaranth-300 focus-visible:ring-amaranth-300",
      primary:
        "bg-primary text-white hover:bg-primary-600 focus-visible:ring-primary",
      secondary:
        "bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500",
      danger:
        "bg-amaranth-600 text-white hover:bg-amaranth-700 focus-visible:ring-amaranth-500",
      success:
        "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500",
      outline:
        "border border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500",
    };

    const sizes = {
      // CORRECCIÓN: Eliminada la clase redundante 'size-10'
      xsm: "h-8 px-1 text-sm", 
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-6 text-lg",
    };
    
    // Determina el color del spinner para alta visibilidad
    const spinnerColorClass =
      variant === "primary" || variant === "danger" || variant === "success"
        ? "text-white" // Spinner blanco para fondos oscuros
        : "text-primary"; // Spinner de color primario para fondos claros (o ajusta a 'text-gray-600')

    return (
      <button
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            // Usa el color determinado para el spinner
            className={clsx("animate-spin -ml-1 mr-2 h-4 w-4", spinnerColorClass)}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";