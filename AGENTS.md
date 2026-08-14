# AGENTS.md

Guidance for coding agents (Codex, etc.) working in this repository. Mirrors `CLAUDE.md`.

## Project

Slax Reader Web is the open-source "Read It Later" product: a Nuxt web app plus a WXT browser extension, working together with the Slax Reader API (separate repo) and the Slax Reader App. This is the standalone community edition repo (`slax-lab/slax-reader-web`).

## Commands (run from repo root; package manager is pnpm)

- Dev web app: `pnpm dev` (interactive orchestrator) or `pnpm dev:dweb` (Nuxt direct)
- Dev extension: `pnpm dev:extensions`
- Build: `pnpm build:dweb` / `pnpm build:extensions`
- Lint: `pnpm lint` (`eslint .`); fix: `pnpm --F @apps/slax-reader-dweb run lint:fix`
- Format: `pnpm format` / `pnpm format:check`
- Type check (web): `pnpm --dir apps/slax-reader-dweb exec vue-tsc --noEmit -p .nuxt/tsconfig.app.json` (the bare `--noEmit` without `-p` always exits 0 and checks nothing; run `nuxt prepare` first if `.nuxt/tsconfig.app.json` is missing)
- Type check (ext): `pnpm --F @apps/slax-reader-extensions run compile`
- Test: `pnpm test` (Vitest); single: `pnpm --F @apps/slax-reader-dweb exec vitest run <path>`

Do not run `pnpm dev` / build / deploy unprompted during a review. `pnpm lint` and type checks are fine.

## Architecture

Monorepo layout:

- `apps/slax-reader-dweb/` — Nuxt web app; core logic lives in the `layers/core` Nuxt Layer
- `apps/slax-reader-extensions/` — WXT extension
- `commons/` — shared workspace packages (`@commons/types`, `@commons/utils`, `@slax-reader/selection`)
- `configs/` — cross-app config helpers

pnpm workspaces: `apps/*`, `commons/*`.

### Web app (Nuxt Layers)

- `nuxt.config.ts` extends `./layers/core`; almost all app code lives under `layers/core/app/...` and `layers/core/i18n/...`.
- Static assets (`/fonts/` etc.) live in `layers/core/public/`.
- `nitro.cloudflare.pages.routes.include` in `nuxt.config.ts` is an **allowlist** — only listed path globs get routed to the SSR worker on Cloudflare Pages; anything else falls back to the static shell. New SSR route rules (`ssr: true`) must be added here or the page will 500 in production while working fine in `dev`.

### Extension (WXT)

- Build outDir is `build/` (load `build/chrome-mv3`, not `dist`).
- `postinstall` runs `wxt prepare` + vendor build (markmap/highlight.js/katex externalized for dev speed).

## Tech stack

Nuxt (Vue 3.5, SSR) on Cloudflare Pages · WXT extension · UnoCSS (attributify/icons/rem-to-px, token theming light/dark/eink) · Pinia · VueUse · TypeScript · Vitest · `@nuxtjs/i18n`.

## Gotchas

- `@slax-reader/selection` (`commons/selection`) is built with `tsup`; runtime uses `dist/` — editing `src/` alone does nothing until rebuilt.
- Restart the dev server after `nuxt.config.ts` / layer / alias changes.
- UnoCSS can turn bare JS tokens (e.g. `!!container`) into invalid CSS and crash `build` (lightningcss "Unexpected token '!'") while `dev` is fine — verify with a real build.
- `v-autofocus` directive (`layers/core/app/plugins/autofocus.client.ts`): inside a `v-show`-toggled overlay, must be bound with the open/closed state, or it fires while the element is still hidden.
- Main branch is `main`.
- Run `pnpm lint` + a real type check before committing.
