---
"audience-atlas": major
---

Migrate legacy direct API calls to a structured, resilient polling and orchestration hook architecture with comprehensive unit and MSW integration test suites.

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
