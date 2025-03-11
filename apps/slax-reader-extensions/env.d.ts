import type { SlaxEnv } from '../../configs/env'

declare global {
  namespace NodeJS {
    interface ProcessEnv extends SlaxEnv {}
  }
}

export {}
