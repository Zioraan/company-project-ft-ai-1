# Backend Architecture Proposal

## Purpose

This document proposes the initial backend architecture for Nexova's company-wide platform. Its purpose is not to predict every endpoint before implementation starts, but to define a structure that can support multiple web interfaces, shared business capabilities, legacy integrations, and future AI workflows without forcing a structural rewrite after the first few milestones.

The proposal is based on:

- Nexova's active business context in `CONTEXT.md`
- repository direction documented in the memory bank
- current migration plan toward shared `uis/*` and `services/*` structures
- the need for a backend that will serve more than the current talent tracker

## Context Summary

Nexova is not building a single-purpose application. It is building a platform that will eventually support:

- the public marketing website
- internal backoffice workflows
- talent operations
- customer support operations
- training services
- internal HR processes
- executive reporting
- AI-assisted automations and retrieval workflows

The company also has real constraints:

- disconnected existing systems
- low operational visibility
- manual reporting
- future interfaces that are not fully defined yet
- a small engineering team relative to the business surface area

Because of this, the backend should be optimized for clarity, controlled growth, and maintainability rather than architectural novelty.

## Recommended Architecture

### Chosen Pattern

The recommended approach is a **domain-oriented modular monolith with layered architecture**, implemented with **FastAPI**.

This means:

- one backend application deployed as a single system at the start
- clear internal separation by business domain
- thin API/router layer
- business logic isolated in services/use cases
- persistence and external integrations isolated behind repositories/adapters

This recommendation intentionally favors a structure that is scalable in responsibility and team understanding before it is scalable in deployment topology.

### Why This Fits Nexova

This proposal fits Nexova better than a generic backend structure because the company's challenge is not only CRUD. The real complexity comes from:

- several departments with distinct workflows
- shared reporting and executive visibility needs
- multiple future frontend consumers
- legacy external systems that must be integrated gradually
- AI features that depend on stable operational data

A modular monolith gives Nexova:

- a simpler deployment and development model than microservices
- stronger internal boundaries than a flat monolith
- enough structure to support multiple interfaces
- room to extract services later if scaling or ownership demands it

The layered part is equally important. It reduces the risk of placing domain rules directly inside FastAPI route handlers, which would make the backend harder to test, harder to evolve, and harder to reuse across workflows, automations, or background jobs.

## Alternatives Considered

### 1. Traditional Layered Monolith

This option would use a simple global separation such as routers, services, repositories, and models, but without strong domain modularity.

Pros:

- simple to start
- easy onboarding for small teams
- low deployment complexity

Cons:

- weak boundaries between talent, support, training, HR, and executive logic
- higher risk of shared folders becoming catch-all zones
- harder to scale cleanly as more interfaces appear

Why it was not chosen:

It preserves the operational simplicity of a monolith, but it does not provide enough domain clarity for a company-wide platform.

### 2. MVC-Style Backend

This option would organize the backend around controllers, models, and related request handling patterns.

Pros:

- familiar to many developers
- works well for simple CRUD applications
- straightforward for smaller systems

Cons:

- tends to focus architecture around request handlers rather than domains
- weaker fit for integration-heavy and workflow-heavy systems
- can make business rules harder to isolate once complexity grows

Why it was not chosen:

Nexova's platform must support multi-department workflows, reporting, integrations, and AI-related processes. MVC is not the strongest organizing model for that kind of growth.

### 3. Microservices

This option would split the platform into independently deployed services such as talent, support, HR, training, and reporting.

Pros:

- strong service isolation
- independent scaling and deployment
- clearer long-term ownership if the engineering organization grows significantly

Cons:

- much higher operational complexity
- harder local development and debugging
- requires mature observability, CI/CD, and contract management early
- adds coordination overhead before Nexova has stabilized its domain boundaries

Why it was not chosen:

Nexova needs scalable structure, but not distributed-systems complexity on day one. The current team size, current repository direction, and lack of mature telemetry suggest that microservices would introduce more operational burden than value at this stage.

### 4. Event-Driven Microservices

This option would rely heavily on asynchronous events and distributed processing between separately deployed domain services.

Pros:

- good fit for cross-domain asynchronous workflows
- strong decoupling in large organizations
- useful for notifications, reporting, and AI pipelines at scale

Cons:

- harder to reason about
- increased complexity around retries, idempotency, consistency, and observability
- difficult to introduce well before core contracts and domain ownership are stable

Why it was not chosen:

Nexova does need async workflows, but those can be introduced inside a modular monolith first. Full event-driven microservices would be premature before the core contracts, domain boundaries, and operating model are stable.

