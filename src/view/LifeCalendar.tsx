import { parseISO } from "date-fns";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ageAt, buildGrid, GRID_SHAPE, type GridUnit } from "../domain/grid";
import { cellLayout } from "../domain/layout";
import { resolveLifeExpectancy, type LifeExpectancyData } from "../domain/lifeExpectancy";
import { lifespan } from "../domain/lifespan";
import { lifeStats, type LifeStats } from "../domain/stats";
import type { MessageKey, PluralKey, Translator } from "../i18n";
import { estimateHint } from "../lifeExpectancyText";
import type { SettingsStore } from "../settingsStore";
import { useElementWidth } from "./useElementWidth";
import { useToday } from "./useToday";
import { YearGrid, type CellPointer } from "./YearGrid";

interface LifeCalendarProps {
    store: SettingsStore;
    translator: Translator;
    data: LifeExpectancyData;
    openSettings: () => void;
}

const UNITS: { unit: GridUnit; label: MessageKey; remaining: PluralKey }[] = [
    { unit: "day", label: "unitDay", remaining: "remainingDay" },
    { unit: "week", label: "unitWeek", remaining: "remainingWeek" },
    { unit: "month", label: "unitMonth", remaining: "remainingMonth" },
];

export function LifeCalendar({ store, translator, data, openSettings }: LifeCalendarProps) {
    const settings = useSyncExternalStore(store.subscribe, store.get);
    const today = useToday();
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
    return (
        <CalendarGrid
            birthDate={settings.birthDate}
            lifeExpectancyYears={lifeExpectancy.years}
            expectancyHint={estimateHint(translator, lifeExpectancy)}
            unit={settings.unit}
            today={today}
            translator={translator}
            onUnitChange={(unit) => void store.update({ unit })}
        />
    );
}

interface CalendarGridProps {
    birthDate: string;
    lifeExpectancyYears: number;
    expectancyHint: string | undefined;
    unit: GridUnit;
    today: Date;
    translator: Translator;
    onUnitChange: (unit: GridUnit) => void;
}

function CalendarGrid({
    birthDate,
    lifeExpectancyYears,
    expectancyHint,
    unit,
    today,
    translator,
    onUnitChange,
}: CalendarGridProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [pointer, setPointer] = useState<CellPointer | null>(null);
    const life = useMemo(() => lifespan(parseISO(birthDate), lifeExpectancyYears), [birthDate, lifeExpectancyYears]);
    const blocks = useMemo(() => buildGrid(unit, life, today), [unit, life, today]);
    const stats = lifeStats(blocks, life, today);
    const [measureRef, gridWidth] = useElementWidth<HTMLDivElement>();
    const layout = cellLayout(unit, gridWidth, GRID_SHAPE[unit].columns);

    useEffect(() => {
        const closeOutsideGrid = (event: PointerEvent): void => {
            if (!(event.target instanceof Element) || !event.target.closest(".pix-lifespan-calendar-year-grid"))
                setPointer(null);
        };
        document.addEventListener("pointerdown", closeOutsideGrid);
        return () => document.removeEventListener("pointerdown", closeOutsideGrid);
    }, []);

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
                <div className="pix-lifespan-calendar-stats" title={expectancyHint}>
                    {statsText(stats, unit, translator)}
                </div>
            </div>
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
                        <YearGrid block={block} unit={unit} layout={layout} onHover={setPointer} />
                    </div>
                ))}
            {pointer && rootRef.current && (
                <Tooltip
                    pointer={pointer}
                    root={rootRef.current}
                    birth={life.birth}
                    showRange={unit === "week"}
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
    translator: Translator;
}

function Tooltip({ pointer, root, birth, showRange, translator }: TooltipProps) {
    const origin = root.getBoundingClientRect();
    const { cell } = pointer;
    const range = new Intl.DateTimeFormat(translator.language, { day: "2-digit", month: "2-digit" });
    return (
        <div
            className="pix-lifespan-calendar-tooltip"
            style={{
                left: pointer.rect.left - origin.left + pointer.rect.width / 2,
                top: pointer.rect.top - origin.top,
            }}
        >
            <div className="pix-lifespan-calendar-tooltip-period">
                {showRange ? `${cell.key} · ${range.formatRange(cell.start, cell.end)}` : cell.key}
            </div>
            <div>{translator.t("age", { age: ageAt(cell.start, birth) })}</div>
        </div>
    );
}
