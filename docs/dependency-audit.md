# Dependency audit log

Summary for PAL-S1-002 (2026-11-20). Re-run periodically:

```bash
cd frontend && npm audit --audit-level=high
cd ../backend && source .venv/bin/activate && pip install pip-audit && pip-audit -r requirements.txt
```

## Backend (`pip-audit` on `requirements.txt`)

| Severity | Count | Action |
|----------|-------|--------|
| Critical / High | 0 | No changes required |

Runtime and API dependencies report **no known vulnerabilities** at audit time.

## Frontend (`npm audit`)

### Resolved in PAL-S1-002

Applied `npm audit fix` (no `--force`). Lockfile updates bumped transitive/dev tooling including **vite**, **react-router** / **react-router-dom**, **nanoid**, **postcss**, and **source-map-js**, clearing **5 high** findings.

Post-fix checks: `npm test` (3 passed), `npm run build` succeeded.

### Accepted residual (moderate)

| Package | Advisory (summary) | Action | Rationale |
|---------|-------------------|--------|-----------|
| `postcss-selector-parser` (<6.1.5) | Quadratic complexity in selector parsing (GHSA-rj75-hqrm-r3gf) | **Accepted** | Transitive via `@tailwindcss/typography`. Remediation requires `npm audit fix --force` → pins **@tailwindcss/typography@0.5.4** (breaking vs current ^0.5.20). Risk is dev/build-time parsing of project CSS, not production SPA runtime. Revisit when Tailwind typography releases a compatible fix. |

### Notes

- Do **not** run `npm audit fix --force` without a deliberate Tailwind/UI regression pass.
- High-severity **Vite dev-server** advisories addressed via lockfile bumps; Palander uses Vite for **local dev and production build** only—no public Vite server in production.
- Python dev install: removed invalid `httpx2` from `requirements-dev.txt` (clean-checkout footgun); `httpx` remains on the main `requirements.txt` for the app and TestClient.

## Follow-up

- Re-audit on major frontend toolchain upgrades (Vite 7+, Router 8+).
- Optional: add `pip-audit` to `requirements-dev.txt` for local repeatability (not required in CI for this story).