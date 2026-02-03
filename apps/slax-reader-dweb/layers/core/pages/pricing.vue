<template>
  <div class="pricing-page">
    <!-- Header -->
    <AppHeader :show-home-links="false" />

    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <h1>Read Smarter, <span class="highlight">Not Hoarding.</span></h1>
        <p class="subtitle">Save Forever, Not Just Later. Your intelligent library for deep understanding and permanent knowledge.</p>
        <div class="promo-badge">
          <span class="emoji">🎉</span>
          <span class="text">Join today and get 1 Month of Pro Free</span>
        </div>
      </div>
    </section>

    <!-- Pricing Table Section -->
    <section class="pricing-table-section">
      <div class="container">
        <div class="pricing-table">
          <div class="table-header">
            <div class="header-cell title-cell">
              <h2>Pricing Plans</h2>
            </div>
            <div class="header-cell plan-cell">
              <h3>Free Reader</h3>
              <div class="price">
                <span class="amount">$0</span>
                <span class="period">/ Month</span>
              </div>
              <p class="plan-description">Founding Member Perks: Unlimited bookmarks & backup forever — join now before limits apply!</p>
              <button class="btn-plan btn-free-plan">Start Free</button>
            </div>
            <div class="header-cell plan-cell pro-plan">
              <h3 class="pro-title">Pro Reader</h3>
              <div class="price">
                <span class="amount">$5.99</span>
                <span class="period">/ Month</span>
                <span class="original-price">($9.99)</span>
              </div>
              <p class="plan-description">Unleash your reading superpowers with integrated AI analysis and unlimited knowledge retention.</p>
              <button class="btn-plan btn-pro-plan">Try 1 Month Free</button>
            </div>
          </div>

          <div class="table-body">
            <div v-for="(feature, index) in features" :key="index" class="feature-row">
              <div class="feature-name">
                <span v-if="feature.badge" class="ai-badge">{{ feature.badge }}</span>
                <span>{{ feature.name }}</span>
              </div>
              <div class="feature-value">
                <span v-if="feature.free === true" class="check-icon">✓</span>
                <span v-else-if="feature.free === false" class="cross-icon">✕</span>
                <span v-else class="text-value">{{ feature.free }}</span>
              </div>
              <div class="feature-value pro-value">
                <span v-if="feature.pro === true" class="check-icon">✓</span>
                <span v-else-if="feature.pro === false" class="cross-icon">✕</span>
                <span v-else class="text-value pro-text">{{ feature.pro }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works">
      <div class="container">
        <div class="section-header">
          <h2>From Bookmark to Breakthrough</h2>
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

    <!-- FAQ Section -->
    <section class="faq-section">
      <div class="container">
        <h2>FAQ</h2>
        <div class="faq-list">
          <details v-for="(faq, index) in faqs" :key="index" class="faq-item" :open="index === 0">
            <summary>
              <h4>{{ faq.question }}</h4>
              <span class="expand-icon">▼</span>
            </summary>
            <div class="faq-answer">
              <p v-html="faq.answer"></p>
            </div>
          </details>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="container">
        <div class="section-header">
          <h2>Start Your Intelligent Reading Journey Today</h2>
          <p>Read smarter, learn faster, remember more.</p>
        </div>
        <a href="/bookmarks?from=pricing" class="btn-cta">
          <span>Get Started - It's Free</span>
          <img src="@images/arrow-right-black.png" alt="" />
        </a>
      </div>
    </section>

    <!-- Footer -->
    <AppFooter />
  </div>
</template>

<script lang="ts" setup>
import AppFooter from '#layers/core/components/AppFooter.vue'
import AppHeader from '#layers/core/components/AppHeader.vue'

import lampIcon from '@images/lamp-icon.png'
import questionIcon from '@images/question-icon.png'
import searchIcon from '@images/search-icon.png'
import textIcon from '@images/text-icon.png'

const { t } = useI18n()

interface Feature {
  name: string
  free: boolean | string
  pro: boolean | string
  badge?: string
}

interface Step {
  title: string
  description: string
  icon: string
}

interface FAQ {
  question: string
  answer: string
}

useHead({
  titleTemplate: `Pricing - ${t('common.app.name')}`
})

const features: Feature[] = [
  {
    name: 'Save unlimited articles, websites, posts.',
    free: true,
    pro: true
  },
  {
    name: 'Permanent snapshots. Anti-404 backup for every articles.',
    free: true,
    pro: true
  },
  {
    name: 'Highlights & private notes',
    free: true,
    pro: true
  },
  {
    name: 'Full-text search',
    free: 'Basic',
    pro: 'Advanced Semantic'
  },
  {
    name: 'Mobile & Browser Sync',
    free: true,
    pro: true
  },
  {
    name: 'Social sharing',
    free: true,
    pro: true
  },
  {
    name: 'Open source foundation',
    free: true,
    pro: true
  },
  {
    name: 'Manual tags',
    free: true,
    pro: true
  },
  {
    name: 'Auto-tagging & Folders',
    free: false,
    pro: true,
    badge: '[✨AI]'
  },
  {
    name: 'Custom Article Summaries',
    free: false,
    pro: true,
    badge: '[✨AI]'
  },
  {
    name: 'Automatic Article Outlines',
    free: false,
    pro: true,
    badge: '[✨AI]'
  },
  {
    name: 'Personal Knowledge Chatbot',
    free: false,
    pro: true,
    badge: '[✨AI]'
  }
]

const steps: Step[] = [
  {
    title: 'Save Anything',
    description: 'One click to save articles, papers, or blog posts from anywhere on the web.',
    icon: textIcon
  },
  {
    title: 'AI Analyzes',
    description: 'Instant AI overviews help you decide what deserves deep reading and what to skim.',
    icon: searchIcon
  },
  {
    title: 'Ask Questions',
    description: 'Chat with AI about your saved content to deepen understanding and find connections.',
    icon: questionIcon
  },
  {
    title: 'Engage & Connect',
    description: 'Highlight, comment & discuss with others. What you write is more valuable than what you read.',
    icon: lampIcon
  }
]

const faqs: FAQ[] = [
  {
    question: 'Will Slax Reader really save me hours of reading every week?',
    answer:
      'Yes! Our AI summarization and semantic search allow you to extract the most important information from an article in seconds. Instead of reading every word of every bookmark, you can "chat" with your library to find exactly what you need. Learn more about our philosophy in <a class="faq-link" href="https://reader-blog.slax.com" target="_blank">this blog post</a>.'
  },
  {
    question: 'What does "No auto-renewal" mean?',
    answer:
      "We believe in transparency. When your Pro month ends, we won't charge your card automatically. You'll simply be asked if you'd like to continue for another month. No \"forgotten subscription\" traps here."
  },
  {
    question: 'Can I cancel my subscription?',
    answer: "Yes, you can cancel at any time from your account settings. You'll continue to have access to your Pro features until the end of your current billing period."
  },
  {
    question: 'Is there a student discount?',
    answer: 'We offer special educational pricing for students and researchers. Please contact our support team with your .edu email address to learn more.'
  }
]
</script>

<style lang="scss" scoped>
* {
  font-family: -apple-system, 'system-ui', 'Segoe UI', Roboto, sans-serif !important;
}

.pricing-page {
  --style: h-screen overflow-auto;
}

.container {
  --style: max-w-1200px mx-auto px-20px;
}

/* Hero Section */
.hero {
  --style: py-80px text-center relative overflow-hidden bg-gradient-to-br from-[#f8fffc] to-[#e6fff3];

  h1 {
    --style: text-52px text-[#1f1f1f] font-bold line-height-68px mb-24px;

    .highlight {
      --style: text-#16B998;
    }
  }

  .subtitle {
    --style: text-18px text-[#333] line-height-28px mb-40px max-w-800px mx-auto;
  }

  .promo-badge {
    --style: inline-flex items-center gap-12px px-32px py-16px rounded-16px font-bold text-18px border-2;
    background: rgba(22, 185, 152, 0.1);
    border-color: rgba(22, 185, 152, 0.3);
    color: #16b998;

    .emoji {
      --style: text-24px;
    }
  }
}

/* Pricing Table Section */
.pricing-table-section {
  --style: py-80px bg-#fff;
}

.pricing-table {
  --style: bg-white rounded-24px overflow-hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);

  .table-header {
    --style: grid grid-cols-[34%_33%_33%] border-b-2 border-#f0f0f0;

    .header-cell {
      --style: p-40px;

      &.title-cell {
        --style: flex items-end pb-40px;

        h2 {
          --style: text-40px font-bold text-[#1f1f1f] m-0;
        }
      }

      &.plan-cell {
        --style: text-center flex flex-col items-center border-l-2 border-#f0f0f0;

        h3 {
          --style: text-20px font-bold mb-16px text-[#1f1f1f];

          &.pro-title {
            --style: text-#16B998;
          }
        }

        .price {
          --style: flex items-baseline justify-center gap-6px mb-24px;

          .amount {
            --style: text-40px font-bold text-[#1f1f1f];
          }

          .period {
            --style: text-14px text-#666 font-400;
          }

          .original-price {
            --style: text-12px text-#999 line-through;
          }
        }

        .plan-description {
          --style: text-12px text-#666 line-height-20px mb-32px max-w-200px;
        }

        .btn-plan {
          --style: w-full max-w-180px h-48px rounded-12px font-bold text-16px border-none cursor-pointer transition-all duration-300;

          &.btn-free-plan {
            --style: bg-#f8f9fa text-[#333];

            &:hover {
              --style: bg-#e9ecef;
            }
          }

          &.btn-pro-plan {
            --style: text-#fff;
            background: linear-gradient(135deg, #25d4b0 0%, #1cb0b5 50%, #16b998 100%);

            &:hover {
              --style: '-translate-y-1px shadow-[0_8px_16px_#16b99840]';
            }
          }
        }

        &.pro-plan {
          background: rgba(22, 185, 152, 0.03);
          border-left: 2px solid #16b998;
        }
      }
    }
  }

  .table-body {
    .feature-row {
      --style: grid grid-cols-[34%_33%_33%] border-b-1 border-#f5f6f7;

      &:last-child {
        --style: border-b-0;
      }

      .feature-name {
        --style: p-24px text-14px font-500 text-[#333] flex items-center gap-8px;

        .ai-badge {
          --style: text-10px font-bold px-8px py-4px rounded-4px whitespace-nowrap;
          background: rgba(22, 185, 152, 0.15);
          color: #16b998;
        }
      }

      .feature-value {
        --style: p-24px text-center flex items-center justify-center border-l-1 border-#f5f6f7;

        .check-icon {
          --style: text-20px font-bold text-#16B998;
        }

        .cross-icon {
          --style: text-20px text-#ccc;
        }

        .text-value {
          --style: text-14px text-#666;

          &.pro-text {
            --style: font-bold text-#16B998;
          }
        }

        &.pro-value {
          background: rgba(22, 185, 152, 0.03);
          border-left: 2px solid #16b998;
        }
      }
    }
  }
}

/* How It Works Section */
.how-it-works {
  --style: bg-[#f8f9fa] py-80px;

  .section-header {
    --style: text-center mb-68px;

    h2 {
      --style: text-40px text-[#1f1f1f] font-bold mb-0;
    }
  }

  .steps {
    --style: 'grid grid-cols-4 gap-40px max-md:(grid-cols-1)';

    .step {
      --style: text-center;

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

/* FAQ Section */
.faq-section {
  --style: py-80px bg-#fff;

  h2 {
    --style: text-52px font-bold text-[#1f1f1f] mb-48px;
  }

  .faq-list {
    --style: flex flex-col gap-16px;

    .faq-item {
      --style: bg-[#f8f9fa] rounded-12px overflow-hidden transition-all duration-300;

      &:hover {
        --style: bg-[#f0f1f2];
      }

      summary {
        --style: flex items-center justify-between cursor-pointer p-24px list-none;

        h4 {
          --style: text-20px font-bold text-[#1f1f1f] m-0;
        }

        .expand-icon {
          --style: text-16px text-#999 transition-transform duration-300;
        }

        &::-webkit-details-marker {
          --style: hidden;
        }
      }

      &[open] summary .expand-icon {
        --style: rotate-180deg;
      }

      .faq-answer {
        --style: px-24px pb-24px pt-0;

        p {
          --style: text-16px text-#666 line-height-28px m-0;

          :deep(.faq-link) {
            --style: text-#16B998 underline;

            &:hover {
              --style: text-#14a589;
            }
          }
        }
      }
    }
  }
}

/* CTA Section */
.cta-section {
  --style: py-80px;
  background: linear-gradient(180deg, #2eb396 0%, #5edda8 100%);

  .section-header {
    --style: text-center mb-48px;

    h2 {
      --style: text-40px text-#fff font-bold mb-24px;
    }

    p {
      --style: text-18px text-#fff font-400;
    }
  }

  .btn-cta {
    --style: 'm-auto w-fit flex gap-12px items-center h-60px px-32px rounded-10px justify-center text-#1F1F1F text-20px font-600 bg-white relative overflow-hidden transition-all duration-300 no-underline select-none';

    &::before {
      --style: 'content-empty absolute top-50% left-50% w-0 h-0 rounded-full -translate-x-1/2 -translate-y-1/2';
      background: #16b99820;
      transition:
        width 0.6s,
        height 0.6s;
    }

    &:hover {
      --style: '-translate-y-2px shadow-[0_8px_24px_rgba(0,0,0,0.2)]';

      &::before {
        --style: w-300px h-300px;
      }
    }

    &:active {
      --style: translate-y-0;
    }

    img {
      --style: w-16px relative z-1;
    }

    span {
      --style: relative z-1;
    }
  }
}
</style>
