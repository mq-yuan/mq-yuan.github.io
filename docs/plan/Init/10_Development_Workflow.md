# 10 — Development Workflow

> How this project is developed locally: runtime pinning, package management, common
> commands, quality gates, and git conventions. Environment facts verified 2026-08-25.

## 1. Runtime: Node.js via fnm

- Node version manager: **fnm** (1.39.0 installed). No nvm/volta/asdf/mise.
- Pinned Node: **24** (Active LTS "Krypton", supported until ~April 2028; Astro 7
  requires Node ≥ 22.12, odd majors unsupported). Node 24.15.0 is already installed
  locally as `lts-latest`.
- Pin file: **`.node-version`** at repo root containing `24`. Major-only pinning lets
  fnm resolve the latest installed 24.x while guaranteeing the major.

```bash
fnm use          # reads .node-version
node --version   # v24.x
```

## 2. Package manager: pnpm

- **pnpm only** (11.23.0 installed; pnpm 11 is current stable — pnpm 12 is still RC,
  do not adopt yet).
- Pin via `package.json`:

```json
"packageManager": "pnpm@11.23.0"
```

  Since pnpm 10, `manage-package-manager-versions` is enabled by default: any
  installed pnpm auto-switches to the pinned version. **Do not use corepack** (still
  experimental in Node 24, removed in Node 25+).
- Lockfile policy: **only `pnpm-lock.yaml` is committed.** If `package-lock.json`,
  `yarn.lock`, or `bun.lock` ever appears, delete it — its presence indicates the
  wrong tool was run.

## 3. Common commands

```bash
fnm use            # enter pinned Node
pnpm install       # install deps (frozen by pnpm-lock.yaml)
pnpm dev           # Astro dev server (default http://localhost:4321)
pnpm build         # static production build → dist/
pnpm preview       # serve dist/ locally
pnpm check         # astro check (TypeScript + .astro diagnostics)
pnpm lint          # ESLint (flat config)
pnpm format        # Prettier (with prettier-plugin-astro)
```

(Exact script set finalized in Phase 1; this table is updated if scripts change.)

## 4. Quality gates

Before every commit that touches code:

1. `pnpm format`
2. `pnpm lint`
3. `pnpm check`
4. `pnpm build` (must succeed — Astro 7's Rust compiler is strict about invalid HTML
   and fails the build, which is desirable)

## 5. Git workflow

- **Local-only repository.** No remote, no `git push`, no GitHub repo, no gh-pages
  branch, no Actions — until the author explicitly starts Phase 9.
- Branch: work directly on `main` for now (single developer, local).
- Commits: small, focused, imperative, English. Conventional-commit-style prefixes:

```text
docs: establish website direction and architecture
chore: initialize local astro development environment
feat: establish content collections
feat: implement static site shell
experiment: explore interactive hero concepts
perf: optimize interactive homepage
fix: …
```

- One phase ⇒ a handful of meaningful commits, not one giant commit and not
  per-character commits.
- Ritual per phase: implement → validate (`pnpm build` + manual review) → update
  `docs/plan/` if reality diverged → review `git diff` → commit.

## 6. Editor / tooling notes

- TypeScript strict mode (Astro's `astro/tsconfigs/strict`).
- Prettier + `prettier-plugin-astro`; ESLint flat config with `eslint-plugin-astro`.
- All repository content in English (code, comments, docs, commit messages).

## 7. Environment snapshot (2026-08-25)

| Tool | Version | Source |
| --- | --- | --- |
| fnm | 1.39.0 | Homebrew |
| Node | 24.15.0 (default, lts-latest) | fnm |
| pnpm | 11.23.0 | standalone |
| macOS | Darwin 25.5.0 | — |

Global environment is never modified by this project; everything is pinned at the
repo level.
