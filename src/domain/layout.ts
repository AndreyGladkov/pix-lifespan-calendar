import type { GridUnit } from "./grid";

export interface CellLayout {
	cell: number;
	gap: number;
	pitch: number;
}

const LIMITS: Record<GridUnit, { maxCell: number; gap: number }> = {
	day: { maxCell: 12, gap: 2 },
	week: { maxCell: 12, gap: 2 },
	month: { maxCell: 36, gap: 6 },
};

export function cellLayout(unit: GridUnit, availableWidth: number, columns: number): CellLayout {
	const { maxCell, gap } = LIMITS[unit];
	const fitted = Math.floor((availableWidth + gap) / columns) - gap;
	const cell = Math.max(1, Math.min(maxCell, fitted));
	return { cell, gap, pitch: cell + gap };
}
