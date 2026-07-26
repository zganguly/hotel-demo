import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

/** Hotel business / stay date as property-local YYYY-MM-DD */
export type HotelDate = string;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function assertHotelDate(value: string): asserts value is HotelDate {
  if (!DATE_RE.test(value) || Number.isNaN(parseISO(value).getTime())) {
    throw new Error(`Invalid hotel date: ${value}`);
  }
}

/** Stay occupies [arrival, departure); departure is not an occupied night. */
export function occupiedNights(arrivalDate: HotelDate, departureDate: HotelDate): HotelDate[] {
  assertHotelDate(arrivalDate);
  assertHotelDate(departureDate);
  const nights = differenceInCalendarDays(parseISO(departureDate), parseISO(arrivalDate));
  if (nights <= 0) {
    throw new Error("Arrival must be before departure");
  }
  const dates: HotelDate[] = [];
  for (let i = 0; i < nights; i += 1) {
    dates.push(format(addDays(parseISO(arrivalDate), i), "yyyy-MM-dd"));
  }
  return dates;
}

export function nightCount(arrivalDate: HotelDate, departureDate: HotelDate): number {
  return occupiedNights(arrivalDate, departureDate).length;
}

export function propertyLocalDate(now: Date, timeZone: string): HotelDate {
  return format(toZonedTime(now, timeZone), "yyyy-MM-dd");
}
