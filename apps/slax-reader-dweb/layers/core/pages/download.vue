<template>
  <div class="download-page">
    <!-- Header -->
    <AppHeader :show-home-links="false" />

    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <h1>Slax Reader — Save Forever. Read Smarter.</h1>
        <p>Free to download, available on all your favorite platforms</p>
      </div>
    </section>

    <!-- Download Cards Section -->
    <section class="download-section">
      <div class="container">
        <div class="download-list">
          <!-- Mobile Apps Card -->
          <article class="download-card">
            <div class="card-content">
              <div class="card-left">
                <div class="card-header">
                  <div class="platform-icon">📱</div>
                  <h2>iPhone, iPad, Android</h2>
                </div>
                <ul class="feature-list">
                  <li>Save forever, for free.</li>
                  <li>Save any article with one tap.</li>
                  <li>Get instant AI outlines and quick navigation.</li>
                  <li>Cross-platform sync.</li>
                </ul>
              </div>
              <div class="download-buttons">
                <a href="https://apps.apple.com/cn/app/slax-reader-ai-read-it-later/id6596730998" target="_blank" rel="noopener noreferrer" class="download-btn ios-btn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                      fill="currentColor"
                    />
                  </svg>
                  <div>
                    <div class="btn-label">Download on the</div>
                    <div class="btn-store">App Store</div>
                  </div>
                </a>
                <a href="https://play.google.com/store/apps/details?id=com.slax.reader" target="_blank" rel="noopener noreferrer" class="download-btn android-btn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"
                      fill="currentColor"
                    />
                  </svg>
                  <div>
                    <div class="btn-label">GET IT ON</div>
                    <div class="btn-store">Google Play</div>
                  </div>
                </a>
              </div>
            </div>
          </article>

          <!-- Mac Card -->
          <article class="download-card">
            <div class="card-content">
              <div class="card-left">
                <div class="card-header">
                  <div class="platform-icon">💻</div>
                  <h2>Mac</h2>
                </div>
                <ul class="feature-list">
                  <li>Save, read and organize like a pro.</li>
                </ul>
              </div>
              <div class="download-buttons">
                <a href="https://apps.apple.com/cn/app/slax-reader-ai-read-it-later/id6596730998" target="_blank" rel="noopener noreferrer" class="download-btn mac-btn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                      fill="currentColor"
                    />
                  </svg>
                  <div>
                    <div class="btn-label">Download on the</div>
                    <div class="btn-store">Mac App Store</div>
                  </div>
                </a>
              </div>
            </div>
          </article>

          <!-- Browser Extension Card -->
          <article class="download-card">
            <div class="card-content">
              <div class="card-left">
                <div class="card-header">
                  <div class="platform-icon">🌐</div>
                  <h2>Browser Extension</h2>
                </div>
                <ul class="feature-list">
                  <li>One tap to save and back up any web page — yours to keep forever.</li>
                  <li>AI chat with your articles — right on the same page.</li>
                  <li>Find what you need fast with powerful semantic search.</li>
                </ul>
              </div>
              <div class="download-buttons">
                <a
                  href="https://chromewebstore.google.com/detail/gdnhaajlomjkhahnmiijphnodkcfikfd?utm_source=homepage"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="download-btn browser-btn"
                >
                  <svg width="24" height="24" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                    <path d="M371.8 512c0 77.5 62.7 140.2 140.2 140.2S652.2 589.5 652.2 512 589.5 371.8 512 371.8 371.8 434.4 371.8 512z" fill="currentColor" />
                    <path
                      d="M900 362.4l-234.3 12.1c63.6 74.3 64.6 181.5 11.1 263.7l-188 289.2c78 4.2 158.4-12.9 231.2-55.2 180-104 253-322.1 180-509.8zM320.3 591.9L163.8 284.1C121 349.5 96 428 96 512c0 208 152.3 380.3 351.4 410.8l106.9-209.4c-96.6 18.2-189.9-34.8-234-121.5zM538.8 306.4l344.4 18.1C848 254.7 792.6 194 719.8 151.7 653.9 113.6 581.5 95.5 510.5 96c-122.5 0.5-242.2 55.2-322.1 154.5l128.2 196.9c32-91.9 124.8-146.7 222.2-141z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Chrome Extension</span>
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <AppFooter />
  </div>
</template>

<script lang="ts" setup>
import AppFooter from '#layers/core/components/AppFooter.vue'
import AppHeader from '#layers/core/components/AppHeader.vue'

// SEO 配置
useHead({
  title: 'Download - Slax Reader',
  meta: [
    {
      name: 'description',
      content: 'Download Slax Reader for iOS, Android, and browser extensions. Your AI-powered read-it-later companion, available on all platforms.'
    },
    {
      property: 'og:title',
      content: 'Download - Slax Reader'
    },
    {
      property: 'og:description',
      content: 'Download Slax Reader for iOS, Android, and browser extensions. Your AI-powered read-it-later companion, available on all platforms.'
    },
    {
      property: 'og:type',
      content: 'website'
    },
    {
      name: 'keywords',
      content: 'Slax Reader download, iOS app, Android app, browser extension, read later, AI reading assistant'
    }
  ]
})
</script>

<style lang="scss" scoped>
* {
  font-family: -apple-system, 'system-ui', 'Segoe UI', Roboto, sans-serif !important;
}

