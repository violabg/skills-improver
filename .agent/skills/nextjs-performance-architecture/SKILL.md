---
name: nextjs-performance-architecture
description: A comprehensive guide to Next.js performance patterns, combining Data Fetching Colocation, the Donut Pattern, and the 'use cache' directive for optimal application architecture.
---

This document aggregates three core architectural patterns for modern Next.js development: **Data Fetching Colocation**, **The Donut Pattern**, and **The 'use cache' Directive**. These patterns are designed to improve performance, maintainability, and code composition in Next.js 16+ applications.

---

## 1. Skill: Data Fetching Colocation

### When to use

- When data is being passed down through multiple layers of components (prop drilling).
- When a root layout or page file is blocked by a large initial data fetch.
- When components are not reusable because they depend on props passed from a specific parent.

### Implementation

Instead of fetching data at the top level (Page/Layout), move the `async` fetch call directly into the Server Component that requires the data.

```tsx
// ❌ Before: Passing data down
export default async function Page() {
  const data = await getData();
  return <Child data={data} />;
}

// ✅ After: Collocated fetching
export default async function Child() {
  const data = await getData();
  return <div>{data.title}</div>;
}
```

#### Resolving Promises with `use`

In Client Components, use `React.use()` to unwrap promises passed from Server Components, allowing the server to stream data without blocking the initial render.

```tsx
// Client Component
"use client";
import { use } from "react";

export function UserProfile({ userPromise }) {
  const user = use(userPromise); // Unwraps the promise
  return <div>{user.name}</div>;
}
```

---

## 2. Skill: The Donut Pattern

### When to use

- When you need to add interactivity (e.g., state, event handlers) to a section of a page while keeping its nested content on the server.
- To avoid marking a large component tree as `"use client"` just for a small interactive element.
- When you want to preserve the ability of nested components to be `async` Server Components.

### Implementation

1. **Isolate Interactive Logic**: Extract interactive parts into a Client Component.
2. **Create the "Hole" (Children Prop)**: Accept `children` as a prop in the Client Component.
3. **Compose on the Server**: Import the Client wrapper in a Server Component and pass Server Components as children.

```tsx
// BannerContainer.tsx (Client Component)
"use client";
import { useState } from "react";

export default function BannerContainer({ children }) {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) return null;
  return <div onClick={() => setIsVisible(false)}>{children}</div>;
}

// Page.tsx (Server Component)
import BannerContainer from "./BannerContainer";
import AsyncWelcomeMessage from "./AsyncWelcomeMessage"; // Server Component

export default function Page() {
  return (
    <BannerContainer>
      <AsyncWelcomeMessage /> {/* Runs on the server! */}
    </BannerContainer>
  );
}
```

---

## 3. Skill: The 'use cache' Directive

### When to use

- When a page is dynamic (due to headers/cookies) but contains sections that are mostly static.
- To eliminate complex "static vs dynamic" route splitting hacks.
- To cache expensive computations or database queries at the component level.

### Implementation

Apply the `'use cache'` directive at the top of a component or function to mark it for caching regardless of the page's dynamic status.

```tsx
// FeatureProducts.tsx
"use cache";
import db from "@/lib/db";

export async function FeatureProducts() {
  const products = await db.skill.findMany({ where: { category: "HARD" } });
  return (
    <div>
      {products.map((p) => (
        <div key={p.id}>{p.name}</div>
      ))}
    </div>
  );
}
```

#### Interleaving Dynamic Content

If a cached component needs a dynamic piece (like a user-specific button), combine this with the **Donut Pattern**. Pass the dynamic component as `children` into the cached component.

```tsx
"use cache";
export async function ProductLayout({ children }) {
  // Heavy static shell...
  return <div>{children}</div>;
}
```
