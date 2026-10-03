import { describe, expect, it } from "vitest";
import { buildGrid } from "../src/domain/grid";
import type { Lifespan } from "../src/domain/lifespan";
import { lifeStats } from "../src/domain/stats";

const date = (iso: string): Date => new Date(`${iso}T00:00:00`);

describe("lifeStats", () => {
    it("reports lived fraction and remaining future cells", () => {
        const life: Lifespan = { birth: date("2000-01-01"), expectedEnd: date("2002-01-01") };
        const today = date("2001-01-15");
        const stats = lifeStats(buildGrid("month", life, today), life, today);
        expect(stats).toMatchObject({ kind: "remaining", remainingCells: 11 });
        expect(stats.kind === "remaining" && stats.livedFraction).toBeCloseTo(0.52, 2);
    });

    it("reports surplus years once the expected end has passed", () => {
        const life: Lifespan = { birth: date("1940-01-01"), expectedEnd: date("2010-01-01") };
        const today = date("2020-01-01");
        const stats = lifeStats(buildGrid("month", life, today), life, today);
        expect(stats.kind).toBe("surplus");
        expect(stats.kind === "surplus" && stats.surplusYears).toBeCloseTo(10, 1);
    });
});
