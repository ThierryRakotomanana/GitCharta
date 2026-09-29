## 1.0.0

### Major Changes

- feat: will add stargazers, forks and prs section [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#39](https://github.com/ThierryRakotomanana/GitCharta/pull/39)]
  After it's first exposure, we received many feedback from differents person, everyone asked a map for `Stargazers` and we think it could be extend to `Forks` and why not `PRs` also

- Migrate legacy direct API calls to a structured, resilient polling and orchestration hook architecture with comprehensive unit and MSW integration test suites. [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#65](https://github.com/ThierryRakotomanana/GitCharta/pull/65)]
  
  **What Changed**
  
  - **Primitive Job Polling (`useAudienceJob`):**
  - Implemented robust lifecycle management with state persistence via `jobStorage`, handling job creation, active polling, terminal state cleanup, and cancellation.
  - Added critical safety guarantees including exponential backoff with connection warning states on consecutive failures, safe 404 expiration resets, and 500 error bailouts to prevent infinite restart loops.
  - Ensured complete resource cleanup and timer cancellation on component unmount.
  
  - **High-Level Orchestration (`useAudience` & `useAudienceGeocoding`):**
  - Coordinated parallel execution of follower and following retrieval pipelines.
  - Integrated efficient non-blocking region geocoding managed via clean `useState` state machines and `AbortController` signals.
  - Automated metric generation including follow-back analysis and ghost follower identification.
  
  - **Testing Infrastructure & Type Safety:**
  - **Unit Tests:** Hardened primitive hook tests utilizing Vitest fake timers to verify backoff, unmount behavior, and error boundaries.
  - **Integration Tests:** Implemented MSW-backed integration suites for the main orchestrator to verify end-to-end network coordination, success states, and error short-circuiting.

- Refactor project architecture from a flat folder structure to a feature-based structure. This is a structural change that moves source files into feature-specific directories. While there are no functional changes to the codebase logic, all internal file paths and import paths have changed. [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#68](https://github.com/ThierryRakotomanana/GitCharta/pull/68)]

### Minor Changes

- feat(map): unify control dock and resolve mobile layout collisions [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#60](https://github.com/ThierryRakotomanana/GitCharta/pull/60)]

- refactor(useGlobeRotation): split it into three distinctive separation of concern, and avoid re-inventing features already provide by d3 [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#58](https://github.com/ThierryRakotomanana/GitCharta/pull/58)]

- refactor: replace custom caching system with tanstack query in hooks [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#72](https://github.com/ThierryRakotomanana/GitCharta/pull/72)]

- feat(worldmap): add globe rotation and interactive dragging logic [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#47](https://github.com/ThierryRakotomanana/GitCharta/pull/47)]
  Add interactive drag rotation and auto-centering to the 3D globe, powered by a new `useGlobeRotation` custom hook.

- feat: add smooth transition between the two projection(2D and 3D) [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#47](https://github.com/ThierryRakotomanana/GitCharta/pull/47)]

- refactor: replace custom canvas snapshot with html-to-image library [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#46](https://github.com/ThierryRakotomanana/GitCharta/pull/46)]

- feat(zoom): Introduce 2D Map Zooming, Panning, and Interaction Refactoring [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#49](https://github.com/ThierryRakotomanana/GitCharta/pull/49)]

- feat: keep the map interactive while the country list is diplayed [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#62](https://github.com/ThierryRakotomanana/GitCharta/pull/62)]

- refactor: extract the path generator into a custom hooks [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#44](https://github.com/ThierryRakotomanana/GitCharta/pull/44)]

- refactor(map): move audience selection menu to bottom-left overlay dock [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#63](https://github.com/ThierryRakotomanana/GitCharta/pull/63)]

### Patch Changes

- fix(transition): add smooth transition on the control dock when zoom is activated [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#61](https://github.com/ThierryRakotomanana/GitCharta/pull/61)]

- fix: decouple position from visibility & capture on drag, not on down [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#48](https://github.com/ThierryRakotomanana/GitCharta/pull/48)]

- fix: the issue where dragging or rotating the map accidentally toggled country selection upon pointer release, and resolves broken country click interactions caused by eager DOM pointer capture. [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#57](https://github.com/ThierryRakotomanana/GitCharta/pull/57)]

- fix: handle recovered login none [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#66](https://github.com/ThierryRakotomanana/GitCharta/pull/66)]
## 0.2.0

### Minor Changes

- update ui theme and refactor components [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#19](https://github.com/ThierryRakotomanana/GitCharta/pull/19)]

- feat: rebrand project with new landing page and favicon [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#36](https://github.com/ThierryRakotomanana/GitCharta/pull/36)]

- feat: add button to switch to another user & increase the concurrency request [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#26](https://github.com/ThierryRakotomanana/GitCharta/pull/26)]

- feat: add screenshot generation [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#37](https://github.com/ThierryRakotomanana/GitCharta/pull/37)]

- feat(api): migrate to GraphQL with REST fallback and reconciliation layer [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#25](https://github.com/ThierryRakotomanana/GitCharta/pull/25)]

- feat: add github icon link that targets the repos [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#17](https://github.com/ThierryRakotomanana/GitCharta/pull/17)]

- feat: add retry and cancel feature [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#32](https://github.com/ThierryRakotomanana/GitCharta/pull/32)]

- feat: let user to choose between using his PAT or use the demos token [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#28](https://github.com/ThierryRakotomanana/GitCharta/pull/28)]

### Patch Changes

- perf: virtualize audience list as it freeze for a large one [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#27](https://github.com/ThierryRakotomanana/GitCharta/pull/27)]

- fix: adatpt the header to mobile devices [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#33](https://github.com/ThierryRakotomanana/GitCharta/pull/33)]

- fix: apply the glow effect on the selected country [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#31](https://github.com/ThierryRakotomanana/GitCharta/pull/31)]

- fix: make the progressbar dynamic [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#29](https://github.com/ThierryRakotomanana/GitCharta/pull/29)]

- ci: increase the timeout of the ai response [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#20](https://github.com/ThierryRakotomanana/GitCharta/pull/20)]

## 0.1.0

### Minor Changes

- Move to tailwind for styling and rewrite the loading and the header components [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`04cafb6`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/04cafb6789d062281f8edcb29b30ab6f3e657353)]

- feat(map): upgrade to ISO GeoJSON, add audience grouping, and optimize country list performance [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#4](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/4)]

- feat(panel): add search feature for both country list and profile list [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#10](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/10)]

- - Integrated `@shadcn/ui`, `tailwindcss`, and `lucide-react` into the project workspace. [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`16c08a1`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/16c08a1e9b279c44f395dfe8ed6a5564eb1461c1)]
  - Added a "show/hide" toggle feature for user tokens to improve UX and security management.
  - Replaced custom/legacy UI views (Credentials, Loading, Error pages) with standardized, accessible native Shadcn components.

- fix path error for types and rewrite the error view in tailwind [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`5029c4d`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/5029c4d746945dd8d3c912b2a4beca9d26793aec)]

- feat: add location based user by parsing free-text and adding a dictionnary [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`15b8ad1`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/15b8ad15469cd5e7c0e3b419c5e8b7327c724df4)]
  - Implement a geocode method to parse, validate, and clean free-string location inputs.
  - Add text cleaning logic to tokenize location inputs into an array of search strings.
  - Create mapping dictionaries for city-to-country and flag-to-country resolution.
  - Sanitize inputs by filtering out English grammar prepositions (e.g., "in", "at") and excluding fantasy or virtual locations.
  - Return a filtered list of users based on the resolved country.

- Add local CI tooling: Husky, lint-staged, commitlint, and changesets [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`a75703a`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/a75703aa704293ce8871df541245a9aaa2a248fb)]

- ci: implement automated releases via Changesets and GitHub Actions [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#1](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/1)]

- refactor(panel): add meaningful informations for both country&profile list [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#9](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/9)]

- Added a responsive layout shell that scales automatically on window resize and handles container sizing safely on initial load. [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#3](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/3)]

- feat(map): colorize all countries uniquely and add canvas glow effects [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#5](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/5)]

- feat(map): display the audience by the selected category(followers, following, ghost) [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#7](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/7)]

- create a loader logic to visualize each steps of building the audience [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`4926ff6`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/4926ff6771308a809835a4b69599bfaabc71d87e)]

- refactor(map): extract fetching process to a custom hook, move hardcode styling by using tailwind and enhance accessibility [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#13](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/13)]

- Introduced an interactive SVG-based world map component to visualize geographic user distributions [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`77996dc`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/77996dc094cac807e9db40f793aa7e6b5267f4e0)]
  Updated project dependencies to include d3, d3-geo, and corresponding TypeScript definitions (@types/d3).

- Show a warning when the remaining quota of requests are less than needed(rate limit defined by Github API). [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`02337b4`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/02337b4cce1748ecda318e5bdc83e7aab60115f9)]

- Add a form for user's credentials [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`8f105a3`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/8f105a30fa53b31c31f024446e6b12b43a6b0940)]

### Patch Changes

- feat(locations): enforce strict matching and sanitize github user location : [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`3defcc0`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/3defcc04e114848c38f9ee2b70cb12f3f7779cb1)]
  - feat/fix: Enforce strict dictionary matching for cities and countries only.
  - fix: Parse user locations to strip out email patterns.
  - fix: Remove location acronym aliases to eliminate false positives.

- fix: remove deprecated ts config that leads to a failing ci & remove all unused component as they depend on unistalled dependencies(not listed in package-json or lock file) [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`325afcb`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/325afcb73c344c1df92f910c92f23e693032aa08)]

- feat: standardize UI with Shadcn and refactor hooks for release [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#15](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/15)]

- fix(map): glow effect to apply only on continent edges [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#8](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/8)]

- fix: wrapped input elemments inside a form element and avoid hydratation error that might be caused by a div wrapped inside a p element [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`7c02f28`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/7c02f287e3ef20f5d360a3616ade3da02e3f3521)]

- fix(countrylist): correct null-selection state and clean up styling [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#6](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/6)]
