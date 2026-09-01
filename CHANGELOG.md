# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.1] - 2026-09-01

Tooling only — the library code and its README are byte-for-byte identical to
3.0.0. Upgrading gains you nothing; there is no reason to rush.

### Changed

- GitHub Release notes are now generated from this changelog rather than from
  commit titles, and a release now fails *before* publishing if its version has
  no changelog entry.
- The CI Node matrix now matches what Angular 22 actually requires
  (`^22.22.3 || ^24.15.0 || >=26.0.0`): Node 22 and 24 must pass, Node 26 runs
  as an advisory check. Node 20 was never supported and has been dropped.
- `npm run typecheck` and `npm test` build the library first, so every script
  works on a clean checkout rather than depending on a warm `dist/`.

## [3.0.0] - 2026-09-01

A full visual redesign, a new centred toast, and a move to Angular 22.

### Added

- **Centred toasts.** The new `center` position floats a toast in the middle of
  the viewport with a spring entrance — it scales up out of a blur, overshoots
  slightly, then settles. `toast.center(message, type?, config?)` is the
  shorthand; `position: 'center'` works anywhere a position is accepted.
- **Dimmed backdrop** behind centred toasts, with a blur. Clicking it dismisses
  the toast. Opt out per toast with `backdrop: false`.
- **`top-center` and `bottom-center` positions**, each with their own entrance
  and exit animation. There are now seven positions in total.
- **`warning` toast type**, joining `success`, `error`, `info` and `pending`.
- **Corner radius presets** via `radius: 'soft' | 'round' | 'pill'`. `round` is
  the default; `pill` renders fully rounded capsule toasts.
- **Close button** on every toast, with its own accessible label. Hide it with
  `showCloseButton: false`.
- **Pause on hover.** The dismiss timer freezes while the pointer is over a
  toast and resumes on leave. Disable with `pauseOnHover: false`.
- **Optional progress bar** tracking the remaining timeout (`showProgress`).
  It pauses in step with the dismiss timer.
- **`maxToasts`** caps how many toasts stack up at each position, dropping the
  oldest first. Defaults to 5.
- **`title`** overrides a toast's heading, which previously always came from the
  toast type.
- **`dismissAll()`**, plus `pauseToast(id)` and `resumeToast(id)`.
- **`show(type, message, config?)`** as a general entry point alongside the
  per-type helpers.
- **Dark mode** through `prefers-color-scheme`, and a reduced-motion path where
  `prefers-reduced-motion: reduce` replaces every entrance and exit with a plain
  opacity fade — no movement, no scaling, no blur — and drops the hover lift.
- **Screen reader announcements** through persistent live regions that exist
  before any toast is inserted. `ariaLive` picks the politeness per toast.
- A Vitest suite of 85 unit tests across the service, the component, the
  overlay service and the provider — including the server-side rendering paths
  and a `npm run lint:tokens` check that guards the CSS theming contract.
- `npm run verify:package`, which packs the tarball, installs it into a
  throwaway consumer outside the workspace, imports it, and type-checks a real
  consumer under both `bundler` and `node16` module resolution — catching a
  broken `exports` map, a missing `types` entry, an unshipped file or a wrong
  peer range, none of which the demo app can see.
- A Playwright end-to-end suite of 46 tests covering what jsdom cannot see:
  real entrance and exit animations, settled layout geometry for all seven
  positions, the centred toast's spring and backdrop, hover pausing a live
  dismiss timer, the CSS cascade for consumer theme overrides, dark mode,
  reduced motion, keyboard dismissal and title contrast.

### Changed

- **Redesigned the toast.** Toasts are now rounded white (or dark) cards with a
  tinted, rounded icon tile, a bold title, a muted message, and a soft shadow
  that picks up the toast's accent colour — replacing the flat, fully-coloured
  blocks of v2.
- **Per-toast `position` is now honoured.** v2 documented the option but always
  rendered every toast at the globally configured position. Toasts are now
  grouped into one container per position in use.
- **Toasts animate out before they are removed.** v2 faked the exit with a CSS
  animation on a fixed 5s delay, which desynchronised from the real timeout. The
  service now marks a toast as leaving, waits for the animation, then drops it.
