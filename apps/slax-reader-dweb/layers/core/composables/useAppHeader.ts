export interface NavLink {
  name: string
  href: string
  external?: boolean
}

export interface AppHeaderConfig {
  showHomeLinks: boolean
  navLinks: NavLink[]
}

/**
 * App Header 导航配置的 composable
 * 统一管理所有页面的导航链接
 */
export function useAppHeader(options?: { showHomeLinks?: boolean; extraLinks?: NavLink[] }) {
  const { showHomeLinks = true, extraLinks = [] } = options || {}

  // 默认导航链接配置
  const defaultNavLinks: NavLink[] = [
    // 条件导航：首页专属链接
    ...(showHomeLinks
      ? [
          { name: 'Features', href: '/#features' },
          { name: 'How it Works', href: '/#how-it-works' }
        ]
      : [{ name: 'Home', href: '/' }]),

    // 主要导航
    { name: 'Pricing', href: '/pricing' },
    { name: 'Download', href: '/download' },
    { name: 'Blog', href: 'https://reader-blog.slax.com', external: true }
  ]

  // 合并额外的自定义链接
  const navLinks = [...defaultNavLinks, ...extraLinks]

  // 辅助导航（GitHub、Start Free按钮）单独配置
  const auxiliaryLinks = {
    github: {
      name: 'GitHub',
      href: 'https://github.com/slax-lab',
      external: true
    },
    startFree: {
      name: 'Start Free',
      action: async () => {
        await navigateTo('/bookmarks?from=homepage')
      }
    }
  }

  return {
    showHomeLinks,
    navLinks,
    auxiliaryLinks
  }
}
