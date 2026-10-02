import { isBefore } from "date-fns";
import type { YearBlock } from "./grid";
import { yearsBetween, type Lifespan } from "./lifespan";

export type LifeStats =
	| { kind: "remaining"; livedFraction: number; remainingCells: number }
	| { kind: "surplus"; surplusYears: number };

export function lifeStats(blocks: YearBlock[], life: Lifespan, today: Date): LifeStats {
	if (!isBefore(today, life.expectedEnd)) {
		return { kind: "surplus", surplusYears: yearsBetween(life.expectedEnd, today) };
	}
	const remainingCells = blocks.reduce(
		(total, block) => total + block.cells.filter((cell) => cell.state === "future").length,
		0,
	);
	return {
		kind: "remaining",
		livedFraction: yearsBetween(life.birth, today) / yearsBetween(life.birth, life.expectedEnd),
		remainingCells,
	};
}
