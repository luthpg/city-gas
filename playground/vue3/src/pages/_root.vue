<template>
  <div>
    <header>Header</header>
    <main>
      <h1>city-gas Playground</h1>
      <Navigation />
      <hr />
      <slot />
    </main>
    <footer>Footer</footer>
  </div>
</template>

<script setup lang="ts">
import Navigation from '../components/navigation.vue';
</script>
