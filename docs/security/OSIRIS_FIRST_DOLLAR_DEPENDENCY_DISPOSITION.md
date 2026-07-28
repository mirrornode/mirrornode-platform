# Osiris First-Dollar Dependency Disposition

Date: 2026-07-28
Scope: mirrornode-platform / Osiris Audit v1 payment-to-intake path

## Applied remediation

- Next.js upgraded from 16.2.4 to 16.2.12.
- Vitest upgraded from 3.2.4 to 3.2.7.
- Vite, esbuild, js-yaml, brace-expansion, PostCSS, and related transitive dependencies were updated through the non-breaking npm audit remediation path.
- eslint-config-next was aligned to 16.2.12.
- The ESLint configuration was migrated from FlatCompat to the supported Next.js flat configuration.
- No force audit repair or framework downgrade was accepted.

## Verification requirements

- All automated tests pass.
- ESLint completes without errors.
- The production Next.js build completes.
- The Osiris Audit test checkout and intake submission complete.
- Production persistence records payment separately from fulfillment state.

## Residual findings

npm audit continues to report PostCSS 8.4.31 and Sharp 0.34.5 beneath Next.js 16.2.12.

The suggested automated repair would downgrade Next.js to 9.3.3 and is rejected as incompatible and unsafe.

The application does not accept customer-controlled CSS, source maps, or image uploads through the Osiris Audit payment-to-intake path. The residual packages remain governed as upstream framework dependencies pending a compatible Next.js release.

## Stop boundary

This disposition does not authorize ignoring future security releases. Re-run dependency review whenever Next.js, PostCSS, or Sharp publishes a compatible patched release.
