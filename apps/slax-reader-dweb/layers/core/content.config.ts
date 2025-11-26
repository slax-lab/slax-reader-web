import { defineCollection, defineContentConfig } from '@nuxt/content'
import path from 'node:path'

export default defineContentConfig({
  collections: {
    article: defineCollection({
      type: 'page',
      source: {
        cwd: path.resolve('./layers/core/content'),
        include: '*.md'
      }
    })
  }
})
