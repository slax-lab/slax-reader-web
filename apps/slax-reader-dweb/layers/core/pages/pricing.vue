<template>
  <div class="pricing-page">
    <!-- Header -->
    <AppHeader :show-home-links="false" />

    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <h1>Read Smarter, <span class="highlight">Not Just Later.</span></h1>
        <p class="subtitle">Save Forever, Learn faster. Your intelligent library for high efficiency and deep undersatanding.</p>
        <div class="promo-badge">
          <span class="emoji">🎉</span>
          <span class="text">Join today and get 1 Month of Pro Free.</span>
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
              <p class="plan-description">Unlimited bookmarks & Permanent backup — join now before limits apply!</p>
              <button class="btn-plan btn-free-plan">Start Free</button>
            </div>
            <div class="header-cell plan-cell pro-plan">
              <h3 class="pro-title">Pro Reader</h3>
              <div class="price">
                <span class="amount">$5.99</span>
                <span class="period">/ Month</span>
                <span class="original-price">($9.99)</span>
              </div>
              <p class="plan-description">Unleash your reading superpowers with AI analysis.</p>
              <button class="btn-plan btn-pro-plan">
                <span>Try 1 Month FREE</span>
                <span class="btn-subtitle">No auto-renewal</span>
              </button>
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
    name: 'Unlimited highlights and notes.',
    free: true,
    pro: true
  },
  {
    name: 'Full-text search for all articles in your Slax Reader collection.',
    free: true,
    pro: true
  },
  {
    name: 'Sync your articles across web, iOS, and Android',
    free: true,
    pro: true
  },
  {
    name: 'Share articles highlights and join discussions with friends.',
    free: true,
    pro: true
  },
  {
    name: 'Open source on GitHub. Fully transparent. You own your data.',
    free: true,
    pro: true
  },
  {
    name: 'Create tags to easily organize your articles manually',
    free: true,
    pro: true
  },
  {
    name: 'Smart auto-tagging for effortless organization. AI categorizes for you.',
    free: false,
    pro: true,
    badge: '[✨AI]'
  },
  {
    name: 'Instant Summaries: Get the gist in 3 seconds',
    free: false,
    pro: true,
    badge: '[✨AI]'
  },
  {
    name: 'Interactive Outlines: Grasp any 10,000-word essay in 30 seconds.',
    free: false,
    pro: true,
    badge: '[✨AI]'
  },
  {
    name: 'Chatbot: Deep dive into any topic by directly chatting with your articles.',
    free: false,
    pro: true,
    badge: '[✨AI]'
  },
  {
    name: "Welcome to support Slax Reader's sustainable operation",
    free: '😊',
    pro: true
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
    question: 'Can I use Slax Reader for free?',
    answer:
      'Yes! Our Slax Free plan is completely free. As part of our Founding Member Perks, early users enjoy unlimited bookmarks, permanent snapshots (anti-404), and manual tagging at no cost. Join now and lock in these benefits before future limits apply!'
  },
  {
    question: 'Will Slax Reader really save me hours of reading every week?',
    answer:
      'That\'s exactly what it\'s built for. By using AI to distill long-form content into structured, interactive insights, Slax Reader fundamentally changes the way you consume information. <a class="faq-link" href="https://reader-blog.slax.com/posts/a-smarter-more-efficient-ai-powered-way-to-save-and-read-forever/" target="_blank">Full Visual Tour →</a>'
  },
  {
    question: 'Have any more questions?',
    answer:
      'We\'d love to hear from you! You can reach us directly on <a class="faq-link" href="https://t.me/slax_app" target="_blank">Telegram</a> or <a class="faq-link" href="https://x.com/SlaxReader" target="_blank">X (Twitter)</a>.'
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
    --style: 'grid grid-cols-[34%_33%_33%] border-b-2 border-#f0f0f0 max-md:(grid-cols-1 border-b-0)';

    .header-cell {
      --style: 'p-48px max-md:(p-32px)';

      &.title-cell {
        --style: 'flex items-end pb-48px max-md:(hidden)';

        h2 {
          --style: 'text-48px font-bold text-[#1f1f1f] m-0 max-md:(text-36px)';
        }
      }

      &.plan-cell {
        --style: 'text-center flex flex-col items-center border-l-2 border-#f0f0f0 max-md:(border-l-0 border-b-2 border-#f0f0f0)';

        h3 {
          --style: 'text-24px font-bold mb-20px text-[#1f1f1f] max-md:(text-28px)';

          &.pro-title {
            --style: text-#16B998;
          }
        }

        .price {
          --style: 'flex items-baseline justify-center gap-8px mb-28px max-md:(mb-24px)';

          .amount {
            --style: 'text-48px font-bold text-[#1f1f1f] max-md:(text-52px)';
          }

          .period {
            --style: 'text-16px text-#666 font-400 max-md:(text-18px)';
          }

          .original-price {
            --style: 'text-14px text-#999 line-through max-md:(text-16px)';
          }
        }

        .plan-description {
          --style: 'text-15px text-#666 line-height-24px mb-36px max-w-280px max-md:(text-16px line-height-26px max-w-full mb-32px)';
        }

        .btn-plan {
          --style: 'w-full max-w-200px h-52px rounded-12px font-bold text-17px border-none cursor-pointer transition-all duration-300 max-md:(max-w-full h-56px text-18px)';

          &.btn-free-plan {
            --style: bg-#f8f9fa text-[#333];

            &:hover {
              --style: bg-#e9ecef;
            }
          }

          &.btn-pro-plan {
            --style: 'text-#fff flex flex-col items-center justify-center gap-3px h-64px max-md:(h-68px)';
            background: linear-gradient(135deg, #25d4b0 0%, #1cb0b5 50%, #16b998 100%);

            .btn-subtitle {
              --style: 'text-13px font-400 opacity-90 max-md:(text-14px)';
            }

            &:hover {
              --style: '-translate-y-1px shadow-[0_8px_16px_#16b99840]';
            }
          }
        }

        &.pro-plan {
          background: rgba(22, 185, 152, 0.03);
          border-left: 2px solid #16b998;

          @media (max-width: 768px) {
            border-left: 0;
            border-bottom: 2px solid #16b998;
          }
        }
      }
    }
  }

  .table-body {
    --style: 'max-md:(hidden)';

    .feature-row {
      --style: grid grid-cols-[34%_33%_33%] border-b-1 border-#f5f6f7;

      &:last-child {
        --style: border-b-0;
      }

      .feature-name {
        --style: p-28px text-16px font-500 text-[#333] flex items-center gap-10px;

        .ai-badge {
          --style: text-11px font-bold px-10px py-5px rounded-6px whitespace-nowrap;
          background: rgba(22, 185, 152, 0.15);
          color: #16b998;
        }
      }

      .feature-value {
        --style: p-28px text-center flex items-center justify-center border-l-1 border-#f5f6f7;

        .check-icon {
          --style: text-24px font-bold text-#16B998;
        }

        .cross-icon {
          --style: text-24px text-#ccc;
        }

        .text-value {
          --style: text-16px text-#666;

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
