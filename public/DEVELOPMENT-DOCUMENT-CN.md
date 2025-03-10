# Slax Reader Web 开发调试文档

## 项目架构

### 目录结构

```shell
.
├── apps                          # 应用项目目录
│   ├── slax-reader-extensions    # 浏览器插件项目
│   └── slax-reader-dweb          # 网页版项目
├── commons                       # 公共库目录
│   ├── types                     # 类型定义
│   └── utils                     # 共用工具类
├── configs                       # 配置文件目录
│   ├── cmd.ts                    # 项目运行配置
│   └── env.ts                    # 环境变量配置
├── scripts                       # 脚本目录
│   └── start.script.ts           # 项目启动辅助脚本
├── env.schema.ts                 # 环境变量类型定义
├── uno.config.ts                 # UnoCSS 配置
├── eslint.config.mjs             # ESLint 配置
├── .prettierrc.mjs               # Prettier 配置
├── README.md                     # 项目说明文档
├── package.json                  # 包管理配置
├── pnpm-lock.yaml                # 依赖锁定文件
├── pnpm-workspace.yaml           # 工作区配置
├── tsconfig.base.json            # TypeScript 基础配置
├── tsconfig.json                 # TypeScript 项目配置
└── slax-reader.code-workspace    # VSCode 工作区配置
```

### 核心项目

| 项目名                                                                 | 描述           |
| ---------------------------------------------------------------------- | -------------- |
| **[slax-reader-extensions](../apps/slax-reader-extensions/README.md)** | 浏览器扩展程序 |
| **[slax-reader-dweb](../apps/slax-reader-dweb/README.md)**             | 网页应用版本å  |

### 公共库

| 库名                                  | 描述         |
| ------------------------------------- | ------------ |
| **[commons/types](../commons/types)** | 全局类型定义 |
| **[commons/utils](../commons/utils)** | 共享工具函数 |

## 开发环境配置

> 本项目采用 **[pnpm workspace](https://pnpm.io/workspaces)** 实现 **Monorepo** 架构管理，开发前请确保已安装 **[pnpm](https://pnpm.io/installation)**

### 依赖安装

```shell
# 安装所有依赖（包括根目录和子项目）
pnpm install
```

### 开发调试

```shell
# 启动所有项目开发环境
pnpm run dev

# 仅启动特定项目
pnpm run dev:extensions  # 启动浏览器扩展项目
pnpm run dev:dweb        # 启动网页版项目
```

### 依赖管理

```shell
# 安装公共库到工作区
pnpm i @commons/utils -w

# 为特定项目安装依赖
pnpm i lodash -F @apps/slax-reader-dweb
```

## 环境变量配置

### 类型定义与校验

项目使用 **[zod](https://github.com/colinhacks/zod)** 进行环境变量的类型定义和校验，确保类型安全和配置正确性。

```typescript
// env.schema.ts

// 基础环境变量 Schema
const baseEnvSchema = z.object({
  PUBLIC_BASE_URL: z.string().startsWith('http'),
  COOKIE_DOMAIN: z.string(),
  COOKIE_TOKEN_NAME: z.string().min(5)
})

// 浏览器扩展环境变量 Schema
export const extensionsEnvSchema = baseEnvSchema.extend({
  EXTENSIONS_API_BASE_URL: z.string(),
  GOOGLE_ANALYTICS_MEASUREMENT_ID: z.string().optional(),
  GOOGLE_ANALYTICS_API_SECRET: z.string().optional(),
  UNINSTALL_FEEDBACK_URL: z.string().startsWith('http').optional()
})

// 网页版环境变量 Schema
export const dwebEnvSchema = baseEnvSchema.extend({
  DWEB_API_BASE_URL: z.string().startsWith('http'),
  SHARE_BASE_URL: z.string().startsWith('http'),
  GOOGLE_OAUTH_CLIENT_ID: z.string(),
  TURNSTILE_SITE_KEY: z.string(),
  PUSH_API_PUBLIC_KEY: z.string().optional()
})
```

### 环境变量文件配置

通过在项目根目录创建环境变量文件来配置不同环境：

- `.env` - 基础环境变量
- `.env.development` - 开发环境变量
- `.env.production` - 生产环境变量
- `.env.[环境].local` - 本地覆盖配置（不提交到版本控制）

**环境变量加载优先级**： `.env.[环境].local` > `.env.[环境]` > `.env`

> **注意**：依赖安装时，nuxt 和 wxt 会根据环境变量生成相应类型定义并进行校验，请确保安装前正确配置环境变量。

### 开发环境变量示例

以下是 `.env.development` 文件的参考配置：

```shell
# OAuth 配置
GOOGLE_OAUTH_CLIENT_ID=""

# API 端点
DWEB_API_BASE_URL="http://localhost:8787"
EXTENSIONS_API_BASE_URL="http://localhost:8787"

# 应用 URL
PUBLIC_BASE_URL="http://localhost:3000"
SHARE_BASE_URL="http://localhost:3000"

# Cookie 配置
COOKIE_DOMAIN="localhost"
COOKIE_TOKEN_NAME="token"

# 安全配置
TURNSTILE_SITE_KEY="1x00000000000000000000AA"
```