### 5. Serverless-First Backend

This option would build the backend primarily as cloud functions or independently deployed serverless endpoints.

Pros:

- fast initial deployment
- elastic scaling
- useful for isolated tasks or bursty workloads

Cons:

- domain logic can fragment across many functions
- cross-cutting concerns such as auth, audit, and validation become harder to keep consistent
- weaker fit for a shared internal platform with integrations and long-lived workflows

Why it was not chosen:

Nexova needs a coherent backend platform more than a collection of independent endpoints. Serverless may still be useful later for isolated workloads, but not as the primary architecture.

### 6. Strict Hexagonal or Clean Architecture

This option would formalize ports and adapters across nearly all layers and treat the domain core as highly isolated from infrastructure concerns.

Pros:

- very strong separation of concerns
- high testability
- good long-term maintainability when followed consistently

Cons:

- more abstraction overhead
- can slow early delivery if applied too rigidly
- may be too heavy while domain boundaries and concrete endpoint needs are still forming

Why it was not chosen:

This is the closest alternative to the proposed solution. The recommendation borrows some of its strengths, but applies them pragmatically inside a layered modular monolith instead of requiring maximum architectural ceremony from the start.

## Proposed Design Principles

The backend should follow these principles:

1. Organize by business domain, not by frontend page.
2. Keep FastAPI routers thin and focused on transport concerns.
3. Keep business rules in service or use-case layers.
4. Isolate persistence and external systems behind repositories or adapters.
5. Version public API routes from the start.
6. Treat observability, auditability, and access control as core backend concerns.
7. Keep AI workflows adjacent to operational systems, but not mixed directly into transactional logic.

## Proposed Module Structure

At a high level, the backend should be organized into domain modules plus shared platform capabilities.

### Business Domains

- `talent`
- `support`
- `training`
- `sales`
- `hr`
- `executive_reporting`

### Shared Platform Domains

- `auth`
- `users`
- `files`
- `notifications`
- `audit`
- `integrations`
- `common`

### Suggested Backend Folder Structure

```text
backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── database.py
│   │   ├── logging.py
│   │   └── dependencies.py
│   ├── api/
│   │   ├── router.py
│   │   └── v1/
│   │       ├── router.py
│   │       ├── talent/
│   │       ├── support/
│   │       ├── training/
│   │       ├── sales/
│   │       ├── hr/
│   │       ├── executive_reporting/
│   │       └── platform/
│   ├── domains/
│   │   ├── talent/
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── repository.py
│   │   │   ├── service.py
│   │   │   ├── router.py
│   │   │   └── tasks.py
│   │   ├── support/
│   │   ├── training/
│   │   ├── sales/
│   │   ├── hr/
│   │   └── executive_reporting/
│   ├── integrations/
│   │   ├── hubspot/
│   │   ├── zendesk/
│   │   ├── google_workspace/
│   │   └── legacy_ats/
│   ├── ai/
│   │   ├── retrieval/
│   │   ├── ranking/
│   │   ├── agents/
│   │   └── workflows/
│   └── tests/
└── requirements or pyproject configuration
```

This structure reflects two important decisions:

- route grouping should be domain-oriented
- domain logic should not be mixed directly with external integration code

## Layer Responsibilities

### Router Layer

Responsibilities:

- receive HTTP requests
- validate transport-level inputs
- call domain services
- convert results into response schemas
- enforce route-level dependencies such as auth or permissions

The router layer should not contain:

- business decision logic
- complex transformation pipelines
- direct database implementation details

### Service Layer

Responsibilities:

- implement business rules
- coordinate repositories and integrations
- handle use-case logic
- define the meaning of operations such as candidate progression, enrollment approval, SLA alerts, or KPI generation

This layer is the core of the architecture because it keeps domain behavior reusable, testable, and independent from transport details.

### Repository Layer

Responsibilities:

- encapsulate data access
- isolate ORM or query details
- provide persistence methods to services

This makes future data-model evolution safer and prevents database behavior from leaking into routers.

### Integration Layer

Responsibilities:

- connect to HubSpot, Zendesk, Google Workspace, legacy ATS, and future providers
- normalize external system behaviors
- isolate failures and retries

This is especially important for Nexova because the company context already identifies fragmented tooling as a major operational problem.

## FastAPI Route Organization

FastAPI should be organized with `APIRouter` per domain and a versioned top-level router.

Suggested route grouping:

