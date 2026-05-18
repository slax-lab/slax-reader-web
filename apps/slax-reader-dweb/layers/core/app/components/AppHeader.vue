<template>
  <header class="app-header">
    <nav class="container">
      <a href="/" class="logo">
        <img src="@images/logo.png" alt="Slax Reader" />
        <span>Slax Reader</span>
      </a>

      <div class="nav-links">
        <a v-for="(link, index) in navLinks" :key="index" :href="link.href" :target="link.external ? '_blank' : undefined" class="link hover mr-16px">
          {{ link.name }}
        </a>
        <a :href="auxiliaryLinks.github.href" target="_blank" class="link btn-github">
          <img src="@images/github-icon.png" alt="" />
          <span>{{ auxiliaryLinks.github.name }}</span>
        </a>
        <span @click="handleStartFree" class="link btn-free">{{ auxiliaryLinks.startFree.name }}</span>
      </div>

      <button class="hamburger-btn" @click="showMobileSidebar = true" aria-label="打开菜单">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>

    <Transition name="fade">
      <div v-show="showMobileSidebar" class="sidebar-mask" @click="showMobileSidebar = false"></div>
    </Transition>
    <Transition name="slide">
      <div v-show="showMobileSidebar" class="mobile-sidebar">
        <div class="mobile-sidebar-header">
          <button class="close-btn" @click="showMobileSidebar = false" aria-label="关闭菜单">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <div class="mobile-nav-links">
          <a v-for="(link, index) in navLinks" :key="index" :href="link.href" :target="link.external ? '_blank' : undefined" class="mobile-link" @click="showMobileSidebar = false">
            {{ link.name }}
          </a>
          <span @click="handleStartFree" class="mobile-link btn-free">{{ auxiliaryLinks.startFree.name }}</span>
        </div>

        <div class="mobile-sidebar-footer">
          <a :href="auxiliaryLinks.github.href" target="_blank" class="mobile-link btn-github" @click="showMobileSidebar = false">
            <img src="@images/github-icon.png" alt="" />
            <span>{{ auxiliaryLinks.github.name }}</span>
          </a>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script lang="ts" setup>
import type { NavLink } from '../composables/useAppHeader'

interface Props {
  showHomeLinks?: boolean
  extraLinks?: NavLink[]
}

const props = withDefaults(defineProps<Props>(), {
  showHomeLinks: true,
  extraLinks: () => []
})

const { navLinks, auxiliaryLinks } = useAppHeader({
  showHomeLinks: props.showHomeLinks,
  extraLinks: props.extraLinks
})

const showMobileSidebar = ref(false)

const addLog = () => {
  const refs: Record<string, 'homepage' | 'pricing' | 'download' | 'blog' | 'contact'> = {
    '/download': 'download',
    '/pricing': 'pricing',
    '/contact': 'contact',
    '/blog': 'blog'
  }

  analyticsLog({
    event: 'homepage_view',
    section: refs[window.location.pathname] || 'homepage'
  })
}

onMounted(() => {
  addLog()
})

const handleStartFree = async () => {
  showMobileSidebar.value = false
  if (auxiliaryLinks.startFree.action) {
    await auxiliaryLinks.startFree.action()
  }
}
</script>

