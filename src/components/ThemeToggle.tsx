import * as Switch from "@radix-ui/react-switch";
import { useEffect, useState } from "react";

const STORAGE_KEY = "entrypoint-theme";

/**
 * Radix Switch that flips the `.dark` class on <html> and persists the choice.
 * The initial theme is applied by an inline script in BaseLayout before paint.
 */
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function handleCheckedChange(next: boolean) {
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Storage can be unavailable (private mode); the class change still applies.
    }
  }

  return (
    <Switch.Root
      checked={isDark}
      onCheckedChange={handleCheckedChange}
      aria-label="Toggle dark theme"
      title="Toggle dark theme"
      className="inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border bg-muted p-0.5 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary"
    >
      <Switch.Thumb className="block h-5 w-5 rounded-full bg-background shadow-sm transition-transform duration-150 data-[state=checked]:translate-x-5" />
    </Switch.Root>
  );
}
