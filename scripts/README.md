# `scripts` folder

This folder contains **helper scripts** for the monorepo: development automation, maintenance utilities, repetitive tasks (setup, lint, migrations, data generation, etc.), and internal tooling.

- **Main purpose**: group support tools that do not belong to a specific app, agent, or pipeline but make the team’s work easier.
- **Recommendation**: document each script (what it does, parameters, requirements, usage examples) and keep them reproducible (and safe) across environments.

## `analyze.py`

Validates Nexova support ticket CSV exports and prints analysis metrics.

```bash
pip install -r scripts/requirements.txt
python scripts/analyze.py docs/incidents-nexova.csv
```

The script shares validation logic with `services/api` and never prints customer email addresses.

> _Spanish version: [README.es.md](./README.es.md)._
