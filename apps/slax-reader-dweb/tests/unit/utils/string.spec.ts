// 测 urlBase64ToUint8Array：base64url → Uint8Array 解码
// 覆盖点：标准转换、padding 补齐、特殊字符替换、空字符串、返回类型
import { urlBase64ToUint8Array } from '~~/layers/core/app/utils/string'

import { describe, expect, it } from 'vitest'

describe('urlBase64ToUint8Array', () => {
  it('标准 base64url 字符串解码字节正确', () => {
    // 'Hello' 的 base64 是 'SGVsbG8=', base64url 为 'SGVsbG8'
    const result = urlBase64ToUint8Array('SGVsbG8')
    expect(Array.from(result)).toEqual([72, 101, 108, 108, 111])
  })

  it("base64url 特殊字符 '-' '_' 替换为 '+' '/' 后解码", () => {
    // base64url '-_A' → 替换为 '+/A' → 补 padding '+/A=' → 解码为 [251, 240]
    const result = urlBase64ToUint8Array('-_A')
    expect(Array.from(result)).toEqual([251, 240])
  })

  it('长度不是 4 的倍数时自动补 padding', () => {
    // 'SGk' 长度 3，需补 1 个 '=' 才能 atob，应该返回 'Hi'
    const result = urlBase64ToUint8Array('SGk')
    expect(Array.from(result)).toEqual([72, 105]) // 'Hi'
  })

  it('空字符串返回长度为 0 的 Uint8Array', () => {
    const result = urlBase64ToUint8Array('')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(0)
  })

  it('返回值是 Uint8Array 实例（不是普通 Array）', () => {
    const result = urlBase64ToUint8Array('SGk')
    expect(result).toBeInstanceOf(Uint8Array)
  })
})
