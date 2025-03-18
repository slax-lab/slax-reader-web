# Slax Reader DWeb 页面

## 项目概述

Slax Reader DWeb 是一个基于现代 Web 技术的阅读应用，提供强大的内容处理和展示功能。

## 项目结构

```bash
.
├── README.md
├── nuxt.config.ts                # Nuxt 配置文件
├── package.json
├── public
│   └── favicon.ico
├── slax-reader-dweb.code-workspace
├── layers
│   └── core
│       ├── app.vue
│       ├── assets
│       ├── components
│       ├── composables
│       ├── error.vue
│       ├── i18n
│       ├── layouts
│       ├── middleware
│       ├── nuxt.config.ts
│       ├── pages
│       ├── public
│       ├── stores
│       ├── styles
│       ├── uno.config.ts
│       └── utils
├── src
│   ├── app.vue                   # 应用入口组件
│   ├── components/               # UI 组件目录
│   │   └── global/               # 全局组件 (自动注册)
│   │   └── ...
│   ├── composables/              # 可复用逻辑函数 (自动注册)
│   │   └── ...
│   ├── utils/                    # 工具方法 (自动注册)
│   │   └── ...
│   ├── middleware/               # 中间件 (自动注册)
│   │   └── ...
│   ├── styles/                   # 样式文件目录
│   │   └── global/               # 全局样式 (自动注册)
│   ├── layouts/                  # 页面布局
│   │   └── default.vue
│   ├── pages/                    # 页面组件
│   ├── service-workers/          # 浏览器后台 Workers
│   └── server/                   # 服务端逻辑 (API, SSR)
│       └── tsconfig.json
└── tsconfig.json
```

## 技术栈

### 核心框架与工具

- Nuxt.js (Vue 3 框架)
- Vite.js (构建工具)
- Pinia (状态管理)
- VueUse (实用工具集)
- Vite-PWA (PWA 支持)
- Nuxt-i18n (国际化)

### 功能实现库

- Markdown-it (Markdown 解析)
- Markmap (思维导图)

## 开发指南

### 环境设置

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build

# 本地预览生产版本
pnpm run preview
```

## 国际化 (i18n) 指南 ‼️

项目使用 nuxt-i18n (基于 vue-i18n) 进行国际化开发，请遵循以下规范：

1. **配置位置**：i18n 文字配置位于项目根目录的 `i18n.config.ts` 文件中

2. **避免字符串拼接**：不要使用字符串拼接或模板字符串 (\`${}\`)，应使用插值：

   ```javascript
   // 配置文件中: "{tips} 访问中"
   // 使用方式:
   t('"{tips}" 访问中...', { tips: '列表页' })
   ```

3. **动态组件中使用**：动态创建的 Vue 组件需要手动获取翻译函数：

   ```javascript
   const t = (text: string) => {
     return useNuxtApp().$i18n.t(text)
   }
   ```

4. **特殊字符处理**：特殊字符如 `@` 需要使用插值形式传入 `{'@'}`

5. **命名规范**：i18n 文案 key 命名遵循以下规则：

   ```
   // 页面文案
   'page.[页面文件名].[内容描述]'
   // 例: page.auth.title, page.bookmarks_index.list.1.title

   // 组件文案
   'component.[组件文件名].[内容描述]'
   // 例: component.login_view.title, component.feedback.placeholder

   // 工具文案
   'util.[工具文件名].[内容描述]'
   // 例: util.request.error

   // 通用文案
   'common.[大类名].[内容描述]'
   // 例: common.tips.success
   ```

## 注意事项

- **自动引入更新**：如发现自动引入未更新，运行 `npx nuxt prepare` 更新类型定义

- **国际化开发**：避免在需要国际化的地方使用字符串拼接

- **开发文档**：参考 [Nuxt.js 文档](https://nuxt.com/docs/getting-started/deployment) 和 [SSR 指南](https://nuxt.com/docs/guide/concepts/rendering)

## 许可证

`Slax Reader` 基于 [Apache License 2.0](../../LICENSE) 许可，社区版 100% 免费且开源，永久提供。
