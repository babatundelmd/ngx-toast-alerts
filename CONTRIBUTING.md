# Contributing to ngx-toast-alerts

Thank you for your interest in contributing! Whether it's reporting a bug,
suggesting a feature, or writing code — every bit helps make this project
better.

By taking part you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting set up

You need Node 20.19+, 22.12+ or 24+ — the versions Angular 22 supports.

```bash
git clone https://github.com/babatundelmd/ngx-toast-alerts.git
cd ngx-toast-alerts
npm install
```

The repo ships an `.npmrc` with `omit=peer`, which stops npm auto-installing
`@angular/build`'s optional peers — Karma and Jasmine among them, which this
project does not use. The trade-off is that **any peer we genuinely need must
be an explicit devDependency**. If a build suddenly cannot resolve an
`@angular/*` package, that is the cause: add it to `devDependencies` rather
than deleting the `.npmrc`.

### Everyday commands

| Command | What it does |
| --- | --- |
| `npm start` | Serve the demo app on <http://localhost:4200> |
| `npm run build` | Build the library into `dist/ngx-toast-alerts` |
| `npm run watch` | Rebuild the library on change |
| `npm test` | Run the library tests |
| `npm run test:demo` | Run the demo app tests |
| `npm run lint:tokens` | Check the CSS theming contract |
| `npm run lint:versions` | Check both manifests agree on the version |
| `npm run typecheck` | Type-check the workspace the way your editor does |
| `npm run verify:package` | Pack, install the tarball, and type-check a consumer |
| `npm run e2e` | Run the Playwright end-to-end suite (headless) |
| `npm run e2e:headed` | Same, but in a visible browser you can watch |
| `npm run e2e:ui` | Run the E2E suite in Playwright's interactive UI |
| `npm run e2e:debug` | Step through a test with the inspector |
| `npm run e2e:report` | Open the last E2E HTML report |

`npm run e2e` is **headless** — you will not see a browser window, which is
normal. Use `e2e:headed` to watch it drive the demo, or `e2e:ui` to scrub
through each step with a DOM snapshot per action.
| `npm run build:demo` | Build the demo app, including SSR |

The demo app under `projects/test-ngx-toast-alerts` imports the library through
the `ngx-toast-alerts` path mapping, which points at `dist/`. Nothing can
type-check the demo until the library has been built at least once.

Every script that needs it therefore builds the library first — `npm start`,
`npm test`, `npm run test:demo`, `npm run typecheck`, `npm run build:demo`,
`npm run e2e` and `npm run verify:package` all work on a clean checkout with no
`dist/`. **If you add a script that touches the demo or the root tsconfig,
prefix it with `npm run build &&` too**, or it will pass locally where `dist/`
already exists and fail in CI where it does not.

The demo exercises every position, radius and type — it is the fastest way to
see a visual change. It is also load-bearing beyond that: the library's own
unit tests borrow its build target (a library project has none of its own), and
the Playwright suite drives it.

What the demo **cannot** tell you is whether the *published package* works. It
resolves the library from `dist/` through a path mapping, so it never touches
the npm manifest — a broken `exports` map, a missing `types` entry, an unshipped
file or a wrong peer range would all sail past it and break every real install.
`npm run verify:package` covers that gap: it packs the tarball, installs it into
a throwaway project outside this workspace, imports it, and type-checks a
consumer under both `bundler` and `node16` module resolution. Run it after
touching `public-api.ts`, `ng-package.json`, or the library's `package.json`.

## Reporting bugs

Open an issue using the bug report template. The most useful thing you can
include is a minimal reproduction — a StackBlitz or a small repository. Please
also give us the ngx-toast-alerts version, the Angular version, and whether you
are running zoneless or with `zone.js`.

## Suggesting features

Use the feature request template. Lead with the problem rather than the
solution: knowing what you were trying to do often points at a better API than
the one either of us would have designed up front.

## Submitting code changes

1. Fork the repository and branch from `main`:
   `git checkout -b feature/your-feature-name`
