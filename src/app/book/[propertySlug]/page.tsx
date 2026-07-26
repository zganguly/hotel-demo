import Link from "next/link";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

export default async function BookPage({ params }: PageProps) {
  const { propertySlug } = await params;
  return (
    <main className="min-h-screen bg-background px-4 py-16 text-text">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm uppercase tracking-[0.16em] text-teal">Direct booking</p>
        <h1 className="mt-3 font-[family-name:var(--font-cormorant)] text-5xl font-semibold">
          Reserve your stay
        </h1>
        <p className="mt-4 text-text-muted">
          Public booking engine for {propertySlug}. Availability search is available at
          /api/v1/availability.
        </p>
        <Link
          href={`/app/${propertySlug}/dashboard`}
          className="mt-8 inline-flex rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-white"
        >
          Open property operations
        </Link>
      </div>
    </main>
  );
}
