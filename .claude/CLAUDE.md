# GLOBAL_CLAUDE.md — portable engineering instructions

Tier 0. Fully project-agnostic — no repo, stack, or product is named
below except as an example. Drop this file at any repo root and bind it
per §0.

Inherits nothing. Everything else inherits this.

---

## 0. Wiring this file into a project

This file is project-agnostic. Dropping it into a repo does nothing on
its own — an agent must bind it. On first session in a new repo, do this
before any other work, then never again:

1. Confirm the file is at the repo root as `GLOBAL_CLAUDE.md`.
2. Create `.claude/CLAUDE.md` if absent. Its first line is:

       This project inherits every rule in `../GLOBAL_CLAUDE.md`.
       Rules below add to or override it. Nothing here restates it.

3. Detect the stack. Read `package.json`, lockfiles, config files —
   NOT this file's fallback table. §13 applies only where detection
   comes back empty.
4. Create the continuity files in §19 that the repo lacks. Seed each
   from what is actually on disk. Never invent an entry.
5. Record the binding date and detected stack in `STATE.md`.

Do not copy this file's contents into the project file. A copy is a
second thing to update, and it will drift. Reference it.

**WHAT OVERRIDES WHAT — most specific wins:**

  1. An instruction in the current conversation
  2. The project's tech-stack file (`STACK.md`, `TECH_STACK.md`)
  3. The nearest `.claude/CLAUDE.md` walking up from the file you edit
  4. A repo-root `CLAUDE.md` / `AGENTS.md` (often machine-written —
     treat as tool output, not authorship; commit its edits, don't fight
     them)
  5. This file

When two of these conflict, say so out loud and follow the more
specific. Never resolve a conflict silently.

> Point 4 exists because a repo-root `CLAUDE.md` and a
> `.claude/CLAUDE.md` can both apply to the same edit, and nothing
> previously said which won.


## 1. Prime Directive

**Plan → Verify → Execute.** Before writing any code:

1. List every file you will create, modify, or delete.
2. Identify existing abstractions that overlap the plan — extend, don't
   duplicate.
3. If scope is ambiguous on any single point, ask **one** question. Never
   assume and proceed silently on anything load-bearing.

---

## 2. Universal Task Protocol

This is how every task runs, start to finish. Skip a phase only when it's
a genuine no-op (a one-line typo fix doesn't need a milestone plan) —
default to running the full protocol.

**Phase 0 — Identify.**
State the task's intent and the role it requires (frontend, backend,
migration, design pass, lint/cleanup, etc.) in one line before anything
else.

**Phase 1 — Context.**
Read the whole root folder relevant to the task, not just the file
mentioned — existing patterns, adjacent components, the tech-stack file,
any project CLAUDE.md. Never plan against a partial picture.

**Phase 2 — Plan.**
Break the task into milestones. A milestone must be:

- **Independently committable** — repo builds, types pass, nothing is
  left half-implemented at its boundary.
- **Self-contained** — no milestone depends on a future milestone to
  avoid being broken.

Any UI/structural/design work in the plan gets a **concrete textual
mockup** — ASCII wireframe, component tree, prop shapes, example markup —
not just prose. Pairs with the design pass in Section 12.

The plan also names the **files each milestone touches**, following the
granularity rules in Section 7.1 — one file, one task, planned as such
from the start, not refactored into shape afterwards.

**Phase 3 — Approval gate.**
Present the milestone plan. **Stop.** Wait for explicit permission before
writing any implementation code. Hard stop, not a formality.

**Phase 4 — Task breakdown.**
Once approved, expand the plan into a task + subtask list. No cap on
count — as granular as the work needs.

**Phase 5 — Per-task execution loop.** For each task, in order:

a. Implement — walk the ponytail ladder (Section 5) first and write
the rung that holds. Nothing more.
b. Run the Quality Gate (Section 3). Fix everything it flags, including
recurring a11y/security patterns (Section 3.1) — apply the known fix,
don't rediscover it. Re-run until clean — no suppression (Section 4).
c. Commit via the Git Commit Protocol (Section 6) — immediate, no
approval pause. Stage and commit as soon as the gate is clean.
d. Decide if the task needs test coverage: new logic / new branch /
regression guard for a bug fix → yes. Copy change, style-only,
config tweak → usually no.
e. If yes: write the test(s), run, fix failures, re-run until green,
commit again via Section 6 (also immediate).
f. Move to the next task automatically — do not ask "should I
continue?" between tasks or commits. Nothing in this loop pauses for
confirmation except a genuinely ambiguous commit prefix (Section 6).

**Failure escape hatch.** If the same quality-gate error survives 3 fix
attempts on one task, stop looping. Report the error, what was tried, and
ask for direction — don't burn cycles silently.

**Parallel/delegated execution (multiple agents or subagents on
duplicate files).** When the same fix pattern needs to be applied across
several near-duplicate files (e.g. three copies of the same landing-page
component), establish the pattern by hand on one instance first — don't
let every parallel worker independently invent its own version of the
fix. Specify the exact pattern (including which ARIA role, which key
strategy, etc.) before delegating, or run a consistency pass afterward.
Independent agents fixing the same rule on duplicate files can each land
on a different-but-valid choice, leaving the codebase inconsistent even
though every individual file passes lint. See Section 3.1 for a concrete
example.

