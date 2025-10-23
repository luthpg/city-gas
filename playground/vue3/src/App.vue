<template>
  <div>
    <h1>city-gas Vue Playground</h1>
    <nav>
      <button @click="goHome">Go Home</button>
      <button @click="goUser">Go User 123</button>
      <button @click="goAbout">Go About</button>
    </nav>
    <hr />
    <RouterOutlet />
  </div>
</template>

<script setup lang="ts">
import { useNavigate } from "@ciderjs/city-gas/vue";

const navigate = useNavigate();

const goHome = () => navigate("/");
const goUser = () => navigate("/users/show", { userId: "123" });
const goAbout = () => navigate("/about");
</script>
