# agents.md

## Project Overview

This project is an **AI-powered blog content generation tool** focused on **Naver SEO optimized posts**.

The goal is to generate **publish-ready blog posts** including:

- SEO optimized structure
- persona-based tone
- images embedded within content
- FAQ and metadata
- HTML / Markdown export

This tool will be sold as a **SaaS product** where users input their own API keys.

The system uses:

- **Next.js** (App Router)
- **TypeScript**
- **Google Gemini API**
- **Image generation APIs**

No backend infrastructure or database is required.
All drafts are stored locally.

---

## Development Commands

Run these commands in the project root:

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run a single test file
npm test -- <test-file-path>

# Run tests with coverage
npm test -- --coverage

# Run tests matching a pattern
npm test -- --testNamePattern="<pattern>"
```

---

## Code Style Guidelines

### General Rules

- Use **2 spaces** for indentation (no tabs)
- Use **single quotes** for strings (except where double quotes are required)
- Use **semicolons** at the end of statements
- Maximum line length: **100 characters**
- Use **ESNext** features (async/await, optional chaining, nullish coalescing)

### Naming Conventions

#### Files

- Components: `PascalCase` (e.g., `BlogCard.tsx`, `ImageGenerator.tsx`)
- Utils/Helpers: `camelCase` (e.g., `generateSlug.ts`, `parseJson.ts`)
- Types/Interfaces: `PascalCase` (e.g., `PipelineStep.ts`, `DraftState.ts`)

#### Functions & Variables

- Functions: `camelCase` (e.g., `generateTitle()`, `validatePost()`)
- Boolean variables: prefix with `is`, `has`, `should` (e.g., `isValid`, `hasImages`)

### Imports

```typescript
// 1. React/Next.js imports
import { useState } from "react";
import Link from "next/link";

// 2. External libraries
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

// 3. Internal modules (absolute paths)
import { runPipeline } from "@/core/pipeline/runPipeline";
import { Button } from "@/components/ui/Button";

// 4. Relative imports (when needed)
import { helper } from "./utils/helper";

// 5. Type imports (use 'import type')
import type { PipelineStep, DraftState } from "@/types/pipeline";
```

### Types & Interfaces

- Always define **explicit return types** for functions
- Use **interfaces** for object shapes, **types** for unions/aliases
- Avoid `any`, use `unknown` when type is truly uncertain

```typescript
// Good
function calculateScore(input: string): number { ... }

interface BlogPost {
  title: string;
  content: string;
  images: Image[];
}

// Bad
function process(data) { ... }  // No types!
```

### Error Handling

- Always use **try/catch** for async operations
- Create custom error classes for domain-specific errors

```typescript
// Custom error class
class PipelineError extends Error {
  constructor(
    message: string,
    public step: string,
    public code?: string,
  ) {
    super(message);
    this.name = "PipelineError";
  }
}

// Proper error handling
try {
  await generateContent(keyword);
} catch (error) {
  if (error instanceof PipelineError) {
    // Handle domain error
    console.error(`Pipeline failed at ${error.step}:`, error.message);
  } else {
    // Handle unexpected error
    throw new PipelineError("Unexpected error", "unknown", "UNKNOWN");
  }
}
```

### React/Component Patterns

- Use **functional components** with hooks only
- Keep components small and focused (max 200 lines)
- Extract reusable logic into **custom hooks**

```typescript
// Good component structure
interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
}