2. Make your change.
3. Add or update tests. The suite runs on **Vitest** (via Angular's
   `@angular/build:unit-test` builder) with jsdom — use `vi.spyOn`,
   `vi.useFakeTimers()` and `expect(...)`, not Jasmine's `jasmine.createSpy` or
   `tick()`.

   **Import the test helpers explicitly**, as the existing specs do:

   ```ts
   import { beforeEach, describe, expect, it, vi } from 'vitest';
   ```

   Relying on ambient globals compiles under `tsconfig.spec.json` but not under
   the root `tsconfig.json` — and the root config is the one editors resolve
   spec files against, since they look for a file named exactly
   `tsconfig.json`. Without the import you get red squiggles
   (`Cannot find name 'describe'`) even though `npm test` passes.
   `npm run typecheck` catches this, and so does CI.

   Tests live next to the code:

   | File | Covers |
   | --- | --- |
   | `ngx-toast-alerts.service.spec.ts` | Queueing, timers, positions, SSR |
   | `ngx-toast-alerts.component.spec.ts` | Anything that renders or is clicked |
   | `toast-overlay.service.spec.ts` | Mounting and tearing down the host |
   | `provide-ngx-toast-alerts.spec.ts` | Provider and config merging |

   Note that a dismissed toast stays in the DOM for its exit animation, so
   scope assertions to a specific card rather than querying the whole host.

   **Anything that depends on a real browser goes in an end-to-end test**
   instead — animation, layout geometry, the CSS cascade, `prefers-color-scheme`
   and `prefers-reduced-motion`. jsdom has no layout or cascade engine, so unit
   tests cannot see any of it.

   ```bash
   npx playwright install chromium   # once
   npm run e2e
   ```

   | File | Covers |
   | --- | --- |
   | `e2e/toast-lifecycle.e2e.ts` | Showing, dismissing, real timers, hover pause |
   | `e2e/toast-positions.e2e.ts` | Geometry for all seven positions, the backdrop |
   | `e2e/toast-theming.e2e.ts` | Custom-property overrides, dark mode, reduced motion |
   | `e2e/toast-accessibility.e2e.ts` | Live regions, keyboard, focus ring, contrast |

   `e2e/support/toast-page.ts` holds the page object. Use its `waitForSettled()`
   before asserting on geometry — otherwise you measure a mid-animation frame.
4. Run `npm test` and `npm run build`. If you changed the public API or the
   packaging, also run `npm run verify:package`.
5. Add an entry under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md).
6. Update the README if the public API or configuration changed — both the root
   README and `projects/ngx-toast-alerts/README.md`, which is the one published
   to npm.
7. Commit, push, and open a pull request against `main`.

Please describe **what** the change is and **why** it is needed. CI runs the
build and tests on Node 20, 22 and 24.

## Code style

- Follow the [Angular style guide](https://angular.dev/style-guide).
- Use `@Service()` for services, not `@Injectable({ providedIn: 'root' })` —
  they are equivalent, and `@Service()` is the Angular 22 idiom. Reach for
  `@Service({ autoProvided: false })` when a service must be listed in a
  `providers` array instead of being root-provided, and keep `@Injectable` only
  for cases `@Service` cannot express.
- Prefer signals and `inject()` over decorators and RxJS where either would work
   — the library is deliberately zoneless-safe, so avoid anything that depends
  on `zone.js` or `@angular/animations`.
- Keep the library free of runtime dependencies beyond `tslib`, and never fetch
  a web font or other remote asset from library code.
- Style through the `--ngx-toast-*` custom properties rather than hard-coded
  values, so consumers can retheme without `::ng-deep`. New visual options
  should come with a variable and a README entry.
- Respect `prefers-reduced-motion` and `prefers-color-scheme` in any new CSS.
- Write clear, self-documenting code, and comment the non-obvious parts —
  explain why, not what.

## Releasing

Releases are automated. **Merging a version bump to `main` publishes it** —
there is no manual publish step.

Open a release PR that:

1. Bumps the version in **both** `package.json` and
   `projects/ngx-toast-alerts/package.json`. CI fails if they disagree
   (`npm run lint:versions`).
2. Moves the `## [Unreleased]` entries under a new version heading in
   [CHANGELOG.md](CHANGELOG.md), and updates the comparison links at the bottom.

When that PR merges, `.github/workflows/release.yml` runs the full CI suite —
build and test on Node 20/22/24, Playwright, and the pack-and-install
verification — and then, **only if that version is not already on npm**:

- publishes with `--provenance`, so the tarball is cryptographically linked to
  the workflow run and commit that produced it;
- tags `vX.Y.Z` and opens a GitHub Release.

A merge that does not change the version is a no-op: the checks run, the publish
step is skipped, and the job summary says why. That is deliberate — publishing on
every merge would burn a version number on every docs fix.

### One-time setup

The workflow needs an `NPM_TOKEN` repository secret: an **automation** token
from npm (Access Tokens → Generate New Token → Automation), which bypasses 2FA
for CI. Add it under Settings → Secrets and variables → Actions.

`npm run publish:lib` still exists for an emergency manual publish, but prefer
the automated path — it is the only one that produces provenance.

### If a release fails partway

The publish is the first irreversible step. If a later step fails (tagging, or
the GitHub Release), fix the cause and re-run the workflow from the Actions tab
— the version gate sees the version is already on npm and skips straight past
publishing, so it will not double-publish.
