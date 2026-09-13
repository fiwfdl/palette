import * as TogglePrimitive from "@radix-ui/react-toggle";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
} from "react";
import { cn } from "../../lib/utils";

/**
 * shadcn-style wrapper around Radix Toggle. Radix owns the pressed/unpressed
 * state semantics; the starter owns only the tokenised styling.
 */
export const Toggle = forwardRef<
  ComponentRef<typeof TogglePrimitive.Root>,
  ComponentPropsWithoutRef<typeof TogglePrimitive.Root>
>(({ className, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] border border-border bg-surface px-5 py-2.5 text-sm font-medium text-surface-foreground transition-colors hover:bg-muted data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Toggle.displayName = TogglePrimitive.Root.displayName;
