# Definition of Done checklist

Copied from the build specification. Phase work is not complete until these hold for the shipped scope.

## Functional

- [ ] Admin and Manager can complete every authorized core workflow
- [ ] Availability is accurate per stay night
- [ ] Concurrent booking cannot oversell beyond configured authorization
- [ ] Reservation lifecycle, room assignment, check-in, room move, and checkout are consistent
- [ ] Housekeeping and maintenance affect readiness/inventory correctly
- [ ] Folios, taxes, payments, reversals, and invoices reconcile
- [ ] Night audit is safe, resumable, and advances the business date once
- [ ] Demo data exercises normal, empty, exception, failure, and approval states

## UI

- [x] Modern left navigation matches the 272/80 px specification
- [x] Landing and login are polished, responsive, and professionally animated
- [x] Three.js and Anime.js degrade gracefully with reduced motion
- [x] Shared loading/empty/error/permission state components exist
- [ ] Dense workflows remain fully keyboard-operable end-to-end
- [x] Status uses color plus text/icon
- [x] Mobile drawer navigation for urgent hotel actions

## Engineering

- [x] Strict TypeScript and domain module boundaries scaffolded
- [x] Server/client separation intentional
- [x] Core MongoDB indexes defined on inventory/assignments
- [x] Idempotency/outbox/job models present
- [x] Unit tests for money, dates, inventory math, authorize
- [x] No secrets committed (single `.env` file, gitignored)

## Deployment

- [x] Standard Next.js Node deploy docs for Hostinger + Node 22
- [x] Health and ready endpoints
- [x] Protected cron dispatcher route
- [ ] MongoDB Atlas connectivity verified in target environment
- [ ] Production smoke + rollback rehearsed

## Product readiness

- [ ] Stakeholder procedure review
- [ ] Jurisdiction tax/privacy/payment review
- [ ] Support ownership defined
- [ ] Role-specific training guides
