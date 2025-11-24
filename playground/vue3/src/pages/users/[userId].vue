<template>
  <div>
    <h2>User Page</h2>
    <p>User ID: {{ ref.userId }}</p>
  </div>
</template>

<script setup lang="ts">
import { useParams } from '@ciderjs/city-gas/vue';

const ref = useParams('/users/[userId]');
console.log(ref.value.type ?? 0);
</script>

<script lang="ts">
import { z } from 'zod';
export const schema = z.object({
  type: z.coerce.number().optional(),
});
</script>