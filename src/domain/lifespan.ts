import { addDays, differenceInCalendarDays } from "date-fns";

const DAYS_PER_YEAR = 365.2425;

export interface Lifespan {
	birth: Date;
	expectedEnd: Date;
}

export function lifespan(birth: Date, lifeExpectancyYears: number): Lifespan {
	return { birth, expectedEnd: addDays(birth, Math.round(lifeExpectancyYears * DAYS_PER_YEAR)) };
}

export function yearsBetween(from: Date, to: Date): number {
	return differenceInCalendarDays(to, from) / DAYS_PER_YEAR;
}
