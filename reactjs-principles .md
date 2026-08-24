# react-principles.md — General React Engineering Principles

Generic, framework-agnostic React rules (works with Vite, CRA, or any React setup,
JS or TS). Copy this file as-is into any React project. No project-specific facts
belong here. If the project is actually Next.js, use nextjs-principles.md instead —
it covers React-level rules too, plus Next-specific ones.

## 1. Architecture

- **UI never knows where data came from.** Content lives in a data module or a
  fetcher/hook; components receive it as props. A component must not both own
  hard-coded content and render it.
- **No business logic inside JSX.** Filtering, sorting, deriving, formatting —
  resolve it above the `return` (a `useMemo`, or a helper function), never inline
  in markup.
- **One responsibility per component.** A component doing fetch + display + logic
  together must be split into a container (logic/data) and a presentational piece
  (pure UI).
- **Reusable primitives beat per-page markup.** Before writing a button/card/heading,
  look for an existing shared component. Anything appearing in two places becomes a
  shared component. Never re-style the same element separately per place.
- **Strong types, never `any`** (TS projects). Every content entity has an explicit
  type. Use string-literal unions for categories/status/state instead of bare
  `string`.

## 2. Data Fetching

- Keep fetching logic out of components — put it in a custom hook (`useVideos()`,
  `useUser()`) or a dedicated data-access module, so the component just consumes
  data + loading/error state.
- Don't fetch the same data in multiple places without a cache — use a data-fetching
  library (React Query, SWR, or similar) once the app has more than trivial fetching
  needs; don't hand-roll caching/retry logic ad hoc per component.
- Fetch data as close as possible to where it's used — avoid prop-drilling fetched
  data down many levels; let the component that needs it own the fetch (via its hook).
- Always expose and handle three states from a fetch: loading, error, success. Never
  assume the happy path.

## 3. Props & Components

- Props always typed (`interface`/`type` in TS; `PropTypes` or JSDoc in plain JS if
  the project uses it); never `any`.
- Keep props few and specific — more than 5–6 is a signal to split the component or
  group them into one meaningful object.
- Don't pass a whole object when only one field is used
  (`<Card title={user.name} />`, not `<Card user={user} />` if only the name is read).
- Prefer composition (`children`) over a growing list of configuration props.
- Controlled components for form inputs by default; only go uncontrolled with a
  clear reason (e.g. integrating a non-React widget).

## 4. State Management

- Keep local state local — don't lift it unless it's genuinely shared between
  components.
- Never duplicate derived data in state — compute it at render time (or with
  `useMemo`) instead of storing a second state variable that can drift out of sync.
- Use the URL as the source of state where appropriate (filters, pagination, current
  tab) via your router, instead of internal state — easier to share/bookmark and
  works with back/forward.
- Reach for global state (Context, Zustand, Redux, etc.) only when a feature
  genuinely needs it across multiple distant components — never as a default.
  Context is for rarely-changing, broadly-needed values (theme, auth user), not a
  general-purpose store.

## 5. Rules of Hooks (non-negotiable)

- Call hooks only at the top level of a component or custom hook — never inside
  conditions, loops, or nested functions. If a hook needs to run conditionally,
  put the condition *inside* the hook (e.g. inside `useEffect`'s body), not around
  the hook call itself.
- Call hooks in the same order on every render — this is why the above rule exists.
- Only call hooks from React function components or from other custom hooks, never
  from plain functions or class components.

## 6. `useEffect` — last resort, not a default tool

`useEffect` is for synchronizing with something outside React (subscriptions, DOM
APIs, timers, manually fetching data without a library). It is not a general place
to "run some logic."

- **Don't use `useEffect` to compute derived data.** If a value can be calculated
  from existing props/state, calculate it during render (optionally with
  `useMemo`) — don't `setState` inside an effect that watches other state.
- **Don't use `useEffect` to handle an event.** If something should happen because
  the user clicked/submitted, put that logic in the event handler directly, not in
  an effect that reacts to a state change the handler caused.
- Every effect that subscribes/starts something must clean up after itself (return
  a cleanup function) — unsubscribe, clear timers, abort fetches.
- Always fill in the dependency array honestly (don't suppress the lint rule to make
  a bug disappear) — a missing dependency is a stale-closure bug waiting to happen,
  not a false positive.

## 7. TypeScript (when the project uses it)

- Never use `any`. Use `unknown` with type guards when a type is genuinely
  uncertain.
- For external APIs/forms, validate at runtime with a schema library (e.g. Zod) and
  derive the static type from it, so runtime and compile-time types can't drift
  apart.
- Never redefine the same shape in two places — define it once and share it.

## 8. Performance

- Images: always set explicit `width`/`height` (or `aspect-ratio`) to avoid layout
  shift; use a modern format and lazy-load offscreen images (`loading="lazy"`).
- Lazy-load heavy components/routes with `React.lazy` + `Suspense`, so they stay out
  of the initial bundle.
- Use `memo`/`useMemo`/`useCallback` only once a real, measured render problem
  exists — not as a default habit; overuse adds complexity without benefit.
- Keep large assets and rarely-used dependencies out of the initial bundle; check
  bundle size when adding a new heavy library.
- Give every list item a stable, unique `key` — never the array index if the list
  can reorder, filter, or have items inserted/removed.

## 9. Error Handling & Edge Cases

- Wrap major sections (or the whole app) in an Error Boundary so a render error in
  one part doesn't blank the entire page. Error Boundaries must be implemented as a
  class component (`getDerivedStateFromError`/`componentDidCatch`) or via a library
  like `react-error-boundary` — React has no hook-based error boundary. Don't
  attempt to build one with `useEffect`/try-catch inside a function component; that
  won't catch render errors.
- Validate input on the server always, even if also validated on the client —
  client-side validation is UX, not security. (If there's no backend of your own,
  still never trust data coming from a third-party API blindly.)
- Never assume data exists — handle `null`/`undefined` explicitly, especially after
  a fetch or before first render.
- Show explicit loading and empty states for anything async or filterable — don't
  let the UI silently render nothing.

## 10. Naming & Consistency

- One fixed naming convention for files/folders (e.g. kebab-case files, PascalCase
  components) applied across the entire project.
- Don't mix patterns for the same thing — if using named exports, stay consistent;
  don't mix default and named exports without a reason.
- Custom hooks always start with `use` and contain only hook logic — not general
  utility functions.

## 11. Security

- Never hard-code secrets/API keys in frontend code — anything shipped to the
  browser is public, regardless of env-variable naming conventions. True secrets
  belong on a backend the frontend calls, not in the React app itself.
- Sanitize/escape any user-generated content rendered as HTML
  (`dangerouslySetInnerHTML` is a last resort, never a default) to avoid XSS.
- Don't trust data from `localStorage`/`sessionStorage`/URL params as safe without
  validation — treat it like any other untrusted input.

## 12. Accessibility

- Use semantic HTML elements (`button`, `nav`, `label`, `header`) instead of `div`
  with click handlers — screen readers and keyboard navigation depend on it.
- Every interactive element must be reachable and operable by keyboard alone (tab
  order, Enter/Space activation) — don't rely on mouse-only events like
  `onMouseOver` for anything essential.
- Form inputs always have an associated `label` (or `aria-label`) — never a
  placeholder as the only identifier.