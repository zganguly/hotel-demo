# Research notes and references

Platform and deployment rely on Next.js App Router on Hostinger Node 22 Web Apps, MongoDB Atlas replica sets for transactions, and Better Auth with a MongoDB adapter.

UI/motion: Tailwind CSS 4, shadcn/ui primitives, Lucide, Three.js / R3F for landing+login only, Anime.js 4 for marketing/login motion with `prefers-reduced-motion` support.

Hotel operations: inventory is sold by room type/night before physical assignment; folios are append-only with reversals; night audit owns the hotel business date separately from wall-clock time.

Authoritative product/engineering contract: original `hotel-management-system-cursor-build-specification.md`.
