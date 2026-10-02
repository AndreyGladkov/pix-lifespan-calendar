import { isAfter, isValid, parseISO, startOfDay } from "date-fns";
import type { GridUnit } from "./domain/grid";
import type { Sex } from "./domain/lifeExpectancy";

export interface LifeCalendarSettings {
	birthDate: string | null;
	country: string | null;
	sex: Sex;
	lifeExpectancyOverride: number | null;
	unit: GridUnit;
}

export const DEFAULT_SETTINGS: LifeCalendarSettings = {
	birthDate: null,
	country: null,
	sex: "unspecified",
	lifeExpectancyOverride: null,
	unit: "week",
};

export const LIFE_EXPECTANCY_RANGE = { min: 1, max: 150 };

export type ParseResult<T> = { ok: true; value: T } | { ok: false };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseBirthDate(input: string, today: Date): ParseResult<string | null> {
	const trimmed = input.trim();
	if (trimmed === "") return { ok: true, value: null };
	if (!ISO_DATE.test(trimmed)) return { ok: false };
	const date = parseISO(trimmed);
	if (!isValid(date) || isAfter(date, startOfDay(today))) return { ok: false };
	return { ok: true, value: trimmed };
}

export function parseLifeExpectancy(input: string): ParseResult<number | null> {
	const normalized = input.trim().replace(",", ".");
	if (normalized === "") return { ok: true, value: null };
	if (!/^\d+(\.\d)?$/.test(normalized)) return { ok: false };
	const value = Number(normalized);
	if (value < LIFE_EXPECTANCY_RANGE.min || value > LIFE_EXPECTANCY_RANGE.max) return { ok: false };
	return { ok: true, value };
}
