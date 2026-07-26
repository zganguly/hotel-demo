# Security, privacy, and compliance notes

- Authenticate and authorize every protected read/mutation on the server
- UI visibility is not authorization
- Only `ADMIN` and `MANAGER` account types
- Tenant isolation via `propertyId` on property-owned documents
- Never store CVV or raw card numbers; use hosted/tokenized payments
- Redact secrets, tokens, identity documents, and payment details from logs
- Require reason codes for refunds, voids, discounts, write-offs, overrides, reversals
- Audit sensitive actions
- Validate webhook signatures
- Use idempotency keys for booking, payment, channel, and scheduled operations
- Force demo seed credentials off in production (`ALLOW_DEMO_SEED`)
