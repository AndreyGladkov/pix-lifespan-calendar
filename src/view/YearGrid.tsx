import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type RefObject } from "react";
import { emptyPositions, type Cell, type GridUnit, type YearBlock } from "../domain/grid";
import type { CellLayout } from "../domain/layout";
import type { CalendarNote } from "../domain/notes";

const CORNER_RATIO = 0.2;
const NOTE_MARK_RATIO = 0.2;

export const cellClass = ({ state, lifestyle }: Pick<Cell, "state" | "lifestyle">): string =>
    `pix-lifespan-calendar-cell is-${state}${lifestyle ? ` is-${lifestyle}` : ""}`;
const RENDER_MARGIN = "800px";

export interface CellPointer {
    cell: Cell;
    rect: DOMRect;
}

interface YearGridProps {
    block: YearBlock;
    unit: GridUnit;
    layout: CellLayout;
    cellNotes: ReadonlyMap<string, readonly CalendarNote[]>;
    onHover: (pointer: CellPointer | null) => void;
    onSelect: (pointer: CellPointer, event: MouseEvent) => void;
}

interface NoteMarkProps {
    x: number;
    y: number;
    size: number;
}

export const NoteMark = ({ x, y, size }: NoteMarkProps) => (
    <circle
        className="pix-lifespan-calendar-note-mark"
        cx={x + size / 2}
        cy={y + size / 2}
        r={Math.max(1, size * NOTE_MARK_RATIO)}
    />
);

function useNearViewport<T extends Element>(): [RefObject<T>, boolean] {
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

export function YearGrid({ block, unit, layout, cellNotes, onHover, onSelect }: YearGridProps) {
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
    const notedCells = useMemo(() => block.cells.filter((cell) => cellNotes.has(cell.key)), [block, cellNotes]);

    const pointerAt = (event: ReactMouseEvent<SVGSVGElement>): CellPointer | null => {
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
        <div ref={containerRef} className="pix-lifespan-calendar-year-grid" style={{ height }}>
            {near && (
                <svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    onPointerMove={(event) => event.pointerType === "mouse" && onHover(pointerAt(event))}
                    onPointerLeave={(event) => event.pointerType === "mouse" && onHover(null)}
                    onClick={(event) => {
                        const pointer = pointerAt(event);
                        if (pointer) onSelect(pointer, event.nativeEvent);
                    }}
                >
                    {block.cells.map((cell) => (
                        <rect
                            key={cell.key}
                            className={cellClass(cell)}
                            x={cell.column * pitch}
                            y={cell.row * pitch}
                            width={size}
                            height={size}
                            rx={radius}
                        />
                    ))}
                    {notedCells.map((cell) => (
                        <NoteMark key={`note-${cell.key}`} x={cell.column * pitch} y={cell.row * pitch} size={size} />
                    ))}
                    {placeholders.map(({ column, row }) => (
                        <rect
                            key={`empty-${column}-${row}`}
                            className="pix-lifespan-calendar-placeholder"
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
