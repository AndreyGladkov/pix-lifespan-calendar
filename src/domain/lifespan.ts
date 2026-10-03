import { addDays, differenceInCalendarDays } from "date-fns";
import { NO_LIFESTYLE_SPANS, type LifestyleSpans, type YearRange } from "./lifeExpectancy";

const DAYS_PER_YEAR = 365.2425;

export interface DateRange {
    start: Date;
    end: Date;
}

export interface Lifespan {
    birth: Date;
    expectedEnd: Date;
    gained: DateRange | null;
    lost: DateRange | null;
}

const dateAfterYears = (birth: Date, years: number): Date => addDays(birth, Math.round(years * DAYS_PER_YEAR));

const dateRange = (birth: Date, range: YearRange | null): DateRange | null =>
    range === null ? null : { start: dateAfterYears(birth, range.from), end: dateAfterYears(birth, range.to) };

export function lifespan(
    birth: Date,
    lifeExpectancyYears: number,
    spans: LifestyleSpans = NO_LIFESTYLE_SPANS,
): Lifespan {
    return {
        birth,
        expectedEnd: dateAfterYears(birth, lifeExpectancyYears),
        gained: dateRange(birth, spans.gained),
        lost: dateRange(birth, spans.lost),
    };
}

export function yearsBetween(from: Date, to: Date): number {
    return differenceInCalendarDays(to, from) / DAYS_PER_YEAR;
}
