<template>
  <div>
    <h2>User Page</h2>
    <p>User ID: {{ ref.userId }}</p>
  </div>
</template>

<script setup lang="ts">
import { useParams } from '@ciderjs/city-gas/vue';

const ref = useParams('/user/[userId]');
</script>
