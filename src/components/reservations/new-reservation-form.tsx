"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  BedDouble,
  CheckCircle2,
  FileImage,
  IdCard,
  Loader2,
  Minus,
  Plus,
  Sparkles,
  Upload,
  Users,
  X,
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export type RoomTypeOption = {
  id: string;
  code: string;
  name: string;
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  available: number;
  nightlyMinor: number;
  currency: string;
  amenities: string[];
};

type RoomPick = {
  quantity: number;
  adults: number;
  children: number;
};

type NewReservationFormProps = {
  propertySlug: string;
  businessDate: string;
  currency: string;
  roomTypes: RoomTypeOption[];
};

const SOURCES = [
  { value: "DIRECT", label: "Direct" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "PHONE", label: "Phone" },
  { value: "CORPORATE", label: "Corporate" },
  { value: "AGENT", label: "Travel agent" },
  { value: "GROUP", label: "Group" },
  { value: "OTA", label: "OTA" },
] as const;

const DOC_TYPES = [
  { value: "AADHAAR", label: "Aadhaar" },
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVING_LICENSE", label: "Driving license" },
  { value: "VOTER_ID", label: "Voter ID" },
  { value: "OTHER", label: "Other government ID" },
] as const;

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-text outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-focus";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-text-muted";

function nightsBetween(arrival: string, departure: string) {
  if (!arrival || !departure || departure <= arrival) return 0;
  const a = new Date(`${arrival}T00:00:00`);
  const b = new Date(`${departure}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function roomAccent(code: string) {
  if (code === "SUITE") return "from-[#1D3449] to-[#0F766E]";
  if (code === "DLX") return "from-[#173B57] to-[#2A4A6A]";
  return "from-[#132131] to-[#1D3449]";
}

export function NewReservationForm({
  propertySlug,
  businessDate,
  currency,
  roomTypes,
}: NewReservationFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [arrivalDate, setArrivalDate] = useState(businessDate);
  const [departureDate, setDepartureDate] = useState(() => {
    const date = new Date(`${businessDate}T00:00:00`);
    date.setDate(date.getDate() + 2);
    return date.toISOString().slice(0, 10);
  });
  const [source, setSource] = useState("DIRECT");
  const [specialRequests, setSpecialRequests] = useState("");
  const [documentType, setDocumentType] = useState("AADHAAR");
  const [documentNumber, setDocumentNumber] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [picks, setPicks] = useState<Record<string, RoomPick>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    confirmation: string;
    guest: string;
    publicId: string;
    roomCount: number;
  } | null>(null);

  const nights = nightsBetween(arrivalDate, departureDate);

  const selections = useMemo(() => {
    return roomTypes.flatMap((type) => {
      const pick = picks[type.id];
      if (!pick || pick.quantity < 1) return [];
      return [{ type, quantity: pick.quantity, adults: pick.adults, children: pick.children }];
    });
  }, [picks, roomTypes]);

  const roomCount = selections.reduce((sum, s) => sum + s.quantity, 0);
  const guestCount = selections.reduce(
    (sum, s) => sum + (s.adults + s.children) * s.quantity,
    0,
  );
  const grossMinor = selections.reduce(
    (sum, s) => sum + s.type.nightlyMinor * s.quantity * Math.max(nights, 0),
    0,
  );
  const taxMinor = Math.round(grossMinor * 0.18);
  const totalMinor = grossMinor + taxMinor;

  function setQuantity(typeId: string, quantity: number, type: RoomTypeOption) {
    setPicks((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[typeId];
        return next;
      }
      const existing = prev[typeId];
      next[typeId] = {
        quantity: Math.min(quantity, type.available),
        adults: existing?.adults ?? Math.min(2, type.maxAdults),
        children: existing?.children ?? 0,
      };
      return next;
    });
  }

  function updatePick(typeId: string, patch: Partial<RoomPick>) {
    setPicks((prev) => {
      const existing = prev[typeId];
      if (!existing) return prev;
      return { ...prev, [typeId]: { ...existing, ...patch } };
    });
  }

  function onIdSelected(file: File | null) {
    if (idPreview) URL.revokeObjectURL(idPreview);
    if (!file) {
      setIdFile(null);
      setIdPreview(null);
      return;
    }
    setIdFile(file);
    if (file.type.startsWith("image/")) {
      setIdPreview(URL.createObjectURL(file));
    } else {
      setIdPreview(null);
    }
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = "First name is required.";
    if (!lastName.trim()) next.lastName = "Last name is required.";
    if (!arrivalDate) next.arrivalDate = "Arrival is required.";
    if (!departureDate) next.departureDate = "Departure is required.";
    if (arrivalDate && departureDate && departureDate <= arrivalDate) {
      next.departureDate = "Departure must be after arrival.";
    }
    if (selections.length === 0) next.rooms = "Select at least one room.";
    if (!documentType) next.documentType = "Select ID type.";
    if (documentNumber.trim().length < 4) {
      next.documentNumber = "Enter the ID number (at least 4 characters).";
    }
    if (!idFile) next.idFile = "Government ID card upload is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!validate() || !idFile) return;

    setSubmitting(true);
    try {
      const body = new FormData();
      body.set("propertySlug", propertySlug);
      body.set("firstName", firstName.trim());
      body.set("lastName", lastName.trim());
      body.set("email", email.trim());
      body.set("phone", phone.trim());
      body.set("arrivalDate", arrivalDate);
      body.set("departureDate", departureDate);
      body.set("source", source);
      body.set("specialRequests", specialRequests.trim());
      body.set("documentType", documentType);
      body.set("documentNumber", documentNumber.trim());
      body.set(
        "rooms",
        JSON.stringify(
          selections.map((s) => ({
            roomTypeId: s.type.id,
            quantity: s.quantity,
            adults: s.adults,
            children: s.children,
          })),
        ),
      );
      body.set("idDocument", idFile);

      const response = await fetch("/api/v1/reservations", {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as {
        ok: boolean;
        data?: {
          publicId: string;
          confirmationNumber: string;
          guestName: string;
          roomCount: number;
        };
        error?: { message: string };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        setFormError(payload.error?.message ?? "Could not create reservation.");
        setSubmitting(false);
        return;
      }

      setSuccess({
        confirmation: payload.data.confirmationNumber,
        guest: payload.data.guestName,
        publicId: payload.data.publicId,
        roomCount: payload.data.roomCount,
      });
    } catch {
      setFormError("Network error while creating the reservation.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="overflow-hidden rounded-[22px] border border-border bg-surface shadow-[var(--shadow-card)]">
        <div className="bg-gradient-to-br from-[#0F1C2A] via-[#173B57] to-[#0F766E] px-6 py-10 text-center text-nav-text sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-nav-active-accent/20 text-nav-active-accent ring-1 ring-nav-active-accent/40">
            <CheckCircle2 className="h-8 w-8" aria-hidden />
          </div>
          <h2 className="mt-5 font-[family-name:var(--font-cormorant)] text-3xl font-semibold text-nav-active-accent">
            Booking confirmed
          </h2>
          <p className="mt-2 text-sm text-nav-muted">
            {success.guest} · {success.roomCount} room{success.roomCount === 1 ? "" : "s"} · ID on file
          </p>
          <p className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold tabular tracking-wide text-nav-text">
            {success.confirmation}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 p-6">
          <button
            type="button"
            onClick={() => router.push(`/app/${propertySlug}/reservations/${success.publicId}`)}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Open reservation & receipt
          </button>
          <button
            type="button"
            onClick={() => {
              setSuccess(null);
              setPicks({});
              setIdFile(null);
              setIdPreview(null);
              setDocumentNumber("");
              setSpecialRequests("");
            }}
            className="rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-text hover:bg-surface-subtle"
          >
            Create another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
      <div className="space-y-5">
        {/* Guest */}
        <section className="rounded-[20px] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-semibold text-text">Guest details</h2>
              <p className="text-sm text-text-muted">Primary guest for this booking</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="firstName">First name</label>
              <input id="firstName" className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Aarav" />
              {errors.firstName ? <p className="mt-1.5 text-xs text-danger">{errors.firstName}</p> : null}
            </div>
            <div>
              <label className={labelClass} htmlFor="lastName">Last name</label>
              <input id="lastName" className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Sharma" />
              {errors.lastName ? <p className="mt-1.5 text-xs text-danger">{errors.lastName}</p> : null}
            </div>
            <div>
              <label className={labelClass} htmlFor="email">Email</label>
              <input id="email" type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="guest@example.com" />
            </div>
            <div>
              <label className={labelClass} htmlFor="phone">Phone</label>
              <input id="phone" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className={labelClass} htmlFor="arrivalDate">Arrival</label>
              <input id="arrivalDate" type="date" className={inputClass} value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
              {errors.arrivalDate ? <p className="mt-1.5 text-xs text-danger">{errors.arrivalDate}</p> : null}
            </div>
            <div>
              <label className={labelClass} htmlFor="departureDate">Departure</label>
              <input id="departureDate" type="date" className={inputClass} value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
              {errors.departureDate ? <p className="mt-1.5 text-xs text-danger">{errors.departureDate}</p> : null}
            </div>
            <div>
              <label className={labelClass} htmlFor="source">Source</label>
              <select id="source" className={inputClass} value={source} onChange={(e) => setSource(e.target.value)}>
                {SOURCES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="specialRequests">Special requests</label>
              <textarea
                id="specialRequests"
                rows={2}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-focus"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="High floor, late checkout, connecting rooms…"
              />
            </div>
          </div>
        </section>

        {/* Multi-room selection */}
        <section className="rounded-[20px] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 text-teal">
                <BedDouble className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-base font-semibold text-text">Select rooms</h2>
                <p className="text-sm text-text-muted">
                  Add multiple room types to one booking
                </p>
              </div>
            </div>
            <span className="rounded-full bg-primary/8 px-3 py-1 text-xs font-bold text-primary">
              {roomCount} selected
            </span>
          </div>

          {errors.rooms ? (
            <p className="mb-4 rounded-xl border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">
              {errors.rooms}
            </p>
          ) : null}

          <div className="grid gap-4">
            {roomTypes.map((type) => {
              const pick = picks[type.id];
              const quantity = pick?.quantity ?? 0;
              const selected = quantity > 0;
              return (
                <article
                  key={type.id}
                  className={cn(
                    "overflow-hidden rounded-[18px] border transition",
                    selected
                      ? "border-primary/40 bg-primary/[0.04] shadow-[0_10px_30px_rgba(23,59,87,0.08)]"
                      : "border-border bg-background hover:border-primary/25",
                  )}
                >
                  <div className="grid gap-0 md:grid-cols-[140px_1fr]">
                    <div
                      className={cn(
                        "relative flex min-h-[120px] items-end bg-gradient-to-br p-4 text-white",
                        roomAccent(type.code),
                      )}
                    >
                      <div className="absolute right-3 top-3 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                        {type.code}
                      </div>
                      <div>
                        <BedDouble className="mb-2 h-7 w-7 opacity-90" aria-hidden />
                        <p className="text-xs text-white/70">{type.available} sellable</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-text">{type.name}</h3>
                          <p className="mt-1 text-sm text-text-muted">
                            Up to {type.maxAdults} adults
                            {type.maxChildren ? ` · ${type.maxChildren} children` : ""}
                            {" · "}
                            {type.maxOccupancy} total
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(type.amenities.length
                              ? type.amenities
                              : ["Wi-Fi", "AC", "Daily housekeeping"]
                            ).slice(0, 4).map((amenity) => (
                              <span
                                key={amenity}
                                className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-text-muted"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Per night</p>
                          <p className="mt-0.5 text-xl font-bold tabular text-primary">
                            {formatMoney({ amountMinor: type.nightlyMinor, currency: type.currency })}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-2 py-1.5">
                          <button
                            type="button"
                            aria-label={`Remove one ${type.name}`}
                            disabled={quantity === 0}
                            onClick={() => setQuantity(type.id, quantity - 1, type)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-text transition hover:bg-surface-subtle disabled:opacity-40"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-8 text-center text-base font-bold tabular text-text">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Add one ${type.name}`}
                            disabled={quantity >= type.available}
                            onClick={() => setQuantity(type.id, quantity + 1, type)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white transition hover:bg-primary-hover disabled:opacity-40"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        {selected ? (
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <label className="flex items-center gap-2 text-text-muted">
                              Adults / room
                              <input
                                type="number"
                                min={1}
                                max={type.maxAdults}
                                value={pick?.adults ?? 1}
                                onChange={(e) =>
                                  updatePick(type.id, {
                                    adults: Math.min(
                                      type.maxAdults,
                                      Math.max(1, Number(e.target.value) || 1),
                                    ),
                                  })
                                }
                                className="h-9 w-16 rounded-lg border border-border bg-background px-2 text-center tabular outline-none focus:ring-2 focus:ring-focus"
                              />
                            </label>
                            <label className="flex items-center gap-2 text-text-muted">
                              Children / room
                              <input
                                type="number"
                                min={0}
                                max={type.maxChildren}
                                value={pick?.children ?? 0}
                                onChange={(e) =>
                                  updatePick(type.id, {
                                    children: Math.min(
                                      type.maxChildren,
                                      Math.max(0, Number(e.target.value) || 0),
                                    ),
                                  })
                                }
                                className="h-9 w-16 rounded-lg border border-border bg-background px-2 text-center tabular outline-none focus:ring-2 focus:ring-focus"
                              />
                            </label>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setQuantity(type.id, 1, type)}
                            className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
                          >
                            Add to booking
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ID upload */}
        <section className="rounded-[20px] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-primary">
              <IdCard className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-semibold text-text">
                Government ID <span className="text-danger">*</span>
              </h2>
              <p className="text-sm text-text-muted">
                Required for every booking · only last 4 digits are stored with the file
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="documentType">ID type</label>
              <select
                id="documentType"
                className={inputClass}
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                {DOC_TYPES.map((doc) => (
                  <option key={doc.value} value={doc.value}>{doc.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="documentNumber">ID number</label>
              <input
                id="documentNumber"
                className={inputClass}
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Full number — only ···· last4 is retained"
                autoComplete="off"
              />
              {errors.documentNumber ? (
                <p className="mt-1.5 text-xs text-danger">{errors.documentNumber}</p>
              ) : null}
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0] ?? null;
              if (file) onIdSelected(file);
            }}
            className={cn(
              "mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[18px] border-2 border-dashed px-4 py-8 text-center transition",
              idFile
                ? "border-success/40 bg-success/5"
                : "border-border bg-surface-subtle/40 hover:border-primary/40 hover:bg-primary/[0.03]",
              errors.idFile && !idFile ? "border-danger/40 bg-danger/5" : "",
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(e) => onIdSelected(e.target.files?.[0] ?? null)}
            />
            {idPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={idPreview}
                alt="ID preview"
                className="mb-3 h-36 w-auto max-w-full rounded-xl border border-border object-contain shadow-sm"
              />
            ) : (
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {idFile ? <FileImage className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
              </span>
            )}
            <p className="text-sm font-semibold text-text">
              {idFile ? idFile.name : "Drop ID card image or PDF here"}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              JPG, PNG, WEBP or PDF · max 8 MB
            </p>
            {idFile ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onIdSelected(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-subtle"
              >
                <X className="h-3.5 w-3.5" /> Remove file
              </button>
            ) : null}
          </div>
          {errors.idFile ? <p className="mt-2 text-xs text-danger">{errors.idFile}</p> : null}
        </section>
      </div>

      {/* Summary */}
      <aside className="xl:sticky xl:top-6 xl:self-start">
        <div className="overflow-hidden rounded-[22px] border border-border bg-surface shadow-[var(--shadow-float)]">
          <div className="bg-gradient-to-br from-[#0B1420] to-[#1D3449] px-5 py-5 text-nav-text">
            <div className="flex items-center gap-2 text-nav-active-accent">
              <Sparkles className="h-4 w-4" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">Booking summary</p>
            </div>
            <p className="mt-3 font-[family-name:var(--font-cormorant)] text-3xl font-semibold">
              {nights || "—"} night{nights === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-sm text-nav-muted">
              {arrivalDate || "—"} → {departureDate || "—"}
            </p>
          </div>

          <div className="space-y-3 px-5 py-4">
            {selections.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm text-text-muted">
                Choose one or more rooms to build this booking.
              </p>
            ) : (
              selections.map((s) => (
                <div
                  key={s.type.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-text">
                      {s.quantity}× {s.type.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {s.adults}A{s.children ? ` · ${s.children}C` : ""} per room
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular text-text">
                    {formatMoney({
                      amountMinor: s.type.nightlyMinor * s.quantity * Math.max(nights, 1),
                      currency,
                    })}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 border-t border-border px-5 py-4 text-sm">
            <div className="flex justify-between text-text-muted">
              <span>Rooms / guests</span>
              <span className="tabular text-text">
                {roomCount} · {guestCount}
              </span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Room charges</span>
              <span className="tabular text-text">
                {formatMoney({ amountMinor: grossMinor, currency })}
              </span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>GST (18%)</span>
              <span className="tabular text-text">
                {formatMoney({ amountMinor: taxMinor, currency })}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-semibold text-text">Estimated total</span>
              <span className="text-lg font-bold tabular text-primary">
                {formatMoney({ amountMinor: totalMinor, currency })}
              </span>
            </div>
          </div>

          <div className="border-t border-border px-5 py-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-text-muted">
              <BadgeCheck className="h-4 w-4 text-success" aria-hidden />
              ID upload {idFile ? "attached" : "required before save"}
            </div>
            {formError ? (
              <p role="alert" className="mb-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {formError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C89B5D] via-[#D6AE73] to-[#C89B5D] text-sm font-bold text-[#0B1420] shadow-[0_8px_24px_rgba(200,155,93,0.28)] transition hover:brightness-105 disabled:opacity-70"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {submitting ? "Creating booking…" : "Confirm booking"}
            </button>
          </div>
        </div>
      </aside>
    </form>
  );
}
