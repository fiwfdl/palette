import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createPalette,
  regenerateUnlocked,
  resizePalette,
  oklchToHex,
  contrastRatio,
  wcagLevel,
  textOnSwatch,
  toCssVariables,
  toJson,
} from "../src/lib/palette.ts";

const WHITE = { l: 1, c: 0, h: 0 };
const BLACK = { l: 0, c: 0, h: 0 };

test("createPalette is deterministic for a given seed, hue, and count", () => {
  const a = createPalette(42, 265, 6);
  const b = createPalette(42, 265, 6);
  assert.deepEqual(a, b, "same inputs must produce the same palette");
  assert.notDeepEqual(a, createPalette(43, 265, 6), "seed must change output");
  assert.notDeepEqual(a, createPalette(42, 120, 6), "hue must change output");

  assert.equal(a.length, 6);
  for (const swatch of a) {
    assert.ok(swatch.l > 0 && swatch.l < 1, "lightness in (0,1)");
    assert.ok(swatch.c >= 0, "chroma non-negative");
    assert.ok(swatch.h >= 0 && swatch.h < 360, "hue in [0,360)");
    assert.equal(swatch.locked, false);
  }
  // Swatches span a meaningful lightness range so contrast labels differ.
  const lightness = a.map((s) => s.l);
  assert.ok(Math.max(...lightness) - Math.min(...lightness) > 0.3);
});

test("regenerateUnlocked keeps locked swatches and refreshes the rest", () => {
  const base = createPalette(1, 265, 5);
  base[1].locked = true;
  base[3].locked = true;

  const next = regenerateUnlocked(base, 2, 265);
  assert.equal(next.length, 5);
  assert.deepEqual(next[1], base[1], "locked swatch 1 unchanged");
  assert.deepEqual(next[3], base[3], "locked swatch 3 unchanged");
  assert.ok(
    next.some(
      (s, i) => !s.locked && JSON.stringify(s) !== JSON.stringify(base[i]),
    ),
    "at least one unlocked swatch changed",
  );
});

test("resizePalette grows and shrinks while preserving locked swatches", () => {
  const base = createPalette(9, 265, 5);
  base[0].locked = true;
  base[2].locked = true;

  const grown = resizePalette(base, 9, 265, 7);
  assert.equal(grown.length, 7);
  assert.deepEqual(grown[0], base[0]);
  assert.deepEqual(grown[2], base[2]);

  const shrunk = resizePalette(base, 9, 265, 3);
  assert.equal(shrunk.length, 3);
  assert.deepEqual(shrunk[0], base[0]);
  assert.deepEqual(shrunk[2], base[2]);
});

test("oklchToHex converts OKLCH to a lowercase 6-digit hex", () => {
  assert.equal(oklchToHex(1, 0, 0), "#ffffff");
  assert.equal(oklchToHex(0, 0, 0), "#000000");
  assert.match(oklchToHex(0.5, 0, 0), /^#[0-9a-f]{6}$/);
  // Chroma shifts the channel ordering but never breaks the format.
  assert.match(oklchToHex(0.65, 0.18, 145), /^#[0-9a-f]{6}$/);
});

test("contrastRatio reaches the WCAG extremes and wcagLevel classifies them", () => {
  assert.ok(Math.abs(contrastRatio(WHITE, BLACK) - 21) < 0.05);
  assert.ok(Math.abs(contrastRatio(BLACK, WHITE) - 21) < 0.05);
  assert.ok(Math.abs(contrastRatio(WHITE, WHITE) - 1) < 1e-9);

  assert.equal(wcagLevel(21), "AAA");
  assert.equal(wcagLevel(7), "AAA");
  assert.equal(wcagLevel(4.6), "AA");
  assert.equal(wcagLevel(3.1), "AA Large");
  assert.equal(wcagLevel(2.9), "Fail");
});

test("textOnSwatch picks whichever text tone contrasts more", () => {
  const darkSwatch = { l: 0.2, c: 0.05, h: 265, locked: false };
  const lightSwatch = { l: 0.95, c: 0.05, h: 265, locked: false };

  assert.equal(textOnSwatch(darkSwatch).tone, "light");
  assert.equal(textOnSwatch(lightSwatch).tone, "dark");
  assert.ok(
    textOnSwatch(darkSwatch).ratio >= textOnSwatch(lightSwatch).ratio - 21,
  );
  for (const ratio of [
    textOnSwatch(darkSwatch).ratio,
    textOnSwatch(lightSwatch).ratio,
  ]) {
    assert.ok(ratio >= 1 && ratio <= 21);
  }
});

test("toCssVariables emits OKLCH variables and toJson is parseable", () => {
  const palette = createPalette(7, 265, 3);
  const css = toCssVariables(palette);
  assert.match(css, /--palette-1:\s*oklch\(/);
  assert.match(css, /--palette-3:\s*oklch\(/);
  assert.doesNotMatch(css, /#[0-9a-f]{6}/i, "CSS variables stay in OKLCH");

  const parsed = JSON.parse(toJson(palette));
  assert.equal(parsed.swatches.length, 3);
  assert.match(parsed.swatches[0].hex, /^#[0-9a-f]{6}$/);
  assert.match(parsed.swatches[0].oklch, /^oklch\(/);
  assert.equal(typeof parsed.swatches[0].contrast.ratio, "number");
});
