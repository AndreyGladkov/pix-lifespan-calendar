import type { LifeExpectancyEstimate } from "./domain/lifeExpectancy";
import type { LifestyleFactor } from "./domain/lifestyle";
import type { MessageKey, Translator } from "./i18n";

const FACTOR_LABELS: Record<LifestyleFactor, MessageKey> = {
    smoking: "factorSmoking",
    alcohol: "factorAlcohol",
    activity: "factorActivity",
};

const yearsFormat = ({ language }: Translator): Intl.NumberFormat =>
    new Intl.NumberFormat(language, { maximumFractionDigits: 1 });

export function formatYears(translator: Translator, years: number): string {
    return yearsFormat(translator).format(years);
}

function breakdown(
    translator: Translator,
    { baseline, adjustments }: LifeExpectancyEstimate,
    format: Intl.NumberFormat,
) {
    const terms = adjustments.map(({ factor, years }) => {
        const sign = years < 0 ? "−" : "+";
        return `${sign} ${format.format(Math.abs(years))} ${translator.t(FACTOR_LABELS[factor])}`;
    });
    return [format.format(baseline), ...terms].join(" ");
}

export function estimatePlaceholder(translator: Translator, estimate: LifeExpectancyEstimate, place: string): string {
    const format = yearsFormat(translator);
    const years = format.format(estimate.years);
    return estimate.adjustments.length === 0
        ? translator.t("lifeExpectancyPlaceholder", { years, place })
        : translator.t("lifeExpectancyPlaceholderAdjusted", {
              years,
              place,
              breakdown: breakdown(translator, estimate, format),
          });
}
