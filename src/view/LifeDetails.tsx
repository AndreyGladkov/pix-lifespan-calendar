import { CELLS_PER_YEAR, type CellState, type GridUnit, type LifestyleMark } from "../domain/grid";
import type { ResolvedLifeExpectancy, Sex } from "../domain/lifeExpectancy";
import type { LifestyleFactor } from "../domain/lifestyle";
import type { MessageKey, PluralKey, Translator } from "../i18n";
import { cellClass } from "./YearGrid";

interface LifeDetailsProps {
    lifeExpectancy: ResolvedLifeExpectancy;
    place: string;
    sex: Sex;
    unit: GridUnit;
    open: boolean;
    translator: Translator;
    onToggle: (open: boolean) => void;
}

const FACTOR_NAMES: Record<LifestyleFactor, MessageKey> = {
    smoking: "smokingName",
    alcohol: "alcoholName",
    activity: "activityName",
};

const WHO_GROUPS: Record<Sex, MessageKey> = {
    male: "whoGroupMen",
    female: "whoGroupWomen",
    unspecified: "whoGroupBoth",
};

const CELL_COUNTS: Record<GridUnit, PluralKey> = { day: "countDay", week: "countWeek", month: "countMonth" };

const LEGEND: { state: CellState; lifestyle: LifestyleMark | null; label: MessageKey }[] = [
    { state: "lived", lifestyle: null, label: "legendLived" },
    { state: "current", lifestyle: null, label: "legendCurrent" },
    { state: "future", lifestyle: null, label: "legendFuture" },
    { state: "future", lifestyle: "gained", label: "legendGained" },
    { state: "outside", lifestyle: "lost", label: "legendLost" },
    { state: "surplus", lifestyle: null, label: "legendSurplus" },
];

const SWATCH_SIZE = 10;

export function LifeDetails({ lifeExpectancy, place, sex, unit, open, translator, onToggle }: LifeDetailsProps) {
    const { t, plural, formatNumber } = translator;
    const { years, estimate, overridden } = lifeExpectancy;
    const oneDecimal = { minimumFractionDigits: 1, maximumFractionDigits: 1 };
    const signed = (value: number, options?: Intl.NumberFormatOptions): string =>
        `${value < 0 ? "−" : "+"}${formatNumber(Math.abs(value), options)}`;
    const cells = (value: number): string => {
        const count = Math.round(value * CELLS_PER_YEAR[unit]);
        return `≈ ${plural(CELL_COUNTS[unit], Math.abs(count), { count: signed(count) })}`;
    };
    const totalYears = plural("yearsCount", years, { count: formatNumber(years, { maximumFractionDigits: 1 }) });

    return (
        <details
            className="pix-lifespan-calendar-details"
            open={open}
            onToggle={(event) => onToggle(event.currentTarget.open)}
        >
            <summary>{t("details")}</summary>
            <div className="pix-lifespan-calendar-details-total">{t("detailsExpectancy", { years: totalYears })}</div>
            <table className="pix-lifespan-calendar-breakdown">
                <tbody>
                    {overridden ? (
                        <tr>
                            <td>{t("detailsOverride")}</td>
                            <td>{formatNumber(years, oneDecimal)}</td>
                            <td />
                        </tr>
                    ) : (
                        <>
                            <tr>
                                <td>{t("detailsWho", { place, group: t(WHO_GROUPS[sex]) })}</td>
                                <td>{formatNumber(estimate.baseline, oneDecimal)}</td>
                                <td />
                            </tr>
                            {estimate.adjustments.map(({ factor, years: delta }) => (
                                <tr key={factor}>
                                    <td>{t(FACTOR_NAMES[factor])}</td>
                                    <td>{signed(delta, oneDecimal)}</td>
                                    <td>{cells(delta)}</td>
                                </tr>
                            ))}
                        </>
                    )}
                </tbody>
            </table>
            <ul className="pix-lifespan-calendar-legend">
                {LEGEND.map((item) => (
                    <li key={item.label}>
                        <svg width={SWATCH_SIZE} height={SWATCH_SIZE} aria-hidden>
                            <rect className={cellClass(item)} width={SWATCH_SIZE} height={SWATCH_SIZE} rx={2} />
                        </svg>
                        {t(item.label)}
                    </li>
                ))}
            </ul>
        </details>
    );
}
