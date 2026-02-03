<template>
  <div class="homepage">
    <!-- Header -->
    <AppHeader :show-home-links="true" />

    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <div class="hero-text">
            <h1>Read Smarter<br />Connect Deeper</h1>
            <p>Your permanent library that saves, understands, and networks your content with others.</p>
            <div class="hero-cta">
              <span @click="freeBtn" class="btn-free">
                <span>Start Reading Smarter - Free</span>
                <img src="@images/arrow-right-white.png" alt="" />
              </span>
            </div>
            <div class="trust-indicators">
              <span>🔒 Your content, forever safe</span>
              <span>🚀 5x faster understanding</span>
              <span>⭐ Interactive reading community</span>
            </div>
          </div>
          <div class="hero-visual">
            <div class="product-preview">
              <div class="ai-demo">
                <h4>🤖&nbsp;&nbsp;AI Analysis</h4>
                <p>
                  This article discusses the impact of quantum computing on cryptography. Key points: <br />1.&nbsp;&nbsp;Current encryption methods vulnerable by 2030,
                  <br />2.&nbsp;&nbsp;New quantum-resistant algorithms needed...
                </p>
              </div>
              <div class="ai-demo">
                <h4>💬&nbsp;&nbsp;Ask AI</h4>
                <p>
                  <strong>You:</strong> "What should I do to prepare?"<br />
                  <strong>AI:</strong> "Based on the article, you should: migrate to post-quantum cryptography, audit current systems..."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
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

    <!-- How It Works -->
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

    <!-- Comparison Section -->
    <section class="comparison" id="comparison">
      <div class="container">
        <div class="section-header">
          <h2>Why Readers Are Switching to Slax</h2>
          <p>See how we compare to traditional read-later tools</p>
        </div>
        <div class="comparison-table">
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Slax Reader</th>
                <th>Instapaper</th>
                <th>Readwise</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Unlimited Free Bookmarks (for early users)</td>
                <td><span class="check">✅</span></td>
                <td><span class="cross">✅</span></td>
                <td><span class="cross">Paid service</span></td>
              </tr>
              <tr>
                <td>Permanent Content Backup</td>
                <td><span class="cross">✅</span></td>
                <td><span class="cross">Paid service</span></td>
                <td><span class="cross">Paid service</span></td>
              </tr>
              <tr>
                <td>AI Outline</td>
                <td><span class="cross">Paid service</span></td>
                <td><span class="cross">✅</span></td>
                <td><span class="cross">Paid service</span></td>
              </tr>
              <tr>
                <td>Chat with AI While Reading</td>
                <td><span class="cross">Paid service</span></td>
                <td><span class="cross">❌</span></td>
                <td><span class="cross">Paid service</span></td>
              </tr>
              <tr>
                <td>Highlight & Comment on Original Pages & Snapshots, <br />Two-Way Synced</td>
                <td><span class="cross">✅</span></td>
                <td><span class="cross">❌</span></td>
                <td><span class="cross">Paid service</span></td>
              </tr>
              <tr>
                <td>Join Reader Discussions</td>
                <td><span class="cross">✅</span></td>
                <td><span class="cross">❌</span></td>
                <td><span class="cross">⚠️ Shared highlights only, no discussions</span></td>
              </tr>
              <tr>
                <td>AI Auto Tagging</td>
                <td><span class="cross">Paid service</span></td>
                <td><span class="cross">⚠️ Manual tags only</span></td>
                <td><span class="cross">⚠️ Manual tags only</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="container">
        <div class="section-header">
          <h2>Start Your Intelligent Reading Journey Today</h2>
          <p>Read smarter, learn faster, remember more</p>
        </div>
        <a href="/bookmarks?from=homepage" class="btn-free">
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
import AppFooter from './AppFooter.vue'
import AppHeader from './AppHeader.vue'

import lampIcon from '@images/lamp-icon.png'
import questionIcon from '@images/question-icon.png'
import searchIcon from '@images/search-icon.png'
import textIcon from '@images/text-icon.png'

const { t } = useI18n()

interface Feature {
  title: string
  description: string
}

interface Step {
  title: string
  description: string
  icon: string
}

