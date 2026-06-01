<template>
  <div class="slug">
    <SnapshotTopBar>
      <template #left>
        <span class="topbar-logo" @click="logoClick">{{ $t('common.app.name') }}</span>
      </template>
    </SnapshotTopBar>
    <div class="content">
      <div class="slug-container">
        <img v-if="error?.statusCode === 404" src="@images/404.png" alt="" />
        <span>{{ errorMessage }}</span>
        <button @click="logoClick">{{ $t('page.slug.back_home') }}</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()

const props = defineProps({
  error: Object
})

const logoClick = () => {
  navigateTo('/bookmarks', {
    replace: true
  })
}

const errorMessage = computed(() => {
  const error = props.error
  if (error?.statusCode === 404) {
    return t('page.slug.title')
  }

  let errorMessage = `${error?.statusCode}`
  if (isNuxtError(error)) {
    errorMessage += `: ${error.cause}`
  } else {
    if (error?.data) {
      errorMessage += `: ${error.data}`
    } else if (error?.message) {
      errorMessage += `: ${error.message}`
    }
  }

  return errorMessage
})
</script>

<style lang="scss" scoped>
.slug {
  --style: w-full flex flex-col items-center overflow-hidden select-none;

  .topbar-logo {
    font-family: var(--slax-font-serif);
    font-size: var(--slax-fs-brand);
    font-weight: 500;
    color: var(--slax-text);
    letter-spacing: -0.02em;
    cursor: pointer;
  }

  .content {
    --style: w-full pt-[var(--slax-header-height)] pb-68px h-screen flex-center -translate-y-25px;

    .slug-container {
      --style: flex-center flex-col;

      img {
        --style: w-204px object-contain;
      }

      span {
        --style: mt-16px text-meta line-height-20px text-align-center whitespace-pre-line;
        color: var(--slax-text-muted);
      }

      button {
        --style: 'mt-100px w-274px h-48px font-bold rounded-3xl flex-center transition-all duration-normal hover:(opacity-90 scale-105)';
        font-size: var(--slax-fs-meta);
        color: var(--slax-text);
        background: var(--slax-surface-solid);
        border: 1px solid var(--slax-border);
      }
    }
  }
}
</style>

<!-- eslint-disable vue-scoped-css/enforce-style-type -->
<style lang="scss">
body {
  background: #faf8f2;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(at 30% 0%, #faf5eb 0%, transparent 50%), radial-gradient(at 80% 20%, #f6efe4 0%, transparent 60%), radial-gradient(at 50% 80%, #f8efe4 0%, transparent 40%);
  z-index: -1;
  pointer-events: none;
}

[data-slax-theme='dark'] body {
  background: #141210;
}
[data-slax-theme='dark'] body::before {
  background:
    radial-gradient(at 30% 0%, #1e1810 0%, transparent 50%), radial-gradient(at 80% 20%, #1a1612 0%, transparent 60%), radial-gradient(at 50% 80%, #181410 0%, transparent 40%);
}

[data-slax-theme='eink'] body {
  background: #ffffff;
}
[data-slax-theme='eink'] body::before {
  display: none;
}
</style>
