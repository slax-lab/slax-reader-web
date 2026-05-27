<template>
  <a class="article-source" :href="url" target="_blank" rel="noopener noreferrer" :title="url">
    {{ displayUrl }}
  </a>
</template>

<script lang="ts" setup>
const props = defineProps<{ url: string }>()

const displayUrl = computed(() => {
  try {
    const u = new URL(props.url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return props.url
  }
})
</script>

<style lang="scss" scoped>
.article-source {
  --style: 'inline-flex items-center max-w-full px-12px py-4px rounded-full text-aux cursor-pointer transition-colors duration-fast overflow-hidden whitespace-nowrap text-ellipsis';
  background: var(--slax-accent-bg);
  color: var(--slax-text-muted);
  border: 1px solid transparent;

  &:hover {
    background: color-mix(in srgb, var(--slax-accent-bg) 180%, transparent);
    color: var(--slax-accent);
  }
}
</style>
