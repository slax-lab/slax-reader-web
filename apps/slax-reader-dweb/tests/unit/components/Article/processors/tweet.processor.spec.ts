// TweetProcessor 单测 —— 第四期 Sprint A.1.1
// 覆盖：仅 Twitter 风格才 match=true / tweet-header 替换 + dataset 透传 / tweet-footer 替换 + dataset 解析 / followers/replyCount 缺省转 0 / 容器无目标安全跳过
import { TweetProcessor } from '~~/layers/core/app/components/Article/processors/tweet.processor'
import type { WebProcessorContext } from '~~/layers/core/app/components/Article/processors/types'
import { ArticleStyle } from '~~/layers/core/app/components/Article/processors/types'
import { describe, expect, it, vi } from 'vitest'

const userArgs: Array<Record<string, unknown>> = []
const footerArgs: Array<Record<string, unknown>> = []

vi.mock('~~/layers/core/app/components/Article/CEComponents', () => {
  class FakeTweetUserInfo extends HTMLElement {
    constructor(props?: Record<string, unknown>) {
      super()
      if (props) userArgs.push(props)
    }
  }
  class FakeTweetFooterInfo extends HTMLElement {
    constructor(props?: Record<string, unknown>) {
      super()
      if (props) footerArgs.push(props)
    }
  }
  if (!customElements.get('fake-tweet-user-info')) {
    customElements.define('fake-tweet-user-info', FakeTweetUserInfo)
  }
  if (!customElements.get('fake-tweet-footer-info')) {
    customElements.define('fake-tweet-footer-info', FakeTweetFooterInfo)
  }
  return {
    TweetUserInfoElement: FakeTweetUserInfo,
    TweetFooterInfoElement: FakeTweetFooterInfo,
    UnsupportedVideoElement: class {},
    WechatVideoInfoElement: class {},
    PhotoSwiperDotsElement: class {}
  }
})

function buildContext(html: string, articleStyle = ArticleStyle.Twitter): WebProcessorContext {
  const container = document.createElement('div')
  container.innerHTML = html
  return {
    container,
    url: new URL('https://example.com/'),
    articleStyle,
    callbacks: { screenLockUpdate: () => {}, showImagePreview: () => {}, websiteClick: () => {} },
    cleanups: []
  }
}

describe('TweetProcessor', () => {
  const processor = new TweetProcessor()

  it('articleStyle=Twitter：match=true', () => {
    expect(processor.match(buildContext('', ArticleStyle.Twitter))).toBe(true)
  })

  it('articleStyle=Default：match=false', () => {
    expect(processor.match(buildContext('', ArticleStyle.Default))).toBe(false)
  })

  it('tweet-header 替换 + dataset 透传 + 数字缺省 0', () => {
    userArgs.length = 0
    const ctx = buildContext(
      '<tweet-header data-href="https://x.com/u" data-avatar="a" data-name="N" data-description="d" data-screen-name="sn" data-location="loc" data-website="w" data-created-at="c" data-followers="123"></tweet-header>'
    )
    processor.process(ctx)
    expect(ctx.container.querySelector('tweet-header')).toBeNull()
    expect(userArgs).toHaveLength(1)
    expect(userArgs[0]).toMatchObject({
      href: 'https://x.com/u',
      avatar: 'a',
      name: 'N',
      description: 'd',
      screenName: 'sn',
      location: 'loc',
      website: 'w',
      createdAt: 'c',
      followers: 123,
      followings: 0
    })
  })

  it('tweet-footer 替换 + 数字解析 + 数字缺省 0', () => {
    footerArgs.length = 0
    const ctx = buildContext('<tweet-footer data-reply-count="5" data-favorite-count="42"></tweet-footer>')
    processor.process(ctx)
    expect(ctx.container.querySelector('tweet-footer')).toBeNull()
    expect(footerArgs[0]).toEqual({
      replyCount: 5,
      retweetCount: 0,
      favoriteCount: 42
    })
  })

  it('容器无 tweet-header / tweet-footer：不抛错', () => {
    const ctx = buildContext('<p>正文</p>')
    expect(() => processor.process(ctx)).not.toThrow()
  })
})
