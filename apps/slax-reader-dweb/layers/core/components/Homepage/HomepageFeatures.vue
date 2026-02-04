<template>
  <section class="features" id="features">
    <div class="container">
      <div class="section-header">
        <h2>Not Just Another Read-Later Tool</h2>
        <p>We're building the future of intelligent reading</p>
      </div>
      <div class="feature-grid">
        <div class="feature-card" v-for="(feature, index) in features" :key="index">
          <div class="feature-icon">{{ index + 1 }}</div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
interface Feature {
  title: string
  description: string
}

const features: Feature[] = [
  {
    title: 'AI-Powered Understanding',
    description: `Get instant summaries, key insights, and answers to your questions about any article. It's like having a personal tutor for everything you read.`
  },
  {
    title: 'Content Never Dies',
    description: 'Articles saved once are backed up forever. No more "404 Page Not Found" disappointments. Your digital library is truly permanent.'
  },
  {
    title: 'Smart Organization',
    description: 'AI automatically tags and categorizes your content. Find exactly what you need when you need it with powerful semantic search.'
  },
  {
    title: 'Connected Reading',
    description: `Highlight and comment on any article you save. Share your content and invite others to add insights and discuss. Every article becomes a place for conversation.`
  }
]
</script>

<style lang="scss" scoped>
* {
  font-family: -apple-system, 'system-ui', 'Segoe UI', Roboto, sans-serif !important;
}

.container {
  --style: max-w-1200px mx-auto px-20px;
}

.features {
  --style: p-t-68px p-b-100px bg-#fff;
  .section-header {
    --style: text-center mb-68px;
    h2 {
      --style: text-40px text-[#1f1f1f] font-bold mb-24px;
    }
    p {
      --style: text-18px text-[#333] font-400;
    }
  }
  .feature-grid {
    --style: 'grid grid-cols-4 gap-2rem max-md:(grid-cols-1)';
    .feature-card {
      --style: 'bg-[#F8F9FA] rounded-16px p-2rem text-center transition-all duration-300 relative overflow-hidden';
      &::before {
        content: '';
        --style: absolute top-0 left-0 w-full h-4px;
        transform: scaleX(0);
        transition: transform 0.3s;
        background: linear-gradient(-90deg, #2eb396 0%, #5edda8 100%);
      }
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        &::before {
          transform: scaleX(1);
        }
      }
      .feature-icon {
        --style: m-auto mb-32px text-20px font-700 w-50px h-50px rounded-full flex items-center justify-center text-#fff;
        background: linear-gradient(-90deg, #2eb396 0%, #5edda8 100%);
      }
      h3 {
        --style: text-20px mb-16px text-[#1a1a1a];
      }
      p {
        --style: text-16px text-[#666] font-400;
      }
    }
  }
}
</style>