useHead({
  title: t('common.app.name'),
  meta: [
    {
      name: 'description',
      content: t('common.app.description')
    },
    {
      property: 'og:title',
      content: t('common.app.name')
    },
    {
      property: 'og:description',
      content: t('common.app.description')
    },
    {
      name: 'twitter:title',
      content: t('common.app.name')
    },
    {
      name: 'twitter:description',
      content: t('common.app.description')
    }
  ]
})

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

const freeBtn = async () => {
  await navigateTo('/bookmarks?from=homepage')
}
</script>
<style lang="scss" scoped>
* {
  font-family: -apple-system, 'system-ui', 'Segoe UI', Roboto, sans-serif !important;
}
.homepage {
  --style: h-screen overflow-auto;
}
.container {
  --style: max-w-1200px mx-auto px-20px;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(-30px, -30px) rotate(180deg);
  }
}
/* Hero Section */
.hero {
  --style: py-80px relative overflow-hidden bg-gradient-to-br from-[#f8fffc] to-[#e6fff3];
  &::before {
    content: '';
    --style: absolute top-(-50%) right-(-50%) w-200% h-220%;
    background: radial-gradient(circle, rgba(213, 255, 235, 0.65) 0%, transparent 70%);
    animation: float 20s ease-in-out infinite;
  }
  .hero-content {
    --style: 'grid grid-cols-2 gap-40px relative z-1 max-md:(grid-cols-1)';
    .hero-text {
      h1 {
        --style: text-52px text-[#1f1f1f] font-bold line-height-68px mb-24px;
      }
      p {
        --style: text-18px text-[#333] line-height-28px mb-40px;
      }
      .hero-cta {
        .btn-free {
          --style: 'cursor-pointer w-fit flex gap-12px items-center h-60px px-32px rounded-10px justify-center text-#fff text-20px font-600 max-md:(text-16px m-auto) relative overflow-hidden transition-all duration-300 no-underline select-none';
          background: linear-gradient(135deg, #25d4b0 0%, #1cb0b5 50%, #16b998 100%);
          background-size: 300% 300%;

          &::before {
            --style: 'content-empty absolute inset-0 opacity-0 transition-opacity duration-300';
            background: linear-gradient(135deg, transparent 0%, #ffffff40 50%, transparent 100%);
          }

          &:hover {
            --style: '-translate-y-2px shadow-[0_8px_20px_#16b99840]';
            animation: gradient-shift 2s ease infinite;

            &::before {
              --style: opacity-100;
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
      .trust-indicators {
        --style: flex gap-2rem color-#666 text-0.9rem mt-32px;
      }
    }
    .hero-visual {
      position: relative;
      .product-preview {
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        padding: 2rem;
        transform: perspective(1000px) rotateY(-10deg);
        transition: transform 0.5s;
      }

      .product-preview:hover {
        transform: perspective(1000px) rotateY(0deg);
      }

      .ai-demo {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1rem;
      }

      .ai-demo h4 {
        color: #16b998;
        margin-bottom: 0.5rem;
      }
    }
  }
}

/* Features Section */
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

/* How It Works */
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

/* Comparison */
.comparison {
  --style: bg-#fff p-t-68px p-b-100px;
  .section-header {
    --style: text-center mb-68px;
    h2 {
      --style: text-40px text-[#1f1f1f] font-bold mb-24px;
    }
    p {
      --style: text-18px text-[#333] font-400;
    }
  }
  .comparison-table {
    --style: bg-#fff rounded-16px overflow-hidden mt-3rem overflow-x-auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    table {
      --style: w-full border-collapse;
      th,
      td {
        --style: p-20px text-14px text-left border-b-(1px solid #f5f6f7);
      }
      th {
        --style: bg-[#f8f9fa] text-16px font-600 whitespace-nowrap;
      }
      .check {
        --style: color-#4caf50 font-1.5rem;
      }
      .cross {
        --style: color-#ccc font-1.5rem;
      }
    }
  }
}

/* CTA Section */
.cta-section {
  --style: pt-68px pb-80px;
  background: linear-gradient(180deg, #2eb396 0%, #5edda8 100%);
  .section-header {
    --style: text-center mb-48px;
    h2 {
      --style: text-40px text-[#fff] font-bold mb-24px;
    }
    p {
      --style: text-18px text-[#fff] font-400;
    }
  }
  .btn-free {
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

@keyframes gradient-shift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}
</style>
