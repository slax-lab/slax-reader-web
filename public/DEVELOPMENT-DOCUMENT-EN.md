# Slax Reader Web Development and Debugging Documentation

## Project Architecture

### Directory Structure

```shell
.
├── apps                          # Application projects directory
│   ├── slax-reader-extensions    # Browser extension project
│   └── slax-reader-dweb          # Web application project
├── commons                       # Shared libraries directory
│   ├── types                     # Type definitions
│   └── utils                     # Shared utility classes
├── configs                       # Configuration files directory
│   ├── cmd.ts                    # Project execution configuration
│   └── env.ts                    # Environment variables configuration
├── scripts                       # Scripts directory
│   └── start.script.ts           # Project startup helper script
├── env.schema.ts                 # Environment variable type definitions
├── uno.config.ts                 # UnoCSS configuration
├── eslint.config.mjs             # ESLint configuration
├── .prettierrc.mjs               # Prettier configuration
├── README.md                     # Project documentation
├── package.json                  # Package management configuration
├── pnpm-lock.yaml                # Dependency lock file
├── pnpm-workspace.yaml           # Workspace configuration
├── tsconfig.base.json            # TypeScript base configuration
├── tsconfig.json                 # TypeScript project configuration
└── slax-reader.code-workspace    # VSCode workspace configuration
```

### Core Projects

| Project Name                                                           | Description       |
| ---------------------------------------------------------------------- | ----------------- |
| **[slax-reader-extensions](../apps/slax-reader-extensions/README.md)** | Browser extension |
| **[slax-reader-dweb](../apps/slax-reader-dweb/README.md)**             | Web application   |

### Shared Libraries

| Library Name                          | Description              |
| ------------------------------------- | ------------------------ |
| **[commons/types](../commons/types)** | Global type definitions  |
| **[commons/utils](../commons/utils)** | Shared utility functions |

## Development Environment Setup

> This project uses **[pnpm workspace](https://pnpm.io/workspaces)** to implement a **Monorepo** architecture. Please ensure **[pnpm](https://pnpm.io/installation)** is installed before development.

### Installing Dependencies

```shell
# Install all dependencies (including root directory and subprojects)
pnpm install
```

### Development and Debugging

```shell
# Start development environment for all projects
pnpm run dev

# Start specific projects only
pnpm run dev:extensions  # Start browser extension project
pnpm run dev:dweb        # Start web application project
```

### Dependency Management

```shell
# Install shared libraries to the workspace
pnpm i @commons/utils -w

# Install dependencies for specific projects
pnpm i lodash -F @apps/slax-reader-dweb
```

## Environment Variable Configuration

### Type Definitions and Validation

The project uses **[zod](https://github.com/colinhacks/zod)** for environment variable type definitions and validation, ensuring type safety and correct configuration.

```typescript
// env.schema.ts

// Base environment variable Schema
const baseEnvSchema = z.object({
  PUBLIC_BASE_URL: z.string().startsWith('http'),
  COOKIE_DOMAIN: z.string(),
  COOKIE_TOKEN_NAME: z.string().min(5)
})

// Browser extension environment variable Schema
export const extensionsEnvSchema = baseEnvSchema.extend({
  EXTENSIONS_API_BASE_URL: z.string(),
  GOOGLE_ANALYTICS_MEASUREMENT_ID: z.string().optional(),
  GOOGLE_ANALYTICS_API_SECRET: z.string().optional(),
  UNINSTALL_FEEDBACK_URL: z.string().startsWith('http').optional()
})

// Web application environment variable Schema
export const dwebEnvSchema = baseEnvSchema.extend({
  DWEB_API_BASE_URL: z.string().startsWith('http'),
  SHARE_BASE_URL: z.string().startsWith('http'),
  GOOGLE_OAUTH_CLIENT_ID: z.string(),
  TURNSTILE_SITE_KEY: z.string(),
  PUSH_API_PUBLIC_KEY: z.string().optional()
})
```

### Environment Variable File Configuration

Configure different environments by creating environment variable files in the project root directory:

- `.env` - Base environment variables
- `.env.development` - Development environment variables
- `.env.production` - Production environment variables
- `.env.[environment].local` - Local override configurations (not committed to version control)

**Environment variable loading priority**: `.env.[environment].local` > `.env.[environment]` > `.env`

> **Note**: During dependency installation, nuxt and wxt will generate corresponding type definitions based on environment variables and perform validation. Please ensure environment variables are correctly configured before installation.

### Development Environment Variables Example

The following is a reference configuration for the `.env.development` file:

```shell
# OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=""

# API Endpoints
DWEB_API_BASE_URL="http://localhost:8787"
EXTENSIONS_API_BASE_URL="http://localhost:8787"

# Application URLs
PUBLIC_BASE_URL="http://localhost:3000"
SHARE_BASE_URL="http://localhost:3000"

# Cookie Configuration
COOKIE_DOMAIN="localhost"
COOKIE_TOKEN_NAME="token"

# Security Configuration
TURNSTILE_SITE_KEY="1x00000000000000000000AA"
```
