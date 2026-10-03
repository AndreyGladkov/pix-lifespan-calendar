import { isAfter, isValid, parseISO, startOfDay } from "date-fns";
import type { GridUnit } from "./domain/grid";
import { LIFE_EXPECTANCY_RANGE, type Sex } from "./domain/lifeExpectancy";
import { NO_LIFESTYLE, type Lifestyle } from "./domain/lifestyle";

export interface LifeCalendarSettings extends Lifestyle {
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
    ...NO_LIFESTYLE,
    unit: "week",
};

const MIN_QUIT_AGE = 10;

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

export function parseQuitAge(input: string, currentAge: number | null): ParseResult<number | null> {
    const trimmed = input.trim();
    if (trimmed === "") return { ok: true, value: null };
    if (!/^\d+$/.test(trimmed)) return { ok: false };
    const value = Number(trimmed);
    if (value < MIN_QUIT_AGE || (currentAge !== null && value > currentAge)) return { ok: false };
    return { ok: true, value };
}
