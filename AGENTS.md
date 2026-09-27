<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## AVERON invariants

- AVERON is commerce for goods purchased in China and delivered to Uzbekistan.
- AI and parsers may only create `PENDING_REVIEW` imports. They must never publish products.
- Publication requires an authenticated human administrator and an audit-log entry.
- Customer orders and supplier purchases are separate entities and lifecycles.
- Expected cost/profit and actual cost/profit must remain separate.
- Backend recalculates prices; never trust totals from the frontend.
- Business entities use UUIDs. Authorization and RBAC are enforced on the backend.
- Preserve source product IDs, URLs, original CNY prices and exchange rates.
- Actual profit includes purchase, cargo, payment fee, local delivery, other expenses and refunds.
- Storefront content supports Uzbek, Russian and English.
- The page builder has been removed and must not be reintroduced without an explicit product decision.
