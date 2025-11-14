<template>
  <div>
    <h2>User Show Page</h2>
    <p>User ID: {{ ref.userId }}</p>
  </div>
</template>

<script setup lang="ts">
import { useParams } from '@ciderjs/city-gas/vue';

const ref = useParams<'/users/show'>();
</script>

<script lang="ts">
export const params = {
  userId: 'string',
};
</script>
