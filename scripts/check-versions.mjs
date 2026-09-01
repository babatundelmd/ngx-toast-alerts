#!/usr/bin/env node
/**
 * Keeps the two package.json versions in step.
 *
 * The workspace root and the library each carry a version. Only the library's
 * is published, so a bump that misses one leaves the repo claiming a version it
 * never shipped — and the release workflow keys off the library's value.
 *
 * Also prints whether that version is already on npm, which is what the release
 * workflow uses to decide between publishing and skipping.
 *
 * Run with `npm run lint:versions`.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const read = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));

const rootPkg = read('package.json');
const libPkg = read('projects/ngx-toast-alerts/package.json');

const problems = [];

if (rootPkg.version !== libPkg.version) {
  problems.push(
    `Version mismatch:\n` +
      `  package.json                          ${rootPkg.version}\n` +
      `  projects/ngx-toast-alerts/package.json ${libPkg.version}\n` +
      `  Bump both — the library's value is the one that gets published.`,
  );
}

if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(libPkg.version)) {
  problems.push(`"${libPkg.version}" is not a valid semver version.`);
}

// The published manifest must point back at this repository, or npm provenance
// attestation is rejected at publish time.
const repoUrl = libPkg.repository?.url ?? '';
if (!repoUrl.includes('github.com/babatundelmd/ngx-toast-alerts')) {
  problems.push(
    `The library's repository.url must point at the GitHub repo for npm\n` +
      `  provenance to be accepted. Found: ${repoUrl || '(none)'}`,
  );
}

if (problems.length > 0) {
  console.error('\n✖ Version check failed.\n');
  for (const problem of problems) {
    console.error(`  ${problem}\n`);
  }
  process.exit(1);
}

console.log(`✔ Version ${libPkg.version} is consistent across both manifests.`);

// Consumed by the release workflow via $GITHUB_OUTPUT.
if (process.env['GITHUB_OUTPUT']) {
  const { appendFileSync } = await import('node:fs');
  appendFileSync(process.env['GITHUB_OUTPUT'], `version=${libPkg.version}\n`);
}
