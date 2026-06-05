# uis Directory

This directory contains user interface applications for the target product architecture.

Planned surfaces:

1. `uis/website` for public-facing company website experiences.
2. `uis/backoffice` for internal operations and admin workflows.

Migration policy:

1. Migrate from existing `apps/*` in stages.
2. Each stage requires parity checkpoints before cutover.
3. No destructive switch-over until parity criteria pass.
