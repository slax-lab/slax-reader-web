<template>
  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-links">
          <a href="https://reader-blog.slax.com" target="_blank">Blog</a>
          <span class="separator">•</span>
          <a href="https://x.com/SlaxReader" target="_blank">Twitter</a>
          <span class="separator">•</span>
          <a href="https://t.me/slax_app" target="_blank">Telegram</a>
          <span class="separator">•</span>
          <a href="/terms">Terms of Service</a>
          <span class="separator">•</span>
          <a href="/privacy">Privacy</a>
          <span class="separator">•</span>
          <a href="/contact">Contact Us</a>
        </div>
        <div class="footer-copyright">
          <p>&copy; 2026 Slax Reader. All rights reserved.</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
footer {
  --style: bg-#1a1a1a text-#999 py-48px;
}

.container {
  --style: max-w-1200px mx-auto px-20px;
}

.footer-content {
  --style: flex flex-col items-center gap-20px text-center;
}

.footer-links {
  --style: flex items-center gap-16px;

  a {
    --style: text-15px text-#999 no-underline transition-colors duration-300;

    &:hover {
      --style: text-#16b998;
    }
  }

  .separator {
    --style: text-#666 text-12px;
  }
}

.footer-copyright {
  p {
    --style: text-14px text-#666 m-0;
  }
}
</style>
