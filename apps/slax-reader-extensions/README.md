# Slax Reader 浏览器扩展

Slax Reader 是一款 AI 驱动的浏览器扩展：一键收藏网页、自动生成大纲与重点摘要、支持划线标注、评论与 AI 对话，为用户提供增强的阅读与内容组织体验。

## 项目概述

扩展基于 [WXT](https://wxt.dev/) 框架与 Vue 3 构建，采用 Manifest V3。核心能力包括：

- **一键收藏**：通过图标、右键菜单或快捷键（`Alt+Y`）将当前网页收藏到 Slax Reader。
- **内容提取**：使用 `@slax-lab/readability` 解析正文，生成可阅读的纯净内容。
- **AI 总结与大纲**：自动生成文章概览（AIOverview）、要点摘要（AISummaries）与思维导图（MarkMindMap）。
- **划线标注与评论**：基于共享的 `@slax-reader/selection` 引擎实现文本选区高亮、评论与协作。
- **AI 对话**：内置 Chatbot，可针对当前文章提问。
- **侧边栏面板**：在页面右侧提供 AI / 大纲 / 对话 / 分享 / 评论 / 归档 / 收藏 / 反馈等快捷入口。
- **登录态同步**：监听 Cookie 与网络变化，后台 Service Worker 定时增量同步收藏数据（支持 WebSocket 实时更新）。

## 技术栈

- **核心框架**：Vue 3.5（`@wxt-dev/module-vue`）
- **扩展框架**：WXT 0.20（Manifest V3）
- **构建工具**：Vite 8
- **样式**：UnoCSS（`@wxt-dev/unocss`）+ SCSS
- **国际化**：`@wxt-dev/i18n`（en / zh_CN）
- **埋点分析**：`@wxt-dev/analytics` + Google Analytics 4
- **内容解析**：`@slax-lab/readability`
- **划线引擎**：`@slax-reader/selection`（workspace 包，位于 `commons/selection`）
- **浏览器 API**：Chrome / Firefox Extensions API（最低 Chrome 115）

## 项目结构

```
.
├── src/
│   ├── app.config.ts             # WXT App Config（埋点/分析配置）
│   ├── components/               # UI 组件
│   │   ├── AIOverview.vue         # AI 文章概览
│   │   ├── AISummaries.vue        # AI 要点摘要
│   │   ├── BookmarkTags.vue       # 收藏标签管理
│   │   ├── Collect.vue            # 收藏弹窗（content 注入）
│   │   ├── CopyButton.vue         # 复制按钮
│   │   ├── DotLoading.vue         # 加载动画
│   │   ├── PanelOperate.vue       # 面板操作栏
│   │   ├── PanelView.vue          # 面板视图容器
│   │   ├── SidePanel.vue          # 侧边栏主面板
│   │   ├── SidebarItems.vue       # 侧边栏快捷入口项
│   │   ├── Chat/                  # AI 对话：ChatBot / 各类消息气泡 + chatbot.ts 逻辑
│   │   ├── Markdown/              # Markdown 渲染：MarkdownText / MarkMindMap（思维导图）
│   │   ├── Modal/                 # 弹窗：About / Feedback / ShareModal
│   │   ├── Selection/             # 划线标注 UI + adapters（桥接 selection 引擎到扩展环境）
│   │   ├── Tips/                  # 引导提示：SidebarTips / TextTips
│   │   └── Toast/                 # 全局 Toast 提示
│   ├── config/
│   │   ├── message.ts            # 消息协议与 action 枚举（content ↔ background）
│   │   └── panel.ts             # 侧边栏面板项定义（PanelItemType、图标资源）
│   ├── entrypoints/
│   │   ├── background/           # MV3 后台 Service Worker，按职责拆分为服务
│   │   │   ├── index.ts          # 入口编排：事件监听与服务装配
│   │   │   ├── authService.ts    # 登录态 / Token 管理
│   │   │   ├── bookmarkService.ts# 收藏增删改、增量同步与 Socket
│   │   │   ├── browserService.ts # 角标、右键菜单、标签页、弹窗
│   │   │   ├── config.ts         # 常量配置（同步周期等）
│   │   │   ├── indexedDB.ts      # 本地收藏变更队列（IndexedDB）
│   │   │   ├── messageHandler.ts # runtime 消息路由
│   │   │   ├── storageService.ts # Token / 用户数据存储
│   │   │   └── types.ts          # 后台共享类型
│   │   ├── content/index.ts      # 内容脚本：以 Shadow DOM 挂载收藏弹窗与侧边栏
│   │   └── mark.content.css      # 注入页面的划线高亮样式
│   ├── locales/                  # 国际化文案（en.json / zh_CN.json）
│   ├── styles/reset.scss         # 样式重置
│   ├── utils/                    # 工具函数（request / jwt / locale / url / website / analytics / examine）
│   ├── public/icon/              # 扩展图标（16/32/48/128）
│   └── vite-env.d.ts
├── plugins/                      # 构建插件（图标迁移、UTF-8 转换）
├── package.json
├── tsconfig.json
└── wxt.config.ts                 # WXT 配置（manifest、模块、别名、构建钩子）
```

## 开发指南

### 环境要求

- **Node.js**: >= 20
- **包管理器**: pnpm >= 9

> 本扩展是 monorepo 的一个 workspace 包，依赖 `commons/` 下的共享包（`@slax-reader/selection`、`@commons/types`、`@commons/utils`）。请在仓库根目录执行 `pnpm install`。

### 安装依赖

```bash
pnpm install
```

### 开发模式

启动带热重载的开发服务器（默认端口 3001）：

```bash
pnpm run dev          # Chrome / Edge
pnpm run dev:firefox  # Firefox
```

### 类型检查

```bash
pnpm run compile      # vue-tsc 类型检查（不输出文件）
```

### 代码质量

```bash
pnpm run lint:fix     # ESLint 自动修复
```

### 构建

```bash
pnpm run build          # Chrome / Edge
pnpm run build:firefox  # Firefox
```

生成分发用压缩包：

```bash
pnpm run zip          # Chrome / Edge
pnpm run zip:firefox  # Firefox
```

## 安装与使用

1. 构建扩展（`pnpm run build`），产物输出到 `build/chrome-mv3`。
2. 在 Chrome 中访问 `chrome://extensions`。
3. 开启右上角的「开发者模式」。
4. 点击「加载已解压的扩展程序」。
5. 选择 `build/chrome-mv3` 目录。

> **注意**：每次更新代码并重新构建后，需在扩展管理页面点击 `Slax Reader` 的刷新按钮以应用更改。开发模式（`pnpm run dev`）下产物为 `build/chrome-mv3-dev`，支持热重载。

## 贡献指南

欢迎提交 Pull Request 或 Issue 来帮助改进 Slax Reader。请确保遵循项目的代码风格（ESLint + Prettier）和提交规范。

## 许可证

`Slax Reader` 基于 [Apache License 2.0](../../LICENSE) 许可，社区版 100% 免费且开源，永久提供。
