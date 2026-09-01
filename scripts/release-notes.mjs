#!/usr/bin/env node
/**
 * Builds GitHub Release notes from the CHANGELOG entry for a version.
 *
 * The changelog is the better-written source than `--generate-notes`, which
 * only lists commit titles. This extracts the matching `## [X.Y.Z]` section and
 * wraps it with what a release page wants but a changelog does not: an install
 * command, a breaking-change callout, and compare links.
 *
 * Exits non-zero if the version has no changelog section. The release workflow
 * runs this *before* publishing, so a missing entry stops the release rather
 * than leaving a published package with no notes.
 *
 *   node scripts/release-notes.mjs 3.0.0 > notes.md
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'babatundelmd/ngx-toast-alerts';
const PACKAGE = 'ngx-toast-alerts';

const version = process.argv[2];
if (!version) {
  console.error('Usage: node scripts/release-notes.mjs <version>');
  process.exit(1);
}

const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
const lines = changelog.split('\n');

const isVersionHeading = (line) => /^## \[[^\]]+\]/.test(line);
const headingFor = (line) => line.match(/^## \[([^\]]+)\]/)?.[1];

const startIndex = lines.findIndex(
  (line) => headingFor(line) === version,
);

if (startIndex === -1) {
  console.error(
    `\n✖ CHANGELOG.md has no "## [${version}]" section.\n\n` +
      `  Add one before releasing — the release notes are generated from it.\n` +
      `  Move the "## [Unreleased]" entries under a "## [${version}]" heading.\n`,
  );
  process.exit(1);
}

// Everything up to the next version heading.
let endIndex = lines.length;
for (let i = startIndex + 1; i < lines.length; i++) {
  if (isVersionHeading(lines[i])) {
    endIndex = i;
    break;
  }
}

const body = lines
  .slice(startIndex + 1, endIndex)
  .join('\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

if (!body) {
  console.error(`\n✖ The "## [${version}]" section in CHANGELOG.md is empty.\n`);
  process.exit(1);
}

/** The previous released version, for the compare link. */
const previousVersion = lines
  .slice(endIndex)
  .map(headingFor)
  .find((name) => name && name !== 'Unreleased');

/**
 * The lead paragraph: the section's opening prose, if it has any before the
 * first `###` subheading. Avoids repeating it in the body below.
 */
const firstSubheading = body.indexOf('\n### ');
const lead = firstSubheading === -1 ? '' : body.slice(0, firstSubheading).trim();
const rest = firstSubheading === -1 ? body : body.slice(firstSubheading).trim();

// A `### Migration` subsection is the author saying this needs migration steps.
const isBreaking = /^### Migration\b/m.test(body);

const parts = [];

if (lead) {
  parts.push(lead);
}

parts.push('```bash\nnpm install ' + PACKAGE + '\n```');

if (isBreaking) {
  parts.push(
    '> **Breaking change.** See [Migration](#migration) at the bottom before upgrading.',
  );
}

parts.push('---', rest, '---');

const footer = [
  `**Full changelog:** [CHANGELOG.md](https://github.com/${REPO}/blob/main/CHANGELOG.md)`,
];
if (previousVersion) {
  footer.push(
    `**Compare:** [v${previousVersion}...v${version}](https://github.com/${REPO}/compare/v${previousVersion}...v${version})`,
  );
}
parts.push(footer.join(' · '));

parts.push(
  `Published from CI with [npm provenance](https://www.npmjs.com/package/${PACKAGE}/v/${version}).`,
);

process.stdout.write(parts.join('\n\n').replace(/\n{3,}/g, '\n\n') + '\n');
