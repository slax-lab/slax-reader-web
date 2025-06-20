<template>
  <div class="quick-start">
    <div class="guide-section">
      <h1 class="title">{{ $t('page.quickStart.title') }}</h1>
      <div class="steps">
        <span class="step">
          <span class="step-title">1.&nbsp;&nbsp;{{ $t('page.quickStart.step1.title') }}</span>
          <span class="step-subtitle"
            >{{ $t('page.quickStart.step1.subtitle') }}<a :href="pluginUrl" class="link" target="_blank">{{ $t('page.quickStart.getLink') }}</a></span
          >
        </span>
        <span class="step">
          <span class="step-title">2.&nbsp;&nbsp;{{ $t('page.quickStart.step2.title') }}</span>
          <span class="step-subtitle">{{ $t('page.quickStart.step2.subtitle') }}</span>
        </span>
        <span class="step">
          <span class="step-title">3.&nbsp;&nbsp;{{ $t('page.quickStart.step3.title') }}</span>
          <span class="step-subtitle">{{ $t('page.quickStart.step3.subtitle') }}</span>
        </span>
      </div>
    </div>

    <div class="demo-section">
      <div class="demo-header">
        <h2 class="subtitle">{{ $t('page.quickStart.subtitle') }}</h2>
      </div>
      <div class="demo-frame">
        <video src="https://static-reader.slax.app/operating-instructions.mp4" width="100%" controls></video>
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
  --style: 'w-full max-md:(hidden) max-w-3xl mx-auto bg-gradient-to-b from-[#E0FFF1] to-[#FCFFFD] rounded-8px border-1 border-[#BEF6E4] p-24px';

  .guide-section {
    .title {
      --style: font-600 text-18px text-[#0F1419] lh-25px mb-12px;
    }

    .steps {
      --style: flex flex-col gap-12px pb-24px mb-24px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);

      .step {
        --style: flex flex-col gap-4px;
        .step-title {
          --style: text-13px text-[#0F1419] font-500;
        }
        .step-subtitle {
          --style: pl-20px text-12px text-[#333333];
        }
        .link {
          --style: text-[#567895] hover: underline ml-1;
        }
      }
    }
  }

  .demo-section {
    --style: mb-32px;
    .demo-header {
      --style: flex items-center gap-8px mb-20px;
      .subtitle {
        --style: text-14px text-[#333333] font-500;
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
