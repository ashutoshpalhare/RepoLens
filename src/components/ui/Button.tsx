import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/utils/cn";

type Variant = "primary" | "outline" | "ghost" | "subtle" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium " +
  "transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-contrast font-semibold shadow-sm hover:bg-accent-strong " +
    "active:brightness-95 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]",
  outline:
    "border border-line-strong/80 bg-surface/80 text-ink hover:border-accent-border hover:bg-accent-soft/40 hover:text-accent " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  ghost: "text-muted hover:bg-surface-2 hover:text-ink active:bg-surface-2/80",
  subtle: "bg-surface-2 border border-line/60 text-ink hover:border-line-strong hover:bg-elevated hover:text-accent " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
  danger: "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 active:bg-danger/25",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-9 px-3.5 text-xs sm:h-10 sm:px-4 sm:text-sm",
  lg: "h-11 px-5 text-sm sm:h-12 sm:px-6 sm:text-base",
};

export type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: Variant;
  size?: Size;
  children?: React.ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "subtle", size = "md", children, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.015 }}
      transition={{ duration: 0.15 }}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
});

export type IconButtonProps = Omit<ButtonProps, "size"> & {
  label: string;
  size?: "sm" | "md";
  active?: boolean;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ className, label, size = "md", active, children, ...props }, ref) {
    return (
      <motion.button
        ref={ref}
        aria-label={label}
        title={label}
        whileTap={{ scale: 0.94 }}
        transition={{ duration: 0.12 }}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ease-out",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "text-muted hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-40",
          size === "sm" ? "h-7 w-7" : "h-9 w-9",
          active && "bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent",
          className,
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);
