<template>
  <section class="hero">
    <div class="container">
      <div class="hero-content">
        <div class="hero-text">
          <h1>Read Smarter<br />Connect Deeper</h1>
          <p>Your permanent library that saves, understands, and networks your content with others.</p>
          <div class="hero-cta">
            <span @click="emit('startReading')" class="btn-free">
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
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  startReading: []
}>()
</script>

<style lang="scss" scoped>
* {
  font-family: -apple-system, 'system-ui', 'Segoe UI', Roboto, sans-serif !important;
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
          --style: 'cursor-pointer w-fit flex gap-12px items-center h-60px px-32px rounded-10px justify-center text-#fff text-20px font-600 max-md:(text-16px m-auto) relative overflow-hidden no-underline select-none';
          background: linear-gradient(135deg, #25d4b0 0%, #1cb0b5 50%, #16b998 100%);
          background-size: 200% 200%;
          will-change: transform, box-shadow;
          transition:
            transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

          &::before {
            --style: 'content-empty absolute inset-0 opacity-0';
            background: linear-gradient(135deg, transparent 0%, #ffffff50 50%, transparent 100%);
            transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1;
          }

          &::after {
            --style: 'content-empty absolute inset-0';
            background: linear-gradient(135deg, #25d4b0 0%, #1cb0b5 50%, #16b998 100%);
            background-size: 200% 200%;
            animation: gradient-shift 3s ease-in-out infinite;
            z-index: -1;
          }

          &:hover {
            --style: '-translate-y-3px shadow-[0_12px_28px_#16b99850]';
            transform: translateY(-3px) scale(1.02);

            &::before {
              --style: opacity-100;
            }
          }

          &:active {
            --style: 'translate-y-1px shadow-[0_4px_12px_#16b99840]';
            transform: translateY(1px) scale(0.98);
            transition:
              transform 0.1s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.1s cubic-bezier(0.4, 0, 0.2, 1);
          }

          img {
            --style: w-16px relative z-1;
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          span {
            --style: relative z-1;
          }

          &:hover img {
            transform: translateX(3px);
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

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
