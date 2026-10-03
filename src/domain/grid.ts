import {
    addDays,
    differenceInYears,
    endOfISOWeek,
    endOfMonth,
    format,
    getISOWeeksInYear,
    getISOWeekYear,
    getYear,
    isAfter,
    isBefore,
    max,
    setISOWeek,
    startOfISOWeekYear,
    subDays,
} from "date-fns";
import type { DateRange, Lifespan } from "./lifespan";

export type GridUnit = "day" | "week" | "month";

export type CellState = "outside" | "lived" | "current" | "future" | "surplus";

export type LifestyleMark = "gained" | "lost";

export interface Cell {
    key: string;
    start: Date;
    end: Date;
    column: number;
    row: number;
    state: CellState;
    lifestyle: LifestyleMark | null;
}

export interface YearBlock {
    year: number;
    columns: number;
    rows: number;
    cells: Cell[];
}

export const CELLS_PER_YEAR: Record<GridUnit, number> = { day: 365.2425, week: 365.2425 / 7, month: 12 };

export const GRID_SHAPE: Record<GridUnit, { columns: number; rows: number }> = {
    day: { columns: 53, rows: 7 },
    week: { columns: 53, rows: 1 },
    month: { columns: 12, rows: 1 },
};

interface Period {
    key: string;
    start: Date;
    end: Date;
    column: number;
    row: number;
}

export function cellState(period: Pick<Period, "start" | "end">, life: Lifespan, today: Date): CellState {
    if (isBefore(period.end, life.birth)) return "outside";
    if (!isAfter(period.start, today) && !isBefore(period.end, today)) return "current";
    if (!isBefore(period.start, life.expectedEnd)) return isBefore(period.end, today) ? "surplus" : "outside";
    return isBefore(period.end, today) ? "lived" : "future";
}

const overlaps = (period: Pick<Period, "start" | "end">, range: DateRange | null): boolean =>
    range !== null && isBefore(period.start, range.end) && !isBefore(period.end, range.start);

export function lifestyleMark(
    period: Pick<Period, "start" | "end">,
    state: CellState,
    life: Lifespan,
): LifestyleMark | null {
    if (state === "future" && overlaps(period, life.gained)) return "gained";
    if (state === "outside" && overlaps(period, life.lost)) return "lost";
    return null;
}

function isoWeekStart(isoYear: number, week: number): Date {
    return setISOWeek(startOfISOWeekYear(new Date(isoYear, 0, 4)), week);
}

function dayPeriods(isoYear: number): Period[] {
    const firstDay = startOfISOWeekYear(new Date(isoYear, 0, 4));
    const days = getISOWeeksInYear(firstDay) * 7;
    return Array.from({ length: days }, (_, index) => {
        const day = addDays(firstDay, index);
        return {
            key: format(day, "yyyy-MM-dd"),
            start: day,
            end: day,
            column: Math.floor(index / 7),
            row: index % 7,
        };
    });
}

function weekPeriods(isoYear: number): Period[] {
    const weeks = getISOWeeksInYear(new Date(isoYear, 0, 4));
    return Array.from({ length: weeks }, (_, index) => {
        const start = isoWeekStart(isoYear, index + 1);
        return {
            key: format(start, "RRRR-'W'II"),
            start,
            end: endOfISOWeek(start),
            column: index,
            row: 0,
        };
    });
}

function monthPeriods(year: number): Period[] {
    return Array.from({ length: 12 }, (_, month) => {
        const start = new Date(year, month, 1);
        return {
            key: format(start, "yyyy-MM"),
            start,
            end: endOfMonth(start),
            column: month,
            row: 0,
        };
    });
}

const PERIODS: Record<GridUnit, (year: number) => Period[]> = {
    day: dayPeriods,
    week: weekPeriods,
    month: monthPeriods,
};

const YEAR_OF: Record<GridUnit, (date: Date) => number> = {
    day: getISOWeekYear,
    week: getISOWeekYear,
    month: getYear,
};

export function buildGrid(unit: GridUnit, life: Lifespan, today: Date): YearBlock[] {
    const yearOf = YEAR_OF[unit];
    const lastDay = max([subDays(life.expectedEnd, 1), today, ...(life.lost ? [subDays(life.lost.end, 1)] : [])]);
    const firstYear = yearOf(life.birth);
    const lastYear = yearOf(lastDay);
    return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => {
        const year = firstYear + index;
        return {
            year,
            ...GRID_SHAPE[unit],
            cells: PERIODS[unit](year).map((period) => {
                const state = cellState(period, life, today);
                return { ...period, state, lifestyle: lifestyleMark(period, state, life) };
            }),
        };
    });
}

export function emptyPositions(block: YearBlock): { column: number; row: number }[] {
    const occupied = new Set(block.cells.map((cell) => `${cell.column}:${cell.row}`));
    return Array.from({ length: block.columns * block.rows }, (_, index) => ({
        column: Math.floor(index / block.rows),
        row: index % block.rows,
    })).filter(({ column, row }) => !occupied.has(`${column}:${row}`));
}

export function ageAt(date: Date, birth: Date): number {
    return Math.max(0, differenceInYears(max([date, birth]), birth));
}