- `/api/v1/talent/*`
- `/api/v1/support/*`
- `/api/v1/training/*`
- `/api/v1/sales/*`
- `/api/v1/hr/*`
- `/api/v1/executive/*`
- `/api/v1/platform/*`

### Example Talent Routes

- `/api/v1/talent/candidates`
- `/api/v1/talent/candidates/{candidate_id}`
- `/api/v1/talent/candidates/{candidate_id}/notes`
- `/api/v1/talent/processes`
- `/api/v1/talent/processes/{process_id}`
- `/api/v1/talent/vacancies`

### Example Support Routes

- `/api/v1/support/tickets`
- `/api/v1/support/tickets/{ticket_id}`
- `/api/v1/support/knowledge-base/search`
- `/api/v1/support/metrics`

### Example Training Routes

- `/api/v1/training/programs`
- `/api/v1/training/enrollments`
- `/api/v1/training/learners/{learner_id}/progress`

### Example Executive Routes

- `/api/v1/executive/kpis`
- `/api/v1/executive/reports/weekly`
- `/api/v1/executive/alerts`

The key idea is that routes should represent domain capabilities rather than mirror specific frontend screens. That keeps the API stable even as Nexova adds new interfaces over time.

## Frontend and Backend Separation

The backend and frontend should be treated as separate runtime systems, even if they remain in the same repository.

### Recommended Relationship

- keep the repository as a monorepo for now
- keep backend code in its own top-level area
- keep `uis/website` and `uis/backoffice` as separate consumers
- centralize API contracts and documentation so frontend surfaces do not drift

### Why This Fits the Current Repo

The repository is already moving toward:

- target UI surfaces under `uis/*`
- shared service contracts under `services/*`
- staged migration with parity checkpoints

A separate runtime but shared repository model fits that direction well. It keeps the project coordinated while avoiding tight coupling between frontend implementation details and backend internals.

### Practical Considerations

- define environment variables separately for backend and each UI surface
- configure explicit CORS allowlists for each allowed frontend origin
- keep authentication and authorization decisions centralized in the backend
- treat API docs as a shared contract for all interfaces

## Recommended Python Packages

The architecture proposal should name a small set of Python packages that directly support business reliability, implementation clarity, and future AI-assisted development. The goal is not to commit to every future tool now, but to standardize the foundations that will make the backend easier to extend.

### Recommend Now

#### `pydantic`

Use Pydantic for request schemas, response schemas, configuration validation, shared error payloads, and common API contracts.

Why it should be included now:

- keeps API contracts explicit and machine-readable
- improves validation and serialization consistency
- supports FastAPI's OpenAPI generation
- makes future implementation easier for both developers and AI-assisted workflows

Pydantic should be treated as a contract layer, not only as a type-casting utility.

#### `sqlalchemy`

Use SQLAlchemy as the primary relational persistence layer.

Why it should be included now:

- fits Nexova's structured operational data
- supports repository boundaries and domain separation
- scales better than ad hoc database access as more departments are added

#### `alembic`

Use Alembic for schema migrations.

Why it should be included now:

- gives the team a safe and repeatable database change process
- prevents schema drift between environments
- creates a durable history of structural changes

#### `httpx`

Use HTTPX as the standard client for external API communication.

Why it should be included now:

- fits async FastAPI applications
- standardizes external integration patterns
- improves testability for adapters that talk to third-party systems

This is especially useful for future integrations with tools such as HubSpot, Zendesk, Google Workspace, and model APIs.

#### `structlog`

Use structlog for structured application logging.

Why it should be included now:

- makes logs easier to query and analyze
- improves troubleshooting for both humans and AI systems
- supports consistent log formatting across domains and workflows

#### `opentelemetry`

Use OpenTelemetry for request tracing, metrics, and distributed observability patterns.

Why it should be included now:

- supports end-to-end visibility across requests, jobs, and integrations
- aligns directly with Nexova's need for operational telemetry
- reduces the risk of repeating the company's current visibility problems

#### `tenacity`

Use Tenacity for controlled retries around unstable external operations.

Why it should be included now:

- standardizes retry behavior
- reduces repeated boilerplate in integration code
- improves resilience for third-party APIs and AI-related calls

### Recommend as Optional Phase-2 Additions

These packages are useful, but they should be introduced only when the corresponding architectural need becomes real.

#### `authlib`

Use when the platform needs OAuth, OpenID Connect, SSO, or more advanced identity-provider integration.

#### `celery`

Use when the backend needs durable background processing for tasks such as scheduled reports, ingestion, notifications, syncing, indexing, or scoring jobs.

