#!/usr/bin/env node
/**
 * Packs the library, installs the real tarball into a throwaway consumer
 * outside this workspace, and type-checks an import against it.
 *
 * The demo app resolves `ngx-toast-alerts` through a tsconfig path mapping
 * straight to `dist/`, so it never exercises the published manifest. This does:
 * a broken `exports` map, a missing `types` entry, an unshipped file or a wrong
 * `peerDependencies` range all fail here and nowhere else.
 *
 * Run with `npm run verify:package`.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist', 'ngx-toast-alerts');

/**
 * `npm run` exports this workspace's npm config to child processes as
 * `npm_config_*` env vars — including the `omit=peer` from our .npmrc. The
 * scratch consumer must install the way a real user would, with peers
 * resolved, so that leakage is stripped here.
 */
function consumerEnv() {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/^npm_config_(omit|include)$/i.test(key)) {
      delete env[key];
    }
  }
  env['npm_config_include'] = 'peer';
  return env;
}

const run = (command, args, cwd, { quiet = true, env } = {}) =>
  execFileSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    stdio: quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });

const step = (message) => console.log(`\n▸ ${message}`);
const ok = (message) => console.log(`  ✔ ${message}`);

/**
 * The exact Angular version to install in the consumer.
 *
 * Resolved to a concrete version rather than passed through as a range:
 * `@angular/core` peers on an *exact* `@angular/compiler`, so installing both
 * with `^` lets npm pick different patches and fail peer resolution.
 */
