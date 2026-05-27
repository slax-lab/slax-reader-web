<template>
  <div class="article-footer">
    <div class="footer-line" />
    <p class="footer-text">
      {{ $t('page.bookmarks_detail.shared_via') }}
      <a href="https://slax.com" target="_blank" rel="noopener noreferrer">Slax Reader</a>
      · {{ $t('page.bookmarks_detail.try_free') }}
    </p>
  </div>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.article-footer {
  --style: pt-48px pb-120px flex flex-col items-center gap-16px;

  @media (max-width: 768px) {
    --style: pb-100px;
  }
}

.footer-line {
  --style: w-48px h-1px;
  background: var(--slax-border);
}

.footer-text {
  --style: text-aux text-center;
  color: var(--slax-text-light);

  a {
    color: var(--slax-accent);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
