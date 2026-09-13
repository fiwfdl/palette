import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

const REQUIRED_TOKENS = [
  "background",
  "foreground",
  "surface",
  "surface-foreground",
  "card",
  "card-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "border",
  "input",
  "ring",
  "destructive",
  "destructive-foreground",
  "success",
  "success-foreground",
];

const COMPONENT_DIRS = ["src/components", "src/layouts", "src/pages"];
const CODE_EXT = new Set([".astro", ".tsx", ".ts", ".jsx", ".js"]);

function walk(dir) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  const out = [];
  for (const entry of readdirSync(abs)) {
    const full = join(abs, entry);
    if (statSync(full).isDirectory()) out.push(...walk(join(dir, entry)));
    else if (CODE_EXT.has(extname(entry))) out.push(join(dir, entry));
  }
  return out;
}

function blockFor(css, selector) {
  const idx = css.indexOf(selector);
  assert.ok(idx !== -1, `selector ${selector} not found in tokens.css`);
  const open = css.indexOf("{", idx);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

test("tokens.css defines every semantic token as an OKLCH triplet in :root and .dark", () => {
  assert.ok(
    existsSync(join(ROOT, "src/styles/tokens.css")),
    "tokens.css missing",
  );
  const css = read("src/styles/tokens.css");
  const light = blockFor(css, ":root");
  const dark = blockFor(css, ".dark");
  for (const token of REQUIRED_TOKENS) {
    const value = `--${token}`;
    assert.match(
      light,
      new RegExp(`\\${value}\\s*:`),
      `light theme missing ${value}`,
    );
    assert.match(
      dark,
      new RegExp(`\\${value}\\s*:`),
      `dark theme missing ${value}`,
    );
  }
});

test("component files contain no raw hex, rgb(, hsl( colours", () => {
  const offenders = [];
  const raw = [/#[0-9a-fA-F]{3,8}\b/, /\brgba?\(/, /\bhsla?\(/];
  for (const dir of COMPONENT_DIRS) {
    for (const file of walk(dir)) {
      const text = read(file);
      for (const re of raw) {
        const m = text.match(re);
        if (m) offenders.push(`${file}: ${m[0]}`);
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `raw colour values found:\n${offenders.join("\n")}`,
  );
});

test("theme toggle is built on the Radix Switch primitive", () => {
  const file = "src/components/ThemeToggle.tsx";
  assert.ok(existsSync(join(ROOT, file)), `${file} missing`);
  const src = read(file);
  assert.match(
    src,
    /@radix-ui\/react-switch/,
    "ThemeToggle must import Radix Switch",
  );
  assert.match(src, /Switch\.Root/, "ThemeToggle must render Switch.Root");
});

test("theme toggle defaults to prefers-color-scheme and persists the choice", () => {
  const layout = read("src/layouts/BaseLayout.astro");
  assert.match(
    layout,
    /prefers-color-scheme/,
    "must default to prefers-color-scheme",
  );
  assert.match(layout, /localStorage/, "must persist the user choice");
  assert.match(
    layout,
    /classList\.(toggle|add|remove)\(\s*["']dark/,
    "must flip .dark on <html>",
  );
});

test("home page carries the tagline and required header/footer landmarks", () => {
  const layout = read("src/layouts/BaseLayout.astro");
  const index = read("src/pages/index.astro");
  const header = existsSync(join(ROOT, "src/components/Header.astro"))
    ? read("src/components/Header.astro")
    : "";
  const footer = existsSync(join(ROOT, "src/components/Footer.astro"))
    ? read("src/components/Footer.astro")
    : "";
  assert.match(
    `${layout}\n${index}\n${header}\n${footer}`,
    /Build your next web product\./,
    "tagline missing",
  );
  assert.match(header, /<header/, "Header.astro must render a <header>");
  assert.match(header, /Get started/, "header CTA missing");
  assert.match(footer, /<footer/, "Footer.astro must render a <footer>");
});

test("docs/CONTEXT.md and docs/tasks.md exist and are non-trivial", () => {
  for (const doc of ["docs/CONTEXT.md", "docs/tasks.md"]) {
    assert.ok(existsSync(join(ROOT, doc)), `${doc} missing`);
    assert.ok(read(doc).trim().length > 120, `${doc} looks empty`);
  }
});
