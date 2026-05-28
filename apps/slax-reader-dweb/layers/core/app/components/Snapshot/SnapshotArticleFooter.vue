<template>
  <footer class="article-footer">
    <div class="article-footer-text">
      {{ $t('page.bookmarks_detail.shared_via') }}
      <strong>Slax Reader</strong>
      · <a class="article-footer-link" href="https://slax.com/reader/" target="_blank" rel="noopener noreferrer">{{ $t('page.bookmarks_detail.try_free') }}</a>
    </div>
  </footer>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.article-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 56px;
  padding: 20px 0 120px;
  border-top: 1px solid var(--slax-border);
  flex-wrap: wrap;

  @media (max-width: 768px) {
    padding-bottom: 100px;
  }

  .article-footer-text {
    font-size: 13px;
    color: var(--slax-text-light);
    font-weight: 300;

    strong {
      color: var(--slax-text-muted);
      font-weight: 500;
    }

    .article-footer-link {
      color: var(--slax-accent);
      text-decoration: none;
      font-weight: 500;
      margin-left: 4px;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