<style lang="scss" scoped>
.app-header {
  --style: sticky top-0 z-1000 h-68px flex items-center bg-#fff shadow-sm;

  nav {
    --style: flex justify-between items-center;

    .logo {
      --style: flex items-center gap-10px cursor-pointer no-underline transition-opacity duration-300;

      &:hover {
        --style: opacity-80;
      }

      img {
        --style: w-18px;
      }

      span {
        --style: text-18px font-600 text-#16B998;
      }
    }

    .nav-links {
      --style: 'flex items-center gap-16px max-lg:(hidden)';

      .link {
        --style: 'text-16px font-400 text-#333 no-underline transition-all duration-300';

        &.hover {
          --style: 'hover:text-#16B998';
        }
      }

      .btn-free {
        --style: 'cursor-pointer flex items-center rounded-6px px-10px h-36px text-#fff select-none relative overflow-hidden';
        background: linear-gradient(135deg, #25d4b0 0%, #1cb0b5 50%, #16b998 100%);
        background-size: 200% 200%;
        will-change: transform, box-shadow;
        transition:
          transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
          box-shadow 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

        &::before {
          --style: 'content-empty absolute inset-0 opacity-0';
          background: linear-gradient(135deg, transparent 0%, #ffffff50 50%, transparent 100%);
          transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1;
        }

        &::after {
          --style: 'content-empty absolute inset-0';
          background: linear-gradient(135deg, #25d4b0 0%, #1cb0b5 50%, #16b998 100%);
          background-size: 200% 200%;
          animation: gradient-shift 3s ease-in-out infinite;
          z-index: -1;
        }

        &:hover {
          --style: 'shadow-[0_6px_16px_#16b99850]';
          transform: translateY(-2px) scale(1.03);

          &::before {
            --style: opacity-100;
          }
        }

        &:active {
          --style: 'shadow-[0_2px_8px_#16b99840]';
          transform: translateY(0px) scale(0.98);
          transition:
            transform 0.1s cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 0.1s cubic-bezier(0.4, 0, 0.2, 1);
        }
      }

      .btn-github {
        --style: flex gap-6px items-center h-36px px-12px rounded-6px text-#333 font-500 text-15px border-2 border-#333 select-none;
        will-change: transform, background-color;
        transition:
          transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
          background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          --style: bg-#f8f9fa;
          transform: translateY(-2px) scale(1.03);
        }

        &:active {
          transform: translateY(0px) scale(0.98);
          transition:
            transform 0.1s cubic-bezier(0.4, 0, 0.2, 1),
            background-color 0.1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        img {
          --style: w-20px;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        &:hover img {
          transform: scale(1.1) rotate(-5deg);
        }
      }
    }

    .hamburger-btn {
      --style: 'hidden max-lg:(flex relative w-24px h-18px bg-transparent border-none cursor-pointer p-0)';

      span {
        --style: absolute left-0 w-full h-1px bg-#333 transition-all duration-300;

        &:nth-child(1) {
          --style: top-1px;
        }

        &:nth-child(2) {
          --style: top-1/2 -translate-y-1/2;
        }

        &:nth-child(3) {
          --style: bottom-1px;
        }
      }

      &:hover span {
        --style: bg-#16B998;
      }
    }
  }
}

.sidebar-mask {
  --style: 'fixed inset-0 z-1001 bg-black bg-opacity-50 lg:(hidden)';
}

.mobile-sidebar {
  --style: 'fixed top-0 right-0 w-280px h-screen bg-#fff z-1002 shadow-lg lg:(hidden)';

  .mobile-sidebar-header {
    --style: flex items-center justify-end h-68px px-20px border-b border-#f0f0f0;

    .close-btn {
      --style: flex items-center justify-center w-40px h-40px bg-transparent border-none cursor-pointer rounded-6px transition-all duration-300 text-#333;

      &:hover {
        --style: bg-#f8f9fa text-#16B998;
      }
    }
  }

  .mobile-nav-links {
    --style: flex flex-col py-0 px-20px gap-16px;

    .mobile-link {
      --style: text-16px font-400 text-#333 no-underline transition-all duration-300 py-12px px-16px rounded-8px;

      &:not(.btn-free):not(.btn-github) {
        --style: 'hover:(bg-#f8f9fa text-#16B998)';
      }

      &.btn-free {
        --style: 'cursor-pointer flex items-center justify-center rounded-6px h-44px text-#fff select-none relative overflow-hidden';
        background: linear-gradient(135deg, #25d4b0 0%, #1cb0b5 50%, #16b998 100%);
        background-size: 200% 200%;
        will-change: transform, box-shadow;
        transition:
          transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
          box-shadow 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

        &::before {
          --style: 'content-empty absolute inset-0 opacity-0';
          background: linear-gradient(135deg, transparent 0%, #ffffff50 50%, transparent 100%);
          transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1;
        }

        &::after {
          --style: 'content-empty absolute inset-0';
          background: linear-gradient(135deg, #25d4b0 0%, #1cb0b5 50%, #16b998 100%);
          background-size: 200% 200%;
          animation: gradient-shift 3s ease-in-out infinite;
          z-index: -1;
        }

        &:hover {
          --style: 'shadow-[0_6px_16px_#16b99850]';
          transform: translateY(-2px) scale(1.02);

          &::before {
            --style: opacity-100;
          }
        }

        &:active {
          --style: 'shadow-[0_2px_8px_#16b99840]';
          transform: translateY(0px) scale(0.98);
          transition:
            transform 0.1s cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 0.1s cubic-bezier(0.4, 0, 0.2, 1);
        }
      }
    }
  }

  .mobile-sidebar-footer {
    --style: absolute bottom-0 left-0 right-0 p-20px border-t border-#f0f0f0;

    .btn-github {
      --style: 'flex gap-6px items-center justify-center h-44px px-16px rounded-6px text-#333 font-500 text-15px border-2 border-#333 select-none no-underline';
      will-change: transform, background-color;
      transition:
        transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
        background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        --style: bg-#f8f9fa;
        transform: translateY(-2px) scale(1.02);
      }

      &:active {
        transform: translateY(0px) scale(0.98);
        transition:
          transform 0.1s cubic-bezier(0.4, 0, 0.2, 1),
          background-color 0.1s cubic-bezier(0.4, 0, 0.2, 1);
      }

      img {
        --style: w-20px;
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      &:hover img {
        transform: scale(1.1) rotate(-5deg);
      }
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.container {
  --style: max-w-1200px mx-auto px-20px;
}
</style>
