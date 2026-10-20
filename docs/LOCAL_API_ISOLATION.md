# Local API isolation

The storefront must not use the production API during local development or automated tests. In `development` and `test`, API callers and `/api/backend` rewrites ignore `NEXT_PUBLIC_API_URL` and target `http://127.0.0.1:8080` by default. An override is accepted only when it is an HTTP loopback URL; other values fail closed.

For a local production-mode preview, set these variables before building so the target is included in the Next.js build:

```text
NEXT_PUBLIC_AVERON_RUNTIME_TARGET=local
NEXT_PUBLIC_AVERON_LOCAL_API_URL=http://127.0.0.1:8080
```

Production deployments keep the existing production API selection. Do not set the local runtime target in production. Analytics is disabled in development, tests, and noncanonical hosts; it remains enabled for `averon.uz` in production.

Firebase Authentication is also isolated in development, tests, and local production-mode previews: auth actions use the emulator at `http://127.0.0.1:9099`. If the emulator is unavailable, those actions fail locally rather than falling back to the production Firebase project. Real production auth remains unchanged outside those local/test modes.
