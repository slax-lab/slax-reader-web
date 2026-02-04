<template>
  <section class="how-it-works" id="how-it-works">
    <div class="container">
      <div class="section-header">
        <h2>From Bookmark to Breakthrough</h2>
        <p>Four simple steps to transform how you read and learn</p>
      </div>
      <div class="steps">
        <div class="step" v-for="(step, index) in steps" :key="index">
          <div class="step-icon">
            <img :src="step.icon" alt="" />
          </div>
          <h4>{{ step.title }}</h4>
          <p>{{ step.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import lampIcon from '@images/lamp-icon.png'
import questionIcon from '@images/question-icon.png'
import searchIcon from '@images/search-icon.png'
import textIcon from '@images/text-icon.png'

interface Step {
  title: string
  description: string
  icon: string
}

const steps: Step[] = [
  {
    title: 'Save Anything',
    description: `One click to save articles, papers, or blog posts from anywhere on the web`,
    icon: textIcon
  },
  {
    title: 'AI Analyzes',
    description: 'Instant AI overviews help you decide what deserves deep reading and what to skim. Save time for the best content.',
    icon: searchIcon
  },
  {
    title: 'Ask Questions',
    description: 'Chat with AI about your saved content to deepen understanding',
    icon: questionIcon
  },
  {
    title: 'Engage with Your Content',
    description: 'Highlight, comment & discuss with others. What you write is more valuable than what you read.',
    icon: lampIcon
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

.how-it-works {
  --style: bg-[#f8f9fa] p-t-68px p-b-100px;
  .section-header {
    --style: text-center mb-68px;
    h2 {
      --style: text-40px text-[#1f1f1f] font-bold mb-24px;
    }
    p {
      --style: text-18px text-[#333] font-400;
    }
  }
  .steps {
    --style: 'grid grid-cols-4 gap-40px max-md:(grid-cols-1)';
    .step {
      --style: 'text-center';
      .step-icon {
        --style: flex justify-center;
        img {
          --style: w-120px h-120px object-cover;
        }
      }
      h4 {
        --style: text-20px font-bold text-[#1f1f1f] mt-16px mb-24px;
      }
      p {
        --style: text-16px font-400 text-[#333];
      }
    }
  }
}
</style>
