<template>
  <header class="site-nav">
    <NuxtLink to="/atlas" class="brand">
      supervision<span class="amp">.</span>
    </NuxtLink>

    <div class="right">
      <nav class="links">
        <NuxtLink to="/atlas" active-class="on">The Atlas</NuxtLink>
        <NuxtLink to="/constellations" active-class="on">Constellations</NuxtLink>
        <NuxtLink to="/stories" active-class="on">Stories</NuxtLink>
      </nav>
      <template v-if="route.path === '/atlas'">
        <div class="divider" aria-hidden="true"></div>
        <button class="arcs-toggle" :class="{ on: showArcs }" @click="showArcs = !showArcs">
          Co-productions
        </button>
      </template>
      <div class="divider" aria-hidden="true"></div>
      <ThemeToggle />
    </div>
  </header>
</template>

<script setup>
const route = useRoute()
const showArcs = useArcs()
</script>

<style scoped>
.site-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 18px 48px;
  background: var(--bg);
  border-bottom: 1px solid var(--rule);
  font-family: var(--font-sans);
}

.brand {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.brand .amp { color: var(--accent); font-style: italic; }

.right {
  display: flex;
  align-items: center;
  gap: 28px;
}

.links {
  display: flex;
  gap: 28px;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.links a {
  color: var(--ink-muted);
  padding-bottom: 4px;
  border-bottom: 1.5px solid transparent;
  transition: color 200ms ease, border-color 200ms ease;
}
.links a:hover { color: var(--ink); }
.links a.on {
  color: var(--ink);
  border-bottom-color: var(--accent);
}

.arcs-toggle {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 14px;
  color: var(--ink-faint);
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: color 200ms ease;
}
.arcs-toggle:hover { color: var(--ink); }
.arcs-toggle.on { color: var(--ink); }

.divider {
  width: 1px;
  height: 16px;
  background: var(--rule);
  align-self: center;
}

@media (max-width: 720px) {
  .site-nav { padding: 14px 20px; }
  .right { gap: 14px; }
  .links { gap: 14px; font-size: 10px; }
}
</style>