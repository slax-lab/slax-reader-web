<template>
  <div class="quote-tweet-container">
    <div class="quote-tweet">
      <div class="quote-header">
        <img :src="avatarUrl" alt="Quote Tweet Avatar" class="quote-avatar" />
        <div class="quote-title">{{ title }}</div>
      </div>
      <div class="quote-description">{{ description }}</div>
      <div class="quote-media">
        <img :src="mediaImageUrl" alt="Quote Tweet Image" />
      </div>
      <a :href="url" target="_blank" class="quote-link"></a>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  avatarUrl: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  mediaImageUrl: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    default: ''
  }
})
</script>

<style lang="scss" scoped>
.quote-tweet-container {
  --style: mt-28px relative border-(1px solid #e1e8ed) rounded-8px p-15px;
  --style: 'hover:bg-#f5f8fa transition-colors duration-250';

  .quote-tweet {
    --style: '!mt-0';

    .quote-header {
      --style: flex items-center;

      img {
        --style: w-32px h-32px rounded-full;
      }

      .quote-title {
        --style: 'font-bold !text-(14px #333)';
      }

      img + .quote-title {
        --style: '!ml-10px';
      }
    }

    .quote-description {
      --style: mt-10px text-(14px #555);
    }

    .quote-media {
      --style: w-full;

      img {
        --style: max-w-full rounded-8px mt-10px;
      }
    }

    .quote-link {
      --style: absolute inset-0 opacity-0;
    }
  }
}
</style>
