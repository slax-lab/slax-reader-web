<template>
  <header class="app-header">
    <nav class="container">
      <a href="/" class="logo">
        <img src="@images/logo.png" alt="Slax Reader" />
        <span>Slax Reader</span>
      </a>

      <div class="nav-links">
        <a v-if="showHomeLinks" href="/#features" class="link hover mr-16px">Features</a>
        <a v-if="showHomeLinks" href="/#how-it-works" class="link hover mr-16px">How it Works</a>
        <a v-if="!showHomeLinks" href="/" class="link hover mr-16px">Home</a>
        <a href="/pricing" class="link hover mr-16px">Pricing</a>
        <a href="/download" class="link hover mr-16px">Download</a>
        <a href="https://reader-blog.slax.com" target="_blank" class="link hover mr-16px">Blog</a>
        <a href="https://github.com/slax-lab" target="_blank" class="link btn-github">
          <img src="@images/github-icon.png" alt="" />
          <span>GitHub</span>
        </a>
        <span @click="handleStartFree" class="link btn-free">Start Free</span>
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
          <a v-if="showHomeLinks" href="/#features" class="mobile-link" @click="showMobileSidebar = false">Features</a>
          <a v-if="showHomeLinks" href="/#how-it-works" class="mobile-link" @click="showMobileSidebar = false">How it Works</a>
          <a v-if="!showHomeLinks" href="/" class="mobile-link" @click="showMobileSidebar = false">Home</a>
          <a href="/pricing" class="mobile-link" @click="showMobileSidebar = false">Pricing</a>
          <a href="/download" class="mobile-link" @click="showMobileSidebar = false">Download</a>
          <a href="https://reader-blog.slax.com" target="_blank" class="mobile-link" @click="showMobileSidebar = false">Blog</a>
          <span @click="handleStartFree" class="mobile-link btn-free">Start Free</span>
        </div>

        <div class="mobile-sidebar-footer">
          <a href="https://github.com/slax-lab" target="_blank" class="mobile-link btn-github" @click="showMobileSidebar = false">
            <img src="@images/github-icon.png" alt="" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script lang="ts" setup>
interface Props {
  showHomeLinks?: boolean
}

withDefaults(defineProps<Props>(), {
  showHomeLinks: true
})

const showMobileSidebar = ref(false)

const handleStartFree = async () => {
  showMobileSidebar.value = false
  await navigateTo('/bookmarks?from=homepage')
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
      --style: 'flex items-center gap-16px max-md:(hidden)';

      .link {
        --style: 'text-16px font-400 text-#333 no-underline transition-all duration-300';

        &.hover {
          --style: 'hover:text-#16B998';
        }
      }

      .btn-free {
        --style: 'cursor-pointer flex items-center rounded-6px px-10px h-36px text-#fff select-none transition-all duration-300 relative overflow-hidden';
        background: linear-gradient(135deg, #25d4b0 0%, #1cb0b5 50%, #16b998 100%);
        background-size: 300% 300%;

        &::before {
          --style: 'content-empty absolute inset-0 opacity-0 transition-opacity duration-300';
          background: linear-gradient(135deg, transparent 0%, #ffffff40 50%, transparent 100%);
        }

        &:hover {
          --style: '-translate-y-1px shadow-[0_4px_12px_#16b99840]';
          animation: gradient-shift 2s ease infinite;

          &::before {
            --style: opacity-100;
          }
        }

        &:active {
          --style: translate-y-0;
        }
      }

      .btn-github {
        --style: flex gap-6px items-center h-36px px-12px rounded-6px text-#333 font-500 text-15px border-2 border-#333 select-none;

        &:hover {
          --style: bg-#f8f9fa;
        }

        img {
          --style: w-20px;
        }
      }
    }

    .hamburger-btn {
      --style: 'hidden max-md:(flex relative w-24px h-18px bg-transparent border-none cursor-pointer p-0)';

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
  --style: 'fixed inset-0 z-1001 bg-black bg-opacity-50 md:(hidden)';
}

.mobile-sidebar {
  --style: 'fixed top-0 right-0 w-280px h-screen bg-#fff z-1002 shadow-lg md:(hidden)';

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
        --style: 'cursor-pointer flex items-center justify-center rounded-6px h-44px text-#fff select-none transition-all duration-300 relative overflow-hidden';
        background: linear-gradient(135deg, #25d4b0 0%, #1cb0b5 50%, #16b998 100%);
        background-size: 300% 300%;

        &::before {
          --style: 'content-empty absolute inset-0 opacity-0 transition-opacity duration-300';
          background: linear-gradient(135deg, transparent 0%, #ffffff40 50%, transparent 100%);
        }

        &:hover {
          --style: '-translate-y-1px shadow-[0_4px_12px_#16b99840]';
          animation: gradient-shift 2s ease infinite;

          &::before {
            --style: opacity-100;
          }
        }

        &:active {
          --style: translate-y-0;
        }
      }
    }
  }

  .mobile-sidebar-footer {
    --style: absolute bottom-0 left-0 right-0 p-20px border-t border-#f0f0f0;

    .btn-github {
      --style: 'flex gap-6px items-center justify-center h-44px px-16px rounded-6px text-#333 font-500 text-15px border-2 border-#333 select-none no-underline transition-all duration-300';

      &:hover {
        --style: bg-#f8f9fa;
      }

      img {
        --style: w-20px;
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
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.container {
  --style: max-w-1200px mx-auto px-20px;
}
</style>
