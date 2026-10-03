import { describe, expect, it } from "vitest";
import { ageAt, buildGrid, cellState, emptyPositions, type Cell, type YearBlock } from "../src/domain/grid";
import { lifespan, type Lifespan } from "../src/domain/lifespan";
import type { CellState } from "../src/domain/grid";

const date = (iso: string): Date => new Date(`${iso}T00:00:00`);

const life: Lifespan = { birth: date("1990-03-15"), expectedEnd: date("2060-03-15"), gained: null, lost: null };

function cellByKey(blocks: YearBlock[], key: string): Cell {
    const cell = blocks.flatMap((block) => block.cells).find((c) => c.key === key);
    if (!cell) throw new Error(`no cell ${key}`);
    return cell;
}

describe("lifespan", () => {
    it("adds expectancy in mean Gregorian years rounded to whole days", () => {
        expect(lifespan(date("2000-01-01"), 73.2).expectedEnd).toEqual(date("2073-03-14"));
    });
});

describe("cellState", () => {
    const today = date("2026-10-02");
    const state = (start: string, end: string): string =>
        cellState({ start: date(start), end: date(end) }, life, today);

    it("marks periods ending before birth as outside", () => {
        expect(state("1990-03-01", "1990-03-14")).toBe("outside");
    });

    it("treats the period containing birth as lived", () => {
        expect(state("1990-03-01", "1990-03-31")).toBe("lived");
    });

    it("marks the period containing today as current", () => {
        expect(state("2026-09-28", "2026-10-04")).toBe("current");
    });

    it("marks periods after today as future", () => {
        expect(state("2026-10-05", "2026-10-11")).toBe("future");
    });

    it("keeps the period containing the expected end inside life", () => {
        expect(state("2060-03-01", "2060-03-31")).toBe("future");
    });

    it("marks periods starting at or after the expected end as outside", () => {
        expect(state("2060-03-15", "2060-03-21")).toBe("outside");
    });

    it("marks lived periods past the expected end as surplus", () => {
        const shortLife: Lifespan = {
            birth: date("1940-01-01"),
            expectedEnd: date("2010-01-01"),
            gained: null,
            lost: null,
        };
        expect(cellState({ start: date("2015-01-01"), end: date("2015-01-31") }, shortLife, today)).toBe("surplus");
    });
});

describe("buildGrid", () => {
    const today = date("2026-10-02");

    it("builds one block per calendar year for months", () => {
        const blocks = buildGrid("month", life, today);
        expect(blocks[0]?.year).toBe(1990);
        expect(blocks.at(-1)?.year).toBe(2060);
        expect(blocks.every((b) => b.cells.length === 12 && b.columns === 12 && b.rows === 1)).toBe(true);
        expect(cellByKey(blocks, "1990-02").state).toBe("outside");
        expect(cellByKey(blocks, "2026-10").state).toBe("current");
        expect(cellByKey(blocks, "2060-04").state).toBe("outside");
    });

    it("uses ISO week years with 52 or 53 weeks", () => {
        const blocks = buildGrid("week", life, today);
        const byYear = new Map(blocks.map((b) => [b.year, b]));
        expect(byYear.get(2026)?.cells).toHaveLength(53);
        expect(byYear.get(2025)?.cells).toHaveLength(52);
        expect(blocks.every((b) => b.columns === 53)).toBe(true);
        expect(cellByKey(blocks, "2026-W40").state).toBe("current");
        expect(cellByKey(blocks, "2026-W53").start).toEqual(date("2026-12-28"));
    });

    it("starts ISO weeks on Monday", () => {
        const blocks = buildGrid("week", life, today);
        expect(cellByKey(blocks, "2026-W01").start).toEqual(date("2025-12-29"));
        expect(cellByKey(blocks, "2026-W01").end.getDay()).toBe(0);
    });

    it("lays days out as weeks by weekday and assigns year-boundary days to their ISO week year", () => {
        const blocks = buildGrid("day", life, today);
        const block2026 = blocks.find((b) => b.year === 2026);
        expect(block2026?.cells).toHaveLength(53 * 7);
        expect(block2026?.cells[0]?.key).toBe("2025-12-29");
        const firstJanuary2027 = cellByKey(blocks, "2027-01-01");
        expect(blocks.find((b) => b.cells.includes(firstJanuary2027))?.year).toBe(2026);
        expect(firstJanuary2027).toMatchObject({ column: 52, row: 4 });
        expect(cellByKey(blocks, "2026-10-02")).toMatchObject({ state: "current", row: 4 });
    });

    it("extends the grid to the current year when the expected end has passed", () => {
        const shortLife: Lifespan = {
            birth: date("1940-01-01"),
            expectedEnd: date("2010-01-01"),
            gained: null,
            lost: null,
        };
        const blocks = buildGrid("month", shortLife, today);
        expect(blocks.at(-1)?.year).toBe(2026);
        expect(cellByKey(blocks, "2026-09").state).toBe("surplus");
        expect(cellByKey(blocks, "2026-11").state).toBe("outside");
    });

    it("ends at the year of the last expected day", () => {
        const endsOnNewYear: Lifespan = {
            birth: date("1990-03-15"),
            expectedEnd: date("2061-01-01"),
            gained: null,
            lost: null,
        };
        expect(buildGrid("month", endsOnNewYear, today).at(-1)?.year).toBe(2060);
    });
});

