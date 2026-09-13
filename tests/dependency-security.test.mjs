import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const lock = JSON.parse(readFileSync(join(ROOT, "package-lock.json"), "utf8"));

function installed(name) {
  const entry = lock.packages?.[`node_modules/${name}`];
  assert.ok(entry?.version, `${name} not found in package-lock.json`);
  return entry.version;
}

function majorMinorPatch(v) {
  return v
    .replace(/^[^0-9]*/, "")
    .split("-")[0]
    .split(".")
    .map(Number);
}

function atLeast(actual, floor) {
  const a = majorMinorPatch(actual);
  const f = majorMinorPatch(floor);
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (f[i] ?? 0)) return (a[i] ?? 0) > (f[i] ?? 0);
  }
  return true;
}

// GHSA-j687-52p2-xcff and the rest of the 2026 Astro advisory set affect
// astro <=7.2.7. 7.3.2 is the first patched release, so the installed line
// must stay at or above it. This is the regression guard for LAN-148.
const ASTRO_SECURITY_FLOOR = "7.3.2";

test("installed astro is at or above the patched security floor", () => {
  const version = installed("astro");
  assert.ok(
    atLeast(version, ASTRO_SECURITY_FLOOR),
    `astro ${version} is below the patched floor ${ASTRO_SECURITY_FLOOR} (vulnerable to GHSA-j687-52p2-xcff and kin)`,
  );
});

test("@astrojs/react tracks the patched astro major", () => {
  const astroMajor = majorMinorPatch(installed("astro"))[0];
  const reactMajor = majorMinorPatch(installed("@astrojs/react"))[0];
  assert.ok(
    reactMajor >= astroMajor - 1,
    `@astrojs/react ${installed("@astrojs/react")} is too old for astro ${installed("astro")}`,
  );
});
