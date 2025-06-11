<template>
  <div class="quick-start">
    <div class="guide-section">
      <h1 class="title">{{ $t('page.quickStart.title') }}</h1>
      <div class="steps">
        <span class="step">
          1.&nbsp;&nbsp;{{ $t('page.quickStart.step1') }}
          <a :href="pluginUrl" class="link" target="_blank">{{ $t('page.quickStart.getLink') }}</a>
        </span>
        <span class="step">2.&nbsp;&nbsp;{{ $t('page.quickStart.step2') }}</span>
        <span class="step">3.&nbsp;&nbsp;{{ $t('page.quickStart.step3') }}</span>
      </div>
    </div>

    <div class="demo-section">
      <div class="demo-header">
        <span class="icon">💡</span>
        <h2 class="subtitle">{{ $t('page.quickStart.subtitle') }}</h2>
      </div>
      <div class="demo-frame">
        <img class="operation-instructions" src="@images/operation-instructions.png" />
      </div>
    </div>

    <div class="action-section">
      <button class="install-button" @click="installClick">
        <span class="icon"></span>
        {{ $t('component.install_extension_tips.install') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const pluginUrl = 'https://chromewebstore.google.com/detail/slax-reader/gdnhaajlomjkhahnmiijphnodkcfikfd'
const installClick = () => {
  window.open(pluginUrl)
}
</script>

<style lang="scss" scoped>
.quick-start {
  --style: 'w-full max-md:(hidden) max-w-3xl mx-auto bg-gradient-to-b from-[#E0FFF1] to-[#FCFFFD] rounded-8px border-1 border-[#BEF6E4] px-16px py-32px';

  .guide-section {
    .title {
      --style: font-600 text-18px text-[#0F1419] lh-25px mb-20px;
    }

    .steps {
      --style: flex flex-col gap-6px pb-20px mb-23px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);

      .step {
        --style: text-12px lh-17px;
        ccolor: rgba(51, 51, 51, 0.8);

        .link {
          --style: text-blue-500 hover: underline ml-1;
        }
      }
    }
  }

  .demo-section {
    --style: mb-32px;
    .demo-header {
      --style: flex items-center gap-8px mb-20px;
      .icon {
        --style: text-19px;
      }
      .subtitle {
        --style: text-14px text-[#333333];
      }
    }

    .demo-frame {
      --style: w-full;
      img {
        --style: w-full;
      }
    }
  }

  .action-section {
    --style: flex justify-center;
    .install-button {
      .icon {
        --style: w-16px h-16px;
        background-image: url('@images/download.png');
        background-size: 100% 100%;
      }
      --style: flex items-center gap-8px bg-#18C190 text-white px-32px py-10px rounded-8px hover: (bg-#14A698);
    }
  }
}
</style>
