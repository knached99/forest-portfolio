<!--
## Sync Impact Report

**Version change**: (template) → 1.0.0
**Bump rationale**: MINOR — initial population of all principles and sections from template placeholders.

### Principles established
- I. Secure Coding Foundation (new)
- II. Content Security Policy (new)
- III. Data Protection & HTTPS (new)
- IV. Third-Party Integration Safety (new)
- V. Security-Aware UX (new)

### Sections added
- Security Standards
- Development Workflow

### Templates reviewed
- `.specify/templates/plan-template.md` ✅ reviewed — Constitution Check section present, aligns with principles
- `.specify/templates/spec-template.md` ✅ reviewed — security requirements (FR-005 logging) align with Principle I
- `.specify/templates/tasks-template.md` ✅ reviewed — "Security hardening" task in Polish phase aligns with all principles
- `.specify/templates/commands/` ⚠ no command files found — skipped

### Deferred items
- None
-->

# Forest Portfolio Constitution

## Core Principles

### I. Secure Coding Foundation

Every feature MUST apply input validation and sanitization at all system boundaries (user
input, external APIs, URL parameters). Hard-coded credentials are strictly prohibited.
Error handling MUST NOT expose internal implementation details or stack traces to the
client. The principle of least privilege MUST apply: each component requests only the
permissions and data access it requires. Strong, industry-standard encryption algorithms
MUST be used wherever sensitive data is processed or stored.

**Rationale**: XSS, injection attacks, and credential leakage originate from failures at
the coding level. These rules close the most common attack vectors before they reach
infrastructure.

### II. Content Security Policy (CSP)

All pages MUST declare a strict Content-Security-Policy header (or meta tag for static
deployments). Inline scripts and `eval()` are prohibited unless an explicit,
documented exemption is approved via the amendment process. Trusted sources for scripts,
styles, fonts, and media MUST be enumerated and kept to the minimum necessary set.
CSP violations MUST be monitored via a `report-uri` or `report-to` endpoint.

**Rationale**: CSP is the primary browser-level defence against XSS and data-injection
attacks. Strict policies limit the blast radius of any injected content.

### III. Data Protection & HTTPS

All data in transit MUST use TLS (HTTPS). HTTP endpoints are not permitted in production.
Sensitive data (tokens, PII, payment details) MUST NOT be stored in `localStorage` or
URL query parameters. Cookies that carry session state MUST use `HttpOnly`, `Secure`,
and `SameSite=Strict` (or `Lax` with documented justification). Security-relevant events
(login, logout, permission changes) MUST be logged and monitored. Security patches MUST
be applied within 7 days of a disclosed vulnerability affecting a project dependency.

**Rationale**: Data protection at rest and in transit prevents passive eavesdropping and
session hijacking, which are trivial on unencrypted channels.

### IV. Third-Party Integration Safety

Every external library or API integration MUST be reviewed for known CVEs before
inclusion. Dependencies MUST be pinned to exact versions in the lock file and audited
on each release cycle. Subresource Integrity (SRI) hashes MUST be applied to any
script or stylesheet loaded from a CDN. Third-party scripts MUST be loaded with the
least-permissive `crossorigin` attribute and, where possible, sandboxed in iframes
with a restrictive `sandbox` attribute. Unused dependencies MUST be removed promptly.

**Rationale**: Third-party code is the most common source of supply-chain attacks.
Pinning and integrity verification ensure that what ships is what was reviewed.

### V. Security-Aware UX

Security controls MUST NOT create unnecessary friction: authentication flows MUST
communicate their protective purpose clearly using plain language and visual indicators.
Multi-factor authentication MUST be offered for user accounts and MUST be the default
for privileged actions. Sensitive information MUST be progressively disclosed — shown
only when needed and hidden otherwise. Users MUST receive real-time notifications for
security-relevant events (new login, password change, suspicious activity). Privacy
and security preferences MUST be user-configurable without requiring support intervention.

**Rationale**: Security that frustrates users gets bypassed. Integrating security into
the UX ensures compliance without degrading the experience, as demonstrated by Google
CSP, GitHub 2FA, and Stripe 3D Secure implementations.

## Security Standards

All new features MUST include a security checklist review before merge covering at
minimum: input validation, output encoding, authentication/authorisation impact, and
dependency additions. CSRF protection (SameSite cookies and/or token-based) MUST be
applied to all state-mutating requests. Automated dependency scanning (e.g., `npm audit`,
`Dependabot`) MUST be enabled and blocking on high/critical severity findings. Penetration
testing MUST be performed before any public launch and after major architectural changes.
Security incidents MUST be documented in a post-mortem within 5 business days.

## Development Workflow

Feature branches MUST be created from `main` using the naming convention
`###-short-description`. All work MUST pass linting, type checking, and automated
security scans before a pull request can be merged. Pull requests require at least one
peer review with explicit sign-off on the security checklist. Commits MUST be atomic and
reference the relevant feature or task identifier. The Specify workflow (`/speckit-specify`
→ `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`) is the mandated path for
new features. Deviations require documented justification in the PR description.

## Governance

This constitution supersedes all other project guidelines. Amendments require: (1) a
written proposal describing the change and rationale, (2) review and approval by the
project maintainer, and (3) a migration plan if existing code is non-compliant.
Version increments follow semantic versioning: MAJOR for principle removals or
incompatible redefinitions, MINOR for new principles or materially expanded guidance,
PATCH for clarifications and wording fixes. All pull requests and code reviews MUST
verify compliance with the principles above. Complexity MUST be justified against the
simplest alternative. This constitution is reviewed at minimum every 6 months.

**Version**: 1.0.0 | **Ratified**: 2026-04-18 | **Last Amended**: 2026-04-18
