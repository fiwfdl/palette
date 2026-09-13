import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

function blockFor(css, selector) {
  const idx = css.indexOf(selector);
  assert.ok(idx !== -1, `selector ${selector} not found`);
  const open = css.indexOf("{", idx);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

function triplet(block, name) {
  const m = block.match(
    new RegExp(`--${name}\\s*:\\s*([0-9.]+)\\s+([0-9.]+)\\s+([0-9.]+)`),
  );
  assert.ok(m, `token --${name} not a numeric OKLCH triplet`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

// OKLCH -> linear sRGB -> WCAG relative luminance / contrast ratio.
function oklchToLinearSrgb(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
function luminance(L, C, H) {
  const [r, g, b] = oklchToLinearSrgb(L, C, H).map((c) =>
    Math.min(1, Math.max(0, c)),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(fg, bg) {
  const a = luminance(...fg);
  const b = luminance(...bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const PAIRS = [
  ["foreground", "background"],
  ["surface-foreground", "surface"],
  ["card-foreground", "card"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["muted-foreground", "muted"],
  ["accent-foreground", "accent"],
  ["destructive-foreground", "destructive"],
  ["success-foreground", "success"],
];

test("every solid-fill text pair meets WCAG AA (>= 4.5) in light and dark", () => {
  const css = read("src/styles/tokens.css");
  const themes = {
    light: blockFor(css, ":root"),
    dark: blockFor(css, ".dark"),
  };
  const failures = [];
  for (const [theme, block] of Object.entries(themes)) {
    for (const [fg, bg] of PAIRS) {
      const ratio = contrast(triplet(block, fg), triplet(block, bg));
      if (ratio < 4.5) {
        failures.push(`${theme} ${fg} on ${bg} = ${ratio.toFixed(2)}:1`);
      }
    }
  }
  assert.deepEqual(failures, [], `contrast failures:\n${failures.join("\n")}`);
});

test("tokens.css commits a type direction: display/body families and a fixed scale", () => {
  const css = read("src/styles/tokens.css");
  assert.match(css, /--font-display:\s*"/, "display family token missing");
  assert.match(css, /--font-sans:\s*"/, "body family token missing");
  for (const [name, rem] of [
    ["--text-xs", "0.75rem"],
    ["--text-sm", "0.875rem"],
    ["--text-base", "1rem"],
    ["--text-lg", "1.125rem"],
    ["--text-xl", "1.25rem"],
    ["--text-2xl", "1.5rem"],
    ["--text-3xl", "2rem"],
    ["--text-4xl", "2.5rem"],
    ["--text-5xl", "3.25rem"],
    ["--text-6xl", "4rem"],
  ]) {
    assert.match(
      css,
      new RegExp(`${name}\\s*:\\s*${rem.replace(".", "\\.")}`),
      `type scale ${name} should be ${rem}`,
    );
  }
});

test("self-hosted font files are committed and declared via @font-face", () => {
  const fontsCss = read("src/styles/fonts.css");
  assert.match(fontsCss, /@font-face/, "fonts.css must declare @font-face");
  assert.match(fontsCss, /\/fonts\/space-grotesk-latin-400-700\.woff2/);
  assert.match(fontsCss, /\/fonts\/ibm-plex-sans-latin-var\.woff2/);
  for (const f of [
    "public/fonts/space-grotesk-latin-400-700.woff2",
    "public/fonts/ibm-plex-sans-latin-var.woff2",
  ]) {
    assert.ok(existsSync(join(ROOT, f)), `${f} missing`);
  }
});

test("art-direction document exists and covers palette, type, grid, motion, motif", () => {
  const doc = read("docs/art-direction.md").toLowerCase();
  for (const term of ["palette", "type", "scale", "grid", "motion", "ring"]) {
    assert.ok(doc.includes(term), `art-direction.md should cover "${term}"`);
  }
});

test("theme switch aria-label names the action, not just the topic", () => {
  const src = read("src/components/ThemeToggle.tsx");
  assert.match(src, /aria-label="Toggle dark theme"/);
});
