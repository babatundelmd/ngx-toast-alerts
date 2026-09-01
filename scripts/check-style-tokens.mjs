#!/usr/bin/env node
/**
 * Guards the theming contract.
 *
 * The library must never *declare* a `--ngx-toast-*` custom property. `:host`
 * compiles to an attribute selector whose specificity beats both a consumer's
 * `ngx-toast-alerts { … }` rule and anything inherited from `:root`, so a
 * declaration here silently discards every consumer override.
 *
 * Public tokens may only be *read*, with a fallback:
 *
 *     --_radius: var(--ngx-toast-radius, 20px);
 *
 * Run with `npm run lint:tokens`.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stylesheet = join(
  root,
  'projects/ngx-toast-alerts/src/lib/ngx-toast.component.scss',
);

const source = readFileSync(stylesheet, 'utf8');
const failures = [];

source.split('\n').forEach((line, index) => {
  // Comments may show the pattern for documentation — they style nothing.
  const code = line.replace(/\/\/.*$/, '');

  // Strip `var(--ngx-toast-x, …)` reads so only declarations remain.
  const withoutReads = code.replace(/var\(\s*--ngx-toast-[\w-]+/g, 'var(');

  const declaration = withoutReads.match(/(--ngx-toast-[\w-]+)\s*:/);
  if (declaration) {
    failures.push({
      line: index + 1,
      token: declaration[1],
      text: line.trim(),
    });
  }
});

if (failures.length > 0) {
  const file = relative(root, stylesheet);
  console.error(
    `\n✖ ${failures.length} public token declaration(s) in ${file}.\n` +
      `  The library must only read these, never declare them — a declaration\n` +
      `  on :host outranks a consumer's :root override and silently wins.\n`,
  );
  for (const failure of failures) {
    console.error(`  ${file}:${failure.line}  ${failure.text}`);
    console.error(
      `    → use  --_name: var(${failure.token}, <default>);  instead\n`,
    );
  }
  process.exit(1);
}

console.log('✔ No public --ngx-toast-* tokens are declared by the library.');