#### `redis`

Use when the system needs shared caching, rate limiting, queue backends, or short-lived workflow state.

#### `pydantic-ai`

Use when AI agent workflows become a formal part of the backend and the team wants schema-driven tool input/output validation.

#### `langfuse`

Use when the platform includes enough LLM-powered behavior that prompt tracing, model evaluation, and AI observability become product-critical.

#### `openai`

Use as the standard SDK if Nexova's backend integrates directly with OpenAI models for summarization, extraction, routing, recommendation, or agentic workflows.

#### `pgvector`

Use when semantic retrieval becomes a core feature for candidate search, support knowledge search, or recommendation flows.

### Search Guidance

Before adding vector infrastructure, the team should first evaluate whether PostgreSQL full-text search is sufficient for the initial search experience. This keeps the early architecture simpler while still leaving room for semantic search later.

## Data and Integration Strategy

Nexova's backend should serve as a normalization layer between internal interfaces and external/legacy systems.

### Short-Term Strategy

- centralize domain logic in Nexova's backend
- integrate external systems through adapters
- avoid exposing external system shapes directly to UI clients

### Why This Matters

If the backend simply proxies legacy system payloads, the platform will inherit old inconsistencies and make future migration harder. A normalized backend contract gives Nexova control over how the platform evolves.

## AI and Workflow Considerations

AI is central to Nexova's business, but it should not be mixed carelessly into transactional flows.

### Recommended Approach

- keep transactional CRUD and workflow state in domain modules
- place retrieval, ranking, recommendation, and agent orchestration in dedicated AI/workflow areas
- trigger AI-related processing through service calls, jobs, or background tasks

### Why

This separation helps with:

- debugging
- explainability
- testing
- compliance and audit
- future replacement of AI components without rewriting core operational logic

## Observability and Governance

The backend should include observability from the first implementation phase.

Required concerns:

- structured logging
- request tracing
- domain audit logs
- metrics for failures, latency, queue/job execution, and business events
- alerting on critical failures in integrations and workflows

This is not optional overhead. Nexova's current business context explicitly describes a lack of visibility and late awareness of failures. The backend should correct that, not reproduce it.

## Risks and Points of Attention

### 1. Organizing by UI Instead of Domain

If backend modules are shaped around current screens instead of business domains, the architecture will degrade as new portals and workflows are added. This would create duplicate logic, inconsistent contracts, and avoidable rework.

### 2. Putting Business Logic in FastAPI Routes

If route handlers begin accumulating business rules, the system will become harder to test, harder to reuse, and harder to maintain. It also makes background workflows, automation, and non-HTTP consumers much harder to support.

### 3. Coupling Domain Logic to External Systems

If HubSpot, Zendesk, Google Workspace, or the legacy ATS are referenced directly throughout domain code, future migrations will become expensive and risky. Adapters should be the boundary.

### 4. Deferring Access Control and Auditability

Because the system will support multiple departments and sensitive people data, access control and audit trails should be designed early. Delaying them would create security and compliance risk.

### 5. Over-Engineering Too Early

If the team introduces microservices, event buses, or overly abstract patterns before the core platform stabilizes, delivery may slow down and operational burden may rise without proportional benefit.

## Phased Evolution Recommendation

The proposal should be implemented incrementally.

### Phase 1

- establish backend app structure
- define shared core configuration
- implement domain-based router organization
- start with the most immediate domains and shared platform modules

### Phase 2

- standardize integration adapters
- centralize auth, audit, and notification patterns
- expand domain coverage as new interfaces are delivered

### Phase 3

- introduce background jobs and event-like internal workflows where needed
- add AI-specific modules for retrieval, recommendation, and automation
- evaluate whether any domain has earned extraction into an independent service

This phased approach keeps the architecture scalable without demanding premature complexity.

## Final Recommendation

Nexova should begin with a **domain-oriented modular monolith using layered architecture in FastAPI**.

This is the best fit because it:

- supports a company-wide platform instead of a single interface
- keeps the system understandable for a small engineering team
- aligns with current repository migration direction
- scales better than a flat monolith
- avoids the premature complexity of microservices
- leaves room for future extraction, background jobs, and AI expansion

In short, the recommended architecture is designed to grow with Nexova's departments, interfaces, and workflows while preserving enough structure to remain maintainable, understandable, and implementable from the beginning.

## References

- FastAPI documentation: Bigger Applications
- FastAPI documentation: CORS
- FastAPI full-stack template and project-generation guidance
- repository memory bank and migration documents
