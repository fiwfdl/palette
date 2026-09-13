import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Check,
  Copy,
  Lock,
  RotateCw,
  Unlock,
  type LucideIcon,
} from "lucide-react";
import {
  createPalette,
  oklchCss,
  oklchToHex,
  regenerateUnlocked,
  resizePalette,
  textOnSwatch,
  toCssVariables,
  toJson,
  type Swatch,
} from "../lib/palette";
import { cn } from "../lib/utils";
import { Toggle } from "./ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const DEFAULT_SEED = 265;
const DEFAULT_HUE = 265;
const DEFAULT_COUNT = 5;
const COUNTS = [3, 4, 5, 6, 7, 9];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "SELECT" ||
    tag === "TEXTAREA" ||
    target.isContentEditable
  );
}

/**
 * Palette generator island. All colour flows through the OKLCH triplet tokens
 * in `tokens.css`; the only dynamic values are the generated `oklch()` swatches.
 */
export default function PaletteGenerator() {
  const reduceMotion = useReducedMotion();
  const [hue, setHue] = useState(DEFAULT_HUE);
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [revision, setRevision] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [swatches, setSwatches] = useState<Swatch[]>(() =>
    createPalette(DEFAULT_SEED, DEFAULT_HUE, DEFAULT_COUNT),
  );
  const copyTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const copy = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }, []);

  const applyHue = useCallback(
    (value: number) => {
      setHue(value);
      setSwatches((previous) => regenerateUnlocked(previous, seed, value));
    },
    [seed],
  );

  const regenerate = useCallback(() => {
    const nextSeed = seed + 1;
    setSeed(nextSeed);
    setSwatches((previous) => regenerateUnlocked(previous, nextSeed, hue));
    setRevision((value) => value + 1);
  }, [hue, seed]);

  const changeCount = useCallback(
    (value: number) => {
      setCount(value);
      setSwatches((previous) => resizePalette(previous, seed, hue, value));
      setRevision((value) => value + 1);
    },
    [hue, seed],
  );

  const toggleLock = useCallback((index: number) => {
    setSwatches((previous) =>
      previous.map((swatch, i) =>
        i === index ? { ...swatch, locked: !swatch.locked } : swatch,
      ),
    );
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "r" || event.metaKey || event.ctrlKey) {
        return;
      }
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      regenerate();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [regenerate]);

  const paletteAction = (
    key: string,
    label: string,
    icon: LucideIcon,
    build: () => string,
  ) => {
    const Icon = icon;
    const active = copied === key;
    return (
      <button
        type="button"
        onClick={() => copy(key, build())}
        className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] border border-border bg-surface px-4 py-2 text-sm font-medium text-surface-foreground transition-colors hover:bg-muted active:scale-[0.98] motion-reduce:transition-none"
      >
        {active ? (
          <Check aria-hidden="true" className="h-4 w-4 text-success" />
        ) : (
          <Icon aria-hidden="true" className="h-4 w-4" />
        )}
        {active ? "Copied" : label}
      </button>
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-[var(--radius)] border border-border bg-card p-5 text-card-foreground sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <label
                htmlFor="base-hue"
                className="block text-sm font-medium text-card-foreground"
              >
                Base hue{" "}
                <span className="tabular-nums text-muted-foreground">
                  {hue}°
                </span>
              </label>
              <input
                id="base-hue"
                type="range"
                min={0}
                max={360}
                step={1}
                value={hue}
                onChange={(event) => applyHue(Number(event.target.value))}
                className="mt-2 h-2 w-52 cursor-pointer accent-primary"
              />
            </div>

            <div>
              <label
                htmlFor="swatch-count"
                className="block text-sm font-medium text-card-foreground"
              >
                Swatches
              </label>
              <select
                id="swatch-count"
                value={count}
                onChange={(event) => changeCount(Number(event.target.value))}
                className="mt-2 rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm text-surface-foreground"
              >
                {COUNTS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={regenerate}
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98] motion-reduce:transition-none"
            >
              <RotateCw aria-hidden="true" className="h-4 w-4" />
              Regenerate
            </button>
            {paletteAction("css", "Copy CSS", Copy, () =>
              toCssVariables(swatches),
            )}
            {paletteAction("json", "Copy JSON", Copy, () => toJson(swatches))}
          </div>
        </div>

        <motion.ul
          key={revision}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          {swatches.map((swatch, index) => {
            const tone = textOnSwatch(swatch);
            const background = oklchCss(swatch.l, swatch.c, swatch.h);
            const hex = oklchToHex(swatch.l, swatch.c, swatch.h);
            const isCopied = copied === `swatch-${index}`;
            const toneClass = tone.tone === "light" ? "text-paper" : "text-ink";
            return (
              <li
                key={index}
                style={{ backgroundColor: background }}
                className={cn(
                  "relative flex min-h-44 flex-col justify-between rounded-[var(--radius)] border border-border p-3",
                  toneClass,
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-display text-sm font-semibold">
                    {hex}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Toggle
                        pressed={swatch.locked}
                        onPressedChange={() => toggleLock(index)}
                        aria-label={
                          swatch.locked
                            ? `Unlock swatch ${index + 1}`
                            : `Lock swatch ${index + 1}`
                        }
                        className="h-8 w-8 min-w-0 border-border bg-background/90 p-0 text-foreground hover:bg-background data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      >
                        {swatch.locked ? (
                          <Lock aria-hidden="true" className="h-4 w-4" />
                        ) : (
                          <Unlock aria-hidden="true" className="h-4 w-4" />
                        )}
                      </Toggle>
                    </TooltipTrigger>
                    <TooltipContent>
                      {swatch.locked
                        ? "Unlock this swatch"
                        : "Lock this swatch"}
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium opacity-80">
                    Text {tone.level} · {tone.ratio.toFixed(2)}:1
                  </p>
                  <button
                    type="button"
                    onClick={() => copy(`swatch-${index}`, hex)}
                    aria-label={`Copy swatch ${index + 1} hex`}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-[var(--radius)] border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-background active:scale-[0.98] motion-reduce:transition-none"
                  >
                    {isCopied ? (
                      <Check aria-hidden="true" className="h-3.5 w-3.5" />
                    ) : (
                      <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                    )}
                    {isCopied ? "Copied" : "Copy hex"}
                  </button>
                </div>
              </li>
            );
          })}
        </motion.ul>

        <p aria-live="polite" className="sr-only">
          {copied ? "Copied to clipboard" : ""}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Lock the swatches you like, then regenerate — only unlocked swatches
          change. Press{" "}
          <kbd className="rounded border border-border px-1">R</kbd> to
          regenerate.
        </p>
      </div>
    </TooltipProvider>
  );
}
