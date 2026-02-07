# SlaxReader 浏览器扩展

SlaxReader 是一款功能强大的浏览器扩展，为用户提供增强的阅读和内容组织体验。

## 项目概述

SlaxReader 利用现代前端技术和浏览器扩展 API，帮助用户更高效地管理和处理网页内容。支持内容提取、知识图谱构建和高级标注功能。

## 技术栈

- **核心框架**: Vue.js
- **构建工具**: Vite.js
- **扩展开发框架**: WXT
- **浏览器 API**: Chrome Extensions API

## 项目结构

```
.
├── src/
│   ├── components/           # 可复用 UI 组件
│   ├── config/               # 应用配置
│   │   └── index.ts          # 主配置文件
│   ├── entrypoints/          # 扩展入口点
│   │   ├── background/       # 后台脚本
│   │   │   ├── action.ts
│   │   │   └── index.ts
│   │   ├── content/          # 内容脚本
│   │   │   ├── app.vue
│   │   │   └── index.ts
│   │   └── sidepanel/        # 侧边栏面板
│   ├── public/               # 静态资源
│   │   ├── icon/             # 图标资源
│   │   └── wxt.svg
│   ├── tools/                # 工具函数
│   ├── types/                # TypeScript 类型定义
│   └── vite-env.d.ts         # Vite 环境声明
├── README.md
├── package.json
├── pnpm-lock.yaml
├── slax-reader-wxt.code-workspace
├── tsconfig.json
└── wxt.config.ts             # WXT 配置文件
```

## 开发指南

### 环境要求

- **Node.js**: >= 20
- **包管理器**: pnpm >= 9

### 安装依赖

```bash
pnpm install
```

### 开发模式

启动带有热重载的开发服务器:

```bash
# Chrome/Edge 浏览器
pnpm run dev

# Firefox 浏览器
pnpm run dev:firefox
```

### 类型检查

```bash
# TypeScript 类型检查（不输出文件）
pnpm run compile
```

### 代码质量

```bash
# 自动修复代码风格问题
pnpm run lint:fix
```

### 构建

标准构建:

```bash
# Chrome/Edge 浏览器
pnpm run build

# Firefox 浏览器
pnpm run build:firefox
```

生成压缩包用于分发:

```bash
# Chrome/Edge 浏览器
pnpm run zip

# Firefox 浏览器
pnpm run zip:firefox
```

## 安装与使用

1. 构建扩展 (`pnpm run build`)
2. 在 Chrome 浏览器中访问 `chrome://extensions`
3. 开启右上角的 "开发者模式"
4. 点击 "加载已解压的扩展程序"
5. 选择项目的 `dist` 目录

> **注意**: 每次更新代码并重新构建后，需要在扩展管理页面点击 `Slax Reader` 扩展的刷新按钮以应用更改。

## 功能特性

- 内容提取与分析
- 知识图谱可视化
- 高级标注工具
- 侧边栏快速访问

## 贡献指南

欢迎提交 Pull Request 或 Issue 来帮助改进 SlaxReader。请确保遵循项目的代码风格和提交规范。

## 许可证

`Slax Reader` 基于 [Apache License 2.0](../../LICENSE) 许可，社区版 100% 免费且开源，永久提供。