---

## 3. Quality Gate — Run After Every Step

```bash
npm run format
npm run lint
npm run typecheck
```

Actual script names may differ per project — **always defer to
`package.json`**, the above is the default expectation, not a hardcoded
command.

Tool responsibility (when authoring/verifying scripts, absent other info):

| Concern             | Tool           |
| ------------------- | -------------- |
| Format              | Biome          |
| Lint — TS/JS        | ESLint         |
| Lint — CSS          | Stylelint      |
| Import organization | Biome          |
| Typecheck           | `tsc --noEmit` |

Rules:

1. Run all three (or whatever the project defines) after **every** step,
   even trivial ones.
2. Format changes are part of the step — stage them.
3. Fix all lint errors, re-run to confirm zero before continuing.
4. Fix all typecheck errors, re-run to confirm zero before continuing.
5. Never suppress with `// eslint-disable`, `// biome-ignore`, or
   `// @ts-ignore` just to pass — fix the root cause.
6. Suppressions are acceptable **only** for genuine, unfixable
   library type gaps — always paired with `// NOTE: <reason>`.
7. Only after all checks exit clean does the step count as done.
8. When a fix for one rule's finding creates a **new** finding on the
   same line from a different rule (e.g. adding `role="button"` to
   satisfy one accessibility rule immediately trips a semantic-elements
   rule), that's usually a genuine rule conflict, not a mistake in the
   first fix. Pick the resolution that satisfies both rules — see 3.1
   for the concrete SVG/ARIA-role case — rather than iterating blindly
   between two half-fixes.

### 3.1 A11y & Security Lint — Established Fix Patterns

These are root-cause fixes for the accessibility/security lint rules
that recur most across this codebase's component patterns. Apply them
directly on sight — don't rediscover the right fix from scratch every
time one of these fires.

- **`noLabelWithoutControl`**: if `<label>` visually wraps a real
  `input`/`select`/`textarea`, nest the control inside the `<label>`
  rather than adding `htmlFor`/`id` — fewer lines, no id-namespacing to
  invent, survives an id rename. If the "label" actually heads a group
  with no single associated control (e.g. a heading above a row of
  picker buttons), it isn't a label at all — change the tag to `<div>`
  (or a real heading element). Don't force a fake `htmlFor` onto a
  button group just to satisfy the rule. Where nesting isn't feasible
  (complex form layouts), use `htmlFor`/`id` pairs — match whichever
  convention is already present in the file rather than inventing a
  third.
- **`useButtonType`**: every `<button>` whose `onClick` isn't a form
  submit gets `type="button"`. Apply by default when writing any button
  — don't wait for lint to catch it.
- **`noStaticElementInteractions` / `useKeyWithClickEvents` on non-native
  interactive elements** (SVG `<g>` and similar): add `onKeyDown`
  (Enter/Space → same handler as `onClick`), `tabIndex={0}`, and a real
  ARIA `role`. Never reach for `role="button"` here — inside `<svg>`
  there's no valid `<button>` element, so `role="button"` immediately
  trips the follow-on semantic-elements rule instead of satisfying
  anything. Use whichever ARIA role actually describes the interaction
  (`role="tab"` + `aria-selected`, `role="menuitem"`, etc.). If the same
  pattern repeats across duplicate files, use the _same_ role in every
  copy — see the parallel-delegation note in Section 2.
- **`useValidAnchor`**: `<a href="#">` used purely as an `onClick`
  trigger (no real navigation) is a mis-typed button — replace with
  `<button type="button">`, reusing the anchor's existing `className` so
  there's no visual change.
- **`noSvgWithoutTitle`**: if the SVG conveys real information, add a
  `<title>` child with a short descriptive string and keep `role="img"`.
  If it's purely decorative, use `aria-hidden="true"` and **remove**
  `role="img"` entirely — the two don't combine; `role="img"` asserts
  "this needs a label" even under `aria-hidden`, so leaving both causes
  the rule to keep firing.
- **`noArrayIndexKey`**: derive the key from the mapped item's own data,
  never the loop index. If the array is intentionally duplicated for
  effect (e.g. `[...items, ...items]` for a seamless marquee), a plain
  data field collides between the two copies — use a composite key
  (`` `${item.field}-${index}` ``) or tag each half explicitly before
  mapping.
