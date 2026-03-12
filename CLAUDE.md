# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Summary

AI-powered Naver blog content generation SaaS tool. Users input keywords and the system generates publish-ready blog posts through a **16-step pipeline**. No backend database — all drafts stored in browser localStorage via Zustand.

**Stack:** Next.js (App Router) · TypeScript (strict) · Google Gemini API (`gemini-2.5-flash`) · Zustand · React Query · Tailwind CSS · Vitest

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint
npm run typecheck        # TypeScript type checking
npm test                 # Run all tests (Vitest)
npm test -- --watch      # Watch mode
npm test -- <file-path>  # Single test file
npm test -- --coverage   # Coverage report
```

## Architecture

### Pipeline System (core concept)

Content generation is a **strict sequential pipeline** — never a single monolithic AI call. Each step is an independent module in `src/core/steps/`:

```
intent → persona → titles → titlePick → outline → sections → faq → summary
→ meta → hashtags → imagePlan → images → naverTone → validator → exportHtml → exportMd
```

- Step definitions and `STEP_ORDER` live in `src/core/pipeline/steps.ts`
- Pipeline orchestrator: `src/core/pipeline/runPipeline.ts`
- Each step implements `PipelineStep` interface with `execute()`, `shouldRun()`, and `dependsOn`
- Step outputs accumulate into `DraftState` (defined in `src/types/pipeline.ts`)

### AI Prompts

All prompts are **externalized as markdown files** in `src/prompts/` (e.g., `01_intent.md`). Never hardcode prompts in step logic. Loaded via `src/core/prompts/getPrompt.ts`.

### API Routes

- `POST /api/pipeline/run` — executes full pipeline
- `POST /api/pipeline/step` — executes a single step

Both receive `{ draft, apiKey, imageProviderType }` and return `{ draft: updatedDraft }`.

### Key Layers

| Layer | Path | Purpose |
|-------|------|---------|
| App/Routes | `src/app/` | Next.js pages and API routes |
| Components | `src/components/` | React UI components |
| Core | `src/core/` | Pipeline logic, steps, prompts, errors |
| Infra | `src/infra/` | Gemini client, image providers |
| Store | `src/store/draftStore.ts` | Zustand store (localStorage-persisted) |
| Types | `src/types/pipeline.ts` | All pipeline type definitions |
| Config | `src/config/index.ts` | Gemini, image, pipeline settings |

### State Management

- **Zustand** (`useDraftStore`) for global draft state, persisted to localStorage
- **React Query** for server state (staleTime: 60s, no refetch on focus)
- Prefer local state where possible

### Gemini Client (`src/infra/gemini/client.ts`)

- Retry with exponential backoff on rate limits (429/RESOURCE_EXHAUSTED)
- Structured JSON responses via schema validation
- Default temperature: 0.4

### Image Providers (`src/infra/images/`)

- Factory pattern: `createImageProvider(type, options)`
- Active: GeminiNanoBananaProvider; StubProvider for testing

## Code Style

- **2 spaces** indentation, **single quotes**, **semicolons required**, 100 char line limit
- File naming: Components `PascalCase`, utils `camelCase`, types `PascalCase`
- Booleans prefixed with `is`, `has`, `should`
- Explicit return types on functions; `interface` for objects, `type` for unions
- Avoid `any` — use `unknown` when type is uncertain
- Import order: React/Next → external libs → `@/` internal → relative → `import type`
- Tests co-located with source: `component.tsx` → `component.test.tsx` (AAA pattern)
- Components: functional only, max ~200 lines
- Logging: `console.info('[Module] message')`, avoid `console.log` in production

## Git Conventions

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`
- Commit messages in English
- Do not commit directly to `main` — use PRs

## Theming

Penguin-mode dark palette:
- Primary: `#101010`, Secondary: `#528be6`, Accent: `#ffe683`
- Font: Pretendard (Korean-optimized)

## Content Generation Rules

- Naver blog style: empathy intro, 3-4 line paragraphs, frequent lists, reader questions, experience-like tone
- SEO: structured H2/H3 headings, FAQ section required, summary required, no keyword stuffing
- Images: 1 cover + 1-2 body images, placement decided in imagePlan step

## 7 Personas

`PersonaId` types: `female-20s-student-jobseeker`, `male-20s-student-junior-worker`, `female-30s-office-worker`, `female-30s-homemaker`, `male-40s-office-worker`, `female-40s-homemaker`, `male-50plus-current-affairs`

## Environment

```bash
# .env (see .env.example)
GEMINI_API_KEY=...
IMAGE_API_KEY=...
```
