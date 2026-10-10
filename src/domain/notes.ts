import { format, isValid, parse } from "date-fns";
import { CELL_KEY_FORMAT, CELLS_PER_YEAR, type GridUnit } from "./grid";

export const DATE_PROPERTY = "lifespan-date";

export interface NotePeriod {
    unit: GridUnit;
    start: Date;
}

export interface CalendarNote {
    path: string;
    title: string;
    period: NotePeriod;
}

const PERIOD_SHAPE = /^\d{4}-(\d{2}|\d{2}-\d{2}|W\d{2})$/;

const PARSE_REFERENCE = new Date(2000, 0, 1);

export const parsePeriod = (text: string): NotePeriod | null => {
    if (!PERIOD_SHAPE.test(text)) return null;
    for (const [unit, pattern] of Object.entries(CELL_KEY_FORMAT) as [GridUnit, string][]) {
        const start = parse(text, pattern, PARSE_REFERENCE);
        if (isValid(start) && format(start, pattern) === text) return { unit, start };
    }
    return null;
};

const withoutTime = (value: string): string => value.trim().replace(/T.*$/, "");

export const calendarNote = (path: string, title: string, dateProperty: unknown): CalendarNote | null => {
    const period =
        (typeof dateProperty === "string" ? parsePeriod(withoutTime(dateProperty)) : null) ?? parsePeriod(title);
    return period && { path, title, period };
};

export const sameNote = (a: CalendarNote | undefined, b: CalendarNote | null): boolean => {
    if (!a || !b) return !a && !b;
    return (
        a.path === b.path &&
        a.title === b.title &&
        a.period.unit === b.period.unit &&
        a.period.start.getTime() === b.period.start.getTime()
    );
};

const fitsInto = (note: GridUnit, cell: GridUnit): boolean => CELLS_PER_YEAR[note] >= CELLS_PER_YEAR[cell];

export const notesByCell = (notes: readonly CalendarNote[], unit: GridUnit): Map<string, CalendarNote[]> => {
    const byCell = new Map<string, CalendarNote[]>();
    const sorted = notes
        .filter((note) => fitsInto(note.period.unit, unit))
        .sort((a, b) => a.period.start.getTime() - b.period.start.getTime() || a.title.localeCompare(b.title));
    for (const note of sorted) {
        const key = format(note.period.start, CELL_KEY_FORMAT[unit]);
        const cellNotes = byCell.get(key);
        if (cellNotes) cellNotes.push(note);
        else byCell.set(key, [note]);
    }
    return byCell;
};

export const freeNotePath = (folder: string, name: string, exists: (path: string) => boolean): string => {
    const prefix = folder === "/" ? "" : `${folder}/`;
    const candidate = (index: number): string => `${prefix}${name}${index === 0 ? "" : ` ${index}`}.md`;
    let index = 0;
    while (exists(candidate(index))) index++;
    return candidate(index);
};

export const newNoteContent = (date: Date): string =>
    `---\n${DATE_PROPERTY}: ${format(date, CELL_KEY_FORMAT.day)}\n---\n`;
