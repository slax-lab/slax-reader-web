<div align="center">
<img src="https://r.slax.com/icon.png" />
<h1> <a href="https://slax.com/slax-reader.html">Slax Reader Web </a> </h1>
<h1>Simple tools for a relaxed life</h1>

[![GitHub pull requests](https://img.shields.io/github/issues-pr/slax-lab/slax-reader-web?style=flat)](https://github.com/slax-lab/slax-reader-web/pulls) [![GitHub closed pull requests](https://img.shields.io/github/issues-pr-closed/slax-lab/slax-reader-web?style=flat)](https://github.com/slax-lab/slax-reader-web/pulls?q=is%3Apr+is%3Aclosed) [![GitHub issues](https://img.shields.io/github/issues/slax-lab/slax-reader-web?style=flat)](https://github.com/slax-lab/slax-reader-web/issues) [![GitHub closed issues](https://img.shields.io/github/issues-closed/slax-lab/slax-reader-web?style=flat)](https://github.com/slax-lab/slax-reader-web/issues?q=is%3Aissue+is%3Aclosed) ![Stars](https://img.shields.io/github/stars/slax-lab/slax-reader-web?style=flat) ![Forks](https://img.shields.io/github/forks/slax-lab/slax-reader-web?style=flat)

[简体中文](./README_CN.md) | English

</div>

<div align="center">
    <a href="https://slax.com/slax-reader.html">Home Page</a> |
    <a href="https://t.me/slax_app">Channel</a> |
    <a href="https://r.slax.com">Live Site</a>
</div>
</br>

Slax Reader Web service includes [browser-based web app](./apps/slax-reader-dweb/README.md) and [browser extension services](./apps/slax-reader-extensions/README.md) and needs to work in conjunction with the [Slax Reader API](https://github.com/slax-lab/slax-reader-api) / [Slax Reader APP](https://github.com/slax-lab/slax-reader-client). This document provides deployment and development tutorials. For direct use of Slax Reader, please visit [Slax Reader](https://r.slax.com) or [Slax Reader Bot](https://t.me/slax_reader_bot).

<div align="center">

</div>
</br>

# ✨ Get Slax Reader

> If you want to use Slax Reader directly, you can:

#### Read on web

- Web: visit [Slax Reader](https://r.slax.com) to create your free account (no downloads needed).

- Browser Extensions (save links in one click):
  - [Chrome Web Store](https://chromewebstore.google.com/detail/slax-reader/gdnhaajlomjkhahnmiijphnodkcfikfd) (also works on Edge)

#### Read on mobile

- [Slax Reader Bot](https://t.me/slaxreaderbot): save articles directly from your phone.

#### Coming soon

- iOS/Android/Desktop apps (under active development).

# 💻 Development

## Requirements

- **Node.js**: >= 20
- **Package Manager**: pnpm >= 9

## Quick Start

```bash
# Install dependencies
pnpm install

# Development
pnpm run dev                    # Interactive mode - choose which app to run
pnpm run dev:dweb               # Run web app only
pnpm run dev:extensions         # Run browser extension only

# Build
pnpm run build:dweb             # Build web app
pnpm run build:extensions       # Build browser extension
pnpm run build:extensions:zip   # Build and create zip for extension

# Code Quality
pnpm run lint                   # Check code style
```

For detailed development guide, see [Development Documentation](./public/DEVELOPMENT-DOCUMENT-EN.md).

# 🚀 Self-Deploy

Quickly deploy your own version! This project supports multiple deployment methods. Check out our [Deploy Document](./public/DEPLOY-EN.md) for complete step-by-step instructions.

# 🎉 Feature List

- [x] Supports saving web pages via URL / extensions / Telegram
- [x] Allows underlining, commenting, replying, sharing, starring, and archiving saved content
- [x] AI interaction, AI summarization, underlined dialogue, and AI tag generation for saved content
- [x] Keyword or semantic search for saved content
- [x] Supports importing bookmarks from Omnivore
- [x] Supports WebSocket / Browser Push for notifications
- [x] Server-side rendering and web app usage

# 🤝 How to Contribute

You can contribute to the code by understanding our development, deployment, and basic standards, helping to improve the product. [Development Documentation](./public/DEVELOPMENT-DOCUMENT-EN.md)

# 💖 Contributors

💖 [Thank you to every contributor who helps make Slax Reader better](https://github.com/slax-lab/slax-reader-web/graphs/contributors) 💖

![contributors](https://contrib.rocks/image?repo=slax-lab/slax-reader-web)

# 🙏 Acknowledgments

In developing Slax Reader Web, we have utilized numerous excellent open-source projects and tools. We sincerely thank the contributors of these projects:

- ⚡ [Vue](https://vuejs.org/)
- 🚀 [Nuxt](https://nuxt.com/)
- 🧩 [WXT](https://wxt.dev/)
- 🎨 [UnoCSS](https://unocss.dev/)
- 🪝 [VueUse](http://vueuse.org/)
- 📦 [Pinia](https://pinia.vuejs.org/)
- ⚙️ [Vite](https://vite.dev/)
- 💄 [Sass](https://sass-lang.com/)
- 📝 [markdown-it](https://markdown-it.github.io/)
- 📱 [VitePWA](https://vite-pwa-org.netlify.app/)
- 🗺️ [Markmap](https://markmap.js.org/)
- 🔷 [TypeScript](https://www.typescriptlang.org/)
- 🔍 [ESLint](https://eslint.org/)
- 🧹 [Prettier](https://prettier.io/)
- 🧰 [Workbox](https://github.com/GoogleChrome/workbox)

# Trademark Policy

The project name Slax Reader, its logo, and any other trademarks, service marks, graphics, and logos used in connection with this project are trademarks or registered trademarks of Slax Lab and may not be used for commercial purposes without prior written permission from Slax Lab.

This trademark restriction does not affect the terms of the Apache License 2.0 as it applies to the software code and documentation, but is an additional requirement.

Specifically:

You may not use the project logo, name, or other trademarks for any commercial purpose without explicit written permission. You may use the project name only for accurate reference to identify that your work is based on this project, but not in a way that suggests endorsement or affiliation. Any modified versions of this software must be clearly labeled as such and must not be labeled or marketed in a manner that suggests they are the official distribution of the original project. For trademark use permission, please contact Slax Lab Teams (ns.boxcounter@gmail.com.).

Please refer to our [trademark and usage policy](./TRADEMARK.md)

# 📝 License

`Slax Reader` is licensed under the [Apache License 2.0](./LICENSE).
