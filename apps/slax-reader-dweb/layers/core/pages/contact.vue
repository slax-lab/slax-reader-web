<template>
  <div class="contact-page">
    <!-- Header -->
    <AppHeader :show-home-links="false" />

    <!-- Contact Hero Section -->
    <section class="contact-hero">
      <div class="container">
        <div class="contact-content">
          <h1>Contact Us</h1>
          <div class="contact-description">
            <p class="intro-text">
              Slax Reader is built by a small, dedicated team of deep readers. We want to help you enjoy a better read-it-later journey by using AI to take over the tedious parts
              of information overload—summarizing to filter value, outlining to deconstruct long-form content, and chatting to deepen understanding.
            </p>
            <p class="highlight-text">Whether you've found a bug, have a feature request, or just want to chat about the future of digital reading — we're listening.</p>
          </div>

          <!-- Contact Methods -->
          <div class="contact-methods">
            <a href="mailto:support@slax.com" class="contact-item" target="_blank">
              <div class="contact-icon">📧</div>
              <div class="contact-info">
                <h3>Email</h3>
                <p>support@slax.com</p>
              </div>
            </a>

            <a href="https://x.com/SlaxReader" class="contact-item" target="_blank" rel="noopener noreferrer">
              <div class="contact-icon">𝕏</div>
              <div class="contact-info">
                <h3>X (Twitter)</h3>
                <p>@SlaxReader</p>
              </div>
            </a>

            <a href="https://t.me/slax_app" class="contact-item" target="_blank" rel="noopener noreferrer">
              <div class="contact-icon">✈️</div>
              <div class="contact-info">
                <h3>Telegram</h3>
                <p>Slax Reader Community</p>
              </div>
            </a>

            <a href="https://github.com/slax-lab/slax-reader" class="contact-item" target="_blank" rel="noopener noreferrer">
              <div class="contact-icon">
                <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor">
                  <path
                    d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                  ></path>
                </svg>
              </div>
              <div class="contact-info">
                <h3>GitHub</h3>
                <p>Best for bug reports and feature requests</p>
              </div>
            </a>
          </div>

          <div class="contact-footer-note">
            <div class="quote-mark top">"</div>
            <p class="main-message">
              Building Slax Reader is a long-haul mission for us, and we couldn't do it without the insights and support of our early community. Thank you for joining us on this
              journey.
            </p>
            <p class="signature">
              Happy Reading,<br />
              <strong>The Slax Reader Team</strong>
            </p>
            <div class="quote-mark bottom">"</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Links Section -->
    <section class="quick-links">
      <div class="container">
        <div class="section-header">
          <h2>Not sure where to start? You might find your answer here:</h2>
        </div>
        <div class="links-grid">
          <a href="/guide" class="link-card">
            <div class="link-icon">📖</div>
            <div class="link-text">
              <p>See the full visual tour of what Slax Reader can do</p>
              <span class="link-arrow">→</span>
            </div>
          </a>
          <a href="/pricing" class="link-card">
            <div class="link-icon">💎</div>
            <div class="link-text">
              <p>What's the pricing plans and founding member perks?</p>
              <span class="link-arrow">→</span>
            </div>
          </a>
          <a href="/download" class="link-card">
            <div class="link-icon">⬇️</div>
            <div class="link-text">
              <p>Get Slax Reader now</p>
              <span class="link-arrow">→</span>
            </div>
          </a>
        </div>
      </div>
    </section>
    <HomepageCallToAction @get-started="handleStartReading" />

    <!-- Footer -->
    <AppFooter />
  </div>
</template>

<script lang="ts" setup>
import AppFooter from '../components/AppFooter.vue'
import AppHeader from '../components/AppHeader.vue'
import HomepageCallToAction from '../components/Homepage/HomepageCallToAction.vue'

// ContactPage Schema.org 配置
useSchemaOrg([
  defineWebPage({
    '@type': 'ContactPage',
    name: 'Slax Reader Contact Us',
    description: 'Contact the Slax Reader team for support, feedback, and community discussions.'
  })
])

// SEO 配置
useHead({
  title: 'Contact Us | Slax Reader: Connect with our AI Deep Reading Team',
  meta: [
    {
      name: 'description',
      content: "Have feedback or questions about Slax Reader? Reach out to the team behind the smartest AI read-it-later assistant. We're here to help you read smarter."
    },
    {
      property: 'og:title',
      content: 'Contact Us | Slax Reader: Connect with our AI Deep Reading Team'
    },
    {
      property: 'og:description',
      content: "Have feedback or questions about Slax Reader? Reach out to the team behind the smartest AI read-it-later assistant. We're here to help you read smarter."
    },
    {
      property: 'og:type',
      content: 'website'
    },
    {
      name: 'twitter:title',
      content: 'Contact Us | Slax Reader: Connect with our AI Deep Reading Team'
    },
    {
      name: 'twitter:description',
      content: "Have feedback or questions about Slax Reader? Reach out to the team behind the smartest AI read-it-later assistant. We're here to help you read smarter."
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    }
  ]
})

const handleStartReading = async () => {
  await navigateTo('/bookmarks?from=homepage')
}
</script>

<style lang="scss" scoped>
* {
  font-family: -apple-system, 'system-ui', 'Segoe UI', Roboto, sans-serif !important;
}

.contact-page {
  --style: h-screen overflow-auto;
}

.container {
  --style: max-w-1200px mx-auto px-20px;
}

