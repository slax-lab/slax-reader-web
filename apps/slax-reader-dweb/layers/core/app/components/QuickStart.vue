<template>
  <!-- 快速入门引导卡片：暖色表面卡片 + 衬线标题 + accent 步骤序号 + 主按钮内联 SVG 图标 -->
  <div class="quick-start">
    <!-- 引导步骤 -->
    <div class="guide-section">
      <h1 class="title">{{ $t('page.quickStart.title') }}</h1>
      <ol class="steps">
        <li class="step">
          <span class="step-index">1</span>
          <div class="step-body">
            <span class="step-title">{{ $t('page.quickStart.step1.title') }}</span>
            <span class="step-subtitle">
              {{ $t('page.quickStart.step1.subtitle') }}
              <a :href="pluginUrl" class="link" target="_blank">{{ $t('page.quickStart.getLink') }}</a>
            </span>
          </div>
        </li>
        <li class="step">
          <span class="step-index">2</span>
          <div class="step-body">
            <span class="step-title">{{ $t('page.quickStart.step2.title') }}</span>
            <span class="step-subtitle">{{ $t('page.quickStart.step2.subtitle') }}</span>
          </div>
        </li>
        <li class="step">
          <span class="step-index">3</span>
          <div class="step-body">
            <span class="step-title">{{ $t('page.quickStart.step3.title') }}</span>
            <span class="step-subtitle">{{ $t('page.quickStart.step3.subtitle') }}</span>
          </div>
        </li>
      </ol>
    </div>

    <!-- 演示视频 -->
    <div class="demo-section">
      <h2 class="subtitle">{{ $t('page.quickStart.subtitle') }}</h2>
      <div class="demo-frame">
        <video src="https://static-cdn.slax.com/operating-instructions.mp4" controls></video>
      </div>
    </div>

    <!-- 安装入口 -->
    <div class="action-section">
      <button class="install-button" @click="installClick">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v12" />
          <path d="m7 11 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
        {{ $t('component.install_extension_tips.install') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const pluginUrl = 'https://chromewebstore.google.com/detail/slax-reader/gdnhaajlomjkhahnmiijphnodkcfikfd?utm_source=web_quick_start'
const installClick = () => {
  window.open(pluginUrl)
}
</script>

<style lang="scss" scoped>
.quick-start {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 28px;
  background: var(--slax-surface);
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius);
  box-shadow:
    var(--slax-shadow-sm),
    inset 0 1px 0 var(--slax-inset-hi);

  @media (max-width: 768px) {
    display: none;
  }
}

.guide-section {
  .title {
    font-family: var(--slax-font-serif);
    font-size: var(--slax-fs-h2);
    font-weight: 500;
    color: var(--slax-text);
    letter-spacing: -0.01em;
    line-height: 1.4;
    margin: 0 0 20px;
  }

  .steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .step {
    display: flex;
    align-items: flex-start;
    gap: 14px;

    .step-index {
      flex-shrink: 0;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--slax-accent-bg);
      color: var(--slax-accent);
      font-size: var(--slax-fs-aux);
      font-weight: 600;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .step-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 3px;
    }

    .step-title {
      font-size: var(--slax-fs-meta);
      font-weight: 500;
      color: var(--slax-text);
    }

    .step-subtitle {
      font-size: var(--slax-fs-aux);
      font-weight: 300;
      color: var(--slax-text-muted);
      line-height: 1.6;
    }

    .link {
      color: var(--slax-accent);
      font-weight: 500;
      margin-left: 4px;
      transition: opacity var(--slax-dur-fast);

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.demo-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 24px;
  border-top: 1px solid var(--slax-border);

  .subtitle {
    font-size: var(--slax-fs-meta);
    font-weight: 500;
    color: var(--slax-text-muted);
    margin: 0;
  }

  .demo-frame {
    width: 100%;
    overflow: hidden;
    border: 1px solid var(--slax-border);
    border-radius: var(--slax-radius-sm);
    background: var(--slax-bg);

    video {
      display: block;
      width: 100%;
    }
  }
}

.action-section {
  display: flex;
  justify-content: center;

  .install-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 28px;
    background: var(--slax-accent);
    color: var(--slax-btn-text);
    border: none;
    border-radius: var(--slax-radius-sm);
    font-size: var(--slax-fs-meta);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--slax-dur-normal);

    .icon {
      width: 16px;
      height: 16px;
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px color-mix(in srgb, var(--slax-accent) 24%, transparent);
    }

    &:active {
      transform: translateY(0);
    }
  }
}
</style>
