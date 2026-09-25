<!-- SYNC CONTRACT: Architecture changes require documentation updates. -->

# Astryx

An independent adaptation of [Meta's Astryx](https://github.com/facebook/astryx),
with a planned move to Material 3.

**Current status:** The code still implements the inherited Astryx design system.
It does not yet claim Material 3 conformance. It is built on
[React 19+](https://react.dev) and [StyleX](https://stylexjs.com).

## Origin and attribution

Astryx was created and open-sourced by Meta Platforms, Inc. This repository
continues that work independently and is not affiliated with or endorsed by
Meta. The original Meta copyright and MIT permission notice remain in the
[LICENSE](LICENSE) file and in the package license copies.

The [original project](https://github.com/facebook/astryx) remains the source
for its own releases, documentation, and contributor processes. Changes to
this repository belong here; see [Contributing](CONTRIBUTING.md).

## Overview

The original Astryx grew inside Meta before its open-source release. This
repository retains its component library and tooling while preparing a
Material 3 adaptation.

It ships 150+ accessible components, brand-level theming, dark mode, ready-to-ship templates, and a CLI as one cohesive system. You import pre-built CSS and use typed React components — no build plugin, no styling library to adopt — and both people and AI assistants build with the same tooling.

**What makes Astryx different:**

- **Open internals.** Components are built to be composed at any level, not locked behind a closed top-level API. The building blocks you'd reach for are exported directly, and when you need to go deeper, swizzle ejects a component's full source into your project to own.
- **No styling lock-in.** Astryx authors its styles with StyleX, but that's invisible to consumers. Override with `className` using Tailwind, CSS modules, or plain CSS — whatever your project already uses.
- **Customize without wrapping.** A theme is a set of CSS custom property overrides, so a designer can make Astryx unmistakably theirs without forking or wrapping component source.
- **Built for people and agents.** The API, docs, and CLI are designed together so a person and an AI assistant build the same way, from the same reference.

## Getting Started

The current components require **React 19** or later (`react` and `react-dom`
are peer dependencies of `@astryxdesign/core`). The commands below install
published `@astryxdesign` packages, not a build of this checkout or a Material 3
adaptation. To work with this repository's source, follow
[Contributing](CONTRIBUTING.md#getting-started).

Install Astryx, a theme, and its peer dependencies:

```bash
# npm
npm install @astryxdesign/core @astryxdesign/theme-neutral @stylexjs/stylex
npm install -D @astryxdesign/cli

# pnpm
pnpm add @astryxdesign/core @astryxdesign/theme-neutral @stylexjs/stylex
pnpm add -D @astryxdesign/cli

# yarn
yarn add @astryxdesign/core @astryxdesign/theme-neutral @stylexjs/stylex
yarn add -D @astryxdesign/cli
```

The simplest setup is a few CSS imports plus a theme provider — no build plugin, no PostCSS or Babel config. See the **[@astryxdesign/core README](packages/core/README.md#quick-start)** for the full guide (Next.js, Tailwind, Vite, and CDN).

For reliable CLI access, add a script to your `package.json`:

```json
"scripts": {
  "astryx": "node node_modules/@astryxdesign/cli/clients/cli/bin/astryx.mjs"
}
```

Then use it as `npm run astryx -- component --list`. This avoids path errors when AI assistants or new developers invoke the CLI directly.

## Workspace packages

| Package                                    | Description                                                                                          | README                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------- |
| [`@astryxdesign/core`](packages/core)      | Components, theme system, and utilities                                                              | [README](packages/core/README.md)  |
| [`@astryxdesign/cli`](packages/cli)        | CLI tooling: component docs, templates, scaffolding, themes, and codemods                            | [README](packages/cli/README.md)   |
| [`@astryxdesign/build`](packages/build)    | Build plugins for StyleX source builds                                                               | [README](packages/build/README.md) |
| [`@astryxdesign/theme-*`](packages/themes) | Seven ready-made, fully customizable themes (neutral, butter, chocolate, matcha, stone, gothic, y2k) | [README](packages/themes)          |

> `@astryxdesign/lab` (experimental components) is used internally for Storybook and the sandbox and is not published to npm. `@astryxdesign/vega` (Vega/Vega-Lite chart wrapper) and `@astryxdesign/charts` (chart components) are published to npm only under the `@canary` dist-tag — there is no stable release yet.

## Principles

These are the promises Astryx makes to the people building on it.

- **Guidance over enforcement.** Components give you capability rather than guardrails that fight you. Design opinions live in docs and examples — if you pass a value, the component renders it.
- **Strong, documented conventions.** Every component follows the same naming, prop, and composition rules, and every one is thoroughly documented — so once you've learned a few, the rest feel familiar, and both people and AI can predict how an unfamiliar component behaves.
- **One system for humans and AI.** The API, conventions, docs, and CLI are designed together so people and AI assistants build the same way. Every change that made Astryx easier for AI made it easier for people too.
- **Earned by measurement.** We test conventions rather than assert them, hold the results loosely, and revisit them when a new situation proves them wrong.

## Architecture

### Foundations

The building blocks for visually cohesive and accessible interfaces: typography, color, layout, and accessibility.

### Components

A library of 150+ reusable UI building blocks with full TypeScript support.

### Patterns

Battle-tested design solutions for common interactions and workflows: table pages, detail page layouts, form wizards, navigation patterns, data entry flows.

## Project Structure

| Directory   | Purpose                                                     |
| ----------- | ----------------------------------------------------------- |
| `apps/`     | Example apps, the docsite, and Storybook                    |
| `packages/` | Workspace packages: core, cli, build, themes                |
| `internal/` | Internal tooling: test utilities, eslint plugin, vibe tests |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup and
[docs/contributing/](docs/contributing/README.md) for this repository's review
process. The original project's wiki describes Meta's upstream process; it
does not govern changes here.

Quick start for contributors: this repo uses **Node 22+ on an active LTS line**
and **pnpm 11**. Install pnpm directly, or enable
[Corepack](https://nodejs.org/api/corepack.html) once so the pinned pnpm version
installs automatically:

```bash
corepack enable
pnpm install
```

If `corepack` is missing, install pnpm directly or install Corepack manually;
see the troubleshooting notes in
[CONTRIBUTING.md](CONTRIBUTING.md#troubleshooting).

## License

This repository retains Meta's [MIT license and copyright notice](LICENSE).
The same notice is included in publishable workspace packages.