.download-page {
  --style: min-h-screen bg-#f8f9fa;
}

.container {
  --style: max-w-1200px mx-auto px-20px;
}

/* Hero Section */
.hero {
  --style: py-100px bg-gradient-to-br from-[#f0fdf9] via-[#e6fff3] to-[#d1fae5];
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    --style: absolute top-0 left-50% w-600px h-600px rounded-full;
    background: radial-gradient(circle, rgba(22, 185, 152, 0.15) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    animation: pulse 3s ease-in-out infinite;
  }

  .container {
    position: relative;
    z-index: 1;
  }

  .hero-badge {
    --style: inline-block px-16px py-6px mb-24px rounded-full text-14px font-600 text-[#16B998];
    background: rgba(22, 185, 152, 0.1);
    border: 1px solid rgba(22, 185, 152, 0.2);
  }

  h1 {
    --style: text-56px font-800 text-[#1f1f1f] mb-20px line-height-72px;
    background: linear-gradient(135deg, #1f1f1f 0%, #16b998 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    --style: text-20px text-[#666] font-400 max-w-600px mx-auto;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 0.8;
  }
}

/* Download Section */
.download-section {
  --style: py-80px bg-#fff;
  .download-list {
    --style: flex flex-col gap-24px;
  }
}

.download-card {
  --style: bg-gradient-to-br from-[#ffffff] to-[#fafafa] rounded-24px p-48px transition-all duration-300;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 1px 2px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    --style: absolute top-0 left-0 w-full h-2px;
    background: linear-gradient(90deg, #16b998 0%, #1cb0b5 100%);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.4s ease;
  }

  &:hover {
    box-shadow:
      0 8px 24px rgba(22, 185, 152, 0.12),
      0 4px 8px rgba(0, 0, 0, 0.08);
    border-color: rgba(22, 185, 152, 0.2);
    transform: translateY(-2px);

    &::before {
      transform: scaleX(1);
    }

    .platform-icon {
      transform: scale(1.1) rotate(5deg);
    }
  }

  .card-content {
    --style: 'flex items-center justify-between gap-48px max-md:(flex-col items-start gap-32px)';
  }

  .card-left {
    --style: flex-1;
  }

  .card-header {
    --style: flex items-center gap-20px mb-16px;
    .platform-icon {
      --style: text-48px;
      transition: transform 0.3s ease;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
    h2 {
      --style: text-32px font-800 text-[#1f1f1f] line-height-40px;
    }
  }

  .feature-list {
    --style: mt-20px;
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      --style: text-16px text-[#666] line-height-28px mb-12px pl-24px;
      position: relative;

      &::before {
        content: '✓';
        --style: absolute left-0 text-[#16B998] font-600;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .download-buttons {
    --style: 'flex gap-12px max-md:(flex-col w-full)';
  }
}

.download-btn {
  --style: flex items-center gap-12px px-24px py-14px rounded-12px font-600 text-16px transition-all duration-300;
  text-decoration: none;
  position: relative;
  overflow: hidden;
  min-width: 180px;
  justify-content: center;
  will-change: transform;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
    transition:
      transform 0.6s,
      opacity 0.6s;
    will-change: transform, opacity;
  }

  &:hover::before {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }

  svg,
  div,
  span {
    position: relative;
    z-index: 1;
  }

  &.ios-btn {
    --style: bg-[#000] text-#fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    &:hover {
      --style: bg-[#1a1a1a];
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &.android-btn {
    --style: bg-[#34A853] text-#fff;
    box-shadow: 0 4px 12px rgba(52, 168, 83, 0.25);

    &:hover {
      --style: bg-[#2d9348];
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(52, 168, 83, 0.35);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &.mac-btn {
    --style: bg-[#000] text-#fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    &:hover {
      --style: bg-[#1a1a1a];
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &.browser-btn {
    --style: text-#fff;
    background: linear-gradient(135deg, #4285f4 0%, #34a853 33%, #fbbc05 66%, #ea4335 100%);
    background-size: 200% 200%;
    box-shadow:
      0 4px 12px rgba(66, 133, 244, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.1) inset;
    position: relative;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      background-position: 100% 100%;
      transform: translateY(-2px);
      box-shadow:
        0 8px 24px rgba(66, 133, 244, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.2) inset;
      animation: gradient-shift 3s ease infinite;

      &::after {
        opacity: 1;
      }
    }

    &:active {
      transform: translateY(0);
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

  .btn-label {
    --style: text-11px opacity-90 text-left;
    letter-spacing: 0.3px;
  }

  .btn-store {
    --style: text-17px font-700;
  }

  svg {
    flex-shrink: 0;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .hero {
    --style: py-60px;

    .hero-badge {
      --style: text-12px px-12px py-4px;
    }

    h1 {
      --style: text-36px line-height-48px mb-16px;
    }

    p {
      --style: text-16px;
    }
  }

  .download-section {
    --style: py-48px;
  }

  .download-card {
    --style: p-24px rounded-20px;

    .card-header {
      --style: gap-12px mb-12px;

      .platform-icon {
        --style: text-36px;
      }

      h2 {
        --style: text-24px line-height-32px;
      }
    }

    .download-buttons {
      --style: w-full;

      .download-btn {
        --style: w-full;
      }
    }
  }
}
</style>
