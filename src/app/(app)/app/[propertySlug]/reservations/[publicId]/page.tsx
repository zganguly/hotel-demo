import Link from "next/link";
import { notFound } from "next/navigation";
import { nightCount } from "@/lib/dates";
import { formatMoney, type Money } from "@/lib/money";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/feedback/status-badge";
import { MetricCards, ModuleSection } from "@/components/module/module-ui";
import { reservationStatusTone } from "@/components/data-table/simple-table";
import { MoneyReceipt } from "@/components/reservations/money-receipt";
import { PrintReceiptButton } from "@/components/reservations/print-receipt-button";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { ReservationModel } from "@/modules/reservations/reservation.model";
import { GuestModel } from "@/modules/guests/guest.model";
import { FolioModel, FolioTransactionModel } from "@/modules/billing/billing.model";

type PageProps = {
  params: Promise<{ propertySlug: string; publicId: string }>;
};

export default async function ReservationDetailsPage({ params }: PageProps) {
  const { propertySlug, publicId } = await params;
  const property = await getPropertyBySlug(propertySlug);
  const businessDate = businessDateToday(property?.timezone);
  const propertyName = propertyDisplayName(propertySlug, property?.name);

  if (!property) {
    return (
      <AppShell
        propertySlug={propertySlug}
        propertyName={propertyName}
        businessDate={businessDate}
        breadcrumb={["Reservations"]}
      >
        <PageHeader title="Reservation" description="Property not found." />
      </AppShell>
    );
  }

  const reservation =
    (await ReservationModel.findOne({
      propertyId: property._id,
      publicId,
    }).lean()) ??
    (await ReservationModel.findOne({
      propertyId: property._id,
      confirmationNumber: publicId,
    }).lean());

  if (!reservation) {
    notFound();
  }

  const [guest, folio] = await Promise.all([
    reservation.guestId
      ? GuestModel.findById(reservation.guestId).lean()
      : Promise.resolve(null),
    FolioModel.findOne({
      propertyId: property._id,
      reservationId: reservation._id,
    }).lean(),
  ]);

  const transactions = folio
    ? await FolioTransactionModel.find({ folioId: folio._id })
        .sort({ businessDate: 1, createdAt: 1 })
        .lean()
    : [];

  const guestName = guest ? `${guest.firstName} ${guest.lastName}` : "Guest";
  const nights = nightCount(reservation.arrivalDate, reservation.departureDate);
  const rate = reservation.rateSnapshot as
    | {
        roomTypeCode?: string;
        roomTypeName?: string;
        nightlyMinor?: number;
        currency?: string;
        rooms?: Array<{ code: string; name: string; quantity: number; nightlyMinor: number }>;
        nights?: number;
      }
    | undefined;
  const rooms = (reservation.rooms ?? []) as Array<{
    roomTypeCode: string;
    roomTypeName: string;
    quantity: number;
    adults: number;
    children: number;
    nightlyMinor: number;
  }>;
  const identityDocument = reservation.identityDocument as
    | {
        documentType: string;
        holderName: string;
        documentNumberLast4: string;
        fileName: string;
        mimeType: string;
        storagePath: string;
        fileSizeBytes: number;
        uploadedAt?: Date | string;
      }
    | undefined;
  const totals = reservation.totals as
    | {
        gross?: Money;
        discount?: Money;
        net?: Money;
        tax?: Money;
        total?: Money;
      }
    | undefined;
  const currency = totals?.total?.currency ?? property.currency ?? "INR";

  const receiptLines = transactions.map((txn) => ({
    id: String(txn._id),
    type: txn.type,
    description: txn.description,
    businessDate: txn.businessDate,
    amount: txn.amount as Money,
    createdAt: txn.createdAt,
  }));

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Reservations", "All Reservations", reservation.confirmationNumber]}
    >
      <PageHeader
        title={reservation.confirmationNumber}
        description={`${guestName} · ${reservation.arrivalDate} → ${reservation.departureDate} · ${nights} night${nights === 1 ? "" : "s"}`}
        primaryAction={
          <div className="flex flex-wrap gap-2 print:hidden">
            <PrintReceiptButton />
            <Link
              href={`/app/${propertySlug}/reservations`}
              className="inline-flex h-11 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text hover:bg-surface-subtle"
            >
              Back to list
            </Link>
          </div>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
        <StatusBadge
          label={reservation.status.replace(/_/g, " ")}
          tone={reservationStatusTone(reservation.status)}
        />
        <StatusBadge label={reservation.source.replace(/_/g, " ")} tone="neutral" />
        {guest?.vip ? <StatusBadge label="VIP" tone="premium" /> : null}
        {identityDocument ? <StatusBadge label="ID on file" tone="success" /> : (
          <StatusBadge label="ID missing" tone="danger" />
        )}
        {rooms.length > 0 ? (
          <StatusBadge
            label={`${rooms.reduce((sum, r) => sum + r.quantity, 0)} rooms`}
            tone="info"
          />
        ) : null}
        {folio ? (
          <StatusBadge
            label={`Folio ${folio.status}`}
            tone={folio.status === "OPEN" ? "warning" : "success"}
          />
        ) : null}
      </div>

      <div className="mt-6 space-y-5 print:hidden">
        <MetricCards
          items={[
            {
              label: "Stay total",
              value: totals?.total ? formatMoney(totals.total) : "—",
              hint: "Quoted package including tax",
              tone: "premium",
            },
            {
              label: "Balance due",
              value: folio?.balance
                ? formatMoney(folio.balance as Money)
                : formatMoney({ amountMinor: 0, currency }),
              hint: folio ? `Folio ${folio.status.toLowerCase()}` : "No folio yet",
              tone: (folio?.balance as Money | undefined)?.amountMinor
                ? "warning"
                : "success",
            },
            {
              label: "Nights",
              value: nights,
              hint: rate?.roomTypeName ?? rate?.roomTypeCode ?? "Room type TBD",
            },
            {
              label: "Occupancy",
              value: `${reservation.adults}A${reservation.children ? ` · ${reservation.children}C` : ""}`,
              hint: "Adults / children",
            },
          ]}
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <ModuleSection title="Guest & stay" description="Profile and booking details">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                  Guest
                </dt>
                <dd className="mt-1 font-semibold text-text">{guestName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                  Contact
                </dt>
                <dd className="mt-1 text-text">
                  {guest?.email ?? "—"}
                  {guest?.phone ? <span className="block text-text-muted">{guest.phone}</span> : null}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                  Arrival
                </dt>
                <dd className="mt-1 tabular text-text">{reservation.arrivalDate}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                  Departure
                </dt>
                <dd className="mt-1 tabular text-text">{reservation.departureDate}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                  Rooms
                </dt>
                <dd className="mt-1 text-text">
                  {rooms.length > 0
                    ? rooms.map((r) => `${r.quantity}× ${r.roomTypeName}`).join(" · ")
                    : rate?.roomTypeName ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                  Nightly rate
                </dt>
                <dd className="mt-1 tabular text-text">
                  {rooms.length > 0
                    ? formatMoney({
                        amountMinor: rooms.reduce(
                          (sum, r) => sum + r.nightlyMinor * r.quantity,
                          0,
                        ),
                        currency,
                      })
                    : typeof rate?.nightlyMinor === "number"
                      ? formatMoney({
                          amountMinor: rate.nightlyMinor,
                          currency: rate.currency ?? currency,
                        })
                      : "—"}
                </dd>
              </div>
            </dl>
            {reservation.specialRequests?.length ? (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                  Special requests
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text">
                  {(reservation.specialRequests as string[]).map((request: string) => (
                    <li key={request}>{request}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {reservation.notes ? (
              <p className="mt-4 rounded-[12px] border border-border bg-surface-subtle/60 px-3 py-2.5 text-sm text-text-muted">
                {reservation.notes}
              </p>
            ) : null}
          </ModuleSection>

          <ModuleSection title="Rate summary" description="Quoted totals for this booking">
            <dl className="space-y-2.5 text-sm">
              {(
                [
                  { label: "Gross", value: totals?.gross },
                  { label: "Discount", value: totals?.discount },
                  { label: "Net", value: totals?.net },
                  { label: "Tax", value: totals?.tax },
                  { label: "Total", value: totals?.total },
                ] as Array<{ label: string; value?: Money }>
              ).map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4">
                  <dt className="text-text-muted">{row.label}</dt>
                  <dd className="font-semibold tabular text-text">
                    {row.value ? formatMoney(row.value) : "—"}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-text-muted">
              {(reservation.policySnapshot as { cancellation?: string } | undefined)?.cancellation ??
                "Cancellation policy on file with the property."}
            </p>
          </ModuleSection>
        </div>

        {(rooms.length > 0 || identityDocument) ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {rooms.length > 0 ? (
              <ModuleSection title="Rooms on this booking" description="Multiple room types under one confirmation">
                <div className="space-y-3">
                  {rooms.map((room) => (
                    <div
                      key={`${room.roomTypeCode}-${room.quantity}-${room.adults}`}
                      className="flex items-start justify-between gap-3 rounded-[14px] border border-border bg-background px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-text">
                          {room.quantity}× {room.roomTypeName}
                          <span className="ml-2 text-xs font-bold uppercase tracking-wide text-text-muted">
                            {room.roomTypeCode}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          {room.adults} adults
                          {room.children ? ` · ${room.children} children` : ""} per room
                        </p>
                      </div>
                      <p className="text-sm font-semibold tabular text-primary">
                        {formatMoney({
                          amountMinor: room.nightlyMinor * room.quantity,
                          currency,
                        })}
                        <span className="block text-right text-[11px] font-medium text-text-muted">
                          / night
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </ModuleSection>
            ) : null}

            {identityDocument ? (
              <ModuleSection title="Government ID" description="Required identity document on file">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-border bg-[#0F1C2A] sm:w-40">
                    {identityDocument.mimeType.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={identityDocument.storagePath}
                        alt="Uploaded ID document"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <p className="px-3 text-center text-xs font-semibold text-nav-active-accent">
                        PDF on file
                      </p>
                    )}
                  </div>
                  <dl className="grid flex-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                        Type
                      </dt>
                      <dd className="mt-1 font-semibold text-text">
                        {identityDocument.documentType.replace(/_/g, " ")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                        Number
                      </dt>
                      <dd className="mt-1 font-semibold tabular text-text">
                        ···· {identityDocument.documentNumberLast4}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                        Holder
                      </dt>
                      <dd className="mt-1 text-text">{identityDocument.holderName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                        File
                      </dt>
                      <dd className="mt-1">
                        <a
                          href={identityDocument.storagePath}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          {identityDocument.fileName}
                        </a>
                      </dd>
                    </div>
                  </dl>
                </div>
              </ModuleSection>
            ) : (
              <ModuleSection title="Government ID" description="Required for new bookings">
                <p className="rounded-[12px] border border-dashed border-warning/40 bg-warning/5 px-4 py-3 text-sm text-text-muted">
                  No identity document is attached to this reservation. New bookings require an ID upload.
                </p>
              </ModuleSection>
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div>
            <h2 className="text-base font-semibold text-text">Money receipt</h2>
            <p className="text-sm text-text-muted">
              Folio charges, payments, and balance for this reservation.
            </p>
          </div>
          <PrintReceiptButton />
        </div>
        <MoneyReceipt
          propertyName={propertyName}
          confirmationNumber={reservation.confirmationNumber}
          guestName={guestName}
          guestEmail={guest?.email}
          guestPhone={guest?.phone}
          arrivalDate={reservation.arrivalDate}
          departureDate={reservation.departureDate}
          folioPublicId={folio?.publicId}
          folioStatus={folio?.status}
          currency={currency}
          lines={receiptLines}
          balance={(folio?.balance as Money | undefined) ?? null}
        />
      </div>
    </AppShell>
  );
}
