<template>
  <div>
    <h2>User Show Page</h2>
    <p>User ID: {{ userId }}</p>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";

// DSL 定義
export const params = {
  userId: "string",
};

// 型安全な props
const props = defineProps<{ userId: string }>();
const { userId } = props;
</script>
