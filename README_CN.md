<div align="center">
<img src="https://r.slax.com/icon.png" />
<h1> <a href="https://slax.com/slax-reader.html">Slax Reader Web </a> </h1>
<h1>Simple tools for a relaxed life</h1>

[![GitHub pull requests](https://img.shields.io/github/issues-pr/slax-lab/slax-reader-web?style=flat)](https://github.com/slax-lab/slax-reader-web/pulls) [![GitHub closed pull requests](https://img.shields.io/github/issues-pr-closed/slax-lab/slax-reader-web?style=flat)](https://github.com/slax-lab/slax-reader-web/pulls?q=is%3Apr+is%3Aclosed) [![GitHub issues](https://img.shields.io/github/issues/slax-lab/slax-reader-web?style=flat)](https://github.com/slax-lab/slax-reader-web/issues) [![GitHub closed issues](https://img.shields.io/github/issues-closed/slax-lab/slax-reader-web?style=flat)](https://github.com/slax-lab/slax-reader-web/issues?q=is%3Aissue+is%3Aclosed) ![Stars](https://img.shields.io/github/stars/slax-lab/slax-reader-web?style=flat) ![Forks](https://img.shields.io/github/forks/slax-lab/slax-reader-web?style=flat)

简体中文 | [English](./README.md)

</div>

<div align="center">
    <a href="https://slax.com/slax-reader.html">Home Page</a> |
    <a href="https://t.me/slax_app">Channel</a> |
    <a href="https://r.slax.com">Live Site</a>
</div>
</br>

Slax Reader Web 服务包含[网页端应用](./apps/slax-reader-dweb/README.md)及[浏览器扩展服务](./apps/slax-reader-extensions/README.md)，需要与项目[Slax Reader API](https://github.com/slax-lab/slax-reader-api) / [Slax Reader APP](https://github.com/slax-lab/slax-reader-client) 配合使用。本文为部署、开发教程，如需直接使用 Slax Reader，请移步 [Slax Reader](https://r.slax.com) 或 [Slax Reader Bot](https://t.me/slax_reader_bot)。

<div align="center">

</div>
</br>

# ✨ Get Slax Reader

> 如果你想直接使用 Slax Reader，你可以：

#### 在网页上阅读

- Web: 访问 [Slax Reader](https://r.slax.com) 创建您的免费账户（无需下载）。

- 浏览器扩展（一键保存链接）：
  - [Chrome Web Store](https://chromewebstore.google.com/detail/slax-reader/gdnhaajlomjkhahnmiijphnodkcfikfd)（也适用于 Edge）

#### 在手机上阅读

- [Slax Reader Bot](https://t.me/slaxreaderbot): 直接从您的手机保存文章。

#### 即将推出

- iOS/Android/Desktop 应用（正在开发中）。

# 💻 开发指南

## 环境要求

- **Node.js**: >= 20
- **包管理器**: pnpm >= 9

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm run dev                    # 交互模式 - 选择要运行的应用
pnpm run dev:dweb               # 仅运行网页应用
pnpm run dev:extensions         # 仅运行浏览器扩展

# 构建
pnpm run build:dweb             # 构建网页应用
pnpm run build:extensions       # 构建浏览器扩展
pnpm run build:extensions:zip   # 构建并打包扩展为 zip

# 代码质量
pnpm run lint                   # 检查代码风格
```

详细开发指南请查看 [开发文档](./docs/DEVELOPMENT-DOCUMENT-CN.md)。

# 🚀 Self-Deploy

快速部署您自己的版本！本项目支持多种部署方式。查看我们的 [部署文档](./docs/DEPLOY-CN.md) 获取完整的步骤说明。

# 🎉 Feature List

- [x] 支持通过 URL / 插件 / Telegram 进行网页收藏
- [x] 支持对收藏内容划线、评论、回复、分享、加星标、归档
- [x] 支持对收藏进行AI对话、AI总结、划线对话、AI标签生成
- [x] 支持对收藏内容进行关键词或语义搜索
- [x] 支持从omnivore导入收藏
- [x] 支持 Websocket / Browser Push 进行消息推送
- [x] 支持服务端渲染及 Web app 使用

# 🤝 How to Contribution

你可以通过了解我们的开发、部署、基础规范来进行代码的贡献，让产品做得更好。[开发文档](./docs/DEVELOPMENT-DOCUMENT-CN.md)

# 💖 Contributors

💖 [Thank you to every contributor who helps make Slax Reader better](https://github.com/slax-lab/slax-reader-web/graphs/contributors) 💖

![contributors](https://contrib.rocks/image?repo=slax-lab/slax-reader-web)

# 🙏 鸣谢

在开发 Slax Reader Web 的过程中，我们使用了许多优秀的开源项目和工具。在此对这些项目的贡献者表示由衷的感谢：

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

# 商标政策

项目名称 Slax Reader、其标志以及与本项目相关的任何其他商标、服务标志、图形和标志均为 Slax Lab 的商标或注册商标，未经 Slax Lab 事先书面许可，不得用于商业目的。

此商标限制不影响 Apache License 2.0 对软件代码和文档的适用条款，但作为一项额外要求。

具体而言：

未经明确书面许可，您不得将项目标志、名称或其他商标用于任何商业目的。您可以使用项目名称仅作为准确引用，以表明您的作品基于本项目，但不得以暗示认可或附属关系的方式使用。本软件的任何修改版本必须清楚地标明为修改版本，且不得以暗示其为原始项目官方发行版的方式进行标记或营销。如需商标使用许可，请联系 Slax Lab 团队 (ns.boxcounter@gmail.com)。

请参阅我们的[商标和使用政策](./docs/TRADEMARK.md)

# 📝 License

`Slax Reader` 基于 [Apache License 2.0](./LICENSE) 许可。