describe("lifestyle marks", () => {
    const today = date("2026-10-02");
    const habits = lifespan(date("2000-01-01"), 60, { gained: { from: 50, to: 60 }, lost: { from: 60, to: 70 } });
    const markOf = (key: string): { state: CellState; lifestyle: string | null } => {
        const { state, lifestyle } = cellByKey(buildGrid("month", habits, today), key);
        return { state, lifestyle };
    };

    it("converts year spans to dates after birth", () => {
        expect(habits.gained).toEqual({ start: date("2049-12-31"), end: date("2060-01-01") });
        expect(habits.lost).toEqual({ start: date("2060-01-01"), end: date("2069-12-31") });
    });

    it("marks future cells added by lifestyle", () => {
        expect(markOf("2049-11")).toEqual({ state: "future", lifestyle: null });
        expect(markOf("2049-12")).toEqual({ state: "future", lifestyle: "gained" });
        expect(markOf("2059-11")).toEqual({ state: "future", lifestyle: "gained" });
    });

    it("extends the grid to the end of the years lifestyle took away", () => {
        expect(buildGrid("month", habits, today).at(-1)?.year).toBe(2069);
    });

    it("marks cells after the end that lifestyle took away", () => {
        expect(markOf("2060-01")).toEqual({ state: "outside", lifestyle: "lost" });
        expect(markOf("2069-12")).toEqual({ state: "outside", lifestyle: "lost" });
    });

    it("never recolors lived or current cells", () => {
        const early = lifespan(date("2000-01-01"), 60, { gained: { from: 10, to: 60 }, lost: null });
        expect(cellByKey(buildGrid("month", early, today), "2015-01")).toMatchObject({
            state: "lived",
            lifestyle: null,
        });
        expect(cellByKey(buildGrid("month", early, today), "2026-10")).toMatchObject({
            state: "current",
            lifestyle: null,
        });
    });
});

describe("emptyPositions", () => {
    const today = date("2026-10-02");
    const blockOf = (unit: "day" | "week" | "month", year: number): YearBlock => {
        const block = buildGrid(unit, life, today).find((b) => b.year === year);
        if (!block) throw new Error(`no block ${year}`);
        return block;
    };

    it("leaves the 53rd week slot empty in 52-week years", () => {
        expect(emptyPositions(blockOf("week", 2025))).toEqual([{ column: 52, row: 0 }]);
        expect(emptyPositions(blockOf("day", 2025))).toEqual(
            Array.from({ length: 7 }, (_, row) => ({ column: 52, row })),
        );
    });

    it("has no empty slots in 53-week years and month grids", () => {
        expect(emptyPositions(blockOf("week", 2026))).toEqual([]);
        expect(emptyPositions(blockOf("day", 2026))).toEqual([]);
        expect(emptyPositions(blockOf("month", 2025))).toEqual([]);
    });
});

describe("ageAt", () => {
    it("returns full years at the date, clamped to birth", () => {
        expect(ageAt(date("2026-03-14"), life.birth)).toBe(35);
        expect(ageAt(date("2026-03-15"), life.birth)).toBe(36);
        expect(ageAt(date("1990-01-01"), life.birth)).toBe(0);
    });
});
