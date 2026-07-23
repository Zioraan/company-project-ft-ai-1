# AUTH-01 Eval Traceability

Maps backend JWT authentication evaluation criteria to implementation and verification evidence.

**Last verified:** 2026-06-23 — `pytest` 49 passed (auth + password reset + supplier/incident regression)

| ID | Eval criterion | Implementation | Verification | Status |
| --- | --- | --- | --- | --- |
| E-A01 | User CRUD is fully implemented and reachable via the API | `services/api/app/routers/users.py`, `services/api/app/store/users_store.py` | `tests/test_auth_api.py` — `test_register_user_via_users_endpoint`, `test_list_users_with_auth`, `test_get_user_by_id`, `test_update_own_user`, `test_delete_own_user` | **Pass** |
| E-A02 | Passwords are hashed at creation and compared correctly at login — plain text never touches the database | `services/api/app/core/security.py`, `services/api/app/store/users_store.py` | `tests/test_auth_api.py` — `test_password_is_hashed_in_storage`, `test_login_returns_valid_jwt`, `test_login_wrong_password_returns_401`; API responses exclude `hashed_password` | **Pass** |
| E-A03 | Login endpoint returns a valid, signed JWT token | `services/api/app/routers/auth.py`, `services/api/app/core/security.py` | `tests/test_auth_api.py` — `test_login_returns_valid_jwt`, `test_register_via_auth_returns_token` | **Pass** |
| E-A04 | `get_current_user` dependency correctly decodes the token and identifies the user | `services/api/app/core/dependencies.py` | `tests/test_auth_api.py` — `test_auth_me_returns_current_user`, `test_auth_me_requires_token` | **Pass** |
| E-A05 | Protected routes return `401` when called without a valid token | `services/api/app/routers/suppliers.py`, `incidents.py`, `users.py` | `tests/test_auth_api.py` — `test_protected_supplier_route_returns_401_without_token`; `tests/test_suppliers_api.py` — `test_unauthenticated_suppliers_returns_401`; `tests/test_incidents_api.py` — unauthenticated analyze/export | **Pass** |
| E-A06 | Token expiry and signing secret are read from environment variables, not hardcoded | `services/api/app/core/config.py` | `tests/test_auth_api.py` — `test_settings_read_from_environment` | **Pass** |
| E-A07 | Auth routes are under `/auth` and user routes are under `/users` — clean, consistent structure | `services/api/app/routers/auth.py` (`prefix="/auth"`), `users.py` (`prefix="/users"`) | Route prefixes + full auth/user test suite | **Pass** |
| E-A08 | The existing routes of the project continue to work (no regressions) | Protected supplier/incident routers with shared `auth_headers` fixture | `tests/test_suppliers_api.py`, `tests/test_incidents_api.py` — full suites pass with authentication | **Pass** |

## Notes

- Self-only authorization for `PUT`/`DELETE /users/{id}` returns `403` when the caller is not the resource owner (`tests/test_auth_api.py`).
- Role-based access control (admin vs. regular user) is **out of scope** for this delivery.
- Backoffice attaches JWT via `uis/backoffice/lib/platform-api-client.ts` (AUTH-02).
