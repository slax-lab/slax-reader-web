# 部署指南

## 插件端 (Extensions)

插件项目基于 `wxt` 构建系统，支持多浏览器平台部署。

### 构建命令

```shell
# 生成插件文件夹
pnpm run build:extensions

# 生成插件文件并打包为 zip 格式
pnpm run build:extensions:zip
```

### 多浏览器支持

默认配置下，构建产物适用于 Chrome 浏览器。如需支持其他浏览器平台，可使用 `-b` 参数指定目标平台：

```shell
# 示例：构建 Firefox 插件
pnpm run build:extensions -b firefox
```

构建完成后，插件文件将位于 `dist/` 目录下的对应浏览器文件夹中。

更多平台支持及发布选项，请参阅 [WXT 官方文档](https://wxt.dev/guide/essentials/publishing.html)。

## 网页端 (DWeb)

网页项目基于 `Nuxt.js` 框架开发，针对云服务部署进行了优化。

### 构建命令

```shell
# 构建网页应用
pnpm run build:dweb
```

构建完成后，产物将位于 `.output/` 目录中，包含静态文件和服务端代码（如适用）。

### 部署配置

- 默认使用 `cloudflare` 预设进行构建优化
- 如需调整部署目标，请修改 `nuxt.config.ts` 中的 `preset` 配置项：

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // 更改为其他部署平台预设
  nitro: {
    preset: 'vercel' // 或 'netlify', 'aws-lambda' 等
  }
})
```

完整部署选项及平台支持，请参阅 [Nuxt.js 部署文档](https://nuxt.com/docs/getting-started/deployment)。

### Cloudflare Pages 部署

项目推荐使用 Cloudflare Pages 进行部署，支持两种部署方式：

1. **GitHub 仓库集成部署**：自动监听代码变更并部署

   - 详细步骤：[Cloudflare Pages Git 集成部署指南](https://developers.cloudflare.com/pages/get-started/git-integration/)
   - 构建命令设置：`pnpm run build:dweb`
   - 输出目录设置：`.output/public`

2. **手动上传部署**：将构建产物直接上传到 Cloudflare
   - 详细步骤：[Cloudflare Pages 直接上传指南](https://developers.cloudflare.com/pages/get-started/direct-upload/)
   - 上传 `.output/public` 目录中的内容

### 其他部署平台

本项目也可部署到其他平台，如 Vercel、Netlify 或传统服务器：

- **Vercel/Netlify**: 通过调整 `preset` 并按照平台指南配置
- **传统服务器**: 将 `.output` 目录内容部署到 Web 服务器

选择适合您工作流的部署方式，确保应用稳定可靠地交付给最终用户。
