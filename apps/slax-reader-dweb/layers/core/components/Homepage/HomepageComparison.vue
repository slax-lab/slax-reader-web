<template>
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
              <td><span class="check">✅</span></td>
              <td><span class="cross">Paid service</span></td>
            </tr>
            <tr>
              <td>Permanent Content Backup</td>
              <td><span class="check">✅</span></td>
              <td><span class="cross">Paid service</span></td>
              <td><span class="cross">Paid service</span></td>
            </tr>
            <tr>
              <td>AI Outline</td>
              <td><span class="cross">Paid service</span></td>
              <td><span class="check">✅</span></td>
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
              <td><span class="check">✅</span></td>
              <td><span class="cross">❌</span></td>
              <td><span class="cross">Paid service</span></td>
            </tr>
            <tr>
              <td>Join Reader Discussions</td>
              <td><span class="check">✅</span></td>
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
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
* {
  font-family: -apple-system, 'system-ui', 'Segoe UI', Roboto, sans-serif !important;
}

.container {
  --style: max-w-1200px mx-auto px-20px;
}

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
</style>
