import { defineConfig } from 'node-modules-inspector'

export default defineConfig({
  defaultFilters: {
    excludes: ['eslint']
  },
  defaultSettings: {
    moduleTypeSimple: true
  },

  // Experimental publint.dev integration, default is false
  publint: true
})