function angularVersion() {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const range = pkg.devDependencies['@angular/core'];
  const resolved = run('npm', ['view', `@angular/core@${range}`, 'version'], root)
    .trim()
    .split('\n')
    .pop()
    // `npm view` prefixes the line with the spec when a range matches many.
    .replace(/^.*?['\s]([0-9][^'\s]*)'?$/, '$1')
    .replace(/'/g, '')
    .trim();

  if (!/^\d+\.\d+\.\d+/.test(resolved)) {
    throw new Error(`Could not resolve a concrete Angular version from "${range}"`);
  }
  return resolved;
}

let scratch;
try {
  step('Building and packing the library');
  run('npm', ['run', 'prepack:lib'], root);

  const packed = run('npm', ['pack', '--json'], distDir);
  const tarballName = JSON.parse(packed)[0].filename;
  const tarball = join(distDir, tarballName);
  ok(`packed ${tarballName}`);

  // A directory outside the workspace, so no tsconfig `paths` mapping and no
  // hoisted node_modules can satisfy the import for us.
  scratch = mkdtempSync(join(tmpdir(), 'ngx-toast-alerts-consumer-'));
  step(`Installing the tarball into a clean consumer\n  ${scratch}`);

  writeFileSync(
    join(scratch, 'package.json'),
    JSON.stringify(
      {
        name: 'ngx-toast-alerts-install-check',
        version: '1.0.0',
        private: true,
        type: 'module',
      },
      null,
      2,
    ),
  );

  const ng = angularVersion();
  ok(`pinning Angular ${ng} for the consumer`);
  run(
    'npm',
    [
      'install',
      '--no-audit',
      '--no-fund',
      tarball,
      `@angular/core@${ng}`,
      `@angular/common@${ng}`,
      // The JIT fallback for a partially-compiled library, needed to import
      // the bundle in plain Node without running the Angular Linker.
      `@angular/compiler@${ng}`,
      'typescript@~6.0.3',
    ],
    scratch,
    { env: consumerEnv() },
  );
  ok('installed with its peer dependencies satisfied');

  step('Checking the installed package contents');
  const installed = join(scratch, 'node_modules', 'ngx-toast-alerts');
  const manifest = JSON.parse(
    readFileSync(join(installed, 'package.json'), 'utf8'),
  );

  const expectedPeers = ['@angular/common', '@angular/core'];
  for (const peer of expectedPeers) {
    if (!manifest.peerDependencies?.[peer]) {
      throw new Error(`Published manifest is missing peerDependency ${peer}`);
    }
  }
  ok(`peerDependencies declared: ${expectedPeers.join(', ')}`);

  for (const file of ['README.md', 'LICENSE', 'CHANGELOG.md']) {
    if (!readdirSync(installed).includes(file)) {
      throw new Error(`Published package is missing ${file}`);
    }
  }
  ok('README, LICENSE and CHANGELOG shipped');

  if (manifest.sideEffects !== false) {
    throw new Error('sideEffects:false is missing — tree shaking will suffer');
  }
  ok('sideEffects: false preserved');

  step('Importing the package at runtime');
  // A real dynamic import proves the exports map resolves *and* that the
  // bundle actually loads — not just that a path exists on disk.
  const exported = run(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      // ng-packagr emits a partially-compiled bundle. Outside a bundler the
      // Angular Linker never runs, so load the compiler for the JIT fallback
      // first — otherwise any Angular library fails here, ours included.
      "await import('@angular/compiler'); " +
        "const m = await import('ngx-toast-alerts'); " +
        "console.log(Object.keys(m).sort().join(','));",
    ],
    scratch,
  ).trim();

  const requiredExports = [
    'NGX_TOAST_ALERTS_CONFIG',
    'NGX_TOAST_ALERTS_DEFAULTS',
    'NgxToastAlertsComponent',
    'NgxToastAlertsService',
    'ToastOverlayService',
    'provideNgxToastAlerts',
  ];
  const actual = exported.split(',');
  const missing = requiredExports.filter((name) => !actual.includes(name));
  if (missing.length > 0) {
    throw new Error(`Public API is missing: ${missing.join(', ')}`);
  }
  ok(`imports cleanly, ${actual.length} public exports`);

  step('Type-checking a consumer against the published types');
  mkdirSync(join(scratch, 'src'), { recursive: true });
  writeFileSync(
    join(scratch, 'src', 'consumer.ts'),
    `import { inject, Injectable } from '@angular/core';
import {
  NgxToastAlertsService,
  NgxToastAlertsComponent,
  provideNgxToastAlerts,
  NGX_TOAST_ALERTS_CONFIG,
  NGX_TOAST_ALERTS_DEFAULTS,
  type NgxToastAlertsConfig,
  type NgxToastPosition,
  type NgxToastRadius,
  type NgxToastType,
  type NgxToastEvent,
  type NgxToastEventHandler,
  type NgxToastDismissReason,
  type Toast,
} from 'ngx-toast-alerts';

export const providers = [provideNgxToastAlerts({ position: 'center' })];

@Injectable({ providedIn: 'root' })
export class Notifier {
  private readonly toast = inject(NgxToastAlertsService);

  notify(): number {
    const id: number = this.toast.success('Saved');
    this.toast.center('Centred', 'pending', { radius: 'pill' });
    this.toast.show('warning', 'Careful', { showProgress: true });
    this.toast.closeToast(id, 'programmatic');
    this.toast.dismissAll();
    return id;
  }

  readAll(): readonly Toast[] {
    return this.toast.toasts();
  }
}

// Every exported type must be usable by name.
const position: NgxToastPosition = 'bottom-center';
const radius: NgxToastRadius = 'soft';
const type: NgxToastType = 'error';
const reason: NgxToastDismissReason = 'close-button';
const onEvent: NgxToastEventHandler = (e: NgxToastEvent) => {
  const kind: 'shown' | 'dismissed' = e.event;
  const why: NgxToastDismissReason | undefined = e.reason;
  const ms: number | undefined = e.visibleFor;
  void kind; void why; void ms;
};
const config: NgxToastAlertsConfig = { position, radius, timeout: 1000, onEvent };

export const surface = {
  config,
  type,
  reason,
  token: NGX_TOAST_ALERTS_CONFIG,
  defaults: NGX_TOAST_ALERTS_DEFAULTS,
  component: NgxToastAlertsComponent,
};
`,
  );

  // Two resolution modes: `bundler` is what Angular apps use; `node16` is
  // stricter and catches an exports map missing its `types` condition.
  for (const moduleResolution of ['bundler', 'node16']) {
    writeFileSync(
      join(scratch, `tsconfig.${moduleResolution}.json`),
      JSON.stringify(
        {
          compilerOptions: {
            strict: true,
            noEmit: true,
            skipLibCheck: true,
            experimentalDecorators: true,
            target: 'ES2022',
            module: moduleResolution === 'node16' ? 'node16' : 'ES2022',
            moduleResolution,
            types: [],
          },
          include: ['src/**/*.ts'],
        },
        null,
        2,
      ),
    );

    run(
      join(scratch, 'node_modules', '.bin', 'tsc'),
      ['--noEmit', '-p', `tsconfig.${moduleResolution}.json`],
      scratch,
    );
    ok(`type-checks under moduleResolution: ${moduleResolution}`);
  }

  console.log('\n✔ Package verified: a real install resolves and type-checks.\n');
} catch (error) {
  console.error('\n✖ Package verification failed.\n');
  if (error.stdout) console.error(error.stdout.toString());
  if (error.stderr) console.error(error.stderr.toString());
  if (!error.stdout && !error.stderr) console.error(error.message);
  process.exitCode = 1;
} finally {
  if (scratch) {
    rmSync(scratch, { recursive: true, force: true });
  }
  // Remove the tarball the pack step left in dist/.
  try {
    for (const file of readdirSync(distDir)) {
      if (file.endsWith('.tgz')) {
        rmSync(join(distDir, file), { force: true });
      }
    }
  } catch {
    // dist/ may not exist if the build itself failed.
  }
}
