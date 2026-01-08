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
        <a href="/download" class="link hover mr-16px">Download</a>
        <a href="https://reader-blog.slax.com" target="_blank" class="link hover mr-16px">Blog</a>
        <a href="https://github.com/slax-lab" target="_blank" class="link btn-github">
          <img src="@images/github-icon.png" alt="" />
          <span>GitHub</span>
        </a>
        <span @click="handleStartFree" class="link btn-free">Start Free</span>
      </div>
    </nav>
  </header>
</template>

<script lang="ts" setup>
interface Props {
  showHomeLinks?: boolean
}

withDefaults(defineProps<Props>(), {
  showHomeLinks: true
})

const handleStartFree = async () => {
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
        --style: 'cursor-pointer flex items-center rounded-6px px-10px h-36px text-#fff select-none transition-all duration-300 bg-gradient-to-r from-#25d4b0 to-#1cb0b5';

        &:hover {
          --style: bg-#1cb0b5;
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
  }
}

.container {
  --style: max-w-1200px mx-auto px-20px;
}
</style>
