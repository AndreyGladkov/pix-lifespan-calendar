import { describe, expect, it } from "vitest";
import { cellLayout } from "../src/domain/layout";

describe("cellLayout", () => {
	it("caps cells at the unit maximum when there is room", () => {
		expect(cellLayout("week", 2000, 53)).toEqual({ cell: 12, gap: 2, pitch: 14 });
		expect(cellLayout("month", 2000, 12)).toEqual({ cell: 36, gap: 6, pitch: 42 });
	});

	it("shrinks to the largest whole-pixel cell that fits", () => {
		const layout = cellLayout("week", 721, 53);
		expect(layout).toEqual({ cell: 11, gap: 2, pitch: 13 });
		expect(53 * layout.pitch - layout.gap).toBeLessThanOrEqual(721);
	});

	it("fits exactly when the width matches the full grid", () => {
		expect(cellLayout("day", 53 * 14 - 2, 53).cell).toBe(12);
		expect(cellLayout("day", 53 * 14 - 3, 53).cell).toBe(11);
	});

	it("never collapses below one pixel", () => {
		expect(cellLayout("week", 10, 53).cell).toBe(1);
	});
});
