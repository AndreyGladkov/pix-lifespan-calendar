import { parseISO } from "date-fns";
import { useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { countryNamer } from "../countryNames";
import { ageAt, buildGrid, GRID_SHAPE, type Cell, type GridUnit } from "../domain/grid";
import { cellLayout } from "../domain/layout";
import { resolveLifeExpectancy, type LifeExpectancyData, type LifestyleSpans } from "../domain/lifeExpectancy";
import { lifespan } from "../domain/lifespan";
import { notesByCell, type CalendarNote } from "../domain/notes";
import { lifeStats, type LifeStats } from "../domain/stats";
import type { MessageKey, PluralKey, Translator } from "../i18n";
import type { NoteActions } from "../noteActions";
import type { NotesIndex } from "../notesIndex";
import type { SettingsStore } from "../settingsStore";
import { showCellMenu } from "./cellMenu";
import { LifeDetails } from "./LifeDetails";
import { useElementWidth } from "./useElementWidth";
import { useToday } from "./useToday";
import { YearGrid, type CellPointer } from "./YearGrid";

interface LifeCalendarProps {
    store: SettingsStore;
    translator: Translator;
    data: LifeExpectancyData;
    notes: NotesIndex;
    noteActions: NoteActions;
    openSettings: () => void;
}

const UNITS: { unit: GridUnit; label: MessageKey; remaining: PluralKey }[] = [
    { unit: "day", label: "unitDay", remaining: "remainingDay" },
    { unit: "week", label: "unitWeek", remaining: "remainingWeek" },
    { unit: "month", label: "unitMonth", remaining: "remainingMonth" },
];

export function LifeCalendar({ store, translator, data, notes, noteActions, openSettings }: LifeCalendarProps) {
    const settings = useSyncExternalStore(store.subscribe, store.get);
    const allNotes = useSyncExternalStore(notes.subscribe, notes.get);
    const today = useToday();
    const nameOfCountry = useMemo(() => countryNamer(translator.language), [translator]);
    const { t } = translator;

    if (settings.birthDate === null) {
        return (
            <div className="pix-lifespan-calendar-empty">
                <p>{t("emptyMessage")}</p>
                <button className="mod-cta" onClick={openSettings}>
                    {t("openSettings")}
                </button>
            </div>
        );
    }

    const lifeExpectancy = resolveLifeExpectancy(data, settings);
    const { country } = lifeExpectancy.estimate;
    return (
        <CalendarGrid
            birthDate={settings.birthDate}
            lifeExpectancyYears={lifeExpectancy.years}
            spans={lifeExpectancy.spans}
            unit={settings.unit}
            today={today}
            notes={allNotes}
            noteActions={noteActions}
            translator={translator}
            onUnitChange={(unit) => void store.update({ unit })}
            details={
                <LifeDetails
                    lifeExpectancy={lifeExpectancy}
                    place={country ? nameOfCountry(country) : t("lifeExpectancyWorld")}
                    sex={settings.sex}
                    unit={settings.unit}
                    open={settings.detailsOpen}
                    translator={translator}
                    onToggle={(detailsOpen) => {
                        if (detailsOpen !== settings.detailsOpen) void store.update({ detailsOpen });
                    }}
                />
            }
        />
    );
}

interface CalendarGridProps {
    birthDate: string;
    lifeExpectancyYears: number;
    spans: LifestyleSpans;
    unit: GridUnit;
    today: Date;
    notes: CalendarNote[];
    noteActions: NoteActions;
    translator: Translator;
    onUnitChange: (unit: GridUnit) => void;
    details: ReactNode;
}

function CalendarGrid({
    birthDate,
    lifeExpectancyYears,
    spans,
    unit,
    today,
    notes,
    noteActions,
    translator,
    onUnitChange,
    details,
}: CalendarGridProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [pointer, setPointer] = useState<CellPointer | null>(null);
    const { gained, lost } = spans;
    const life = useMemo(
        () => lifespan(parseISO(birthDate), lifeExpectancyYears, { gained, lost }),
        // spans is a new object on every settings render, so memoize on its bounds rather than its identity.
        [birthDate, lifeExpectancyYears, gained?.from, gained?.to, lost?.from, lost?.to],
    );
    const blocks = useMemo(() => buildGrid(unit, life, today), [unit, life, today]);
    const stats = lifeStats(blocks, life, today);
    const [measureRef, gridWidth] = useElementWidth<HTMLDivElement>();
    const layout = cellLayout(unit, gridWidth, GRID_SHAPE[unit].columns);
    const cellNotes = useMemo(() => notesByCell(notes, unit), [notes, unit]);
    const showRange = unit === "week";

    const openCellMenu = ({ cell }: CellPointer, event: MouseEvent): void => {
        setPointer(null);
        showCellMenu(event, {
            title: Object.values(cellCaption(cell, life.birth, showRange, translator)).join(" · "),
            date: cell.start,
            notes: cellNotes.get(cell.key) ?? [],
            actions: noteActions,
            translator,
        });
    };

    return (
        <div className={`pix-lifespan-calendar is-${unit}`} ref={rootRef}>
            <div className="pix-lifespan-calendar-header">
                <div className="pix-lifespan-calendar-units">
                    {UNITS.map((option) => (
                        <button
                            key={option.unit}
                            className={option.unit === unit ? "mod-cta" : ""}
                            onClick={() => onUnitChange(option.unit)}
                        >
                            {translator.t(option.label)}
                        </button>
                    ))}
                </div>
                <div className="pix-lifespan-calendar-stats">{statsText(stats, unit, translator)}</div>
            </div>
            {details}
            <div className="pix-lifespan-calendar-year pix-lifespan-calendar-measure" aria-hidden>
                <div className="pix-lifespan-calendar-year-label" />
                <div className="pix-lifespan-calendar-year-grid" ref={measureRef} />
            </div>
            {gridWidth > 0 &&
                blocks.map((block, index) => (
                    <div className="pix-lifespan-calendar-year" key={`${unit}-${block.year}`}>
                        <div className="pix-lifespan-calendar-year-label">
                            {isLabelled(unit, block.year, index) ? block.year : ""}
                        </div>
                        <YearGrid
                            block={block}
                            unit={unit}
                            layout={layout}
                            cellNotes={cellNotes}
                            onHover={setPointer}
                            onSelect={openCellMenu}
                        />
                    </div>
                ))}
            {pointer && rootRef.current && (
                <Tooltip
                    pointer={pointer}
                    root={rootRef.current}
                    birth={life.birth}
                    showRange={showRange}
                    noteCount={cellNotes.get(pointer.cell.key)?.length ?? 0}
                    translator={translator}
                />
            )}
        </div>
    );
}

const WEEK_LABEL_EVERY_YEARS = 5;

function isLabelled(unit: GridUnit, year: number, index: number): boolean {
    return unit !== "week" || index === 0 || year % WEEK_LABEL_EVERY_YEARS === 0;
}

function statsText(stats: LifeStats, unit: GridUnit, { t, plural, formatNumber }: Translator): string {
    if (stats.kind === "surplus") {
        const years = formatNumber(stats.surplusYears, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        return plural("surplus", Number(stats.surplusYears.toFixed(1)), { years });
    }
    const percent = formatNumber(stats.livedFraction, {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });
    const remainingKey = UNITS.find((option) => option.unit === unit)?.remaining ?? "remainingWeek";
    const remaining = plural(remainingKey, stats.remainingCells, { count: formatNumber(stats.remainingCells) });
    return `${t("lived", { percent })} · ${remaining}`;
}

interface TooltipProps {
    pointer: CellPointer;
    root: HTMLElement;
    birth: Date;
    showRange: boolean;
    noteCount: number;
    translator: Translator;
}

const cellCaption = (cell: Cell, birth: Date, showRange: boolean, translator: Translator) => {
    const range = new Intl.DateTimeFormat(translator.language, { day: "2-digit", month: "2-digit" });
    return {
        period: showRange ? `${cell.key} · ${range.formatRange(cell.start, cell.end)}` : cell.key,
        age: translator.t("age", { age: ageAt(cell.start, birth) }),
    };
};

function Tooltip({ pointer, root, birth, showRange, noteCount, translator }: TooltipProps) {
    const origin = root.getBoundingClientRect();
    const caption = cellCaption(pointer.cell, birth, showRange, translator);
    return (
        <div
            className="pix-lifespan-calendar-tooltip"
            style={{
                left: pointer.rect.left - origin.left + pointer.rect.width / 2,
                top: pointer.rect.top - origin.top,
            }}
        >
            <div className="pix-lifespan-calendar-tooltip-period">{caption.period}</div>
            <div>{caption.age}</div>
            {noteCount > 0 && (
                <div>{translator.plural("notesCount", noteCount, { count: translator.formatNumber(noteCount) })}</div>
            )}
        </div>
    );
}
