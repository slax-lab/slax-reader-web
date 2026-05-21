function strToUtf8(str: string) {
  return str
    .split('')
    .map(ch => (ch.charCodeAt(0) <= 0x7f ? ch : '\\u' + ('0000' + ch.charCodeAt(0).toString(16)).slice(-4)))
    .join('')
}

// wxt 内部锁的 vite 版本可能与 extensions 自身 vite 版本不一致，
// 不导入 vite.PluginOption 类型，仅提供运行时形状以避免跨实例类型不兼容
export default function toUtf8() {
  return {
    name: 'to-utf8',
    generateBundle(options: any, bundle: any) {
      // Iterate through each asset in the bundle
      for (const fileName in bundle) {
        if (bundle[fileName].type === 'chunk') {
          // Assuming you want to convert the chunk's code
          const originalCode = bundle[fileName].code
          const modifiedCode = strToUtf8(originalCode)

          // Update the chunk's code with the modified version
          bundle[fileName].code = modifiedCode
        }
      }
    }
  }
}
