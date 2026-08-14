# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Slax Reader Web is the open-source "Read It Later" product: a Nuxt web app plus a WXT browser extension, working together with the Slax Reader API (separate repo) and the Slax Reader App. This is the standalone community edition repo (`slax-lab/slax-reader-web`).

## Development Commands

Run from the repo root unless noted. Package manager is **pnpm** (workspaces). Node `>=20`.

### Core Development

- `pnpm dev` - Start the dev orchestrator (`tsx scripts/start.script.ts`) — interactive picker for which app to run
- `pnpm dev:dweb` - Start the web app (Nuxt) directly (`nuxt dev --host 0.0.0.0`)
- `pnpm dev:extensions` - Start the browser extension in watch mode (WXT)
- `pnpm build:dweb` - Build the web app (`nuxt build`)
- `pnpm build:extensions` - Build the extension; `build:extensions:zip` to package

### Quality

- `pnpm lint` - Run ESLint over the whole repo (`eslint .`)
- `pnpm --F @apps/slax-reader-dweb run lint:fix` - Auto-fix lint in the web app
- `pnpm format` / `pnpm format:check` - Prettier write / check
- Type check (web app): `pnpm --dir apps/slax-reader-dweb exec vue-tsc --noEmit -p .nuxt/tsconfig.app.json` — **the bare `--noEmit` (no `-p`) always exits 0 and checks nothing**; run `nuxt prepare` first if `.nuxt/tsconfig.app.json` doesn't exist yet
- Type check (extension): `pnpm --F @apps/slax-reader-extensions run compile` (`vue-tsc --noEmit`)

### Testing

- `pnpm test` - Run the web app test suite (Vitest, `vitest run`)
- `pnpm test:dweb:watch` - Watch mode
- `pnpm test:dweb:coverage` - With coverage
- Run a single test: `pnpm --F @apps/slax-reader-dweb exec vitest run path/to/test.spec.ts`

## Architecture Overview

### Monorepo Layout

- `apps/slax-reader-dweb/` - The web app (Nuxt). Core logic lives in the `layers/core` Nuxt Layer.
- `apps/slax-reader-extensions/` - The browser extension (WXT).
- `commons/` - Shared workspace packages: `@commons/types`, `@commons/utils`, `@slax-reader/selection`.
- `configs/` - Cross-app config helpers (`cmd.ts`, `env.ts`).

pnpm workspace globs: `apps/*`, `commons/*`.

### Web app (`apps/slax-reader-dweb`) — Nuxt Layers

- `nuxt.config.ts` extends `./layers/core`. Almost all app code (pages/components/composables/stores/i18n/styles) lives under `layers/core/app/...` and `layers/core/i18n/...`.
- Static assets (`/fonts/` etc.) live in `layers/core/public/`.
- **Cloudflare Pages `routes.include` is an allowlist.** `nitro.cloudflare.pages.routes.include` in `nuxt.config.ts` controls which paths are routed to the SSR worker (`_routes.json`); everything else falls back to the static shell. Any new SSR route (a route rule with `ssr: true`) must be added to this include list, or it will work fine in `dev`/`ssr:dev` but 500 after deploying to Cloudflare Pages (typically `TypeError: Cannot read properties of undefined` from `getDefaultCachedData` reading `nuxtApp.static.data[key]` on an undefined container, because the request never reached the worker).

### Extension (`apps/slax-reader-extensions`) — WXT

- Build outDir is `build/` (load `build/chrome-mv3`, not `dist`).
- `postinstall` runs `wxt prepare` + `scripts/build-vendor.script.ts` (vendor externalization for markmap/highlight.js/katex to speed up dev builds).

### Key Technologies

- **Framework**: Nuxt (Vue 3.5), SSR, deployed on Cloudflare Pages/Workers
- **Extension**: WXT
- **Styling**: UnoCSS (attributify + icons + rem-to-px), token-based theming (`layers/core/styles/theme.tokens.css`, light/dark/eink)
- **State**: Pinia
- **Utilities**: VueUse
- **Language**: TypeScript
- **Testing**: Vitest
- **i18n**: `@nuxtjs/i18n` (locales under `layers/core/i18n/locales`, currently `zh.json` / `en.json` — keep them in sync when adding keys)

### Configuration

- `.env.development` / `.env.beta` / `.env.preview` / `.env.production` (+ `.env.development.local`), validated by `env.schema.ts`.
- `configs/env.ts` loads env files and builds the runtime config consumed by both apps.
- Wrangler for Cloudflare Pages: `apps/slax-reader-dweb/wrangler.toml`.

## Important Notes

- **`@slax-reader/selection` must be rebuilt after source edits.** It's a workspace package (`commons/selection`) built with `tsup`; the runtime imports `dist/`, so editing `src/` alone does nothing until you rebuild (`pnpm --F @slax-reader/selection build` or `dev` for watch mode).
- **Restart the dev server after `nuxt.config.ts` / layer / alias changes.** HMR does not pick these up.
- **UnoCSS + bare JS tokens.** UnoCSS can turn bare JS tokens (e.g. `!!container`) into invalid CSS, crashing `build` (lightningcss "Unexpected token '!'") while `dev` looks fine. Avoid class-like bare strings; verify with a real `pnpm build:dweb`, not just `dev`.
- **`v-autofocus` directive** (`layers/core/app/plugins/autofocus.client.ts`) auto-focuses inputs. When used inside a `v-show`-toggled overlay, it must be bound with the open/closed state (e.g. `v-autofocus="isOpen"`) — otherwise it fires at the wrong time (element exists but is hidden).
- Main branch is **`main`**.
- Run `pnpm lint` (and a real type check, see above) before committing.
