<template>
  <a class="article-source" :href="href" target="_blank" rel="noopener noreferrer" :title="url">
    <span class="article-source-label">信息来源：</span>
    <span class="article-source-url">{{ displayUrl }}</span>
  </a>
</template>

<script lang="ts" setup>
const props = defineProps<{ url: string }>()

// 无协议时补 https://
const href = computed(() => {
  const url = props.url?.trim() ?? ''
  if (!url) return url
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
})

const displayUrl = computed(() => {
  try {
    const u = new URL(href.value)
    return u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/$/, '')
  } catch {
    return props.url
  }
})
</script>

<style lang="scss" scoped>
.article-source {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 280px;
  width: fit-content;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 400;
  color: var(--slax-text-muted);
  background: var(--slax-accent-bg);
  border-radius: 20px;
  text-decoration: none;
  transition: all 0.15s;

  &:hover {
    background: color-mix(in srgb, var(--slax-accent) 10%, transparent);
  }

  .article-source-label {
    flex-shrink: 0;
  }

  .article-source-url {
    color: var(--slax-accent);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
