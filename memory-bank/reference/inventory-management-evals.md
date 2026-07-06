# Inventory Management Evals

This file captures the backend and frontend evaluation requirements shown in the milestone screenshots so they can be used directly by another implementation agent.

## Backend Eval

### What You Need To Do

#### Database configuration

- Add the Supabase PostgreSQL connection string to `.env`. Never hardcode credentials.
- In `database.py` or the repo-equivalent database module, initialize both database connections:
  - the existing TinyDB client
  - a new SQLModel engine pointing to Supabase
- Create a `get_db` dependency that yields a SQLModel session per request via `Depends()`. No global session variable.

#### ORM models

- Define a `Product` ORM model with at least:
  - `table=True`
  - `id`
  - `name`
  - `sku`
  - any additional company-specific fields required by `CONTEXT.md`
- Define an `InboundOrder` ORM model with:
  - `id`
  - `product_id` as FK to `Product`
  - `quantity`
  - `created_at`
  - `user_uid`
- Define an `OutboundOrder` ORM model with:
  - `id`
  - `product_id` as FK to `Product`
  - `quantity`
  - `created_at`
  - `user_uid`
- Call `SQLModel.metadata.create_all(engine)` on application startup so the schema is initialized in Supabase.

#### Pydantic schemas

- Define request/response schemas for `Product`, `InboundOrder`, and `OutboundOrder` as Pydantic models, separate from the ORM models.
- The `Product` response schema must include `current_stock` as a computed field that is not stored.
- ORM models and Pydantic schemas must live in separate files even if fields overlap.

#### Inventory router

- Create a dedicated `APIRouter` with prefix `/inventory` and register it in the main FastAPI app.
- Implement these endpoints:
  - `GET /inventory/products` to list all products with computed current stock
  - `POST /inventory/products` to create a product and require auth
  - `GET /inventory/products/{id}` to get one product with current stock
  - `POST /inventory/orders/inbound` to register an inbound order and require auth
  - `POST /inventory/orders/outbound` to register an outbound order and require auth
  - `GET /inventory/orders` to list orders with product data and `user_uid`

#### Business rules

- `current_stock` is always computed as:
  - `SUM(inbound quantities) - SUM(outbound quantities)`
- `current_stock` must never be stored directly on the product table.
- A product starts with zero stock at creation and only gains stock through inbound orders.
- Every order creation endpoint requires authentication.
- The authenticated user’s UID from TinyDB must be stored on each order in the `user_uid` field.
- Reject any outbound order that would produce negative stock.
- Rejection must happen before persistence.
- Return `HTTP 400` with a descriptive error message when insufficient stock is requested.
- Entity names, field names, and domain-specific values must match `CONTEXT.md`. Generic implementation wording is not acceptable if the context specifies different names.

### What We Will Evaluate

- Two database connections are demonstrably present and used correctly:
  - TinyDB for auth and user lookups
  - Supabase through SQLModel for inventory entities
- All inventory endpoints are grouped under `/inventory` via a dedicated router.
- SQLModel ORM models correctly declare FK relationships:
  - `InboundOrder.product_id` references `Product`
  - `OutboundOrder.product_id` references `Product`
- `current_stock` is computed from orders, and no endpoint allows direct mutation of a stock field on `Product`.
- An outbound order that exceeds available stock is rejected with `HTTP 400` before any write occurs.
- Every order stores the authenticated creator’s `user_uid` sourced from TinyDB.
- ORM models in `models.py` and Pydantic schemas in `schemas.py` are in separate files and structurally different. No endpoint returns a raw SQLModel object.
- The SQLModel session is injected per request with `Depends()`. No global SQL session exists in the codebase.
- All connection parameters live in `.env`, and `.env` is listed in `.gitignore`.
- Entity names and field names match the student `CONTEXT.md` specification.

## Frontend Eval

### What You Need To Do

#### API integration layer

- Create a module such as `lib/inventory.ts` that centralizes all calls to the `/inventory` endpoints.
- No component should call `fetch` directly.
- All requests to protected endpoints must include:
  - `Authorization: Bearer <token>`
- Read the token from the location already used by the existing auth flow, such as localStorage, context, or cookie.
- Handle API errors explicitly:
  - when the response status is `4xx` or `5xx`, extract the error message from the response body
  - surface it visibly to the user
  - never swallow errors silently

#### Products page: `/backoffice/inventory/products`

- Fetch and display all products from `GET /inventory/products`.
- Show the `current_stock` value for each product alongside the entity-specific fields defined in `CONTEXT.md`.
- Apply visual stock-level indicators using your own thresholds, such as color or iconography.
- Document those thresholds in a comment.
- Include a clearly labeled action from each product row to create either an inbound or outbound order for that product.

#### Inbound order form: `/backoffice/inventory/orders/inbound`

- Render a form that submits to `POST /inventory/orders/inbound`.
- The product selector must list available products by name.
- Do not ask the user to type a raw ID.
- On successful submission:
  - clear the form
  - show a confirmation message
- On `400` or `500`, display the API error message in a visible UI element, not only in the console.
- The route must be protected and redirect unauthenticated users to login.

#### Outbound order form: `/backoffice/inventory/orders/outbound`

- Render a form that submits to `POST /inventory/orders/outbound`.
- When the user selects a product, fetch and display its `current_stock` before they enter a quantity.
- That stock display must update reactively when the selected product changes.
- If the entered quantity exceeds displayed stock, show a client-side warning before submit.
- This is a UX safeguard only; the API still enforces the actual rule.
- If the API returns `HTTP 400` for insufficient stock, show the error message inline near the quantity field.

#### Orders history page: `/backoffice/inventory/orders`

- Fetch and display all orders from `GET /inventory/orders`.
- Each row must show:
  - product name
  - quantity
  - order type, inbound or outbound
  - creation date
  - `user_uid` of the creator
- Display inbound and outbound orders with visual distinction such as color, icon, or label.
- This page is read-only. No edit or delete actions.

#### Route protection

- All four inventory pages must redirect unauthenticated users to the login page.
- Use the same auth-check pattern already present in the backoffice.
- Entity names, field labels, and UI vocabulary must match `CONTEXT.md`.

### What We Will Evaluate

- A dedicated API integration module exists and components do not make raw `fetch` calls.
- All requests to protected endpoints include the current user’s `Authorization` header.
- The products page loads live data from the API and displays `current_stock` with visual stock-level indicators.
- The inbound order form submits correctly and shows either confirmation or readable error feedback on every outcome. No silent failures.
- The outbound order form displays the selected product’s current stock reactively before submit.
- The outbound form shows a client-side warning when the entered quantity exceeds available stock.
- A `400` response from the outbound endpoint surfaces the API error message visibly in the UI.
- The orders history page displays all orders with inbound/outbound distinction, product name, quantity, date, and `user_uid`.
- All four pages redirect unauthenticated users to login.
- Entity names and field labels in the UI match `CONTEXT.md`.
