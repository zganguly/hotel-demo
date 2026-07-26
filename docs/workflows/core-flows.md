# Core business workflows

See also domain services under `src/modules/`.

1. **Availability search** — validate stay dates `[arrival, departure)`, load room types + inventory nights, apply occupancy, return offers.
2. **Direct booking** — create inventory hold → guest/payment → transactional reservation + folio + consume hold → outbox confirmation.
3. **Manager reservation** — guest search, availability, rooms/rates, notes, guarantee, confirm / quote / waitlist / approval.
4. **Check-in** — validate room readiness, allocate physical room-nights, registration, key issue, audit.
5. **Room move** — release old assignments, create new ACTIVE assignments, update front-office status.
6. **Checkout** — settle folio, release rooms, dirty housekeeping, audit.
7. **Housekeeping turnover** — dirty → clean → inspected; readiness gates check-in.
8. **Maintenance block** — OOO/OOS reduces sellable inventory for affected dates.
9. **Payment webhook** — verify signature, idempotent apply, never store raw cards.
10. **Night audit** — surface blockers, post room & tax, advance business date once, resumable.
