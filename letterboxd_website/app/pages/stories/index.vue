<template>
  <div class="stories-page">
    <div class="frame">
      <div class="eyebrow">Stories</div>
      <h1 class="editorial-title">Four small chapters about collaboration.</h1>
      <p class="lede">A short editorial series in development. Each chapter picks a curated collective of filmmakers — a director's troupe, a producer's stable — and walks through the films that built it.</p>
      <ul class="stub-grid">
        <li
          v-for="ch in chapters"
          :key="ch.n"
          class="stub"
          :class="{ live: ch.href }"
        >
          <component
            :is="ch.href ? NuxtLink : 'div'"
            :to="ch.href || undefined"
            class="stub-inner"
          >
            <div class="stub-eyebrow">Chapter {{ String(ch.n).padStart(2, '0') }}</div>
            <div class="stub-title">{{ ch.title }}</div>
            <div class="stub-status">
              <span v-if="ch.href" class="read-cta">Read →</span>
              <span v-else>Forthcoming</span>
            </div>
          </component>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const NuxtLink = resolveComponent('NuxtLink')

const chapters = [
  { n: 1, title: 'Forthcoming', href: null },
  { n: 2, title: 'Forthcoming', href: null },
  { n: 3, title: 'The Architecture of Time: The Christopher Nolan Eras', href: '/stories/nolan' },
  { n: 4, title: "America’s Chronicler: Scorsese’s Visual Journey", href: '/stories/scorsese' },
]
</script>

<style scoped>
.stories-page {
  position: fixed;
  inset: 0;
  padding: 96px 48px 48px;
  overflow-y: auto;
}
.frame { max-width: 880px; margin: 24px auto; }
.editorial-title { font-size: 56px; margin: 8px 0 16px; }
.lede {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 18px;
  color: var(--ink-muted);
  margin: 0 0 48px;
  max-width: 560px;
  line-height: 1.4;
}
.stub-grid {
  list-style: none; padding: 0; margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.stub {
  border: 1px solid var(--rule);
  background: var(--bg-elevated);
  border-radius: 6px;
  opacity: 0.55;
  transition: opacity 200ms ease, transform 200ms ease, border-color 200ms ease;
}
.stub.live {
  opacity: 1;
  border-color: rgba(194,65,12,0.25);
}
.stub.live:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
}
.stub-inner {
  display: block;
  padding: 28px;
  color: inherit;
}
.stub-eyebrow {
  font-family: var(--font-sans);
  font-size: 10px; letter-spacing: 0.28em;
  text-transform: uppercase; color: var(--accent);
  margin-bottom: 8px;
  font-weight: 600;
}
.stub-title {
  font-family: var(--font-serif);
  font-size: 26px;
  line-height: 1.1;
  color: var(--ink);
  margin-bottom: 18px;
}
.stub-status {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--ink-faint);
}
.stub.live .stub-status .read-cta {
  color: var(--accent);
}
</style>
