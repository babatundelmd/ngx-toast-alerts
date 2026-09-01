# Security Policy

## Supported Versions

| Version | Supported |
| --- | --- |
| 3.x | ✅ |
| 2.x | ⚠️ Critical fixes only |
| < 2.0 | ❌ |

## Reporting a Vulnerability

Please **do not** open a public issue for a security vulnerability.

Report it privately through
[GitHub Security Advisories](https://github.com/babatundelmd/ngx-toast-alerts/security/advisories/new),
which lets us discuss and fix the issue before it becomes public.

Include as much of the following as you can:

- The affected version and the Angular version you are on.
- A description of the vulnerability and its impact.
- Steps to reproduce, ideally a minimal reproduction.
- Any suggested fix, if you have one in mind.

## What to Expect

- **Acknowledgement** within 5 working days.
- **An initial assessment** — whether we can reproduce it, and the severity we
  assign — within 10 working days.
- **A fix and a release** as quickly as the severity warrants. You will be
  credited in the advisory and the changelog unless you would rather not be.

## Scope

`ngx-toast-alerts` renders toast content into the DOM through Angular's own
interpolation, which escapes HTML. Passing untrusted strings as a toast
`message` or `title` is safe; bypassing that with your own sanitiser overrides
is not, and is outside the scope of this policy.

Vulnerabilities in the development toolchain (the Angular CLI, Vitest, and their
transitive dependencies) affect contributors rather than users of the published
package — those dependencies are not shipped in the npm tarball. Please report
them upstream.
