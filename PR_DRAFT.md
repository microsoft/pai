## Summary

- Restrict v2 user list access to admins and enforce self-or-admin checks on per-user reads and the legacy per-user password update route.
- Add centralized user response sanitization for v2 user responses, removing password data and confidential extension fields such as raw bounded-cluster tokens and SSH private keys while preserving safe metadata.
- Add focused regression coverage for access control and response redaction behavior.
- Keep the job-list user filter usable for non-admin portal sessions when the all-user API is unavailable.

## Validation

- `node -c src/rest-server/src/utils/userResponse.js`
- `node -c src/rest-server/src/controllers/v2/user.js`
- `node -c src/rest-server/src/routes/v2/user.js`
- `node -c src/rest-server/test/userResponseSecurity.js`

Focused mocha/lint commands were attempted but local dependencies are not installed in this worktree:

- `npm run mocha -- --grep "user response security"` -> `sh: 1: mocha: not found`
- `npm run lint` -> `sh: 1: eslint: not found`

## Notes

- Existing `/api/v2/user` and `/api/v2/users` aliases are preserved.
- Sanitization is applied at response construction; stored user extension data is not modified.
