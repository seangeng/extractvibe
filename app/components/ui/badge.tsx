import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-[hsl(var(--foreground))]/15 bg-[hsl(var(--foreground))]/5 text-[hsl(var(--foreground))]",
        secondary:
          "border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
        destructive:
          "border-[hsl(var(--destructive))]/20 bg-[hsl(var(--destructive))]/5 text-[hsl(var(--destructive))]",
        outline:
          "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]",
        success:
          "border-[hsl(var(--success))]/25 bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
