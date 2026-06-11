<template>
  <footer class="article-footer">
    <div class="article-footer-text" v-if="showVia">
      {{ $t('page.bookmarks_detail.shared_via') }}
      <strong>{{ via || 'Slax Reader' }}</strong>
      · <a class="article-footer-link" href="https://slax.com/reader/" target="_blank" rel="noopener noreferrer">{{ $t('page.bookmarks_detail.try_free') }}</a>
    </div>
    <div class="article-footer-share">
      <span class="article-footer-share-label">{{ $t('common.operate.share') }}：</span>
      <button class="article-footer-share-btn" title="Copy link" @click="copyLink">
        <svg viewBox="0 0 16 16" fill="none" stroke-width="1">
          <g transform="translate(2, 2)" stroke="currentColor">
            <path
              d="M5,3.667 L10,3.667 C10.736,3.667 11.333,4.264 11.333,5 L11.333,10 C11.333,10.736 10.736,11.333 10,11.333 L5,11.333 C4.264,11.333 3.667,10.736 3.667,10 L3.667,5 C3.667,4.264 4.264,3.667 5,3.667 Z"
            />
            <path d="M2,7.667 L1.333,7.667 C0.597,7.667 0,7.07 0,6.333 L0,1.333 C0,0.597 0.597,0 1.333,0 L6.333,0 C7.07,0 7.667,0.597 7.667,1.333 L7.667,2" />
          </g>
        </svg>
      </button>
      <button class="article-footer-share-btn" title="Share to X / Twitter" @click="shareToTwitter">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>
    </div>
  </footer>
</template>

<script lang="ts" setup>
import Toast, { ToastType } from '#layers/core/app/components/Toast'

withDefaults(
  defineProps<{
    via?: string
    // 左侧「Shared via …」署名段是否展示；owner 看自己的快照时不需要，传 false 隐藏
    showVia?: boolean
  }>(),
  { showVia: true }
)

const { t } = useI18n()

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    Toast.showToast({ text: t('component.share_modal.copy_success'), type: ToastType.Success })
  } catch {
    Toast.showToast({ text: t('common.tips.operate_failed'), type: ToastType.Error })
  }
}

const shareToTwitter = () => {
  const url = `https://x.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

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

  .article-footer-share {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--slax-text-light);
  }

  .article-footer-share-label {
    margin-right: 4px;
  }

  .article-footer-share-btn {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid var(--slax-border);
    border-radius: var(--slax-radius-sm);
    color: var(--slax-text-muted);
    cursor: pointer;
    transition: all var(--slax-dur-fast) ease;

    &:hover {
      border-color: var(--slax-accent-soft);
      color: var(--slax-accent);
      background: var(--slax-accent-bg);
    }

    svg {
      width: 14px;
      height: 14px;
    }
  }
}
</style>