/* Contact Hero Section */
.contact-hero {
  --style: py-80px relative overflow-hidden bg-gradient-to-br from-#f8fffc to-#e6fff3;

  .contact-content {
    --style: max-w-900px mx-auto;

    h1 {
      --style: text-52px text-[#1f1f1f] font-bold line-height-68px mb-32px text-center;
    }

    .contact-description {
      --style: text-center mb-60px;

      .intro-text {
        --style: text-19px text-[#333] line-height-34px mb-24px;
      }

      .highlight-text {
        --style: text-20px text-[#16b998] line-height-34px mb-0 font-600;
      }
    }

    .contact-methods {
      --style: 'grid grid-cols-2 gap-24px mb-60px max-md:(grid-cols-1) select-none';

      .contact-item {
        --style: 'flex items-start gap-20px bg-white p-28px rounded-16px no-underline transition-all duration-300 shadow-sm';

        &:hover {
          --style: 'shadow-[0_8px_24px_#0000001a] -translate-y-2px';
        }

        .contact-icon {
          --style: text-40px flex items-center justify-center w-64px h-64px rounded-12px flex-shrink-0 bg-gradient-to-br from-#f0fff9 to-#e6fff3 color-#16b998;
        }

        .contact-info {
          --style: flex-1;

          h3 {
            --style: text-20px font-600 text-[#1f1f1f] mb-8px;
          }

          p {
            --style: text-17px text-[#666] line-height-26px;
          }
        }
      }
    }

    .contact-footer-note {
      --style: text-center p-56px rounded-20px mt-48px relative bg-gradient-to-br from-#f8fffc to-#fff9f0 border-2 border-#e6f7f0 shadow-[0_8px_24px_#16b99814];

      .quote-mark {
        --style: absolute text-80px font-serif opacity-20 select-none color-#16b998;
        font-family: Georgia, serif;

        &.top {
          --style: top-16px left-24px;
        }

        &.bottom {
          --style: bottom-8px right-24px rotate-180;
        }
      }

      .main-message {
        --style: text-18px line-height-36px mb-0 max-w-700px mx-auto relative z-1 font-400 color-#444 italic;
      }

      .signature {
        --style: text-19px mb-0 mt-40px line-height-34px relative z-1 font-400 color-#555 italic;

        strong {
          --style: color-#16b998 font-700 not-italic;
        }
      }

      &::before {
        content: '';
        --style: absolute top-0 left-1/2 w-60px h-3px rounded-full -translate-x-1/2 bg-gradient-to-r from-transparent via-#16b998 to-transparent;
      }

      &::after {
        content: '✨';
        --style: absolute bottom-12px left-1/2 text-20px -translate-x-1/2 opacity-60;
      }
    }
  }
}

/* Quick Links Section */
.quick-links {
  --style: bg-white py-80px;

  .section-header {
    --style: text-center mb-48px;

    h2 {
      --style: text-32px text-[#1f1f1f] font-600 line-height-44px;
    }
  }

  .links-grid {
    --style: 'grid grid-cols-3 gap-28px max-w-1000px mx-auto max-md:(grid-cols-1)';

    .link-card {
      --style: 'flex flex-col items-center bg-[#f8f9fa] p-32px rounded-16px no-underline transition-all duration-300 text-center min-h-200px select-none';

      &:hover {
        --style: 'bg-[#e6fff3] -translate-y-2px shadow-[0_8px_20px_#16b99826]';

        .link-icon {
          --style: scale-110;
        }

        .link-arrow {
          --style: translate-x-4px;
        }
      }

      .link-icon {
        --style: text-48px transition-transform duration-300 mb-20px;
      }

      .link-text {
        --style: flex-1 flex flex-col items-center justify-between;

        p {
          --style: text-18px text-[#333] line-height-28px font-500 mb-16px flex-1 flex items-center;
        }

        .link-arrow {
          --style: text-24px text-#16b998 font-600 transition-transform duration-300;
        }
      }
    }
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .contact-hero {
    --style: py-60px;

    .contact-content {
      h1 {
        --style: text-40px line-height-52px mb-24px;
      }

      .contact-description {
        --style: mb-40px;

        .intro-text {
          --style: text-17px line-height-30px;
        }

        .highlight-text {
          --style: text-18px line-height-30px;
        }
      }

      .contact-methods {
        --style: mb-40px;

        .contact-item {
          --style: p-20px;

          .contact-icon {
            --style: text-32px w-56px h-56px;
          }

          .contact-info {
            h3 {
              --style: text-18px;
            }

            p {
              --style: text-16px;
            }
          }
        }
      }

      .contact-footer-note {
        --style: p-40px mt-32px;

        .quote-mark {
          --style: text-60px;

          &.top {
            --style: top-12px left-16px;
          }

          &.bottom {
            --style: bottom-4px right-16px;
          }
        }

        .main-message {
          --style: text-17px line-height-32px;
        }

        .signature {
          --style: text-18px mt-32px;
        }

        &::before {
          --style: w-40px;
        }

        &::after {
          --style: text-18px bottom-8px;
        }
      }
    }
  }

  .quick-links {
    --style: py-60px;

    .section-header {
      --style: mb-32px;

      h2 {
        --style: text-24px line-height-36px;
      }
    }

    .links-grid {
      .link-card {
        --style: p-24px min-h-180px;

        .link-icon {
          --style: text-40px mb-16px;
        }

        .link-text {
          p {
            --style: text-17px line-height-26px;
          }

          .link-arrow {
            --style: text-20px;
          }
        }
      }
    }
  }
}
</style>
