import { useEffect, useMemo, useRef, useState, type PointerEvent, type RefObject } from "react";
import { emptyPositions, type Cell, type GridUnit, type YearBlock } from "../domain/grid";
import type { CellLayout } from "../domain/layout";

const CORNER_RATIO = 0.2;
const RENDER_MARGIN = "800px";

export interface CellPointer {
	cell: Cell;
	rect: DOMRect;
}

interface YearGridProps {
	block: YearBlock;
	unit: GridUnit;
	layout: CellLayout;
	onHover: (pointer: CellPointer | null) => void;
}

function useNearViewport<T extends Element>(): [RefObject<T | null>, boolean] {
	const ref = useRef<T>(null);
	const [near, setNear] = useState(false);
	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		const observer = new IntersectionObserver(([entry]) => setNear(entry?.isIntersecting ?? false), {
			rootMargin: RENDER_MARGIN,
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	return [ref, near];
}

export function YearGrid({ block, unit, layout, onHover }: YearGridProps) {
	const [containerRef, near] = useNearViewport<HTMLDivElement>();
	const { cell: size, gap, pitch } = layout;
	const width = block.columns * pitch - gap;
	const height = unit === "day" ? block.rows * pitch - gap : pitch;
	const radius = Math.max(1, Math.round(size * CORNER_RATIO));
	const cellsByPosition = useMemo(
		() => new Map(block.cells.map((cell) => [`${cell.column}:${cell.row}`, cell])),
		[block],
	);
	const placeholders = useMemo(() => emptyPositions(block), [block]);

	const pointerAt = (event: PointerEvent<SVGSVGElement>): CellPointer | null => {
		const bounds = event.currentTarget.getBoundingClientRect();
		const clamp = (value: number, count: number): number => Math.min(count - 1, Math.max(0, Math.floor(value)));
		const column = clamp((event.clientX - bounds.left) / pitch, block.columns);
		const row = clamp((event.clientY - bounds.top) / pitch, block.rows);
		const cell = cellsByPosition.get(`${column}:${row}`);
		if (!cell || cell.state === "outside") return null;
		const rect = new DOMRect(bounds.left + cell.column * pitch, bounds.top + cell.row * pitch, size, size);
		return { cell, rect };
	};

	return (
		<div
			ref={containerRef}
			className="lifespan-calendar-year-grid"
			style={{ height }}
		>
			{near && (
				<svg
					width={width}
					height={height}
					viewBox={`0 0 ${width} ${height}`}
					onPointerMove={(event) => event.pointerType === "mouse" && onHover(pointerAt(event))}
					onPointerLeave={(event) => event.pointerType === "mouse" && onHover(null)}
					onPointerDown={(event) => event.pointerType !== "mouse" && onHover(pointerAt(event))}
				>
					{block.cells.map((cell) => (
						<rect
							key={cell.key}
							className={`lifespan-calendar-cell is-${cell.state}`}
							x={cell.column * pitch}
							y={cell.row * pitch}
							width={size}
							height={size}
							rx={radius}
						/>
					))}
					{placeholders.map(({ column, row }) => (
						<rect
							key={`empty-${column}-${row}`}
							className="lifespan-calendar-placeholder"
							x={column * pitch + 0.5}
							y={row * pitch + 0.5}
							width={size - 1}
							height={size - 1}
							rx={radius}
						/>
					))}
				</svg>
			)}
		</div>
	);
}
