// uno.config.ts
import presetAttributify from '@unocss/preset-attributify'
import presetIcons from '@unocss/preset-icons'
import presetUno from '@unocss/preset-uno'
import presetMini from '@unocss/preset-mini'
import transformerDirectives from '@unocss/transformer-directives'
import presetRemToPx from '@unocss/preset-rem-to-px'
import { defineConfig } from 'unocss'

export default defineConfig({
  rules: [
    [
      'flex-center',
      {
        display: 'flex',
        'justify-content': 'center',
        'align-items': 'center'
      }
    ],
    [/^size-(\d)px$/, ([, d]) => ({ width: `${d}px` })]
  ],
  variants: [
    // not first or last
    matcher => {
      const tags = [
        {
          name: 'not-first:',
          selector: ':not(:first-child)'
        },
        {
          name: 'not-last:',
          selector: ':not(:last-child)'
        }
      ]

      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i]
        if (!matcher.startsWith(tag.name)) {
          continue
        }

        return {
          matcher: matcher.slice(tag.name.length),
          selector: s => `${s}${tag.selector}`
        }
      }

      return matcher
    }
  ],
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1
    }),
    presetMini(),
    presetRemToPx()
  ],
  transformers: [
    transformerDirectives({
      applyVariable: ['--at-apply', '--style']
    })
  ],
  content: {
    pipeline: {
      exclude: ['node_modules', 'dist', '.git', '.husky', '.vscode', 'public', 'build', 'mock', './stats.html']
    }
  }
})
