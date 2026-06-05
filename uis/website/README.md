# Website UI (Target Surface)

Purpose:

Public-facing Nexova website experience, evolving from existing marketing implementation.

Current status:

Stage 1 implementation started. Current migrated pieces:

1. Next.js app scaffold with TypeScript and App Router.
2. Landing page sections migrated to React (`app/page.tsx`).
3. Schema.org organization metadata added on landing page.
4. Talent signup route (`app/signup/page.tsx`) created.
5. Client-side validation form behavior migrated to React (`components/TalentSignupForm.tsx`).

Remaining for full Stage 1 parity:

1. Multilingual behavior parity (optional enhancement).
2. Visual parity tuning against original design.
3. Accessibility polish and final keyboard/aria parity checks.

Staged migration checkpoints:

1. Content parity checkpoint: all required sections and copy are present.
2. SEO parity checkpoint: metadata and schema.org coverage maintained.
3. Accessibility checkpoint: keyboard navigation and form validation parity.
4. Visual and responsive checkpoint: mobile and desktop behavior parity.
5. Integration checkpoint: service contracts wired through shared boundaries.
