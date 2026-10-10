import { describe, expect, it } from "vitest";
import {
    calendarNote,
    freeNotePath,
    newNoteContent,
    notesByCell,
    parsePeriod,
    sameNote,
    type CalendarNote,
} from "../src/domain/notes";

const date = (iso: string): Date => new Date(`${iso}T00:00:00`);

const note = (title: string, dateProperty?: string): CalendarNote => {
    const result = calendarNote(`Notes/${title}.md`, title, dateProperty);
    if (!result) throw new Error(`no period in ${title}`);
    return result;
};

describe("parsePeriod", () => {
    it("parses days, ISO weeks and months", () => {
        expect(parsePeriod("2026-10-10")).toEqual({ unit: "day", start: date("2026-10-10") });
        expect(parsePeriod("2026-W40")).toEqual({ unit: "week", start: date("2026-09-28") });
        expect(parsePeriod("2026-10")).toEqual({ unit: "month", start: date("2026-10-01") });
    });

    it("accepts week 53 only in years that have it", () => {
        expect(parsePeriod("2026-W53")).toEqual({ unit: "week", start: date("2026-12-28") });
        expect(parsePeriod("2025-W53")).toBeNull();
    });

    it("rejects impossible dates and other text", () => {
        expect(parsePeriod("2026-02-30")).toBeNull();
        expect(parsePeriod("2026-13")).toBeNull();
        expect(parsePeriod("2026-10-10 Trip")).toBeNull();
        expect(parsePeriod("2026-W40 Plan")).toBeNull();
        expect(parsePeriod("Marathon")).toBeNull();
    });
});

describe("calendarNote", () => {
    it("takes the period from the date property", () => {
        expect(calendarNote("Goals/Marathon.md", "Marathon", "2030-05-01")).toEqual({
            path: "Goals/Marathon.md",
            title: "Marathon",
            period: { unit: "day", start: date("2030-05-01") },
        });
    });

    it("ignores the time of a datetime property", () => {
        expect(calendarNote("a.md", "a", "2030-05-01T09:30")?.period).toEqual({
            unit: "day",
            start: date("2030-05-01"),
        });
    });

    it("falls back to a periodic note name", () => {
        expect(calendarNote("Daily/2026-10-10.md", "2026-10-10", undefined)?.period.unit).toBe("day");
        expect(calendarNote("Weekly/2026-W40.md", "2026-W40", "not a date")?.period.unit).toBe("week");
    });

    it("prefers the property over the note name", () => {
        expect(calendarNote("2026-10.md", "2026-10", "2030-05-01")?.period.start).toEqual(date("2030-05-01"));
    });

    it("skips notes without a date", () => {
        expect(calendarNote("Ideas.md", "Ideas", undefined)).toBeNull();
        expect(calendarNote("Ideas.md", "Ideas", 2030)).toBeNull();
    });
});

describe("sameNote", () => {
    it("compares path, title and period", () => {
        expect(sameNote(note("2026-10-10"), note("2026-10-10"))).toBe(true);
        expect(sameNote(note("Goal", "2030-05-01"), note("Goal", "2030-05-02"))).toBe(false);
        expect(sameNote(undefined, null)).toBe(true);
        expect(sameNote(note("2026-10-10"), null)).toBe(false);
    });
});

describe("notesByCell", () => {
    const notes = [note("Trip", "2026-10-02"), note("2026-10-01"), note("2026-W40"), note("2026-10")];

    it("puts day notes into the cell that contains them", () => {
        const byWeek = notesByCell(notes, "week");
        expect(byWeek.get("2026-W40")?.map((n) => n.title)).toEqual(["2026-W40", "2026-10-01", "Trip"]);
    });

    it("hides notes coarser than the grid unit", () => {
        const byDay = notesByCell(notes, "day");
        expect([...byDay.keys()]).toEqual(["2026-10-01", "2026-10-02"]);
    });

    it("places a week note by its Monday in month mode", () => {
        const byMonth = notesByCell(notes, "month");
        expect(byMonth.get("2026-09")?.map((n) => n.title)).toEqual(["2026-W40"]);
        expect(byMonth.get("2026-10")?.map((n) => n.title)).toEqual(["2026-10", "2026-10-01", "Trip"]);
    });
});

describe("freeNotePath", () => {
    it("numbers the name until the path is free", () => {
        const taken = new Set(["Goals/Untitled.md", "Goals/Untitled 1.md"]);
        expect(freeNotePath("Goals", "Untitled", (path) => taken.has(path))).toBe("Goals/Untitled 2.md");
    });

    it("creates at the vault root", () => {
        expect(freeNotePath("/", "Untitled", () => false)).toBe("Untitled.md");
    });
});

describe("newNoteContent", () => {
    it("writes the date property", () => {
        expect(newNoteContent(date("2030-05-01"))).toBe("---\nlifespan-date: 2030-05-01\n---\n");
    });
});