- **`noDangerouslySetInnerHtml`**: never suppress; there's always a
  root-cause fix. Static `@keyframes`/CSS with no interpolation →
  extract to a co-located `.css` file, import it, delete the `<style>`
  block — it was never dynamic, so it never needed the dangerous sink.
  A large static SVG string injected wholesale → extract to a real
  `public/*.svg` asset and render with the framework's image component
  (`next/image`'s `<Image>`, etc.) with real `alt` text. Both eliminate
  the sink instead of working around it, and both end up as _less_ code
  than the inlined version.
- **Static assets extracted under `public/`** (per the pattern above)
  may themselves get linted and re-trigger the same a11y rules once
  they're on disk. If the asset is referenced via an image component
  with real `alt` text and isn't part of the accessible DOM directly,
  exclude the asset path via a `files.includes`/ignore-scope change in
  the linter config — a scope change, not a suppression comment, same
  category as excluding `node_modules`.

---

## 4. Hard Constraints

- **No `any`.** Use `unknown` + narrowing.
- **No `as` casts** to silence errors.
- **No `console.log`** in production code. `console.warn` /
  `console.error` in catch blocks are fine.
- **No dead code** — no unused variables, imports, components, functions,
  files.
- **No duplication** — search the codebase first. 80%+ similar to
  something existing → extend it, don't copy-paste.
- **No inline styles** for anything expressible in the project's styling
  system.
- **No raw `fetch` in components** — all HTTP through a typed client in
  `lib/`.
- **No `useEffect` for data** fetchable at the server/request level.
- **No new dependencies** without explicit instruction.
- **No hardcoded colors that appear in multiple places.** Any color,
  spacing value (where appropriate), shadow, border radius, or other
  repeated design constant used more than once becomes a CSS
  variable/design token — never re-typed literals.
- **Reuse existing components before writing new ones.** Check first;
  duplicating a component that already does the job is a Section 4
  duplication violation, not a style choice.
- **Minimum code that works.** Every implementation walks the ponytail
  ladder before a line is written (Section 5).
- **Modular, not over-abstracted.** Components stay modular (Section
  9), but don't invent abstraction layers the current scope doesn't
  need — ponytail (Section 5) governs this the same as anywhere else.
- **One file, one task.** A file does exactly one thing — full
  granularity and extraction rules in Section 7.1.
- **No broken import paths** — a file move/rename updates every consumer
  in the same step.
- **No accessibility/security suppressions.** Every finding from Section
  3.1's rule set has a real fix (see the patterns above) — none of them
  qualify as the "genuine unfixable library type gap" exception in Rule
  4/6 of Section 3.

---

## 5. Code Minimalism — Ponytail

Locked doctrine: **the best code is the code never written.** Before
implementing anything, stop at the first rung of this ladder that holds:

```txt
1. Does this need to exist?   → no: skip it (YAGNI)
2. Already in this codebase?  → reuse it, don't rewrite
3. Stdlib does it?            → use it
4. Native platform feature?   → use it
5. Installed dependency?      → use it
6. One line?                  → one line
7. Only then: the minimum that works
```

The ladder runs _after_ understanding the problem, not instead of it —
read the code the change touches and trace the real flow before picking
a rung. Lazy about the solution, never about reading.

**Never on the chopping block:** trust-boundary validation, data-loss
handling, error handling, security, accessibility. Minimal ≠ negligent.
Every non-negotiable in Sections 3, 4, and 12 survives the cut. This
explicitly includes the a11y/security lint patterns in 3.1 — those are
not optional polish to skip for a smaller diff.

**Interaction with file granularity (Section 7.1):** ponytail decides
**how much** code exists; 7.1 decides **where** surviving code lives.
Neither overrides the other. Never cram two concerns into one file in
the name of minimalism; never pad or invent abstractions in the name of
structure.

**Tool availability:** Claude Code has a real plugin for this ladder —
see Section 18 for setup and commands. Where the plugin isn't installed,
the ladder is still doctrine — apply it manually.

---

## 6. Git Commit Protocol

**Before committing:**

1. `git status` + `git diff` — list every changed file.
2. Review the diff against the ponytail ladder (Section 5) — automated
   via a tool if the agent has one, manual otherwise. Anything flagged
   as over-built gets cut, then the Quality Gate (Section 3) re-runs
   before proceeding.
3. Group changes into separate commits **by purpose**. Never bundle
   unrelated changes, even if it's tempting to save a step. A single
   file with multiple unrelated changes (e.g. one fix + one feature)
   gets split with `git add -p`, not `git add <file>`.

**Prefixes — pick exactly one per commit:**

| Prefix   | Use for                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------- |
| `feat/`  | A new feature                                                                                   |
| `fix/`   | A bug fix                                                                                       |
| `up/`    | A package/dependency update                                                                     |
| `rem/`   | Something removed (code, file, feature)                                                         |
| `sm/`    | A small/minor fix — not a full bug fix                                                          |
| `add/`   | Something added that is **not** a feature and **not** a package (config file, env var, util fn) |
| `add-p/` | A new package/dependency added                                                                  |
| `hide/`  | Something added to `.gitignore`                                                                 |
| `init/`  | Initialized something (new package, starter files)                                              |

Format: `<prefix><short-description-in-kebab-case>`
Example: `fix/auth-token-404-register-plugin`

**Rules — follow exactly:**

- One prefix per commit. Never combine two in one message.
- Description under 8 words.
- **Commit immediately, no approval pause.** As soon as a change is
  made and the Quality Gate (Section 3) passes clean, stage and commit
  it right then — same turn, no waiting for confirmation. Print the
  commit (prefix + message + files/hunks) as part of the normal output
  so it's visible, but that's a status line, not a request for
  permission.
- Unsure which prefix fits? Ask, don't guess — this is the one case
  worth a pause, since a wrong prefix is harder to fix after the fact
  than a missed commit is to catch on review.
- Never commit `node_modules`, `.env.local`, or anything already in
  `.gitignore`.

---

## 7. File & Folder Structure

Every folder has a single responsibility. When a folder accumulates more
than one logical group of files, introduce feature-based sub-folders.

### 7.1 File granularity — one file, one task

- **One file, one task.** A file does exactly one thing — one component,
  one hook, one schema, one service, one config object, one type group.
  The moment a second concern appears in a file, it moves out. "It's
  related" is not the same as "it's the same concern".
- **Extract independent blocks — two different bars.**
  - **Types, data, constants, Zod schemas, lookup/config maps — always
    extracted, no exceptions.** This does not depend on reuse. Even if a
    type or a data array is consumed by exactly one file and nowhere
    else, it still does not live inline in that file — it goes in the
    feature's `types/`, `data/`, or `constants/` sub-folder (7.2) and
    gets imported. A `.tsx` component file contains the component and
    nothing else: no inline `interface`/`type`, no inline data arrays,
    no inline constant/lookup maps, no inline Zod schema, no matter how
    small. "It's only used here" is not a reason to inline it — it's a
    reason the extracted file belongs in that feature's sub-folder
    instead of the global one (see 7.2).
  - **Components, hooks, helpers, mappers, services — extracted on
    reuse.** The moment the same logic is needed in 2+ places, it gets
    its own file inside the same feature sub-folder and both call sites
    import it — never copy-pasted.
    Never a multi-hundred-line file built from inlined blocks that
    deserved their own names.
- **Extraction is placement, not padding.** Extraction never adds code —
  ponytail (Section 5) still governs how much gets written. It only
  relocates code that already earned its existence. Don't invent
  wrappers or abstractions just to have more files, and don't extract a
  trivial one-off snippet that no other file consumes.
- **Size is a smell, not a rule.** A file drifting past ~200 lines
  almost always contains a second task. Find it and split — don't wait
  for it to hurt.

### 7.2 Global + feature-wise organization

Every category folder (`types/`, `hooks/`, `utils/`, `constants/`,
`lib/`, `services/`, `stores/`, `mappers/`, `context/`, `config/`)
follows the same shape:

- **Root of the folder** → genuinely global, cross-feature items only.
  (For `types/`, the global file is `index.ts` holding actual
  definitions — not a barrel of re-exports.)
- **One sub-folder per feature** → everything scoped to that feature.

```txt
types/
├── index.ts              # cross-feature types ONLY
├── declarations.d.ts
├── canvas/
│   └── canvas.ts         # types only the canvas feature uses
└── editor/
    ├── editor.ts
    └── toolbar.ts

hooks/
├── use-auth.ts           # global — used across features
└── hero/
    ├── use-hero-scroll.ts
    └── use-hero-animation.ts

components/
└── common/
    └── cards/
        ├── project/
        │   ├── ProjectCard.tsx
        │   └── ProjectCard.types.ts
        └── certification/
            └── CertificationCard.tsx
```

Rules:

- An item used by exactly **one** feature never lives at the folder root
  or in the global file — it goes in that feature's sub-folder.
- An item gets promoted to the root/global file **at the moment** a
  second feature needs it — never preemptively.
- Feature sub-folder names match across categories: the canvas feature
  is `types/canvas/`, `hooks/canvas/`, `utils/canvas/` — one name,
  everywhere.
- 2+ files tied to the same feature always get grouped into a feature
  sub-folder — no loose feature files scattered at the root.

### 7.3 Universal source layout

```txt
src/
├── app/                  # [Next.js] Routes — Server Components by default
│   └── [route]/
│       ├── page.tsx
│       └── layout.tsx    # metadata lives here for client-component pages
│
├── components/
│   ├── ui/               # Design system primitives — do not modify internals
│   ├── common/           # Reusable cross-feature components
│   │   ├── badges/ buttons/ cards/ headings/ pills/ modals/ sections/
│   ├── layout/           # Shell, NavBar, Footer, Sidebar
│   ├── sections/         # Page-section components
│   └── effects/          # Canvas, WebGL, animation-only components
│
├── config/               # App-level config objects (nav, themes, flags) — 7.2
├── constants/            # Exported constants, SCREAMING_SNAKE_CASE — 7.2
├── context/              # React context providers — 7.2
├── data/                 # Static / seed data / mock fixtures
├── hooks/                # Custom hooks, kebab-case filenames — 7.2
│
├── lib/                  # Thin wrappers around third-party libs — 7.2
│   ├── api/              # HTTP client, typed fetchers
│   ├── db/               # Database client / query helpers
│   ├── auth/             # Auth helpers
│   └── validations/      # Zod schemas (shared: form + route handler)
│
├── mappers/               # Raw API/DB shapes → app models — 7.2
├── middleware/            # [Next.js] edge logic
├── models/                # [Backend] Domain model classes/interfaces
├── services/               # Business logic — orchestrates repos, APIs, side effects — 7.2
├── stores/                 # Client state (Zustand) — 7.2
│
├── types/                 # Shared TS types — global + feature-wise, see 7.2
│   ├── index.ts            # cross-feature types ONLY
│   ├── declarations.d.ts
│   └── [feature]/          # e.g. types/canvas/canvas.ts
│
└── utils/                  # Pure, stateless helpers, kebab-case — 7.2
```

> Not every project needs every folder — create one only when it has at
> least one real file. Never create placeholder `index.ts` barrels just
> to have them.

---

## 8. Naming Conventions

| Artifact                | Convention              | Example                               |
| ----------------------- | ----------------------- | ------------------------------------- |
| React component files   | PascalCase              | `ProjectCard.tsx`                     |
| React component exports | PascalCase              | `export default function ProjectCard` |
| Hook files              | kebab-case              | `use-nav-click.ts`                    |
| Hook exports            | camelCase               | `export function useNavClick`         |
| Util files              | kebab-case              | `format-date.ts`                      |
| Util exports            | camelCase               | `export function formatDate`          |
| Service files           | kebab-case              | `auth-service.ts`                     |
| Service exports         | camelCase / PascalCase  | `export class AuthService`            |
| Mapper files            | kebab-case              | `user-mapper.ts`                      |
| Mapper exports          | camelCase               | `export function mapUserResponse`     |
| Constant files          | kebab-case              | `api-endpoints.ts`                    |
| Constant exports        | SCREAMING_SNAKE_CASE    | `export const API_BASE_URL = ...`     |
| Type/interface files    | kebab-case              | `project-types.ts`                    |
| Type/interface exports  | PascalCase              | `export interface ProjectCard`        |
| Config files            | kebab-case              | `nav-config.ts`                       |
| Config exports          | camelCase               | `export const navConfig = ...`        |
| Route folders [Next.js] | kebab-case              | `app/my-projects/`                    |
| Env variables           | SCREAMING_SNAKE_CASE    | `NEXT_PUBLIC_API_URL`                 |
| CSS class names         | kebab-case              | `.card-wrapper`                       |
| Test files              | mirror source + `.test` | `use-nav-click.test.ts`               |

Prop interfaces: always `[ComponentName]Props` — never the same name as a
data type.

Naming and folder structure must stay consistent across the whole
project — a new file follows the same convention as its siblings, not a
locally-invented one, even under deadline pressure.

---

## 9. TypeScript, Components, Hooks, Services, State

### TypeScript

- `strict: true`, always.
- Prop interfaces explicit and named — no inline complex types on
  function signatures.
- Data types and component prop types are separate — never conflate.
- `type` for unions/intersections, `interface` for extendable object
  shapes.
- Generic constraints over `any`: `<T extends object>`, not `<T = any>`.
- Zod is the single source of truth for validated shapes —
  `z.infer<typeof schema>`.

### Components

- Single responsibility. Two jobs → split (per 7.1).
- Server Component by default (Next.js). `"use client"` pushed as far
  down the tree as possible — confirm hooks/browser APIs/event
  handlers/animation libs are actually used before adding it.
- `className?: string` on every reusable component.
- `cn()` for all className merging — never string concatenation.
- Tightly-coupled sub-components get their own files inside the same
  feature sub-folder (7.1) — colocated in the folder, never crammed
  into the parent's file, and not promoted to `common/` until a second
  feature consumes them.
- Merging near-duplicate variants: optional props + a discriminator
  (`size?: 'default' | 'small'`) over separate files.

### Hooks

- One hook, one concern — one hook per file (7.1).
- Cancellation pattern in `useEffect`: `let cancelled = false`, clean up
  on return.
- Never call a hook conditionally.
- Two components sharing logic → extract to a hook immediately, don't
  wait for a third consumer.

### Services & data flow

```txt
Component → Hook → Service → Lib (API client / DB) → External
```

- Components never call `fetch` directly.
- Services orchestrate: call repos/API clients, apply business logic,
  return typed results.
- Mappers are pure functions, raw external shape → internal model.
- Zod validation at the boundary (route handler, form submit) — before
  business logic runs.
- Route handlers: `parse → validate (Zod) → service → respond`. Always
  `{ data }` or `{ error }` shape.

### State management

- Local state first (`useState`, `useReducer`).
- Server state via React Query/SWR before a global store.
- Global store (Zustand) only for genuinely cross-cutting client state.
- Never store derived state — compute it.

---

## 10. Dead Code, Deletions & Import Hygiene

- Before deleting any file: grep the entire `src/` for imports. Zero
  consumers → delete. Consumer found → update it first, then delete.
  Never delete with live consumers.
- Unused exports, variables, imports are violations — remove them.
- `@/` aliases throughout — no `../../` except within the same immediate
  folder.
- After any file move/rename: grep `src/` for the old path, update every
  hit, verify with `tsc --noEmit`.
- Import order: external libraries → internal `@/` paths → relative
  `./` paths. Blank line between groups.
- No barrel `index.ts` files unless the folder is a published package or
  the re-exports give genuine ergonomic value. (`types/index.ts` in 7.2
  is a definitions file, not a barrel.)

---

## 11. Animation & Motion Stack

Locked decision — don't re-litigate per project unless the tech-stack
file explicitly overrides it:

- **GSAP** → scroll + timeline animation. Best tool for the job, no
  contest.
- **Motion (Framer Motion)** → hover, drag, layout transitions. Where a
  project already uses it, reuse it — don't introduce a second lib for
  overlapping work.
- **~~Anime.js~~ — cut.** Overlaps hard with both GSAP and Motion for
  micro-interactions. Three animation libs in one stack is bloat, and
  inconsistent easing/timing across them will show. Motion covers
  micro-interactions.
- **LottieFiles** → loaders, checkmarks, empty states. No overlap with
  the above, does its own thing well. Keep it.
- **Charts** → Recharts or Tremor, not an unverified library. Don't build
  data viz on something unproven — both are established, well-maintained,
  and pair cleanly with Tailwind/shadcn.

**Final stack: GSAP + Motion + LottieFiles + Recharts/Tremor.**

---

## 12. Design, UX & Aesthetic Craft

Default intent for any "build a UI/website" task, unless told otherwise:
**modern, clean, visually distinctive, and genuinely usable** — not just
functional. Aesthetics and UX quality are treated as first-class
requirements, not polish tacked on at the end.

**Fallback rules (apply regardless of what design tooling is available):**

_Never ship, regardless of what's asked for:_
purple-cyan gradients · glassmorphism with neon accents · identical
card grids · bounce/elastic easing · glow effects used as affordances ·
colored accent borders on every card · ALL CAPS headings · uniform
border-radius everywhere with no hierarchy · emoji used as icons ·
gradient-blob backgrounds · bento-grid abuse · stagger-animating
everything on page load · star ratings on testimonials · generic CTAs
("Learn more", "Click here") · walls of text on landing pages · pure
black (`#000`) text · **purple as a primary or accent color** ·
generic/templated "AI-generated" aesthetics of any kind — the whole
point of a design pass is a system that reads as intentionally made,
not defaulted into.

_Additional non-negotiables:_

- **Animations and interactions must run smoothly** — no janky
  transitions, no layout shift on hover/load, test on the actual
  breakpoints being shipped, not just desktop.
- **If asked to implement theming, both Light and Dark themes ship
  fully supported** — not one theme with the other bolted on after.
- **Responsive across common breakpoints** (mobile, tablet, desktop) is
  part of "done," not a follow-up pass.

_Nielsen's 10 usability heuristics — check every surface against these:_
visibility of system status · match between system and the real world ·
user control and freedom · consistency and standards · error prevention ·
recognition over recall · flexibility and efficiency of use · aesthetic
and minimalist design · help users recognize/diagnose/recover from
errors · help and documentation.

_Shneiderman's eight golden rules:_
strive for consistency · enable shortcuts for frequent users · offer
informative feedback · design dialogs to yield closure · offer simple
error handling · permit easy reversal of actions · support internal
locus of control · reduce short-term memory load.

_Non-negotiables regardless of tooling availability:_

- Design every non-happy state before the happy path: loading, empty,
  error, partial, offline — not an afterthought.
- WCAG 2.1 AA minimum: keyboard nav, focus management, real touch
  targets, contrast that actually passes. This is also enforced
  mechanically by the lint patterns in Section 3.1 — treat lint passing
  as a floor, not proof of genuine accessibility.
- A design pass on any new surface produces a token-level plan first
  (spacing, type scale, one accent color, radius, shadow) — not
  ad-hoc Tailwind classes improvised per component.

---

## 13. Tech Stack — Fallback Decision Table

**The project's tech-stack file is authoritative.** This table exists
only for when that file is silent on a category. Do not override an
explicit tech-stack file entry with anything below.

| Category               | Default                                                         |
| ---------------------- | --------------------------------------------------------------- |
| Frontend framework     | Next.js (App Router)                                            |
| Language               | TypeScript                                                      |
| Styling                | Tailwind CSS                                                    |
| Component library      | shadcn/ui                                                       |
| Icons                  | Lucide                                                          |
| Animation              | See Section 11                                                  |
| Backend runtime        | Node.js                                                         |
| Backend framework      | Express (Fastify if perf-critical)                              |
| API style              | REST + Zod; tRPC if front+back both TS and no public API needed |
| Database (NoSQL)       | MongoDB                                                         |
| Database (relational)  | PostgreSQL                                                      |
| ORM/ODM                | Mongoose (Mongo) / Prisma or Drizzle (SQL)                      |
| Auth                   | Better Auth                                                     |
| File/object storage    | Cloudinary (images w/ transforms), Azure Blob, Cloudflare R2    |
| Global state           | Zustand                                                         |
| Server state           | TanStack Query / SWR                                            |
| CRDT/realtime collab   | Yjs                                                             |
| Forms                  | React Hook Form + Zod                                           |
| Unit/integration tests | Vitest                                                          |
| E2E tests              | Playwright                                                      |
| Hosting                | Vercel                                                          |
| CI/CD                  | GitHub Actions                                                  |
| Rate limiting          | Upstash Redis sliding window                                    |
| Bot protection         | reCAPTCHA v3                                                    |
| Payments               | Stripe (global) / Lemon Squeezy (indie, handles tax)            |
| AI/LLM access          | OpenRouter (multi-model) / Anthropic API direct                 |

---

## 14. Reference Style Guides

Pull these when the project's own conventions don't cover an edge case.
Curated for this stack — not an exhaustive list:

- **JS/TS:** [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) ·
  [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) ·
  [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- **CSS/Frontend:** [CSS Guidelines](https://cssguidelin.es) ·
  [Airbnb CSS/Sass Styleguide](https://github.com/airbnb/css) ·
  [Frontend Guidelines](https://github.com/bendc/frontend-guidelines) ·
  [Front-End Checklist](https://github.com/thedaviddias/Front-End-Checklist)
- **Accessibility:** [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- **Node.js:** [Node.js Style Guide](https://github.com/felixge/node-style-guide) ·
  [Microsoft Node.js Guidelines](https://github.com/Microsoft/nodejs-guidelines)
- **Git:** [Git Style Guide](https://github.com/agis/git-style-guide)
- **Changelogs/versioning:** [Keep a Changelog](http://keepachangelog.com/en/0.3.0/) ·
  [Semantic Versioning](http://semver.org)
- **General project structure:** [Project Guidelines (JS)](https://github.com/elsewhencode/project-guidelines)
- **Code minimalism:** [ponytail](https://github.com/DietrichGebert/ponytail) —
  the ladder in Section 5; `examples/` in that repo shows real
  before/afters.
- **Agent instruction format reference:** [Agents.md](https://agents.md) —
  this file loosely follows that spec's philosophy: one durable,
  machine-readable instruction file at the project root.

---

Added from the build-system reference set (the rest of that set
duplicates the entries above — WCAG, OWASP and the Agile material —
and is not repeated):

- **Product requirements:** [Atlassian — how to write a PRD](https://www.atlassian.com/agile/product-management/requirements)
- **Design documents:** [Microsoft Learn — functional and technical design documents](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-portfolio/design-documents)
- **Decision records:** [Azure — Architecture Decision Records](https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record)
- **Diagrams:** [Azure — purposeful architecture diagrams](https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-diagrams)
- **Data modelling:** [Microsoft — relational database design basics](https://support.microsoft.com/en-us/office/database-design-basics-eb2159cf-1e30-401a-8084-bd4f9c9ca1f5)

## 15. Testing Strategy

- Vitest for unit/integration, Playwright for E2E.
- `vi.mock()` at the top of the file (hoisting), imports after.
- `vi.clearAllMocks()` in `beforeEach`.
- A task gets tests when it adds new logic, a new branch, or fixes a bug
  (regression guard). Skip tests for copy-only, style-only, or config
  changes.
- Tests run through the same fix-until-green loop as the quality gate —
  no committing red tests.

---

## 16. What Requires Explicit Instruction Before Doing

- Adding a new dependency.
- Changing visual output (colors, layout, spacing, animations, fonts).
- Modifying design-system primitive internals.
- Expanding scope beyond the stated task.
- Deleting a file that has consumers.
- Changing environment variable names or shapes.
- Any repo-wide audit or acting on its findings beyond the current task.
- Consolidating/de-duplicating near-identical files spotted mid-task
  (e.g. three near-duplicate component variants) — flag it, don't act
  on it uninstructed. See Section 17.

---

## 17. Scope Discipline

Don't refactor unrelated code while implementing a feature. Bug or
improvement spotted mid-task → note it, don't fix it unless instructed.
Don't silently expand scope, ever. This includes inconsistencies
introduced by your own parallel/delegated fixes (Section 2) — flag them
explicitly rather than quietly normalizing across files beyond what the
task asked for.

---

## 18. Claude Code Tooling

### 18.1 Ponytail plugin (Section 5)

**Setup (one-time, per machine):**

```claude
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

Default level is `full`. Override per session with
`/ponytail lite|full|ultra|off`, or globally via the
`PONYTAIL_DEFAULT_MODE` env var / `~/.config/ponytail/config.json`.

**Commands — use them, don't just have them:**

| Command            | When                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `/ponytail-review` | On every diff, before the commit-approval pause (Section 6, step 2). |
| `/ponytail-audit`  | Whole-repo over-engineering audit — only when explicitly asked.      |
| `/ponytail-debt`   | Harvest deferred `ponytail:` shortcuts — only when explicitly asked. |

**If the plugin isn't installed:** the ladder is doctrine, not a plugin
feature — apply it manually anyway. Mention once at session start that
the plugin is missing, then proceed under Section 5 as written.

### 18.2 Design tooling (Section 12)

If the `ui-craft` skill is installed (`npx skills add educlopez/ui-craft`),
route any "build/review/polish/animate a UI" task through it instead of
the fallback rules in Section 12 — it's more thorough (28 domain
references, token system, `/ui-craft:heuristic` scoring, `ui-craft-detect`
CI gate). If it isn't installed, Section 12's fallback rules apply as
written; mention once that the skill is missing.

### 18.3 Parallel/delegated fixes via subagents

When Section 2 calls for delegating a repetitive fix pattern across
near-duplicate files (e.g. three copies of the same landing-page
component), dispatch background subagents — one per file/folder — after
the fix pattern is established by hand on a non-duplicated instance
first.

Before dispatching:

- State the exact pattern each subagent should apply, including the
  specific choice where a rule allows more than one valid fix (e.g.
  which ARIA role for Section 3.1's SVG interaction pattern). Don't let
  each subagent independently choose.
- After all subagents land, do a consistency pass across the touched
  files — diff the same pattern across each copy and confirm they
  match. Independent subagents fixing the same rule without visibility
  into each other's work is exactly how the "different-but-valid
  choice" divergence in Section 2 happens.

### 18.4 Immediate commit

Section 6's commit step runs inline, same turn: stage and commit as
soon as a change clears the Quality Gate, then keep going. Print the
commit info (prefix + message + files/hunks) as a status line for
visibility — it's not a checkpoint to stop at. The only thing worth
ending a turn for is an ambiguous commit prefix (Section 6).

---


## 19. Continuity — files that must exist and stay current

The point: a new session should never re-derive what the last one knew.
These files are how. They are not documentation for humans — they are
context for the next agent, and they are load-bearing.

**THE RULE**

An update to one of these files ships in the SAME commit as the change
that invalidated it. Not a follow-up commit, not end of session. If the
gate is clean and the file is stale, the task is not done.

```txt
File                     Trigger                           Shape
---------------------------------------------------------------------
STATE.md                 end of task; before commit        snapshot
STACK.md                 dependency / service / env change list
DIRECTORY_STRUCTURE.md   create/move/delete under src/     generated
MCPS.md                  .mcp.json or connector change     list
PLUGINS.md               plugin install/uninstall/toggle   list
SKILLS.md                plugin change; unlisted skill     list
DECISIONS.md             a rejected alternative exists     append
DRIFT.md                 docs and code disagree            open items
OPEN_ITEMS.md            defer / accept / provision        register
```

**Contents, precisely:**

- `STATE.md` — where the work is right now: branch, what is in flight,
  what the next action is. Read first, every session.
- `STACK.md` — every package, library, framework, service and tool
  actually in use, with versions and what each is for.
- `DIRECTORY_STRUCTURE.md` — the tree, with `src/` expanded fully and
  everything else collapsed at one level.
- `MCPS.md` / `PLUGINS.md` / `SKILLS.md` — what is installed and
  preferred, so capability gets used instead of reinvented.
- `DECISIONS.md` — context / options / choice / consequence /
  revisit-when. One entry per decision that had a rejected alternative.
- `DRIFT.md` — every place the docs and the code disagree, with the
  condition that closes the entry.
- `OPEN_ITEMS.md` — deferred, accepted-with-reason, and
  written-but-not-provisioned work.

**SHAPE MATTERS**

```txt
snapshot   → rewritten in place. Never grows. If it reads like a log,
             it is wrong.
append     → never edited, never reordered. History is the value.
generated  → regenerate, don't hand-edit. A hand-edit is a bug.
open items → entries DELETED on fix, not struck through. A file of
             closed items is a file nobody reads.
```

**READ ORDER AT SESSION START**

`STATE.md` first — always, before touching code. Then `DRIFT.md`,
because an open drift entry may be the reason the thing you are about
to "fix" looks broken. The rest on demand.

**DO NOT**

- Do not create a file here you have no trigger for. A file that goes
  stale gets trusted once, wrongly, and that is worse than absent.
- Do not add a tenth file without deleting one. Nine is the ceiling for
  what one person keeps honest.
- Do not write a fact into these you have not verified. "UNKNOWN —
  needs confirmation" is a valid and useful entry.
- Do not keep a separate references file. References are inlined in
  §14 of this file, because that file is guaranteed to load and a
  pointer file is one more thing to go stale.

**Why these nine and not others.** Considered and rejected:
`CHANGELOG.md` (git log already is this) · `ARCHITECTURE.md` (covered by
`STACK.md` + `DIRECTORY_STRUCTURE.md`) · `GLOSSARY.md` (no mechanical
trigger) · `TESTING.md` (the test files are the doc) · `ONBOARDING.md`
(no team to onboard) · `ROADMAP.md` (a product artifact; no
commit-fireable trigger). Each failed the same test: **name what breaks
if it does not exist, and name the event that keeps it current.** A file
that cannot answer both goes stale and is worse than absent.

**A note on why this section exists at all.** A drift ledger written
into the bottom of a 3,000-line instruction file produced zero action in
three days — not because it was wrong, but because a fact with no
trigger attached to it is decoration. The triggers above are the whole
mechanism. Everything else here is bookkeeping.

---

## 20. Improve project

[BLOCK 1 — awaiting paste]
[BLOCK 2 — awaiting paste]
[BLOCK 3 — awaiting paste]
[BLOCK 4 — awaiting paste]

> **This section is deliberately unfilled.** Four source blocks were
> never received. Nothing here has been invented, inferred or
> reconstructed. Paste the blocks to fill it; until then this notice
> stands in place of content rather than a guess.
