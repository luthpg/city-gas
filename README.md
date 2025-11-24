# @ciderjs/city-gas

[![README-ja](https://img.shields.io/badge/日本語-blue?logo=ReadMe)](README.ja.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@ciderjs/city-gas.svg)](https://www.npmjs.com/package/@ciderjs/city-gas)
[![GitHub issues](https://img.shields.io/github/issues/luthpg/city-gas.svg)](https://github.com/luthpg/city-gas/issues)

## 🌐 Overview

`city-gas` is a type-safe router for React and Vue 3 applications that works both in **Google Apps Script (GAS)** and **browser environments**.
It features **file-based routing**, a **parameter and validation configuration with Zod**, and a **Vite plugin** that auto-generates TypeScript types for safe navigation.

---

## 📦 Installation

```bash
npm install @ciderjs/city-gas
# or
pnpm add @ciderjs/city-gas
```

---

## 🔥 Core Features

`city-gas` provides a set of framework-agnostic core features.

### 1. File-Based Routing

Your `src/pages` directory structure is automatically converted into route definitions.

- `src/pages/index.tsx` → `/`
- `src/pages/about.vue` → `/about`
- `src/pages/users/show.tsx` → `/users/show`
- `src/pages/users/[id].tsx` → `/users/[id]` (Dynamic Route)

### 2. Nested Routes (Layouts)

Certain filenames are reserved to function as layout components.

- `_root.tsx` / `_root.vue`: The root layout that wraps the entire application.
- `_layout.tsx` / `_layout.vue`: Provides a common layout for child routes in the same directory and its subdirectories.
- `_404.tsx` / `_404.vue`: A fallback page displayed when no matching route is found.

#### Project Structure Example

```tree
src/
└── pages/
    ├── _root.tsx         # The root layout wrapping the entire app
    ├── _layout.tsx       # Layout for the root and its children
    ├── _404.tsx          # Not found page
    ├── index.tsx         # Home page (route: /)
    └── users/
        ├── _layout.tsx   # Nested layout for /users/* routes only
        ├── [id].tsx      # User detail page (route: /users/[id])
        └── index.tsx     # User top page (route: /users)
```

### 3. Dynamic Routes

You can define dynamic routes by wrapping the filename in brackets, like `[id].tsx`.
The parameter name inside the brackets (e.g., `id`) will be available in `useParams`.

- `src/pages/users/[id].tsx` matches `/users/123`, `/users/abc`, etc.
- `src/pages/posts/[slug].vue` matches `/posts/my-first-post`.

### 3. Type-Safe Parameters (Zod)

In each page, you can define the types of parameters it accepts by exporting a `schema` constant.

The Vite plugin detects this and generates type-safe `navigate` functions and `useParams` hooks/composables.

- Router validates with schema in runtime. If it throws some errors, router returns `404` error page.

#### Example of Defining Parameters

```typescript
// src/pages/users/[id].tsx
import { z } from 'zod';
export const params = {
  // id: z.string(), // path parameter is auto defined as required string
  tab: z.enum(['profile', 'settings']).optional(), // optional
};
```

### 4. Type Generation with Vite Plugin

Simply add the plugin to your `vite.config.ts` to watch the `src/pages` directory and auto-generate route and type definitions.

- `.generated/router.d.ts`: `RouteNames` and `RouteParams` type definitions.
- `.generated/routes.ts`: A map of route names to their components.

> [!NOTE]
> The plugin uses an internal cache based on file modification times (`mtime`) to optimize performance and avoid unnecessary regenerations.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // or vue()
import { cityGasRouter } from "@ciderjs/city-gas/plugin";

export default defineConfig({
  plugins: [
    react(), // or vue()
    cityGasRouter(),
  ],
});
```

---

## 🚀 Usage with React

### 1. Initialization

Set up the router in your entry point (`main.tsx`) and wrap your application with the `RouterProvider`.

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRouter } from '@ciderjs/city-gas';
import { RouterProvider } from '@ciderjs/city-gas/react';
import { pages, specialPages, dynamicRoutes } from './generated/routes';

// Create the router instance
const router = createRouter(pages, { specialPages, dynamicRoutes });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
```

### 2. Hooks

`city-gas` provides custom hooks for type-safe operations.

#### `useParams`

Safely access the parameters of the current page.

```tsx
// src/pages/users/[id].tsx
import { useParams } from '@ciderjs/city-gas/react';
import { z } from 'zod';

export const schema = z.object({
  tab: z.enum(['profile', 'settings']).optional(),
});

export default function UserDetail() {
  // Pass the route name as an argument for strict type inference
  const { id, tab } = useParams('/users/[id]');
  
  return (
    <div>
      <h2>User: {id}</h2>
      <p>Tab: {tab ?? 'profile'}</p>
    </div>
  );
}
```

#### `useNavigate`

Perform page transitions with type-checking.

```tsx
// src/components/SomeComponent.tsx
import { useNavigate } from '@ciderjs/city-gas/react';

const MyComponent = () => {
  const navigate = useNavigate();
  return (
    <nav>
      <button onClick={() => navigate('/')}>Home</button>
      {/* Parameters are also type-safe */}
      <button onClick={() => navigate('/users/[id]', { id: '123', tab: 'settings' })}>
        User 123
      </button>
    </nav>
  );
};
```

---

## 🚀 Usage with Vue

### 1. Initialization

Set up the router plugin in your entry point (`main.ts`) and mount the `RouterOutlet`.

```ts
// src/main.ts
import { createRouter } from '@ciderjs/city-gas';
import { createRouterPlugin, RouterOutlet } from '@ciderjs/city-gas/vue';
import { createApp } from 'vue';
import { pages, specialPages, dynamicRoutes } from './generated/routes';

const router = createRouter(pages, { specialPages, dynamicRoutes });
createApp(RouterOutlet).use(createRouterPlugin(router)).mount('#root');
```

### 2. Composables

Provides Composables for use with Vue 3's Composition API.

#### `useParams`

Safely access the parameters of the current page.

```vue
<!-- src/pages/users/[id].vue -->
<template>
  <div>
    <h2>User: {{ id }}</h2>
    <p>Tab: {{ tab ?? 'profile' }}</p>
  </div>
</template>

<script setup lang="ts">
import { useParams } from '@ciderjs/city-gas/vue';

// Pass the route name as an argument for strict type inference
const { id, tab } = useParams('/users/[id]');
</script>

<!-- Use a separate script block to export params -->
<script lang="ts">
import { z } from 'zod';
export const schema = {
  tab: z.enum(['profile', 'settings']).optional(),
};
</script>
```

#### `useNavigate`

Perform page transitions with type-checking.

```vue
<!-- src/components/SomeComponent.vue -->
<template>
  <nav>
    <button @click="() => navigate('/')">Home</button>
    <!-- Parameters are also type-safe -->
    <button @click="() => navigate('/users/[id]', { id: '123', tab: 'settings' })">
      User 123
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useNavigate } from '@ciderjs/city-gas/vue';
const navigate = useNavigate();
</script>
</script>
```

---

## 📜 License

MIT