export function ContentGenerator({ title, onSubmit }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    try {
      await onSubmit({ title });
    } finally {
      setIsLoading(false);
    }
  }, [title, onSubmit]);

  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? '생성 중...' : '생성하기'}
      </button>
    </div>
  );
}
```

### State Management

- Use **Zustand** for global state (draft store)
- Use **React Query** for server state
- Keep state as local as possible

### Async/Await Patterns

- Always handle loading and error states
- Use **early returns** for cleaner code

```typescript
// Good async pattern
async function fetchDraft(id: string): Promise<Draft | null> {
  if (!id) return null;

  try {
    const response = await fetch(`/api/drafts/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("Failed to fetch draft:", error);
    return null;
  }
}
```

### Testing Patterns

- Place tests next to source files: `component.tsx` → `component.test.tsx`
- Use **Vitest** for unit tests
- Use **Testing Library** for component tests
- Follow AAA pattern: **Arrange, Act, Assert**

```typescript
describe("generateTitle", () => {
  it("should generate SEO-friendly title", () => {
    // Arrange
    const keyword = "아이폰 배터리 절약";

    // Act
    const result = generateTitle(keyword);

    // Assert
    expect(result).toContain(keyword);
    expect(result.length).toBeLessThan(60);
  });

  it("should throw error for empty keyword", () => {
    expect(() => generateTitle("")).toThrow("Keyword is required");
  });
});
```

### Logging

- Use **console.info** for general logs, **console.error** for errors
- Avoid console.log in production
- Include context in logs: `console.info('[Pipeline] Starting step:', stepName)`

### Constants & Config

- Create a `config/` folder for environment-based settings
- Use **UPPER_SNAKE_CASE** for environment variable names

```typescript
// src/config/index.ts
export const config = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
    temperature: 0.4,
  },
  image: {
    maxImagesPerPost: 3,
    defaultSize: "1024x1024",
  },
  pipeline: {
    maxRetries: 3,
    timeout: 30000,
  },
};
```

### File Organization

- Group by feature, not by type (for larger features)
- Keep related files close together

```
# Preferred structure for features
src/
  features/
    content-generator/
      components/
      hooks/
      utils/
      types.ts
      index.ts
```

### Git Conventions

- Use **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`
- Write commit messages in English
- Keep commits atomic and focused

```
feat(pipeline): add title selection step
fix(validator): correct FAQ validation logic
refactor(core): extract common types to shared module
docs(readme): update API usage examples
```

---

## Core Principles

The following rules are **strict requirements** for this project.

### 1. Step-based content generation

The system **must NOT generate the entire blog post in a single AI call.**

Instead it must follow a **multi-step pipeline**.

Pipeline order:

1. search intent analysis
2. persona selection
3. title generation
4. best title selection
5. outline generation
6. section content generation
7. FAQ generation
8. summary generation
9. meta description generation
10. hashtag generation
11. image placement planning
12. image generation
13. Naver tone adjustment
14. final validation
15. export to HTML / Markdown

Each step must be implemented as an **independent module**.

---

## Project Architecture

```
src
 ├ app
 ├ components
 ├ core
 │   ├ pipeline
 │   │   ├ runPipeline.ts
 │   │   └ steps.ts
 │   ├ steps
 │   │   ├ 01_intent.ts
 │   │   ├ 02_persona.ts
 │   │   ├ 03_titles.ts
 │   │   ├ 04_titlePick.ts
 │   │   ├ 05_outline.ts
 │   │   ├ 06_sections.ts
 │   │   ├ 07_faq.ts
 │   │   ├ 08_summary.ts
 │   │   ├ 09_meta.ts
 │   │   ├ 10_hashtags.ts
 │   │   ├ 11_imagePlan.ts
 │   │   ├ 12_images.ts
 │   │   ├ 13_naverTone.ts
 │   │   ├ 14_validator.ts
 │   │   ├ 15_export_html.ts
 │   │   └ 15_export_md.ts
 │
 ├ prompts
 │   ├ intent.md
 │   ├ titles.md
 │   ├ outline.md
 │   ├ sections.md
 │   ├ faq.md
 │   ├ summary.md
 │   ├ image.md
 │   └ naverTone.md
 │
 ├ infra
 │   └ gemini
 │       └ client.ts
 │
 ├ store
 │   └ draftStore.ts
 │
 └ types
     └ pipeline.ts
```

---

## AI Model Usage

Primary model:

```
Gemini 1.5 Pro
```

Usage rules:

- Temperature: **0.4**
- Structured JSON responses preferred
- Avoid free-form output where structure is required

All prompts must be stored inside `/prompts`.

Prompts should **never be hardcoded** in step logic.

---

## Content Generation Rules

Generated blog content must follow these rules.

### Naver blog style

- introduction must start with an **empathy sentence**
- paragraphs should be **3–4 lines maximum**
- lists should be used frequently
- include **reader questions mid-article**
- include **experience-like statements**
- avoid robotic AI tone

### SEO rules

- avoid excessive keyword repetition
- headings must be structured with H2 / H3
- FAQ section required
- summary paragraph required

---

## Image Generation Rules

Each blog post must include images.

Required:

- 1 cover image
- 1–2 body images

Image placement must be determined during the **image planning step**.

Example slots:

```
cover
section1
section2
```

Images must include:

- filename
- alt text
- prompt used for generation

Example output structure:

```
{
  position: "section1",
  filename: "iphone-battery-saving.png",
  alt: "아이폰 배터리 절약 설정 화면",
  prompt: "flat illustration of iphone battery settings screen"
}
```

---

## Export Rules

The system must support exporting content as:

- HTML
- Markdown

Images must be embedded within the content at the correct positions.

Example HTML structure:

```
<h1>Title</h1>

<p>Introduction paragraph...</p>

<img src="cover.png" alt="cover image">

<h2>Section title</h2>

<p>content...</p>

<img src="section1.png" alt="section image">
```

---

## Validation Requirements

Before export, a validation step must check:

- SEO structure
- image placement
- FAQ presence
- meta description
- paragraph length
- tone consistency

If validation fails, the system must request regeneration.

---

## Development Guidelines

When implementing new features:

- keep modules small and composable
- avoid large monolithic AI calls
- maintain deterministic step order
- ensure outputs are structured and typed

All step outputs must be saved into the draft state.

---

## Non-goals

The following are explicitly out of scope:

- automatic blog publishing
- scraping existing articles
- rewriting copyrighted content
- keyword stuffing strategies

---

## Future Extensions

The architecture should support:

- additional blog platforms
- new persona types
- additional export formats
- bulk content generation
