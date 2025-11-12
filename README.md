# @ciderjs/city-gas

[![README-ja](https://img.shields.io/badge/日本語-blue?logo=ReadMe)](./README.ja.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@ciderjs/city-gas.svg)](https://www.npmjs.com/package/@ciderjs/city-gas)
[![GitHub issues](https://img.shields.io/github/issues/luthpg/city-gas.svg)](https://github.com/luthpg/city-gas/issues)

## 🌐 Overview

`city-gas` is a type-safe router for React and Vue 3 applications that works both in **Google Apps Script (GAS)** and **browser environments**.  
It features **file-based routing**, a **flexible params DSL**, and a **Vite plugin** that auto-generates TypeScript types for safe navigation.

---

## ✨ Features

- **File-based routing** (`src/pages/` → routes)  
- **Nested Routes (Layouts)** (`_layout`, `_root`, `_404`)
- **Flexible params DSL** (string, number, boolean, enum, array, object, optional)  
- **Type-safe navigation** (`router.navigate("page", params)`)  
- **Environment adapters** (GAS / Browser)  
- **Vite plugin** generates `.d.ts` and route maps automatically  

---

## 📦 Installation

```bash
npm install @ciderjs/city-gas
# or
pnpm add @ciderjs/city-gas
```

---

## 🔌 Vite Plugin

`city-gas` provides a Vite plugin that automatically scans `src/pages/` and generates:

- `.generated/router.d.ts` → `RouteNames` and `RouteParams` types  
- `.generated/routes.ts` → route name ↔ component map  

### Usage (React)

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cityGasRouter } from "@ciderjs/city-gas/plugin";

export default defineConfig({
  plugins: [
    react(),
    cityGasRouter(), // enable city-gas auto type generation
  ],
});
```

### Usage (Vue 3)

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { cityGasRouter } from "@ciderjs/city-gas/plugin";

export default defineConfig({
  plugins: [
    vue(),
    cityGasRouter(), // enable city-gas auto type generation
  ],
});
```

The plugin will watch `src/pages/**/*.tsx` (React) or `src/pages/**/*.vue` (Vue) and regenerate types on file changes.

---

## 🚀 Usage

With `city-gas`, your file structure defines your application's routes and layouts.

### 1. Project Structure Example

First, create your pages and layout components inside the `src/pages` directory.

```tree
src/
└── pages/
    ├── _root.tsx         # The root layout wrapping the entire app
    ├── _layout.tsx       # Layout for the root and its children
    ├── index.tsx         # Home page (route: /)
    └── users/
        ├── _layout.tsx   # Nested layout for /users/* routes only
        └── show.tsx      # User detail page (route: /users/show)
```

### 2. Defining Route Parameters (DSL)

In each page component, you can define the types of parameters it accepts by exporting a constant named `params`. The Vite plugin will automatically detect this and generate type-safe `navigate` functions and `useParams` hooks.

#### React (`.tsx`)

Use a standard named export to define the `params` object.

```tsx: src/pages/users/show.tsx
// src/pages/users/show.tsx
import React from 'react';

// Define the parameter types
export const params = {
  userId: 'string',
  tab: { type: 'enum', values: ['profile', 'settings'], optional: true },
};

// Use the useParams hook to receive parameters within the component
import { useParams } from '@ciderjs/city-gas/react';

export default function UserShowPage() {
  const { userId, tab } = useParams<'/users/show'>() as { userId: string; tab?: 'profile' | 'settings' };
  return (
    <div>
      <h2>User: {userId}</h2>
      <p>Tab: {tab ?? 'profile'}</p>
    </div>
  );
}
```

#### Vue (`.vue`)

In a Vue Single File Component (SFC), use a separate, normal `<script>` tag alongside `<script setup>` to export the `params` constant.

```vue: src/pages/users/show.vue
<!-- src/pages/users/show.vue -->
<template>
  <div>
    <h2>User: {{ userId }}</h2>
    <p>Tab: {{ tab ?? 'profile' }}</p>
  </div>
</template>

<!-- Your Composition API logic goes here -->
<script setup lang="ts">
import { useParams } from '@ciderjs/city-gas/vue';

const { userId, tab } = useParams<'/users/show'>() as { userId: string; tab?: 'profile' | 'settings' };
</script>

<!-- Use a separate script block to export params -->
<script lang="ts">
export const params = {
  userId: 'string',
  tab: { type: 'enum', values: ['profile', 'settings'], optional: true },
};
</script>
```

### 3. Layout Implementation Example

#### React

**`src/pages/_root.tsx` (Root Layout)**
Use this to place global headers, styles, or Context Providers that should apply to the entire application.

```tsx: src/pages/_root.tsx
import React from 'react';
import { useNavigate } from '@ciderjs/city-gas/react';

const Navigation = () => {
  const navigate = useNavigate();
  return (
    <nav>
      <button onClick={() => navigate('/')}>Home</button>
      <button onClick={() => navigate('/users/show', { userId: '123' })}>User 123</button>
    </nav>
  );
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="root-layout" style={{ border: '2px solid blue', padding: '1rem' }}>
      <Navigation />
      <h2>Root Layout (_root)</h2>
      {children}
    </div>
  );
}
```

**`src/pages/users/_layout.tsx` (Nested Layout)**
This layout will only apply to a specific section (in this case, routes under `/users`).

```tsx: src/pages/users/_layout.tsx
import React from 'react';

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="users-layout" style={{ border: '2px solid green', padding: '1rem' }}>
      <h3>Users Section Layout (users/_layout)</h3>
      {children}
    </div>
  );
}
```

#### Vue

**`src/pages/_root.vue` (Root Layout)**

```vue: src/pages/_root.vue
<template>
  <div id="root-layout" style="border: 2px solid blue; padding: 1rem;">
    <h2>Root Layout (_root)</h2>
    <slot></slot>
  </div>
</template>
```

**`src/pages/users/_layout.vue` (Nested Layout)**

```vue: src/pages/users/_layout.vue
<template>
  <div id="users-layout" style="border: 2px solid green; padding: 1rem;">
    <h3>Users Section Layout (users/_layout)</h3>
    <slot></slot>
  </div>
</template>
```

### 4. Router Initialization and App Implementation (React)

Set up the router in your application's entry point (`main.tsx`) and render pages using `RouterOutlet` in `App.tsx`.

**`src/main.tsx`**

```tsx: src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRouter } from '@ciderjs/city-gas';
import { RouterProvider } from '@ciderjs/city-gas/react';
import { pages, specialPages } from './generated/routes';

// Create the router instance
const router = createRouter(pages, { specialPages });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
```

**`src/pages/index.tsx`**

```tsx: src/pages/index.tsx
export default function Page() {
  return (
    <div>
      <h1>Home page</h1>
    </div>
  );
}
```

### 5. Usage with Vue 3

Basic setup for Vue is as follows:

```ts
// main.ts
import { createRouter } from '@ciderjs/city-gas';
import { createRouterPlugin, RouterOutlet } from '@ciderjs/city-gas/vue';
import { createApp } from 'vue';
import { pages, specialPages } from './generated/routes';

function main() {
  const router = createRouter(pages, { specialPages });
  createApp(RouterOutlet).use(createRouterPlugin(router)).mount('#root');
}

main();
```

---

## 📜 License

MIT
