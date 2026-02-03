import { z } from 'zod'

// 共用的环境变量定义 Schema
const baseEnvSchema = z.object({
  PUBLIC_BASE_URL: z.string().startsWith('http'),
  AUTH_BASE_URL: z.string().startsWith('http'),
  COOKIE_DOMAIN: z.string(),
  COOKIE_TOKEN_NAME: z.string().min(5),
  SHARE_BASE_URL: z.string().startsWith('http')
})

// 插件环境变量 Schema
export const extensionsEnvSchema = baseEnvSchema.extend({
  EXTENSIONS_API_BASE_URL: z.string(),
  GOOGLE_ANALYTICS_MEASUREMENT_ID: z.string().optional(),
  GOOGLE_ANALYTICS_API_SECRET: z.string().optional(),
  UNINSTALL_FEEDBACK_URL: z.string().startsWith('http').optional()
})

// 网页环境变量 Schema
export const dwebEnvSchema = baseEnvSchema.extend({
  DWEB_API_BASE_URL: z.string().startsWith('http'),
  GOOGLE_OAUTH_CLIENT_ID: z.string(),
  APPLE_OAUTH_CLIENT_ID: z.string(),
  TURNSTILE_SITE_KEY: z.string(),
  PUSH_API_PUBLIC_KEY: z.string().optional(),
  ...{
    // Firebase 相关配置
    FIREBASE_API_KEY: z.string().optional(),
    FIREBASE_AUTH_DOMAIN: z.string().optional(),
    FIREBASE_DATABASE_URL: z.string().startsWith('http').optional(),
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_STORAGE_BUCKET: z.string().optional(),
    FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
    FIREBASE_APP_ID: z.string().optional(),
    FIREBASE_MEASUREMENT_ID: z.string().optional()
  },
  GTAG_MEASUREMENT_ID: z.string().optional()
})