- **The show methods return the new toast's id**, so it can be dismissed later.
  They previously returned `void`.
- **`provideNgxToastAlerts()` returns `EnvironmentProviders`** built with
  `makeEnvironmentProviders`, instead of a provider array.
- **No web font is downloaded.** v2 pulled Inter from Google Fonts inside the
  library stylesheet. The default is now the platform UI font stack, overridable
  through `--ngx-toast-font`.
- **The overlay mounts lazily** on the first toast rather than in the service
  constructor, so applications that never toast never pay for it.
- **Services use Angular 22's `@Service()` decorator** instead of
  `@Injectable({ providedIn: 'root' })`, applied with the official
  `ng generate @angular/core:service-migration` schematic. The two are
  equivalent — `@Service()` is root-provided by default — so nothing changes for
  consumers, and the `^22.0.0` peer range still holds because `@Service` shipped
  in 22.0.0.
- Every style hook was renamed and expanded — see *Removed* below.
- **Tests run on Vitest** through Angular 22's `@angular/build:unit-test`
  builder. Karma and Jasmine are gone, and an `.npmrc` with `omit=peer` stops
  npm auto-installing them back as optional peers of `@angular/build`. That
  took the dev install from 580 packages with 17 audit findings to 460 with
  none.
- Requires **Angular 22** and **TypeScript 6**.

### Fixed

- Auto-dismiss no longer adds a stray 300ms to every timeout to compensate for
  the exit animation.
- Timers are cleared when the service is destroyed, and when a toast is dropped
  by the `maxToasts` cap.
- Clicking the close button no longer also triggers the toast body's click
  handler.
- The toast container no longer intercepts pointer events over the rest of the
  page; only the toast cards themselves are clickable.
- `ToastOverlayService` resolves `document` through Angular's `DOCUMENT` token
  rather than the global, and tears the overlay down on destroy.
- **CSS custom property overrides now actually apply.** The library declared its
  tokens on `:host`, which compiles to an attribute selector that outranks both
  a consumer's `ngx-toast-alerts { … }` rule and anything inherited from
  `:root` — so every theme override was silently discarded. The library now only
  *reads* the public tokens with a fallback (`var(--ngx-toast-radius, 20px)`)
  into private ones, and never declares them.

### Removed

- The `--toast-*` CSS variables. They are replaced by a larger `--ngx-toast-*`
  set — see the Styling section of the README for the full list.
- The `ng-version` host attribute that the component used to set on itself.

### Migration

`success`, `error`, `info` and `pending` keep their signatures, so most
applications only need the dependency bump. Beyond that:

- Rename any `--toast-success-bg` style overrides to `--ngx-toast-success`, and
  likewise for the other types. Toasts are now light cards with a coloured icon,
  so the old `*-color` text variables have no equivalent.
- If you spread `provideNgxToastAlerts()` into a providers array, stop — it
  returns `EnvironmentProviders` and is used directly.
- If you relied on toasts rendering at the global position despite passing a
  per-toast `position`, remove the per-toast option.

## [2.0.8] - 2025-02-04

### Changed

- Rebuilt against Angular 19.

## [2.0.0] - 2024-08-24

### Added

- `provideNgxToastAlerts()` for standalone bootstrap configuration.
- Automatic overlay creation, removing the need to place `<ngx-toast-alerts>`
  in a template.
- Server-side rendering support.

## [1.0.0] - 2024-08-24

### Added

- Initial release: success, error, info and pending toasts, four corner
  positions, configurable timeout and click-to-close.

> Entries before 3.0.0 were reconstructed from the published release history;
> the 2.0.1–2.0.7 patch releases are folded into the 2.0.8 entry.

[Unreleased]: https://github.com/babatundelmd/ngx-toast-alerts/compare/v3.0.1...HEAD
[3.0.1]: https://github.com/babatundelmd/ngx-toast-alerts/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/babatundelmd/ngx-toast-alerts/compare/v2.0.8...v3.0.0
[2.0.8]: https://github.com/babatundelmd/ngx-toast-alerts/compare/v2.0.0...v2.0.8
[2.0.0]: https://github.com/babatundelmd/ngx-toast-alerts/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/babatundelmd/ngx-toast-alerts/releases/tag/v1.0.0
